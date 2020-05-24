import User, { IUserDoc } from '../models/User';
import Comment, { ICommentDoc } from '../models/Comment';
import Article, { IArticleDoc } from '../models/Article';
import { IContext } from 'resolvers/Resolver';
import { UserInputError } from 'apollo-server-express';
import ErrorHandlerController from './ErrorHandlerController';

interface IQuery {
    tagList?: object;
    author?: IUserDoc;
    _id?: object;
}

export default class ArticleController {
    public static async GetArticle(root: any, args: { limit: number, offset: number, tag: string[], author: string, favorited: string }, context: IContext) {
        try {
            const query: IQuery = {
            };

            let limit = 20;
            let offset = 0;

            if (typeof args.limit !== 'undefined') {
                limit = args.limit;
            }

            if (typeof args.offset !== 'undefined') {
                offset = args.offset;
            }

            if (typeof args.tag !== 'undefined') {
                query.tagList = { $in: args.tag };
            }

            const author = args.author ? await User.findOne({ username: args.author }) : null;
            const favoriter = args.favorited ? await User.findOne({ username: args.favorited }) : null;

            if (author) {
                query.author = author;
            }

            if (favoriter) {
                query._id = { $in: favoriter.favorites };
            } else if (args.favorited) {
                query._id = { $in: [] };
            }

            const articles = await Article.find(query)
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: 'desc' })
                .populate('author')
                .exec();

            const articlesCount = await Article.count(query).exec();

            const userData = context.user ? await User.findById(context.user.id) : null;

