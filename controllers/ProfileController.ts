import User from '../models/User';
import { IContext } from 'resolvers/Resolver';
import ErrorHandlerController from './ErrorHandlerController';
import { UserInputError } from 'apollo-server-express';

export default class ProfileController {

    public static async GetProfile(root: any, args: { username: string }, context: IContext) {
        try {
            if (context.user) {
                const userData = await User.findById(context.user.id);
                if (!userData) { throw (ErrorHandlerController.ValidationError("user", "not found")) }

                const profile = await User.findOne({ username: args.username });
                if (!profile) { throw (ErrorHandlerController.ValidationError("profile", "not found")) }

                return { user: profile.toProfileJSONFor(userData) };
            } else {
                throw ({ errors: { GetProfile: { user: "Could not find" } } });
            }

        } catch (error) {
            throw new UserInputError("Error getting profile", error)
        }
    }

    public static async FollowProfile(root: any, args: { username: string }, context: IContext) {
        try {
            const userData = await User.findById(context.user.id);
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "not found")) }

            const profile = await User.findOne({ username: args.username });
            if (!profile) { throw (ErrorHandlerController.ValidationError("profile", "not found")) }

            const updatedUser = await userData.follow(profile._id);

            return { user: profile.toProfileJSONFor(updatedUser) };

        } catch (error) {
            throw new UserInputError("Error getting profile", error)
        }
    }

    public static async UnfollowProfile(root: any, args: { username: string }, context: IContext) {
        try {
            const userData = await User.findById(context.user.id);
            if (!userData) { throw (ErrorHandlerController.ValidationError("user", "not found")) }

            const profile = await User.findOne({ username: args.username });
            if (!profile) { throw (ErrorHandlerController.ValidationError("profile", "not found")) }

            const updatedUser = await userData.unfollow(profile._id);

            return { user: profile.toProfileJSONFor(updatedUser) };

        } catch (error) {
            throw new UserInputError("Error getting profile", error)
        }
    }
}