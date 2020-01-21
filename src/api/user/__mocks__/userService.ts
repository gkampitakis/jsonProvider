/* eslint-disable @typescript-eslint/no-unused-vars */

export class UserService {

  public createUser(payload: { body: any }): Promise<any> {

    return Promise.resolve();

  }


  public retrieveUser(payload: { id: string }): Promise<any> {

    return Promise.resolve();

  }

  public removeUser(payload: { user: string }): Promise<any> {

    return Promise.resolve();

  }

  public updateUser(filter: any, payload: any): Promise<any> {

    return Promise.resolve();

  }

  public retrieveMe(payload: { user: string }): Promise<any> {

    return Promise.resolve();

  }

  public addDocument(documentId: string, ...id: string[]): Promise<any> {

    return Promise.resolve();

  }

  public removeDocument(documentId: string, ...id: string[]): Promise<any> {

    return Promise.resolve();

  }

}