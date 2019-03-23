import app from '../app';

import 'mocha';



import * as request from "supertest";
import chai = require('chai');
const assert = chai.assert;
import * as mongoose from 'mongoose';

const jwt  = require('jsonwebtoken');

const asPromised = require("chai-as-promised");
chai.use(asPromised);


suite('Test', () => {


    var userToken;

    suiteSetup(function() {

        return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
            mongoose.connection.db.dropDatabase(function(){
            });
        });
    });

    suite( "Status",() => {
        test('GET status', () => {

            return request(app)
                .get("/api/status")
                .send()
                .expect(200)
                .then(res => {
                    assert.equal(res.body.status, "Up");
                })
        });
    });

    suite( "Account Creation",() => {
        test('Account Creation missing email', () => {
            return request(app)
                .post("/api/auth/createAccount")
                .send({
                    password: "The password",
                    fullName: "The full name"
                })
                .expect(400);
        });

        test('Account Creation missing name', () => {
            return request(app)
                .post("/api/auth/createAccount")
                .send({
                    email: "email@email.com",
                    password: "The password",
                })
                .expect(400);
        });

        test('Account Creation missing password', () => {
            return request(app)
                .post("/api/auth/createAccount")
                .send({
                    email: "email@email.com",
                    fullName: "The full name"
                })
                .expect(400);
        });

        test('Account Creation missing everything', () => {
            return request(app)
                .post("/api/auth/createAccount")
                .send({})
                .expect(400);
        });

        test('Account Creation success', () => {
            return request(app)
                .post("/api/auth/createAccount")
                .send({
                    email: "email1@email.com",
                    fullName: "The full name",
                    password: "The password"
                })
                .expect(201);
        });

        test('Account Creation duplicate email', () => {
            return request(app)
                .post("/api/auth/createAccount")
                .send({
                    email: "email1@email.com",
                    fullName: "The full name",
                    password: "The password"
                })
                .expect(500);
        });

        suiteTeardown(function() {

            return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
                mongoose.connection.db.dropDatabase(function(){
                });
            });
        });
    });

    suite( "Account Login",() => {

        var user1 = {
            email: "article_login1@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
        };

        suiteSetup(function() {

            return request(app)
                .post("/api/auth/createAccount")
                .send(user1)
                .expect(201);
        });

        test('Account password is wrong', () => {
            return request(app)
                .post("/api/auth/authenticate")
                .send({
                    password: "not the passworrd",
                    email: user1.email
                })
                .expect(403);
        });

        test('Account does not exist', () => {
            return request(app)
                .post("/api/auth/authenticate")
                .send({
                    password: "The password",
                    email: "non@email.com"
                })
                .expect(403);
        });

        test('Account does exist', () => {
            return request(app)
                .post("/api/auth/authenticate")
                .send({
                    password: user1.password,
                    email: user1.email
                })
                .expect(200)
                .then(res => {
                    assert.containsAllKeys(res.body, ["acccessToken"]);

                    const token = res.body.acccessToken;
                    jwt.verify(token, '44a0a45f31cf8122651e28710a43530e', function(err, decoded) {
                        assert.containsAllKeys(decoded, ["userId", "email", "fullName"]);

                        userToken = token;
                    });

                });
        });

        suiteTeardown(function() {

            return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
                mongoose.connection.db.dropDatabase(function(){
                });
            });
        });
    });

    suite( "Get Articles",() => {

        var user1 = {
            email: "article_login1@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
            article: {
                title: "The title",
                subtitle: "The subtitle",
                leadParagraph: "A lead paragraph",
                body: "The body",
                id: "aa",
            },
        };

        test('Get a list of all the articles where there are no articles', () => {
            return request(app)
                .get("/api/articles")
                .send()
                .expect(200)
                .then(res => {
                    assert.equal(res.body.length, 0);
                });
        });

        test('Get a list of all the articles where there are articles', () => {

            return request(app)
                .post("/api/auth/createAccount")
                .send(user1)
                .expect(201)
                .then(() =>{
                    return request(app)
                        .post("/api/auth/authenticate")
                        .send(user1)
                        .expect(200);
                })
                .then(res => {
                    const token = res.body.acccessToken;
                    jwt.verify(token, '44a0a45f31cf8122651e28710a43530e', function(err, decoded) {

                        user1.token = token;
                        user1.id = decoded.userId;
                    });

                    return request(app)
                        .post("/api/articles")
                        .set("Authorization", `bearer ${user1.token}`)
                        .send(user1.article)
                        .expect(201);
                })
                .then(res => {
                    user1.article.id = res.body.id;

                    return request(app)
                        .get("/api/articles")
                        .send()
                        .expect(200);
                })
                .then(res => {
                    assert.equal(res.body.length, 1);
                });
        });

        suiteTeardown(function() {

            return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
                mongoose.connection.db.dropDatabase(function(){
                });
            });
        });
    });

    suite( "Articles Creation",() => {

        var user1 = {
            email: "article_login1@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
            article: {
                    title: "The title",
                    subtitle: "The subtitle",
                    leadParagraph: "A lead paragraph",
                    body: "The body",
                },
        };
        var user2 = {
            email: "article_login2@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
            article: {
                title: "The another title",
                subtitle: "The subtitle",
                leadParagraph: "A lead paragraph",
                body: "The body",
            },
        };

        suiteSetup(function() {

            return request(app)
                .post("/api/auth/createAccount")
                .send(user1)
                .expect(201)
                .then(() =>{

                    return request(app)
                        .post("/api/auth/createAccount")
                        .send(user2)
                        .expect(201);

                })
                .then(() =>{

                    return request(app)
                        .post("/api/auth/authenticate")
                        .send(user1)
                        .expect(200);
                })
                .then(res => {
                    const token = res.body.acccessToken;
                    jwt.verify(token, '44a0a45f31cf8122651e28710a43530e', function(err, decoded) {

                        user1.token = token;
                        user1.id = decoded.userId;
                    });

                    return request(app)
                        .post("/api/auth/authenticate")
                        .send(user2)
                        .expect(200);
                })
                .then(res => {
                    const token = res.body.acccessToken;
                    jwt.verify(token, '44a0a45f31cf8122651e28710a43530e', function(err, decoded) {

                        user2.token = token;
                        user2.id = decoded.userId;
                    });
                });
        });

        test('Articles Creation missing auth', () => {
            return request(app)
                .post("/api/articles")
                .send(user1.article)
                .expect(403);
        });

        test('Articles Creation bad auth', () => {
            return request(app)
                .post("/api/articles")
                .set("Authorization", `bearer ${user1.token}222`)
                .send(user1.article)
                .expect(403);
        });

        test('Articles Creation success', () => {
            return request(app)
                .post("/api/articles")
                .set("Authorization", `bearer ${user1.token}`)
                .send(user1.article)
                .expect(201)
                .then(res => {
                    assert.containsAllKeys(res.body, ["message", "id"]);
                    assert.equal(res.body.message, "Success");

                    assert.equal(res.body.id.length, 16);
                });
        });

        test('Article Creation missing title', () => {
            return request(app)
                .post("/api/articles")
                .set("Authorization", `bearer ${user1.token}`)
                .send({
                    subtitle: "The subtitle",
                    leadParagraph: "A lead paragraph",
                    body: "The body",
                })
                .expect(400);
        });

        test('Article Creation missing subtitle', () => {
            return request(app)
                .post("/api/articles")
                .set("Authorization", `bearer ${user1.token}`)
                .send({
                    title: "The another title",
                    leadParagraph: "A lead paragraph",
                    body: "The body",
                })
                .expect(400);
        });

        test('Article Creation missing lead para', () => {
            return request(app)
                .post("/api/articles")
                .set("Authorization", `bearer ${user1.token}`)
                .send({
                    title: "The another title",
                    subtitle: "The subtitle",
                    body: "The body",
                })
                .expect(400);
        });

        test('Article Creation missing body', () => {
            return request(app)
                .post("/api/articles")
                .set("Authorization", `bearer ${user1.token}`)
                .send({
                    title: "The another title",
                    subtitle: "The subtitle",
                    leadParagraph: "A lead paragraph",
                })
                .expect(400);
        });

        suiteTeardown(function() {

            return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
                mongoose.connection.db.dropDatabase(function(){
                });
            });
        });
    });

     suite( "Articles Editing",() => {

         var user1 = {
             email: "email_login2@email.com",
             fullName: "The full name",
             password: "The password",
             token: "",
             id: "",
             articles: [
                 {
                     id: "aa",
                     title: "The title",
                     subtitle: "The subtitle",
                     leadParagraph: "A lead paragraph",
                     body: "The body",
                 },
                 {
                     id: "aa",
                     title: "The new title title",
                     subtitle: "The subtitle",
                     leadParagraph: "A lead paragraph",
                     body: "The body",
                 },
             ],
         };
         var user2 = {
             email: "email_login1@email.com",
             fullName: "The full name",
             password: "The password",
             token: "",
             id: "",
             article: {
                 id: "aa",
                 title: "The another title",
                 subtitle: "The subtitle",
                 leadParagraph: "A lead paragraph",
                 body: "The body",
             }
         };

         suiteSetup(function() {

             return request(app)
                 .post("/api/auth/createAccount")
                 .send(user1)
                 .expect(201)
                 .then(() =>{

                     return request(app)
                         .post("/api/auth/createAccount")
                         .send(user2)
                         .expect(201);

                 })
                 .then(() =>{

                     return request(app)
                         .post("/api/auth/authenticate")
                         .send(user1)
                         .expect(200);
                 })
                 .then(res => {
                     const token = res.body.acccessToken;

                     try {
                         var decoded = jwt.verify(token, '44a0a45f31cf8122651e28710a43530e');
                     } catch(err) {
                         // err
                     }

                     user1.token = token;
                     user1.id = decoded.userId;

                     return request(app)
                         .post("/api/auth/authenticate")
                         .send(user2)
                         .expect(200);
                 })
                 .then(res => {
                     const token = res.body.acccessToken;

                     try {
                         var decoded = jwt.verify(token, '44a0a45f31cf8122651e28710a43530e');
                     } catch(err) {
                         // err
                     }

                     user2.token = token;
                     user2.id = decoded.userId;

                     return request(app)
                         .post("/api/articles")
                         .set("Authorization", `bearer ${user1.token}`)
                         .send(user1.articles[0])
                         .expect(201);
                 })
                 .then(res => {
                     user1.articles[0].id = res.body.id;

                     return request(app)
                         .post("/api/articles")
                         .set("Authorization", `bearer ${user1.token}`)
                         .send(user1.articles[1])
                         .expect(201);
                 })
                 .then(res => {
                     user1.articles[1].id = res.body.id;

                     return request(app)
                         .post("/api/articles")
                         .set("Authorization", `bearer ${user2.token}`)
                         .send(user2.article)
                         .expect(201);
                 })
                 .then(res => {
                     user2.article.id = res.body.id;
                 });
         });

         test('Articles Editing missing auth', () => {
             return request(app)
                 .put("/api/articles")
                 .send(user1.articles[0])
                 .expect(403);
         });

         test('Articles Editing bad auth', () => {
             return request(app)
                 .put("/api/articles")
                 .set("authorization", `bearer xdfg${user1.token}`)
                 .send(user1.articles[0])
                 .expect(403);
         });

         test('Articles Editing a different users article ', () => {

             return request(app)
                 .put("/api/articles")
                 .set("authorization", `bearer ${user2.token}`)
                 .send(user1.articles[0])
                 .expect(401);
         });

         test('Articles Editing success', () => {

             return request(app)
                 .put("/api/articles")
                 .set("authorization", `bearer ${user1.token}`)
                 .send(user1.articles[0])
                 .expect(200)
                 .then(res => {
                     assert.containsAllKeys(res.body, ["message"]);
                     assert.equal(res.body.message, "Success");
                 });
         });

         test('Articles Editing missing title', () => {
             return request(app)
                 .put("/api/articles")
                 .set("authorization", `bearer ${user1.token}`)
                 .send({
                     subtitle: "The subtitle",
                     leadParagraph: "A lead paragraph",
                     body: "The body",
                 })
                 .expect(400);
         });

         test('Articles Editing missing subtitle', () => {
             return request(app)
                 .put("/api/articles")
                 .set("authorization", `bearer ${user1.token}`)
                 .send({
                     title: "The another title",
                     leadParagraph: "A lead paragraph",
                     body: "The body",
                 })
                 .expect(400);
         });

         test('Articles Editing missing lead para', () => {
             return request(app)
                 .put("/api/articles")
                 .set("authorization", `bearer ${user1.token}`)
                 .send({
                     title: "The another title",
                     subtitle: "The subtitle",
                     body: "The body",
                 })
                 .expect(400);
         });

         test('Articles Editing missing body', () => {
             return request(app)
                 .put("/api/articles")
                 .set("authorization", `bearer ${user1.token}`)
                 .send({
                     title: "The another title",
                     subtitle: "The subtitle",
                     leadParagraph: "A lead paragraph",
                 })
                 .expect(400);
         });

         suiteTeardown(function() {

             return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
                 mongoose.connection.db.dropDatabase(function(){
                 });
             });
         });

     });

    suite( "Get Articles by a specified user",() => {

        var user1 = {
            email: "email_login2@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
            articles: [
                {
                id: "aa",
                title: "The title",
                subtitle: "The subtitle",
                leadParagraph: "A lead paragraph",
                body: "The body",
                },
                {
                    id: "aa",
                    title: "The new title title",
                    subtitle: "The subtitle",
                    leadParagraph: "A lead paragraph",
                    body: "The body",
                },
                ],
        };
        var user2 = {
            email: "email_login1@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
            article: {
                id: "aa",
                title: "The another title",
                subtitle: "The subtitle",
                leadParagraph: "A lead paragraph",
                body: "The body",
            }
        };

        suiteSetup(function() {

            return request(app)
                .post("/api/auth/createAccount")
                .send(user1)
                .expect(201)
                .then(() =>{

                    return request(app)
                        .post("/api/auth/createAccount")
                        .send(user2)
                        .expect(201);

                })
                .then(() =>{

                    return request(app)
                        .post("/api/auth/authenticate")
                        .send(user1)
                        .expect(200);
                })
                .then(res => {
                    const token = res.body.acccessToken;

                    try {
                        var decoded = jwt.verify(token, '44a0a45f31cf8122651e28710a43530e');
                    } catch(err) {
                        // err
                    }

                    user1.token = token;
                    user1.id = decoded.userId;

                    return request(app)
                        .post("/api/auth/authenticate")
                        .send(user2)
                        .expect(200);
                })
                .then(res => {
                    const token = res.body.acccessToken;

                    try {
                        var decoded = jwt.verify(token, '44a0a45f31cf8122651e28710a43530e');
                    } catch(err) {
                        // err
                    }

                    user2.token = token;
                    user2.id = decoded.userId;

                    return request(app)
                        .post("/api/articles")
                        .set("Authorization", `bearer ${user1.token}`)
                        .send(user1.articles[0])
                        .expect(201);
                })
                .then(res => {
                    user1.articles[0].id = res.body.id;

                    return request(app)
                        .post("/api/articles")
                        .set("Authorization", `bearer ${user1.token}`)
                        .send(user1.articles[1])
                        .expect(201);
                })
                .then(res => {
                    user1.articles[1].id = res.body.id;

                    return request(app)
                        .post("/api/articles")
                        .set("Authorization", `bearer ${user2.token}`)
                        .send(user2.article)
                        .expect(201);
                })
                .then(res => {
                    user2.article.id = res.body.id;
                });
        });

        test('Get a list of all the articles where there are no articles', () => {
            return request(app)
                .get("/api/articles/user/user1")
                .send()
                .expect(200)
                .then(res => {
                    assert.equal(res.body.length, 0);
                });
        });

        test('Get a list of all the articles for user 1', () => {
            return request(app)
                .get(`/api/articles/user/${user1.id}`)
                .send()
                .expect(200)
                .then(res => {
                    assert.equal(res.body.length, 2);
                });
        });

        test('Get a list of all the articles for user 2', () => {
            return request(app)
                .get(`/api/articles/user/${user2.id}`)
                .send()
                .expect(200)
                .then(res => {
                    assert.equal(res.body.length, 1);
                });
        });

        suiteTeardown(function() {

            return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
                mongoose.connection.db.dropDatabase(function(){
                });
            });
        });
    });

    suite( "Get specific article",() => {

        var user1 = {
            email: "get_login2@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
            article: {
                id: "aa",
                title: "The title",
                subtitle: "The subtitle",
                leadParagraph: "A lead paragraph",
                body: "The body",
            },
        };
        var user2 = {
            email: "get_login1@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
            article: {
                id: "aa",
                title: "The another title",
                subtitle: "The subtitle",
                leadParagraph: "A lead paragraph",
                body: "The body",
            }
        };

        suiteSetup(function() {

            return request(app)
                .post("/api/auth/createAccount")
                .send(user1)
                .expect(201)
                .then(() =>{

                    return request(app)
                        .post("/api/auth/createAccount")
                        .send(user2)
                        .expect(201);

                })
                .then(() =>{

                    return request(app)
                        .post("/api/auth/authenticate")
                        .send(user1)
                        .expect(200);
                })
                .then(res => {
                    const token = res.body.acccessToken;

                    try {
                        var decoded = jwt.verify(token, '44a0a45f31cf8122651e28710a43530e');
                    } catch(err) {
                        // err
                    }

                    user1.token = token;
                    user1.id = decoded.userId;

                    return request(app)
                        .post("/api/auth/authenticate")
                        .send(user2)
                        .expect(200);
                })
                .then(res => {
                    const token = res.body.acccessToken;

                    try {
                        var decoded = jwt.verify(token, '44a0a45f31cf8122651e28710a43530e');
                    } catch(err) {
                        // err
                    }

                    user2.token = token;
                    user2.id = decoded.userId;

                    return request(app)
                        .post("/api/articles")
                        .set("Authorization", `bearer ${user1.token}`)
                        .send(user1.article)
                        .expect(201);
                })
                .then(res => {
                    user1.article.id = res.body.id;

                    return request(app)
                        .post("/api/articles")
                        .set("Authorization", `bearer ${user2.token}`)
                        .send(user2.article)
                        .expect(201);
                })
                .then(res => {
                    user2.article.id = res.body.id;
                });
        });

        test('Get article that does not exist', () => {
            return request(app)
                .get("/api/articles/IDontExist")
                .send()
                .expect(404);
        });

        test('Get article that does not exist', () => {
            return request(app)
                .get(`/api/articles/${user1.article.id}`)
                .send()
                .expect(200)
                .then(res => {

                    assert.hasAnyKeys(res.body, ["id", "title", "subtitle", "leadParagraph", "imageUrl", "body", "date", "category"]);

                });
        });

        suiteTeardown(function() {

            return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
                mongoose.connection.db.dropDatabase(function(){
                });
            });
        });

    });

    suite( "Delete specific article",() => {

        var user1 = {
            email: "email_login2@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
            article: {
                id: "aa",
                title: "The title",
                subtitle: "The subtitle",
                leadParagraph: "A lead paragraph",
                body: "The body",
            },
        };
        var user2 = {
            email: "email_login1@email.com",
            fullName: "The full name",
            password: "The password",
            token: "",
            id: "",
            article: {
                id: "aa",
                title: "The another title",
                subtitle: "The subtitle",
                leadParagraph: "A lead paragraph",
                body: "The body",
            }
        };

        suiteSetup(function() {

            return request(app)
                .post("/api/auth/createAccount")
                .send(user1)
                .expect(201)
                .then(() =>{

                    return request(app)
                        .post("/api/auth/createAccount")
                        .send(user2)
                        .expect(201);

                })
                .then(() =>{

                    return request(app)
                        .post("/api/auth/authenticate")
                        .send(user1)
                        .expect(200);
                })
                .then(res => {
                    const token = res.body.acccessToken;

                    try {
                        var decoded = jwt.verify(token, '44a0a45f31cf8122651e28710a43530e');
                    } catch(err) {
                        // err
                    }

                    user1.token = token;
                    user1.id = decoded.userId;

                    return request(app)
                        .post("/api/auth/authenticate")
                        .send(user2)
                        .expect(200);
                })
                .then(res => {
                    const token = res.body.acccessToken;

                    try {
                        var decoded = jwt.verify(token, '44a0a45f31cf8122651e28710a43530e');
                    } catch(err) {
                        // err
                    }

                    user2.token = token;
                    user2.id = decoded.userId;

                    return request(app)
                        .post("/api/articles")
                        .set("Authorization", `bearer ${user1.token}`)
                        .send(user1.article)
                        .expect(201);
                })
                .then(res => {
                    user1.article.id = res.body.id;

                    return request(app)
                        .post("/api/articles")
                        .set("Authorization", `bearer ${user2.token}`)
                        .send(user2.article)
                        .expect(201);
                })
                .then(res => {
                    user2.article.id = res.body.id;
                });
        });

        test('delete article that does not exist', () => {
            return request(app)
                .delete("/api/articles/IDontExist")
                .set("authorization", `bearer ${user1.token}`)
                .send()
                .expect(404);
        });

        test('missing authorization', () => {
            return request(app)
                .delete(`/api/articles/${user1.article.id}`)
                .send()
                .expect(403);
        });

        test('invalid token  authorization', () => {
            return request(app)
                .delete(`/api/articles/${user1.article.id}`)
                .set("Authorization", `bearer ${user1.token}123`)
                .send()
                .expect(403);
        });

        test('delete article created by user 1 by user2', () => {
            return request(app)
                .delete(`/api/articles/${user1.article.id}`)
                .set("Authorization", `bearer ${user2.token}`)
                .send()
                .expect(401);
        });

        test('delete article successfully', () => {
            return request(app)
                .delete(`/api/articles/${user1.article.id}`)
                .set("authorization", `bearer ${user1.token}`)
                .send()
                .expect(200);
        });

        suiteTeardown(function() {

            return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
                mongoose.connection.db.dropDatabase(function(){
                });
            });
        });
    });
});