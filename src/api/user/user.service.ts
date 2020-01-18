import { UserI, User } from "./user.model";
import { TokenService, TokenModel } from "../auth/token/token.service";
import { Service } from "typedi";
import { ServiceModule } from "../interfaces/ServiceModule";
import { EmailController } from "../communication/email/email.controller";
import 'reflect-metadata';

@Service()
export class UserService extends ServiceModule {

  constructor(
    private tokenService: TokenService,
    private emailController: EmailController
  ) {
    super();
  }

  public createUser(payload: { body: any }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      try {

        const user: UserI = new User(payload.body) as UserI;

        const { token } = await this.tokenService.create(
          user._id.toString(),
          'verification');

        const doc = await user.save();

        resolve(this.stripPassword(doc.toObject()));

        this.sendVerificationEmail(user.email, user.username, token);

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public verifyEmail(payload: { token: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      let token: TokenModel;

      try {

        token = await this.tokenService.retrieveVerificationToken(payload.token);
        console.log(token);

        if (!token)
          return reject(this.errorObject('Token not found', 404));

        const user: any = await this.verifyUser(token.userId);

        if (!user)
          return reject(this.errorObject('User not found', 404));

        resolve();

      } catch (error) {

        reject(this.errorObject(error.message, 500));

      } finally {

        if (token)
          token.remove();

      }

    });

  }

  private verifyUser(id: string): Promise<any> {

    return User.findByIdAndUpdate(id, { verified: true }).exec();

  }

  public retrieveUser(payload: { id: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { id } = payload;

      if (!this.isValidId(id))
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

        this.tokenService.invalidateTokens(doc._id);

        resolve();

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
        doc.email = body?.email || doc.email;//TODO: if update email again verify email for updating email
        doc.password = body?.password || doc.password;

        await doc.save();
        resolve(this.stripPassword(doc));

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  //TODO: reset password function

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

          const idx = user.documents.findIndex((document: any) => document.toString() === documentId);

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

  private stripPassword(user: UserI): Partial<UserI> {

    delete user.password;
    delete user.salt;

    return user;

  }

  private sendVerificationEmail(email: string, username: string, token: string): Promise<any> {

    return this.emailController.send(email,
      'Please Verify your email', {
      token: token,
      username: username
    }, 'verifyEmail');

  }

}