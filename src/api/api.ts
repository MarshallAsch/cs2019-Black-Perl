import { Router } from 'express';
import {Account} from '../models/account.model';
import {Article} from '../models/article.model';

const jwt  = require('jsonwebtoken');

const bcrypt = require("bcrypt");
const uuidv4 = require('uuid/v4');


const SECRET = "44a0a45f31cf8122651e28710a43530e";


export class Api {
    public getRouter(): Router {
        const router = Router();

        router.get("/status", ((req, res) => {
            return res.status(200).json({"status": "Up"});
        }));

        router.post("/auth/createAccount", ((req, res) => {
            
            // check for missing params

            if (!req.body.email) {
                return res.status(400).json({"message": "missing email"});
            }

            if (!req.body.fullName) {
                return res.status(400).json({"message": "missing name"});
            }

            if (!req.body.password) {
                return res.status(400).json({"message": "missing password"});
            }

            Account.findOne({
                email: req.body.email,
            }).then(foundUser => {

                if (foundUser) {
                    return res.status(500).json({"message": "email already in use"});
                } else {
                    bcrypt.genSalt(10, function (err, salt) {
                        bcrypt.hash(req.body.password, salt, function (err, hash) {
                            // Store hash in your password DB.

                            var usr = new Account({
                                email: req.body.email,
                                passwordHash: hash,
                                passwordSalt: salt,
                                fullName: req.body.fullName,
                            });

                            usr.save().then(user => {
                                res.status(201).json({"message": "success"});
                            }).catch(err => {
                                res.status(500).json({"message": err});
                            });
                        });
                    });
                }
            }).catch(err => {
                return res.status(500).json(err);
            });
        }));

        router.post("/auth/authenticate", ((req, res) => {

            // check for missing params

            if (!req.body.email) {
                return res.status(400).json({"message": "missing email"});
            }

            if (!req.body.password) {
                return res.status(400).json({"message": "missing password"});
            }

            Account.findOne({
                email: req.body.email,
            }).then((foundUser) => {

                if (foundUser) {

                    bcrypt.compare(req.body.password, foundUser.passwordHash, function(err, passMatch) {

                        if (passMatch) {
                            var payload = {
                                userId: foundUser.userId,
                                email: foundUser.email,
                                fullName: foundUser.fullName,
                            };
                        var token = jwt.sign(payload, SECRET);

                            return res.status(200).json({"acccessToken": token});
                        } else {
                            return res.status(403).json({"message": "access denied"});
                        }
                    });
                } else {
                    return res.status(403).json({"message": "access denied"});
                }
            }).catch(err => {
                return res.status(500).json(err);
            });

        }));

        router.get("/articles", ((req, res) => {

            let mongooseQuery = Article.find({}).sort("-date");

            mongooseQuery.exec().then((results) => {
                let articles = [];
                results.forEach((result) => {
                    articles.push(result);
                });

                return articles;
            }).then((articles => {
                res.status(200).json(articles);
            })).catch(err => {
                return res.status(500).json(err);
            });

        }));

        router.post("/articles", (req, res) => {

            if(!req.headers.authorization) {
                return res.status(403).json({"message" : "missing token"});
            }

            let token = req.headers.authorization;

            //Remove Bearer from string
            token = token.slice(7, token.length);

            jwt.verify(token, SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).json({"message" : "invalid token"});
                }
                else {
                    //check article
                    if (!req.body.body || !req.body.title || !req.body.subtitle || !req.body.leadParagraph)
                    {
                        return res.status(400).json({"message" : "invalid article"});
                    }

                    let article = new Article({
                        id: uuidv4(),
                        userId : decoded.userId,
                        author : decoded.fullName,
                        title : req.body.title,
                        subtitle : req.body.subtitle,
                        leadParagraph : req.body.leadParagraph,
                        imageUrl : req.body.imageUrl,
                        body : req.body.body,
                        category : req.body.category
                    });

                    article.save().then(article => {
                        //return unique id here
                        res.status(201).json({"message": "Success", id: article.id});
                    }).catch(err => {
                        res.status(500).json({"message": err});
                    });
                }
            });

        });

        router.put("/articles", (req, res) => {


                //check if article exists
                Article.findOne({id: req.params.id}).then((foundArticle) => {
                    if (!foundArticle) {
                        return res.status(404).json({"message": "Article not found"});
                    }
                    if (foundArticle.userId != req.params.userId) {
                         return res.status(401).json({"message": "User does not match"});
                    }
            });
        });
        
        router.get("/articles/user/:userId", ((req, res) => {

            let mongooseQuery = Article.find({}).sort("-date");

            mongooseQuery.where("userId").equals(req.params.userId);

            mongooseQuery.exec().then((results) => {
                let articles = [];
                results.forEach((result) => {
                    articles.push(result);
                });

                return articles;
            }).then((articles => {
                res.status(200).json(articles);
            })).catch(err => {
                return res.status(500).json(err);
            });
        }));

        router.get("/articles/:articleId", ((req, res) => {

            Article.findOne({id: req.params.articleId}).then((foundArticle) => {

                if (!foundArticle) {
                    return res.status(404).json({"message": "Article not found"});
                } else {
                    return res.status(200).json(foundArticle);
                }
            }).catch(err => {
                return res.status(500).json(err);
            });

        }));

        router.delete("/articles/:articleId", ((req, res) => {


            // check auth

            var auth = req.get("authorization");

            if (!auth) {
                return res.status(403).json({"message": "Auth token missing"});
            }

            const token = auth.slice(7, auth.length);

            jwt.verify(token, SECRET, function(err, decoded) {

                if (!decoded) {
                    return res.status(403).json({"message": "Permission denied"});
                } else {
                    var userId = decoded.userId;
                    Article.findOne({id: req.params.articleId}).then((foundArticle) => {

                        if (!foundArticle) {
                            return res.status(404).json({"message": "Article not found"});
                        } else {

                            if (userId != foundArticle.userId) {
                                return res.status(401).json({"message": "Permission denied"});
                            }

                            Article.findOneAndDelete({id: req.params.articleId}).then((foundArticle) => {

                                if (foundArticle) {
                                    return res.status(200).json({"message": "Article succesfully deleted."});
                                }
                            });
                        }
                    }).catch(err => {
                        return res.status(500).json(err);
                    });
                }
            });



        }));

        return router;
    }
}

