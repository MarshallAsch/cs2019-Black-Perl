import * as mongoose from "mongoose";


export const AccountSchema = new mongoose.Schema({
    // account email
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        auto: true,
    },
    email: {
        type: String,
        required: true,
    },
    // display name
    fullName: {
        type: String,
        required: true,
    },
    // bcrypt.hashSync(passwd, SALT_ROUNDS)
    passwordHash: {
        type: String,
        required: true,
    },
    passwordSalt: {
        type: String,
        required: true,
    },

});

export interface IAccount extends mongoose.Document {
   userId: string;
   email: string;
   passwordHash: string;
   passwordSalt: string;
   fullName: string;
}



export const Account = mongoose.model<IAccount>("Accounts", AccountSchema);
export default Account;