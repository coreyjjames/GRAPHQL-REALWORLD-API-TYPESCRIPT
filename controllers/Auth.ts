import secret from '../config';
import { Request } from 'express';
import User, { IUserDoc } from '../models/User';
import jsonwebtoken from 'jsonwebtoken';
import ErrorHandlerController from './ErrorHandlerController';

export interface IAutheticateReturn {
    err: any,
    user: IUserDoc | undefined
}

class Auth {
    public static async AuheticateWithCredentials(email: string, password: string): Promise<IAutheticateReturn> {
        let user;
        try {
            user = await User.findOne({ email });
            if (!user || !user.validPassword(password)) {
                throw ({ err: ErrorHandlerController.ValidationError('email or password', ' is invalid'), user: undefined } as IAutheticateReturn);
            }
            return { err: null, user } as IAutheticateReturn;
        } catch (errors) {
            return (errors);
        }
    }

    public static async GraphAuthentication(req: Request) {
        try {
            if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') {
                const verified = await jsonwebtoken.verify(req.headers.authorization.split(' ')[1], secret);
                return verified;
            }
            return null;
        } catch (err) {
            return null;
        }
    }
}

export default Auth;






