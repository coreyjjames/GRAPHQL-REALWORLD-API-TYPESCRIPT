import User, { IUserDoc, IUserDTO } from '../models/User';
import Auth from './Auth';
import { IContext } from 'resolvers/Resolver';
import { UserInputError } from 'apollo-server-express';
import ErrorHandlerController from './ErrorHandlerController';


export default class UserController {
    public static async registerUser(root: any, args: { username: string, email: string, password: string }, context: IContext) {
        try {
            const user = new User();
            user.username = args.username;
            user.email = args.email;
            user.setPassword(args.password);

            const savedUser = await user.save();
            if (!savedUser) { throw (ErrorHandlerController.ValidationError("user", "could not be saved")) }

            return { user: user.toAuthJSON() };
        } catch (error) {
            throw new UserInputError("Error registering user", error)
        }
    }

    public static async loginUser(root: any, args: { email: string, password: string }, context: IContext) {
        try {
            if (!args.email || args.email === "") {
                throw (ErrorHandlerController.ValidationError("email", "can't be blank"));
            }

            if (!args.password || args.email === "") {
                throw (ErrorHandlerController.ValidationError("password", "can't be blank"));
            }

            const { err, user } = await Auth.AuheticateWithCredentials(args.email, args.password);
            if (err) { throw (err) }

            if (user) {
                user.token = user.generateJWT();
                return { user: user.toAuthJSON() };
            }
        } catch (error) {
            throw new UserInputError('Error loging in user', error)
        }
    }

    public static async getUser(root: any, args: any, context: IContext) {
        try {
            const user = await User.findById(context.user.id);
            if (!user) { throw (ErrorHandlerController.ValidationError("user", "not found")) }

            return user.toAuthJSON();

        } catch (error) {
            throw new UserInputError("Error getting user", error)
        }
    }

    public static async getAllUser() {
        try {
            const users = await User.find();
            if (!users) { throw (ErrorHandlerController.ValidationError("users", "unabled to get all users")) }

            return users;

        } catch (error) {
            throw new UserInputError("Error getting all users", error)
        }
    }

    public static async updateUser(root: any, args: { password: string, user: IUserDoc }, context: IContext) {
        try {
            const user = await User.findById(context.user.id);
            if (!user) { throw (ErrorHandlerController.ValidationError("user", "not found")) }

            // only update fields that were actually passed...
            if (typeof args.user.username !== 'undefined') {
                user.username = args.user.username;
            }
            if (typeof args.user.email !== 'undefined') {
                user.email = args.user.email;
            }
            if (typeof args.user.bio !== 'undefined') {
                user.bio = args.user.bio;
            }
            if (typeof args.user.image !== 'undefined') {
                user.image = args.user.image;
            }
            if (typeof args.password !== 'undefined') {
                user.setPassword(args.password);
            }

            const savedUser = await user.save();
            if (!savedUser) { throw (ErrorHandlerController.ValidationError("user", "could not be saved")) }

            return { user: user.toAuthJSON() };
        } catch (error) {
            throw new UserInputError("Error getting all users", error)
        }
    }
}