import { AuthenticationError, gql } from 'apollo-server-express'
import UserController from '../controllers/UserController'
import ProfileController from '../controllers/ProfileController';
import ArticleController from '../controllers/ArticleController';
import TagsController from '../controllers/TagsController';

export interface IContext {
    user: {
        id: string,
        username: string,
    }
}

type callback = (parent: any, args: any, ctx: IContext) => any;

async function AuthRequired(root: any, args: any, context: IContext, next: callback) {
    if (!context.user) {
        throw new AuthenticationError('You must be logged in!');
    }
    return await next(root, args, context);
};

export const typeDefs = gql`
  type Query {
    users: [User!]!
    user: User!
    profile(username: String!): UserPayload
    article(slug: String!): ArticlePayload
    articles(limit: Int, offset: Int, tag: [String], author: String, favorited: String): ArticlesPayload
    comment: CommentPayload
    comments(slug: String!): CommentsPayload
    tags: TagPayload
    feed(limit: Int, offset: Int): ArticlesPayload
  }

  type Mutation {
    login(email: String!, password: String!): UserPayload
    register(email: String!, password: String!, username: String!): UserPayload
    updateUser(user: InputUser!): UserPayload
    createArticle(article: InputArticle!): ArticlePayload
    updateArticle(slug: String!, article: InputArticle!): ArticlePayload
    deleteArticle(slug: String!): Success
    createComment(slug: String!, comment: InputComment!): CommentPayload
    deleteComment(slug: String!, id: String!): Success
    followUser(username: String!): UserPayload
    unFollowUser(username: String!): UserPayload
    favoriteArticle(slug: String!): ArticlePayload
    unFavoriteArticle(slug: String!): ArticlePayload
  }

  type Success {
    message: String
  }
  `;

export default {
    Query: {
        users: async () => {
            return await UserController.getAllUser();
        },
        user: async (root: any, args: any, context: IContext) => {
            return await AuthRequired(root, args, context, UserController.getUser);
        },
        profile: async (root: any, args: any, context: IContext) => {
            return await ProfileController.GetProfile(root, args, context);
        },
        article: async (root: any, args: any, context: IContext) => {
            return await ArticleController.GetArticleBySlug(root, args, context);
        },
        articles: async (root: any, args: any, context: IContext) => {
            return await ArticleController.GetArticle(root, args, context);
        },
        comments: async (root: any, args: any, context: IContext) => {
            return await ArticleController.GetComments(root, args, context);
        },
        tags: async (root: any, args: any, context: IContext) => {
            return await TagsController.GetTags(root, args, context);
        },
        feed: async (root: any, args: any, context: IContext) => {
            return await AuthRequired(root, args, context, ArticleController.GetFeed);
        },

    },

    Mutation: {
        login: async (root: any, args: any, context: IContext, info: any) => {
            return await UserController.loginUser(root, args, context);
        },
        register: async (root: any, args: any, context: IContext, info: any) => {
            return await UserController.registerUser(root, args, context)
        },
        updateUser: async (root: any, args: any, context: IContext, info: any) => {
            return await AuthRequired(root, args, context, UserController.updateUser);
        },
        createArticle: async (root: any, args: any, context: IContext, info: any) => {
            return await AuthRequired(root, args, context, ArticleController.CreateArticle);
        },
        updateArticle: async (root: any, args: any, context: IContext, info: any) => {
            return await AuthRequired(root, args, context, ArticleController.UpdatingArticle);
        },
        deleteArticle: async (root: any, args: any, context: IContext, info: any) => {
            return await AuthRequired(root, args, context, ArticleController.DeleteArticle);
        },
        createComment: async (root: any, args: any, context: IContext, info: any) => {
            return await AuthRequired(root, args, context, ArticleController.CreateComment);
        },
        deleteComment: async (root: any, args: any, context: IContext, info: any) => {
            return await AuthRequired(root, args, context, ArticleController.DeleteComments);
        },
        followUser: async (root: any, args: any, context: IContext) => {
            return await AuthRequired(root, args, context, ProfileController.FollowProfile);
        },
        unFollowUser: async (root: any, args: any, context: IContext) => {
            return await AuthRequired(root, args, context, ProfileController.UnfollowProfile);
        },
        favoriteArticle: async (root: any, args: any, context: IContext, info: any) => {
            return await AuthRequired(root, args, context, ArticleController.FavoriteArticle);
        },
        unFavoriteArticle: async (root: any, args: any, context: IContext, info: any) => {
            return await AuthRequired(root, args, context, ArticleController.UnfavoriteArticle);
        },
    }
};
