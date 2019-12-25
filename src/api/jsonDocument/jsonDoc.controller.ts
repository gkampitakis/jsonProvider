import { Request, Response } from "express";
import { JsonDocModel, JsonDoc, privacy, access } from "./jsonDoc.model";
import $ from "../../util/helper.service";
import _ from "lodash";
import Security from "./security.service";
import userController from "../user/user.controller";
import { _Logger, Logger } from "../../util/decorators/logger";

class JsonDocController {

  @Logger('JsonDocController')
  private static logger: _Logger

  private static handleError(res: Response, error: Error, status = 500) {

    this.logger.error(error.message);
    return res.status(status).json({
      message: error.message,
      status: status
    });

  }

  public create(req: Request, res: Response) {

    const loggedUser = req.user;

    if (!loggedUser)
      return JsonDocController.handleError(res, new Error("Need to be registered"), 401);

    try {

      const doc: any = new JsonDocModel(req.body);
      doc.members.push({ userId: loggedUser });

      doc.save(async (err, data) => {

        if (err) return JsonDocController.handleError(res, err);

        await userController.addDocument(loggedUser, data._id.toString());

        res.status(200).json(data);

      });

    } catch (error) {

      JsonDocController.handleError(res, error);

    }

  }

  public async retrieve(req: Request, res: Response) {

    const loggedUser = req.user,
      id = req.params.id;

    try {

      if (!$.isValidId(id))
        return JsonDocController.handleError(res, new Error("Bad Parameters Provided"), 400);

      const document = await JsonDocModel.findById(id).lean().exec();

      if (!document)
        return JsonDocController.handleError(res, new Error("File not found"), 404);

      if (!Security.authorizedRetrieval(loggedUser, document as JsonDoc))
        return JsonDocController.handleError(res, new Error("Unauthorized Access"), 401);

      return res.status(200).json(document._schema);

    } catch (error) {

      JsonDocController.handleError(res, error);

    }

  }

  public async remove(req: Request, res: Response) {

    const loggedUser = req.user,
      id = req.params.id;

    try {

      if (!$.isValidId(id))
        return JsonDocController.handleError(res, new Error("Bad Parameters Provided"), 400);

      const document: any = await JsonDocModel.findById(id).exec();

      if (!document)
        return JsonDocController.handleError(res, new Error("File not found"), 404);

      if (!Security.isAdmin(loggedUser, document.toObject() as JsonDoc))
        return JsonDocController.handleError(res, new Error("Unauthorized Access"), 401);

      await document.remove();

      res.status(200).send({});

      document.members.forEach(member => {

        userController.removeDocument(member.userId, id);

      });

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

  public async update(req: Request, res: Response) {

    const _schema = req.body._schema,
      id = req.params.id,
      loggedUser = req.user;

    try {

      if (!$.isValidId(id))
        return JsonDocController.handleError(res, new Error("Bad Parameters Provided"), 400);

      if (_.isEmpty(_schema))
        return JsonDocController.handleError(res, new Error("Body can\'t be empty"), 422);

      const document: any = await JsonDocModel.findById(id).exec();

      if (!document)
        return JsonDocController.handleError(res, new Error("File not found"), 404);

      if (!Security.authorizedUpdate(loggedUser, document.toObject() as JsonDoc))
        return JsonDocController.handleError(res, new Error("Unauthorized Access"), 401);

      document._schema = _schema;

      await document.save();

      return res.status(200).json(document);

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

  public async updatePrivacy(req: Request, res: Response) {

    const id = req.params.id,
      loggedUser = req.user;

    try {

      if (!$.isValidId(id))
        return JsonDocController.handleError(res, new Error("Bad Parameters Provided"), 400);

      if (!(req.params.privacy in privacy))
        return JsonDocController.handleError(res, new Error("Bad Parameters Provided"), 400);

      const document: any = await JsonDocModel.findById(id).exec();

      if (!document)
        return JsonDocController.handleError(res, new Error("File not found"), 404);

      if (!Security.isAdmin(loggedUser, document.toObject() as JsonDoc))
        return res.status(401).json({ message: "Unauthorized Access", status: 401 });

      document.privacy = privacy[req.params.privacy];

      await document.save();

      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

  public async addMember(req: Request, res: Response) {

    const userId = req.params.userId,
      id = req.params.id,
      loggedUser = req.user;

    try {

      if (!$.isValidId(id, userId)) return res.status(404).send({});

      if (userId === loggedUser) return JsonDocController.handleError(res, new Error("Unauthorized Action"), 401);

      if (!(req.params.access in access)) return JsonDocController.handleError(res, new Error("Bad Parameters Provided"), 400);

      const document: any = await JsonDocModel.findById(id).exec();

      if (!document)
        return JsonDocController.handleError(res, new Error("File not found"), 404);

      if (!Security.isAdmin(loggedUser, document.toObject() as JsonDoc))
        return JsonDocController.handleError(res, new Error("Unauthorized Access"), 401);

      const idx = document.members.findIndex((member) => member.userId.toString() === userId);

      if (idx === -1) {

        document.members.push({ userId: userId, access: access[req.params.access] });
        await userController.addDocument(userId, id);

      } else
        document.members[idx].access = access[req.params.access];

      await document.save();

      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

  public async removeMember(req: Request, res: Response) {
    //TODO: what happens if you remove the last member
    const userId = req.params.userId,
      id = req.params.id,
      loggedUser = req.user;

    try {

      if (!$.isValidId(id, userId)) return res.status(404).send({});

      const document: any = await JsonDocModel.findById(id).exec();

      if (!document)
        return JsonDocController.handleError(res, new Error("File not found"), 404);

      if (!Security.isAdmin(loggedUser, document.toObject() as JsonDoc))
        return JsonDocController.handleError(res, new Error('Unauthorized Access'), 401);

      if (_.isEmpty(document.members)) return JsonDocController.handleError(res, new Error('Can\'t remove last member'), 400);

      const idx = document.members.findIndex((member) => member.userId.toString() === userId);

      if (idx === -1)
        return JsonDocController.handleError(res, new Error("User not found"), 404);

      document.members.splice(idx, 1);
      await document.save();

      await userController.removeDocument(userId, id);

      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

}

export default new JsonDocController();