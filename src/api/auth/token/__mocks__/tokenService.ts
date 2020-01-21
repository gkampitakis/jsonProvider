import { TokenModel, TokenI } from "../token.model";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class TokenService {

  public static token: TokenI;
  public static userId;

  public async create(userId: string, type: string) {

    return { token: TokenService.token, userId: userId };

  }

  public updateToken(id: string, payload: any): Promise<TokenI> {

    return Promise.resolve(TokenService.token);

  }

  public async remove(userId: string) {

    return;

  }

  public passwordRequestThrottle(userId: string): Promise<TokenI> {

    return Promise.resolve(TokenService.token);

  }

  public retrieveUser(token: string): Promise<string> {

    return Promise.resolve("5e0a02aed716316c24be80b5");

  }

  public async invalidateTokens(userId: string): Promise<any> {

    return Promise.resolve();

  }

  public async retrieveToken(payload: any) {

    if (!TokenService.token) return Promise.resolve(undefined);

    const { token, type } = payload;

    const result = new TokenModel({
      token: token,
      type: type,
      userId: TokenService.userId
    });

    return Promise.resolve(result);

  }

}