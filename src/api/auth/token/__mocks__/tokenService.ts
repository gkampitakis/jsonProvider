import { Token } from "../token.model";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class TokenService {

  public static token;
  public static userId;

  public async create(userId: string, type: string) {

    return { token: TokenService.token, userId: userId };

  }

  public async remove(userId: string) {

    return;

  }

  public async retrieve(userId: string) {

    return TokenService.token;

  }

  public retrieveUser(token: string): Promise<string> {

    return Promise.resolve("5e0a02aed716316c24be80b5");

  }

  public async invalidateTokens(userId: string): Promise<any> {

    return Promise.resolve();

  }

  public async retrieveVerificationToken(token: string) {

    if (!TokenService.token) return Promise.resolve(undefined);

    const result = new Token({
      token: token,
      type: 'verification',
      userId: TokenService.userId
    });

    return Promise.resolve(result);

  }

}