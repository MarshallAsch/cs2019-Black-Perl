import { Router } from 'express';
import {Account} from '../models/account.model';

const bcrypt = require("bcrypt");



export class Api {
    public getRouter(): Router {
        const router = Router();

        router.post("/auth/createAccount", ((req, res) => {


            // check for missing params

            if (!req.body.email) {
                res.status(400).json({"message": "missing email"});
            }

            if (!req.body.fullName) {
                res.status(400).json({"message": "missing name"});
            }

            if (!req.body.password) {
                res.status(400).json({"message": "missing password"});
            }

            new Promise((resolve, reject) => {
                Account.findOne({
                    email: req.body.email,
                }).then((foundUser) => {
                    if (foundUser) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch((err) => {
                    reject(err);
                });
            }).then(doesExist => {

                console.log("exists: " + doesExist);
                if (doesExist) {
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
                            }) ;


                        });
                    });
                }

            });


        }));


        return router;
    }
}

