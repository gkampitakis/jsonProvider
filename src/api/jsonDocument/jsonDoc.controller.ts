import { Request, Response } from 'express';
import { JsonDocModel, JsonDoc, privacy, access } from './jsonDoc.model';
import $ from '../../util/helper.service';
import _ from 'lodash';
import Security from './security.service';

class JsonDocController {

  private static handleError(res: Response, error: Error, status = 500) {

    $.Logger.error(error.message);
    return res.status(status).json({
      message: error.message,
      status: status
    });

  }

  public create(req: Request, res: Response) {

    const loggedUser = req.user;

    if (!loggedUser)
      return JsonDocController.handleError(res, new Error('Need to be registered'), 401);

    try {

      const doc: any = new JsonDocModel(req.body);
      doc.members.push({ userId: loggedUser });

      doc.save((err, data) => {

        if (err) return JsonDocController.handleError(res, err);

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

      if (!$.isValidId(id)) return res.status(404).send({});

      const doc = await JsonDocModel.findById(id).lean().exec();

      if (!Security.authorizedRetrieval(loggedUser, doc as JsonDoc))
        return res.status(401).json({ message: "Unauthorized Access", status: 401 });

      if (!doc) return res.status(404).send({});

      return res.status(200).json(doc._schema);

    } catch (error) {

      JsonDocController.handleError(res, error);

    }

  }

  public async remove(req: Request, res: Response) {

    const loggedUser = req.user,
      id = req.params.id;

    try {

      if (!$.isValidId(id)) return res.status(404).send({});

      const document = await JsonDocModel.findById(id).exec();

      if (!Security.isAdmin(loggedUser, document.toObject() as JsonDoc))
        return res.status(401).json({ message: "Unauthorized Access", status: 401 });

      if (!document) return res.status(404).json({});

      await document.remove();

      res.status(200).send({});

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

  public async update(req: Request, res: Response) {

    const _schema = req.body._schema,
      id = req.params.id,
      loggedUser = req.user;

    try {

      if (!$.isValidId(id)) return res.status(404).send({});

      if (_.isEmpty(_schema)) return res.status(422).json({
        status: 422,
        message: "Body is empty"
      });

      const document: any = await JsonDocModel.findById(id).exec();

      if (!document) return res.status(404).send({});

      if (!Security.authorizedUpdate(loggedUser, document.toObject() as JsonDoc))
        return res.status(401).json({ message: "Unauthorized Access", status: 401 });

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

      if (!$.isValidId(id)) return res.status(404).send({});

      if (!(req.params.privacy in privacy)) return res.status(400).json({ message: "Bad Parameters Provided", status: 400 });

      const document: any = await JsonDocModel.findById(id).exec();

      if (!document) return res.status(404).send({});

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

      if (!(req.params.access in access)) return res.status(400).json({ message: "Bad Parameters Provided", status: 400 });

      const document: any = await JsonDocModel.findById(id).exec();

      if (!document) return res.status(404).send({});

      if (!Security.isAdmin(loggedUser, document.toObject() as JsonDoc))
        return res.status(401).json({ message: "Unauthorized Access", status: 401 });

      const idx = document.members.findIndex((member) => member.userId === userId);

      if (idx === -1)
        document.members.push({ userId: userId, access: access[req.params.access] });
      else
        document.members[idx].access = access[req.params.access];

      await document.save();

      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

  public async removeMember(req: Request, res: Response) {

    const userId = req.params.userId,
      id = req.params.id,
      loggedUser = req.user;

    try {

      if (!$.isValidId(id, userId)) return res.status(404).send({});

      const document: any = await JsonDocModel.findById(id).exec();

      if (!document) return res.status(404).send({});

      if (!Security.isAdmin(loggedUser, document.toObject() as JsonDoc))
        return res.status(401).json({ message: "Unauthorized Access", status: 401 });

      const idx = document.members.findIndex((member) => member.userId === userId);

      if (idx === -1) return res.status(404).send({});

      document.members.splice(idx, 1);
      await document.save();

      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

}

export default new JsonDocController();