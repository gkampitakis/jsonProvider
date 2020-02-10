import { TokenModel, TokenI } from "../api/auth/token/token.model";
import autoBind from 'auto-bind';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class TokenService {

  public static token: string;
  public static userId: string;
  public static type = 'authorization'

  constructor() {

    autoBind(this);

  }

  public async create(userId: string, type: string) {

    return { token: TokenService.token, userId: userId };

  }

  public updateToken(id: string, payload: any): Promise<TokenI> {

    return Promise.resolve(this.tokenFactory({
      token: TokenService.token,
      type: TokenService.type,
      userId: TokenService.userId
    }));

  }

  public async remove(userId: string) {

    return;

  }

  public removeToken(filter: any): Promise<any> {

    return Promise.resolve();

  }

  public createThrottledToken(userId: string, type: string): Promise<TokenI> {

    return Promise.resolve(this.tokenFactory({
      token: TokenService.token,
      type: TokenService.type,
      userId: TokenService.userId
    }));

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

    const result = this.tokenFactory({
      token: token,
      type: type,
      userId: TokenService.userId
    });

    return Promise.resolve(result);

  }

  private tokenFactory(payload: any): TokenI {

    return new TokenModel(payload) as TokenI;

  }

}