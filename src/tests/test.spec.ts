import app from '../app';

import 'mocha';



import * as request from "supertest";
import chai = require('chai');
const assert = chai.assert;
import * as mongoose from 'mongoose';


const asPromised = require("chai-as-promised");
chai.use(asPromised);


suite('Test', () => {

    suiteSetup(function() {

        return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/csgames", () => {
            mongoose.connection.db.dropDatabase(function(){
            })
        });


    });


    test('status', () => {

        return request(app)
            .get("/api/status")
            .send()
            .expect(200)
            .then(res => {
                assert.equal(res.body.status, "Up");
            })
    });

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