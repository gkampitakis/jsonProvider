import { Token as tokenModel, Token } from './token.model';
import { Request, Response } from 'express';
import { Document } from "mongoose";
import tokenParser from 'parse-bearer-token';
import crypto from 'crypto';
import autoBind from "auto-bind";
import { ServiceModule } from "../../interfaces/ServiceModule";
import { Service } from "typedi";
import { UserI, User } from "../../user/user.model";

export interface TokenModel extends Document {
  token: string;
  created: Date;
  type: ['authorization'];
  userId: string;
};

@Service()
export class TokenController extends ServiceModule {

  constructor() {

    super();

    autoBind(this);

  }

  public async create(userId: string, type: 'authorization' | 'verification') {

    if (!this.isValidId(userId)) throw new Error('Invalid id provided');

    const token: string = this.generateToken();
    const document: TokenModel = new tokenModel(
      { userId: userId, token: token, type: type }
    ) as TokenModel;

    await document.save();

    return { token: token, userId: userId };

  }

  public async remove(userId: string) {

    if (!this.isValidId(userId)) throw new Error('Invalid id provided');

    const token = await tokenModel.findOne({ userId: userId }).exec();

    if (token) return await token.remove();

    return;

  }

  public async retrieve(userId: string) {

    if (!this.isValidId(userId)) throw new Error('Invalid id provided');

    const token = await tokenModel.findOne({ userId: userId }).lean().exec();

    if (!token) throw new Error('Token not found');

    return token;

  }

  private generateToken(): string {

    return crypto.randomBytes(48).toString('hex');

  }

  private retrieveUser(token: string): Promise<UserI> {

    return tokenModel.findOne({ token: token })
      .lean()
      .exec()
      .then(async (data: TokenModel) => {

        if (!data) throw { message: 'Token not found', status: 404 };

        let user: UserI;

        try {

          user = await User.findById(data.userId).lean().exec();

        } catch (error) {

          throw error;

        }

        if (!user)
          throw { message: 'User not found', status: 404 };

        return user;

      });

  }


  public retrieveVerificationToken(token: string): any {

    return Token.findOne({ type: 'verification', token: token });

  }

  public invalidateTokens(userId: string): Promise<any> {

    return tokenModel.deleteMany({ userId: userId }).exec();

  }

  public async prepareRequestUser(req: Request, res: Response, next: Function) {

    const token = tokenParser(req);

    if (!token) return next();

    try {

      const user: UserI = await this.retrieveUser(token);

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