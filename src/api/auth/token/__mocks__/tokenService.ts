/* eslint-disable @typescript-eslint/no-unused-vars */
export class TokenService {

  public async create(userId: string) {

    return { token: "123456789", userId: userId };

  }

  public async remove(userId: string) {

    return;

  }

  public async retrieve(userId: string) {

    return "123456789";

  }

  public retrieveUser(token: string): Promise<string> {

    return Promise.resolve("5e0a02aed716316c24be80b5");

  }

  public invalidateTokens(userId: string): Promise<any> {

    return Promise.resolve();

  }

}