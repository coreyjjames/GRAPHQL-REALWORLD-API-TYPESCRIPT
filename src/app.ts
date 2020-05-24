import express, { Router, Request, Response, NextFunction } from 'express';
import { Application } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { GraphQLSchema } from 'graphql';
import InitialData from './initialData';
import mongoose from 'mongoose';
import errorhandler from 'errorhandler';
import Auth from '../controllers/Auth';
import ErrorHandlerController from '../controllers/ErrorHandlerController';

// Register Models
import '../models/User';
import '../models/Article';
import '../models/Comment';

class App {
  public app: Application
  public port: number
  public isProduction: boolean
  public schemas: GraphQLSchema

  constructor(appInit: { port: number; schemas: GraphQLSchema, middleWares: any; }) {
    this.app = express()
    this.port = appInit.port
    this.isProduction = Boolean(process.env.isProduction)
    this.schemas = appInit.schemas

    this.initializeServer()

    this.middlewares(appInit.middleWares)
    this.assets()
    this.template()
    this.database()
  }

  private initializeServer() {
    const server = new ApolloServer({
      context: async ({ req }) => {
        const user = await Auth.GraphAuthentication(req)
        return { user }
      },
      formatError: (err: any) => {
        return ErrorHandlerController.errorHandler(err)
      },
      schema: this.schemas
    });
    server.applyMiddleware({ app: this.app })
  }

  private middlewares(middleWares: { forEach: (arg0: (middleWare: any) => void) => void; }) {
    middleWares.forEach(middleWare => {
      this.app.use(middleWare)
    })
  }

  private assets() {
    this.app.use(express.static('public'))
    this.app.use(express.static('views'))
    if (!this.isProduction) {
      this.app.use(errorhandler());
    }
  }

  private template() {
    this.app.set('view engine', 'pug')
  }

  private async database() {
    try {
      const db = await mongoose.connect(String(process.env.MONGO_URL), { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
      const init = new InitialData(db);
      if (!this.isProduction) {
        mongoose.set('debug', true);
      }
    } catch (error) {
      console.log("MONGODB CONNECTION FAILED.")
      console.log("ERRORS: ", error);
    }
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`App listening on the http://localhost:${this.port}`)
    })
  }
}

export default App;