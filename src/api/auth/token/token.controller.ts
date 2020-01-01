import { HelperService } from "../../../util/helper.service";
import { Token as tokenModel } from './token.model';
import { Request, Response } from 'express';
import { Document } from "mongoose";
import tokenParser from 'parse-bearer-token';
import crypto from 'crypto';
import { Service } from "typedi";
import autoBind from "auto-bind";

export interface TokenModel extends Document {
  token: string;
  created: Date;
  type: ['authorization'];
  userId: string;
};

@Service()
export class TokenController {

  constructor(private helperService: HelperService) {

    autoBind(this);

  }

  public async create(userId: string) {

    if (!this.helperService.isValidId(userId)) throw new Error('Invalid id provided');

    const token: string = this.generateToken();
    const document: TokenModel = new tokenModel({ userId: userId, token: token }) as TokenModel;

    await document.save();

    return { token: token, userId: userId };

  }

  public async remove(userId: string) {

    if (!this.helperService.isValidId(userId)) throw new Error('Invalid id provided');

    const token = await tokenModel.findOne({ userId: userId }).exec();

    if (token) return await token.remove();

    return;

  }

  public async retrieve(userId: string) {

    if (!this.helperService.isValidId(userId)) throw new Error('Invalid id provided');

    const token = await tokenModel.findOne({ userId: userId }).lean().exec();

    if (!token) throw new Error('Token not found');

    return token;

  }

  private generateToken(): string {

    return crypto.randomBytes(48).toString('hex');

  }

  public retrieveUser(token: string): Promise<string> {

    return new Promise((resolve, reject) => {

      tokenModel.findOne({ token: token })
        .lean()
        .exec()
        .then((data: TokenModel) => {

          if (!data) return reject('Token not found');

          resolve(data.userId);

        })
        .catch(err => {

          reject(err);

        });

    });

  }


  public invalidateTokens(userId: string): Promise<any> {

    return tokenModel.deleteMany({ userId: userId }).exec();

  }

  public async prepareRequestUser(req: Request, res: Response, next: Function) {

    const token = tokenParser(req);

    if (!token) return next();

    try {

      req.user = await this.retrieveUser(token);

    } catch { }

    next();

  }

}