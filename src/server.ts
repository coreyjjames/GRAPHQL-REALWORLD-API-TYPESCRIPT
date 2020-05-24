import App from './app'
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import methodoverride from 'method-override';
import { makeExecutableSchema } from 'graphql-tools';

import dotenv from 'dotenv';

// Import Routes
import Resolver, { typeDefs } from '../resolvers/Resolver'
import { UserTypeDefs } from '../models/User';
import { ArticleTypeDefs } from '../models/Article';
import { CommentTypeDefs } from '../models/Comment';
dotenv.config()

const app = new App({
  port: Number(process.env.PORT),
  schemas: makeExecutableSchema({
    typeDefs: [typeDefs, UserTypeDefs, ArticleTypeDefs, CommentTypeDefs],
    resolvers: Resolver
  }),
  middleWares: [
    cors(),
    morgan('dev'),
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    methodoverride(),
  ]
})

app.listen()