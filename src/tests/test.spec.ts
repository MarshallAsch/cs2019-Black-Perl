import app from '../app';

import 'mocha';



import * as request from "supertest";
import chai = require('chai');

const asPromised = require("chai-as-promised");
chai.use(asPromised);





describe('Test', () => {
    it('status', () => {

        return request(app)
            .get("/api/status")
            .send()
            .expect(200);

    });

    it('Account Creation', () => {
        

        return request(app)
        .post("/api/auth/createAccount")
        .send({
            password: "The password",
            fullName: "The full name"
        })
        .expect(400);


    });
});