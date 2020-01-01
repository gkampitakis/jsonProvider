import { HelperService } from "../../util/helper.service";
import { UserI, User } from "./user.model";
import { TokenController } from "../auth/token/token.controller";
import { Service } from "typedi";

@Service()
export class UserService {

  constructor(
    private helperService: HelperService,
    private tokenController: TokenController
  ) { }

  public createUser(payload: { body: any }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      try {

        const user: UserI = new User(payload.body) as UserI;
        const doc = await user.save();

        resolve(this.stripPassword(doc.toObject()));

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public retrieveUser(payload: { id: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { id } = payload;

      if (!this.helperService.isValidId(id))
        return reject(this.errorObject("User not found", 404));

      try {

        const user = await User.findById(id)
          .populate('documents')//FIXME:
          .lean()
          .exec();

        if (!user)
          return reject(this.errorObject("User not found", 404));

        resolve(this.stripPassword(user));

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public removeUser(payload: { user: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { user } = payload;

      if (!user)
        return reject(this.errorObject("Need to be registered", 401));

      try {

        const doc: UserI = await User.findById(user).exec() as UserI;

        if (!doc) //NOTE: if we end up here something has gone really bad
          return reject(this.errorObject("User not found", 404));

        await doc.remove();
        resolve();
        
        this.tokenController.invalidateTokens(doc._id);

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public updateUser(payload: { user: string; body: any }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { user, body } = payload;

      if (!user)
        return reject(this.errorObject("Need to be registered", 401));

      try {

        const doc: UserI = await User.findById(user).exec() as UserI;

        if (!doc)//NOTE: if we end up here something has gone really bad
          return reject(this.errorObject("User not found", 404));

        doc.username = body?.username || doc.username;
        doc.email = body?.email || doc.email;
        doc.image = body?.image || doc.image;
        doc.password = body?.password || doc.password;

        await doc.save();
        resolve(this.stripPassword(doc));

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public retrieveMe(payload: { user: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { user } = payload;

      if (!user)
        return reject(this.errorObject("Need to be registered", 401));

      try {

        const doc = await User.findById(user)
          .populate('documents', '-_id -__v')
          .lean()
          .exec();

        if (!doc)//NOTE: if we end up here something has gone really bad
          return reject(this.errorObject("User not found", 404));

        resolve(this.stripPassword(doc));

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public addDocument(documentId: string, ...id: string[]): Promise<any> {

    const promises: Promise<any>[] = [];

    for (let i = 0; i < id.length; i++) {
      const promise = new Promise(async (resolve, reject) => {

        try {

          const user: UserI = await User.findById(id[i]).exec() as UserI;

          if (!user)
            return reject(this.errorObject("User not found", 404));

          const idx = user.documents.findIndex((document: any) => document === documentId);

          if (idx !== -1) return resolve();

          user.documents.push(documentId);

          await user.save();


          resolve();

        } catch (error) {

          reject({ error: error });

        }

      });

      promises.push(promise);

    }

    return Promise.all(promises);

  }

  public removeDocument(documentId: string, ...id: string[]): Promise<any> {


    const promises: Promise<any>[] = [];

    for (let i = 0; i < id.length; i++) {

      const promise = new Promise(async (resolve, reject) => {

        try {

          const user: UserI = await User.findById(id).exec() as UserI;

          if (!user)
            return reject(this.errorObject("User not found", 404));

          const idx = user.documents.findIndex((document: any) => document.toString() === documentId);

          if (idx === -1) return resolve();

          user.documents.splice(idx, 1);

          await user.save();

          resolve();

        } catch (error) {

          reject({ error: error });
        }

      });

      promises.push(promise);

    }

    return Promise.all(promises);

  }


  private errorObject(message: string, status: number): { error: Error; status: number } {

    return {
      error: new Error(message),
      status
    };

  }

  private stripPassword(user: UserI): Partial<UserI> {

    delete user.password;
    delete user.salt;

    return user;

  }

}