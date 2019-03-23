import app from '../app';

import 'mocha';



import * as request from "supertest";
import chai = require('chai');



describe('Test', () => {
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