import { JsonDoc, access, privacy, JsonDocModel } from "./jsonDoc.model";
import { Service } from "typedi";
import userController from "../user/user.controller";
import _ from 'lodash';

@Service()
class JsonDocService {

  private authorizedRetrieval(userId: string, jsonDoc: JsonDoc): boolean {

    if (jsonDoc.privacy === privacy.public) return true;

    //NOTE: Future work connect it with dock access (the dock access is like a revoke token)

    if (!userId) return false;

    const idx: number = jsonDoc.members.findIndex(member => userId === member.userId.toString());

    return idx !== -1;

  }

  private isAdmin(userId: string, jsonDoc: JsonDoc): boolean {

    if (!userId) return false;

    const idx: number = jsonDoc.members.findIndex(member => userId === member.userId.toString()
      && member.access === access.admin);

    return idx !== -1;

  }

  private authorizedUpdate(userId: string, jsonDoc: JsonDoc): boolean {
    if (!userId) return false;

    const idx: number = jsonDoc.members.findIndex(member => userId === member.userId.toString()
      && member.access >= access.write);

    return idx !== -1;

  }

  public createJson(payload: { user: string; body: any }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { user, body } = payload;

      if (!user)
        return reject({ error: new Error('Need to be registered'), status: 401 });

      const doc: any = new JsonDocModel(body);
      doc.members.push({ userId: user });

      try {

        const jsonDoc = await doc.save();
        // await userController.addDocument(user, jsonDoc._id.toString());
        //FIXME: not yet tested
        //FIXME: this function is going to be moved to user service and is going to be a dependency here
        resolve(jsonDoc);

      } catch (error) {

        reject({ error: error });

      }

    });
  }

  public retrieveJson(payload: { user: string; id: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { user, id } = payload;

      try {

        const document = await JsonDocModel.findById(id).lean().exec();
        if (!document)
          return reject({ error: new Error("File not found"), status: 404 });

        if (!this.authorizedRetrieval(user, document))
          return reject({ error: new Error("Unauthorized Access"), status: 401 });

        resolve(document);

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public removeJson(payload: { user: string; id: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { user, id } = payload;

      try {

        const document: any = await JsonDocModel.findById(id).exec();
        if (!document)
          return reject({ error: new Error("File not found"), status: 404 });

        if (!this.isAdmin(user, document.toObject()))
          return reject({ error: new Error("Unauthorized Access"), status: 401 });

        await document.remove();
        resolve();

        document.members.forEach(member => {
          //TODO: this will be moved to a service
          userController.removeDocument(member.userId, id);

        });

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public updateJson(payload: { _schema: any; id: string; user: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { user, id, _schema } = payload;
      try {

        const document: any = await JsonDocModel.findById(id).exec();

        if (!document)
          return reject({ error: new Error("File not found"), status: 404 });

        if (!this.authorizedUpdate(user, document.toObject() as JsonDoc))
          return reject({ error: new Error("Unauthorized Access"), status: 401 });

        document._schema = _schema;

        await document.save();
        resolve(document);

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public updateJsonPrivacy(payload: { id: string; user: string; privacy: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { user, id, privacy } = payload;

      try {

        const document: any = await JsonDocModel.findById(id).exec();

        if (!document)
          return reject({ error: new Error("File not found"), status: 404 });

        if (!this.isAdmin(user, document.toObject() as JsonDoc))
          return reject({ error: new Error("Unauthorized Access"), status: 401 });

        document.privacy = privacy[privacy];

        await document.save();
        resolve();

      } catch (error) {

        reject({ error: error });

      }
    });

  }

  public addMemberJson(payload: { userId: string; id: string; user: string; access: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { userId, id, user, access } = payload;

      try {

        const document: any = await JsonDocModel.findById(id).exec();

        if (!document)
          return reject({ error: new Error("File not found"), status: 404 });

        if (!this.isAdmin(user, document.toObject() as JsonDoc))
          return reject({ error: new Error("Unauthorized Access"), status: 401 });

        const idx = document.members.findIndex((member) => member.userId.toString() === userId);

        if (idx === -1) {

          document.members.push({ userId: userId, access: access[access] });
          await userController.addDocument(userId, id);

        } else
          document.members[idx].access = access[access];

        await document.save();
        resolve();

      } catch (error) {

        reject({ error: error });

      }

    });

  }

  public removeMemberJson(payload: { userId: string; id: string; user: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const { userId, id, user } = payload;

      try {

        const document: any = await JsonDocModel.findById(id).exec();

        if (!document)
          return reject({ error: new Error("File not found"), status: 404 });

        if (!this.isAdmin(user, document.toObject() as JsonDoc))
          return reject({ error: new Error("Unauthorized Access"), status: 401 });

        if (_.isEmpty(document.members))
          return reject({ error: new Error("Can\'t remove last member'"), status: 400 });

        const idx = document.members.findIndex((member) => member.userId.toString() === userId);

        if (idx === -1)
          return reject({ error: new Error("User not found"), status: 404 });

        document.members.splice(idx, 1);
        await document.save();
        await userController.removeDocument(userId, id);

        resolve();

      } catch (error) {

        reject({ error: error });

      }

    });

  }

}

export default JsonDocService;