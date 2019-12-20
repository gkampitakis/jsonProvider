import { Token as tokenModel } from './token.model';
import { Document } from "mongoose";
import crypto from 'crypto';
import $ from '../../../util/helper.service';

export interface TokenModel extends Document {
  token: string;
  created: Date;
  type: ['authorization'];
  userId: string;
};

class TokenController {

  public async create(userId: string) {

    if (!$.isValidId(userId)) throw new Error('Invalid id provided');

    const token: string = this.generateToken();
    const document: TokenModel = new tokenModel({ userId: userId, token: token }) as TokenModel;

    await document.save();

    return { token: token, userId: userId };

  }

  public async remove(userId: string) {

    if (!$.isValidId(userId)) throw new Error('Invalid id provided');

    const token = await tokenModel.findOne({ userId: userId }).exec();

    if (token) return await token.remove();

    return;

  }

  public async retrieve(userId: string) {

    if (!$.isValidId(userId)) throw new Error('Invalid id provided');

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

}

export const tokenController = new TokenController();