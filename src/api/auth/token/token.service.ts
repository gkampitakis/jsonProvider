import { TokenModel, TokenType, TokenI } from './token.model';
import { Request, Response } from 'express';
import tokenParser from 'parse-bearer-token';
import crypto from 'crypto';
import autoBind from "auto-bind";
import { ServiceModule } from "../../interfaces/ServiceModule";
import { Service } from "typedi";
import { UserI, UserModel } from "../../user/user.model";
import moment from 'moment';

@Service()
export class TokenService extends ServiceModule {

  constructor() {

    super();

    autoBind(this);

  }

  public async create(userId: string, type: TokenType) {

    if (!this.isValidId(userId)) throw new Error('Invalid id provided');

    const token: string = this.generateToken(),
      document: TokenI = new TokenModel({
        userId: userId,
        token: token,
        type: type
      }) as TokenI;

    await document.save();

    return document;

  }

  public updateToken(id: string, payload: any): Promise<TokenI> {

    return TokenModel.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
    //Note: here if we change type and not check the validTokenargs might end up to unwanted errors use with caution
  }

  public async remove(userId: string) {

    if (!this.isValidId(userId)) throw new Error('Invalid id provided');

    const token = await TokenModel.findOne({ userId: userId }).exec();

    if (token) return await token.remove();

    return;

  }

  public createThrottledToken(userId: string, type: TokenType, test = false): Promise<TokenI> {

    return new Promise(async (resolve, reject) => {

      let result: TokenI = await this.retrieveToken({
        userId: userId,
        type
      });

      if (!result) {

        result = await this.create(userId, type);

        return resolve(result);

      }

      const today = Date.now(),
        { counter, date: lastRequest } = result.requestThrottle,
        diff = moment(today).diff(moment(lastRequest), 'day');

      if (diff >= 1 || test) {

        result = await this.updateToken(result._id.toString(),
          { requestThrottle: { counter: 1, date: Date.now() } });

        return resolve(result);

      }

      if (result.requestThrottle.counter > 3)
        return reject(new Error("Reached maximum requests for today"));


      result = await this.updateToken(result._id.toString(),
        { requestThrottle: { date: lastRequest, counter: counter + 1 } });

      resolve(result);


    });

  }

  public retrieveToken(payload: any): Promise<TokenI> {

    return TokenModel.findOne(payload).lean().exec();

  }

  private generateToken(): string {

    return crypto.randomBytes(48).toString('hex');

  }

  private retrieveUser(token: string): Promise<UserI> {

    return TokenModel.findOne({ token: token })
      .lean()
      .exec()
      .then(async (data: TokenI) => {

        if (!data) throw { message: 'Token not found', status: 404 };

        let user: UserI;

        try {

          user = await UserModel.findById(data.userId).lean().exec();

        } catch (error) {

          throw error;

        }

        if (!user)
          throw { message: 'User not found', status: 404 };

        return user;

      });

  }

  public invalidateTokens(userId: string): Promise<any> {//TODO: write test about this

    return TokenModel.deleteMany({ userId: userId }).exec();

  }

  public removeToken(filter: any): Promise<any> {

    return TokenModel.remove(filter).exec();

  }

  public async prepareRequestUser(req: Request, res: Response, next: Function) {

    const token = tokenParser(req),
      email = req.body.email;

    if (!token && !email) return next();

    try {

      let user: UserI;

      if (token)
        user = await this.retrieveUser(token);
      else
        user = await UserModel.findOne({ email: email }).lean().exec();

      if (!user) {

        res.status(404).json({
          message: "User not found",
          status: 404
        });

      }

      if (!user.verified) {

        res.status(401).json({
          message: "Unverified email",
          status: 401
        });

      }

      req.user = user._id.toString();

    } catch (error) {

      const status = error.status || 500;

      return res.status(status).json({
        message: error.message,
        status: status
      });

    }

    next();

  }

}