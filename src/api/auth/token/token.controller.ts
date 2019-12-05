import { Token as tokenModel } from './token.model';
import { ObjectID } from 'mongodb';
import { Document } from "mongoose";
import crypto from 'crypto';

export interface TokenModel extends Document {
  token: string;
  created: Date;
  type: ['authorization'];
  userId: string;
};

class TokenController {

  public create = async (userId: string) => {

    if (!this.isValidId(userId)) throw new Error('Invalid id provided');

    const token: string = this.generateToken();
    const document: TokenModel = new tokenModel({ userId: userId, token: token }) as TokenModel;

    await document.save();

    return { token: token, userId: userId };

  }

  public remove = async (userId: string) => {//TODO: Needs testing

    if (!this.isValidId(userId)) throw new Error('Invalid id provided');

    const token = await tokenModel.findOne({ userId: userId }).exec();

    if (token) return await token.remove();

    return;

  }

  public retrieve = async (userId: string) => {//TODO: Needs testing

    if (!this.isValidId(userId)) throw new Error('Invalid id provided');

    const token = await tokenModel.findOne({ userId: userId }).lean().exec();

    return token;

  }

  private isValidId(id: string) {

    return ObjectID.isValid(id);

  }

  private generateToken(): string {

    return crypto.randomBytes(48).toString('hex');

  }

}

export const tokenController = new TokenController();