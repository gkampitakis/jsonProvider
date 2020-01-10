import { ObjectID } from 'mongodb';

export abstract class ServiceModule {

  public isValidId(...ids): boolean {

    for (const id of ids) {

      if (!ObjectID.isValid(id)) return false;

    }

    return true;
  }

  protected errorObject(message: string, status: number): { error: Error; status: number } {

    return {
      error: new Error(message),
      status
    };

  }

}