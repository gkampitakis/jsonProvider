import { UserI, UserModel } from "./user.model";
import { TokenService } from "../auth/token/token.service";
import { Service } from "typedi";
import { ServiceModule } from "../interfaces/ServiceModule";
import { EmailController } from "../communication/email/email.controller";
import 'reflect-metadata';
import { TokenI } from "../auth/token/token.model";

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

        delete payload.body.verified;

        const user: UserI = new UserModel(payload.body) as UserI;

        const { token } = await this.tokenService.create(
          user._id.toString(),
          'verification');

        const doc = await user.save();

        resolve(this.stripPassword(doc.toObject()));

        this.sendVerificationEmail(user.email, token);

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public verifyEmail(payload: { token: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      let token: TokenI;

      try {

        token = await this.tokenService
          .retrieveToken({ token: payload.token, type: 'verification' });

        if (!token)
          return reject(this.errorObject('Token not found', 404));

        const user: any = await this._updateUser({ _id: token.userId }, { verified: true });

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

  public passwordResetRequest(payload: { email: string }) {
    //TEST: check it through postman for the verified
    return new Promise(async (resolve, reject) => {

      try {

        const { email } = payload;

        const user: UserI = await UserModel.findOne({ email: email })
          .lean()
          .exec();

        if (!user) return reject(this.errorObject('User not found', 404));

        const result: TokenI = await this.tokenService.passwordRequestThrottle(user._id.toString());

        await this.emailController.send(email, 'Password Reset', {
          token: result.token
        },
          'changePassword'
        );

        resolve();

      } catch (error) {

        reject(this.errorObject(error.message, 500));

      }

    });

  }

  public passwordReset(payload: { token: string; password: string }) {
    //TEST:check that the verified still works
    return new Promise(async (resolve, reject) => {

      let result: TokenI;

      try {

        const { token, password: newPassword } = payload;
        result = await this.tokenService
          .retrieveToken({ token: token, type: 'passwordReset' });

        if (!result)
          return reject(this.errorObject('Token not found', 404));

        await this._updateUser({ _id: result.userId }, { password: newPassword });

        resolve();

      } catch (error) {

        reject(this.errorObject(error.message, 500));

      } finally {

        if (result)
          result.remove();//TEST: this works

      }

    });

  }

  private async _updateUser(filter: any, payload: any): Promise<any> {

    let user = await UserModel.findById(filter).exec();

    user = this.mergeUserChanges(user, payload);

    return user.save();

  }

  private mergeUserChanges(oldUser: any, newUser: any) {

    oldUser.username = newUser?.username ?? oldUser.username;
    oldUser.email = newUser?.email ?? oldUser.email;
    oldUser.password = newUser?.password ?? oldUser.password;
    oldUser.verified = newUser?.verified ?? oldUser.verified;

    return oldUser;

  }

  public retrieveUser(payload: { id: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { id } = payload;

      if (!this.isValidId(id))
        return reject(this.errorObject("User not found", 404));

      try {

        const user = await UserModel.findById(id)
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

        const doc: UserI = await UserModel.findById(user).exec() as UserI;

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

        let doc: UserI = await UserModel.findById(user).exec() as UserI;

        if (!doc)//NOTE: if we end up here something has gone really bad
          return reject(this.errorObject("User not found", 404));
        //TODO: if update email again verify email for updating email
        //or maybe support array of emails or just ignore the update later
        doc = this.mergeUserChanges(doc, body);

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

        const doc = await UserModel.findById(user)
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

          const user: UserI = await UserModel.findById(id[i]).exec() as UserI;

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

          const user: UserI = await UserModel.findById(id).exec() as UserI;

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

  private sendVerificationEmail(email: string, token: string): Promise<any> {

    return this.emailController.send(email,
      'Please Verify your email', {
      token: token
    }, 'verifyEmail');

  }

}