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
    });

    suite( "Account Login",() => {
        test('Account password is wrong', () => {
            return request(app)
                .post("/api/auth/authenticate")
                .send({
                    password: "not The password",
                    email: "email1@email.com"
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
                    password: "The password",
                    email: "email1@email.com"
                })
                .expect(200)
                .then(res => {
                    assert.containsAllKeys(res.body, ["acccessToken"]);

                    const token = res.body.acccessToken;
                    jwt.verify(token, '44a0a45f31cf8122651e28710a43530e', function(err, decoded) {
                        assert.containsAllKeys(decoded, ["userId", "email", "fullName"]);
                    });

                });
        });
    });

    suite( "Get Articles",() => {
        test('Get a list of all the articles where there are no articles', () => {
            return request(app)
                .get("/api/articles")
                .send()
                .expect(200)
                .then(res => {
                    assert.equal(res.body.length, 0);
                });
        });
    });

    suite( "Get Articles by a specified user",() => {
        test('Get a list of all the articles where there are no articles', () => {
            return request(app)
                .get("/api/articles/user/user1")
                .send()
                .expect(200)
                .then(res => {
                    assert.equal(res.body.length, 0);
                });
        });
    });

    suite( "Get specific article",() => {
        test('Get article that does not exist', () => {
            return request(app)
                .get("/api/articles/IDontExist")
                .send()
                .expect(404);
        });
    });
});