
import * as mongoose from "mongoose";


export const ArticleSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
        required: true,
    },
    leadParagraph: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    body: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now()
    },
    category: {
        type: String,
    },
});

export interface IArticle extends mongoose.Document {

    id: string;
    title: string;
    subtitle: string;
    leadParagraph: string;
    imageUrl: string;
    body: string;
    author: string;
    userId: string;
    date: Date;
    category: string;
}



export const Article = mongoose.model<IArticle>("Articles", ArticleSchema);
export default Article;