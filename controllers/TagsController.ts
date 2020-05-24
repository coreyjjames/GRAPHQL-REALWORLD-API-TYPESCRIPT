import Article from '../models/Article';
import { UserInputError } from 'apollo-server-express';


export default class TagsController {
    public static async GetTags(root: any, args: any, context: any) {
        try {
            const tags = await Article.find().distinct('tagList');
            return { tagList: tags };
        } catch (error) {
            throw new UserInputError("Error getting tags", error)
        }
    }
}