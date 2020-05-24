import mongoose, { Document } from 'mongoose';
import { IUserDoc } from './User';
import { IArticleDoc } from './Article';
import { gql } from 'apollo-server-express';

export let CommentTypeDefs = gql`
type Comment {
    id: String
    body: String,
    createdAt: String
    updatedAt: String
    author: User,
}

input InputComment {
    body: String,
}

type CommentPayload {
    comment: Comment
}

type CommentsPayload {
    comments: [Comment]
}
`;

export interface ICommentDoc extends Document {
    body: string;
    author: IUserDoc;
    article: IArticleDoc;
    toJSONFor(user: IUserDoc | null): JSON;
}

const CommentSchema = new mongoose.Schema({
    body: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' }
}, { timestamps: true });

CommentSchema.methods.toJSONFor = function (user: IUserDoc | null) {
    return {
        id: this._id,
        body: this.body,
        createdAt: new Date(this.createdAt).toISOString(),
        updatedAt: new Date(this.updatedAt).toISOString(),
        author: this.author.toProfileJSONFor(user)
    };
};

export default mongoose.model<ICommentDoc>('Comment', CommentSchema);