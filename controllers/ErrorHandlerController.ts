import { GraphQLError } from "graphql";

export interface IErrorHandler extends GraphQLError {
    errors: {
        [index: string]: {
            name: string,
            message: string
        }
    },
    name: string
}

interface IError {
    [index: string]: string
}


export default class ErrorHandlerController {
    public static ValidationError(key: string, message: string) {
        return { errors: { [key]: { message } }, name: "ValidationError" }
    }

    public static errorHandler(err: any) {
        const error = err.extensions as IErrorHandler;
        if (error.name === 'ValidationError') {
            return {
                errors: Object.keys(error.errors).reduce((errors: IError, key) => {
                    errors[key] = error.errors[key].message

                    return errors;
                }, {})
            };
        }

        return err;
    }
}