            return {
                articles: articles.map((article) => {
                    return article.toJSONFor(userData);
                }),
                articlesCount
            };
        } catch (error) {
            throw new UserInputError("Error getting article", error)
        }
    }

    public static async GetFeed(root: any, args: { limit: number, offset: number }, context: IContext) {
        try {
            let limit = 20;
            let offset = 0;

            if (typeof args.limit !== 'undefined') {
                limit = args.limit;
            }

            if (typeof args.offset !== 'undefined') {
                offset = args.offset;
            }

            const userData = await User.findById(context.user.id);
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "Could not find")) }

            const articles = await Article.find({ author: { $in: userData.following } })
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: 'desc' })
                .populate('author')
                .exec();

            const articlesCount = await Article.count({ author: { $in: userData.following } }).exec();

            return {
                articles: articles.map((article) => {
                    return article.toJSONFor(userData);
                }),
                articlesCount
            };
        } catch (error) {
            throw new UserInputError("Error getting feed", error)
        }
    }

    public static async CreateArticle(root: any, args: { article: IArticleDoc }, context: IContext) {
        try {
            const userData = await User.findById(context.user.id);
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "Could not find")) }

            const article = new Article(args.article);

            article.author = userData;

            const savedArticle = await article.save();
            if (!savedArticle) { throw (ErrorHandlerController.ValidationError("article", "Could not save data")) }

            return { article: article.toJSONFor(userData) };
        } catch (error) {
            throw new UserInputError("Error creating article", error)
        }
    }

    public static async GetArticleBySlug(root: any, args: { slug: string }, context: IContext) {
        try {
            const userData = context.user ? await User.findById(context.user.id) : null;
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "Could not find user")) }

            let article = await Article.findOne({ slug: args.slug });
            if (!article) { throw (ErrorHandlerController.ValidationError("article", "Could not find")) }
            article = await article.execPopulate();

            await article.populate('author').execPopulate();

            return { article: article.toJSONFor(userData) };
        } catch (error) {
            throw new UserInputError("Error getting article by slug", error)
        }
    }

    public static async UpdatingArticle(root: any, args: { slug: string, article: IArticleDoc }, context: IContext) {
        try {
            const userData = await User.findById(context.user.id);
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "Could not find user")) }

            let article = await Article.findOne({ slug: args.slug });
            if (!article) { throw (ErrorHandlerController.ValidationError("article", "Could not find")) }
            article = await article.execPopulate();

            if (article.author._id.toString() === context.user.id.toString()) {
                if (typeof args.article.title !== 'undefined') {
                    article.title = args.article.title;
                }

                if (typeof args.article.description !== 'undefined') {
                    article.description = args.article.description;
                }

                if (typeof args.article.body !== 'undefined') {
                    article.body = args.article.body;
                }

                if (typeof args.article.tagList !== 'undefined') {
                    article.tagList = args.article.tagList;
                }

                const savedArticle = await article.save();
                if (!savedArticle) { throw (ErrorHandlerController.ValidationError("article", "Could not save data")) }

                await savedArticle.populate('author').execPopulate();

                return { article: savedArticle.toJSONFor(userData) };
            } else {
                throw (ErrorHandlerController.ValidationError("article", "Could not find"))
            }
        } catch (error) {
            throw new UserInputError("Error updating article", error)
        }
    }

    public static async DeleteArticle(root: any, args: { slug: string, article: IArticleDoc }, context: IContext) {
        try {
            const userData = await User.findById(context.user.id);
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "Could not find user")) }

            let article = await Article.findOne({ slug: args.slug });
            if (!article) { throw (ErrorHandlerController.ValidationError("article", "Could not find")) }
            article = await article.execPopulate();

            if (article.author._id.toString() === context.user.id.toString()) {
                await article.remove();

                return { message: "article removed" };
            } else {
                throw (ErrorHandlerController.ValidationError("article", "Could not find"))
            }
        } catch (error) {
            throw new UserInputError("Error deleting article", error)
        }
    }

    public static async FavoriteArticle(root: any, args: { slug: string }, context: IContext) {
        try {
            let article = await Article.findOne({ slug: args.slug });
            if (!article) { throw (ErrorHandlerController.ValidationError("article", "Could not find")) }
            article = await article.execPopulate();

            const articleId = article._id;

            const userData = await User.findById(context.user.id);
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "Could not find user")) }

            await userData.favorite(articleId);
            const updatedArticle = await article.updateFavoriteCount();

            await updatedArticle.populate('author').execPopulate();

            return { article: updatedArticle.toJSONFor(userData) };

        } catch (error) {
            throw new UserInputError("Error favoriting article", error)
        }
    }

    public static async UnfavoriteArticle(root: any, args: { slug: string }, context: IContext) {
        try {
            let article = await Article.findOne({ slug: args.slug });
            if (!article) { throw (ErrorHandlerController.ValidationError("article", "Could not find")) }
            article = await article.execPopulate();

            const articleId = article._id;

            const userData = await User.findById(context.user.id);
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "Could not find user")) }

            await userData.unfavorite(articleId);
            const updatedArticle = await article.updateFavoriteCount();

            await updatedArticle.populate('author').execPopulate();

            return { article: updatedArticle.toJSONFor(userData) };

        } catch (error) {
            throw new UserInputError("Error unfavoriting article", error)
        }
    }

    public static async CreateComment(root: any, args: { slug: string, comment: ICommentDoc }, context: IContext) {
        try {
            const userData = await User.findById(context.user.id);
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "Could not find user")) }

            let article = await Article.findOne({ slug: args.slug });
            if (!article) { throw (ErrorHandlerController.ValidationError("article", "Could not find")) }
            article = await article.execPopulate();

            const comment = new Comment(args.comment)

            comment.article = article;
            comment.author = userData;

            await comment.save();

            article.comments.push(comment);
            await article.save();

            return { comment: comment.toJSONFor(userData) }

        } catch (error) {
            throw new UserInputError("Error creating comment", error)
        }
    }

    public static async GetComments(root: any, args: { slug: string }, context: IContext) {
        try {
            const userData = context.user.id ? await User.findById(context.user.id) : null;

            let article = await Article.findOne({ slug: args.slug });
            if (!article) { throw (ErrorHandlerController.ValidationError("article", "Could not find")) }
            article = await article.execPopulate();

            const articles = await article.populate({
                path: 'comments',
                populate: {
                    path: 'author'
                },
                options: {
                    sort: {
                        createdAt: 'desc'
                    }
                }
            }).execPopulate();

            return {
                comments: articles.comments.map((comment) => {
                    return comment.toJSONFor(userData);
                })
            };

        } catch (error) {
            throw new UserInputError("Error getting comments", error)
        }
    }

    public static async DeleteComments(root: any, args: { id: string, slug: string }, context: IContext) {
        try {
            const comment = await Comment.findById(args.id);
            if (!comment) { throw (ErrorHandlerController.ValidationError("comment", "Could not find")) }

            let article = await Article.findOne({ slug: args.slug });
            if (!article) { throw (ErrorHandlerController.ValidationError("article", "Could not find")) }
            article = await article.execPopulate();

            if (comment.author.toString() === context.user.id.toString()) {
                article.comments.filter((_comment) => {
                    if (_comment._id.toString() !== comment._id.toString()) {
                        return _comment;
                    }
                });

                await article.save();

                await Comment.find({ _id: comment._id }).remove().exec();

                return { message: "comment removed" };
            }
            else {
                if (!comment) { throw (ErrorHandlerController.ValidationError("comment", "Could not find")) }
            }
        } catch (error) {
            throw new UserInputError("Error deleting comment", error)
        }
    }
}