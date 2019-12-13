import { Request, Response } from 'express';
import { JsonDocModel, JsonDoc } from './jsonDoc.model';
import { ObjectID } from 'mongodb';
import $ from '../../util/helper.service';
import _ from 'lodash';
import Security from '../auth/security.service';

class JsonDocController {

  private static handleError(res: Response, error: Error, status = 500) {

    $.Logger.error(error.message);
    return res.status(status).json({
      message: error.message,
      status: status
    });

  }

  public create(req: Request, res: Response) {

    if (!req.user) return JsonDocController.handleError(res, new Error('Need to be registered'), 401);

    try {

      const doc: any = new JsonDocModel(req.body);
      doc.members.push({ userId: req.user });

      doc.save((err, data) => {

        if (err) return JsonDocController.handleError(res, err);

        res.status(200).json(data);

      });

    } catch (error) {

      JsonDocController.handleError(res, error);

    }

  }

  public async retrieve(req: Request, res: Response) {

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const doc = await JsonDocModel.findById(req.params.id).lean().exec();

      if (!Security.authorizedRetrieval(req.user, doc as JsonDoc)) return res.status(401).json({ message: "Unauthorized Access", status: 401 });

      if (!doc) return res.status(404).send({});

      return res.status(200).json(doc._schema);

    } catch (error) {

      JsonDocController.handleError(res, error);

    }

  }

  public async remove(req: Request, res: Response) {
    //Only registered and admin access user can do that
    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const document = await JsonDocModel.findById(req.params.id).exec();

      if (!document) return res.status(404).json({});

      await document.remove();

      res.status(200).send({});

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

  public async update(req: Request, res: Response) {

    //TODO: add check if the user has access to this file to change it only a user with write access or admin

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      if (_.isEmpty(req.body._schema)) return res.status(422).json({
        status: 422,
        message: "Body is empty"
      });

      const document: any = await JsonDocModel.findById(req.params.id).exec();

      if (!document) return res.status(404).send({});

      document._schema = req.body._schema;

      await document.save();

      return res.status(200).json(document);

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }


  //FIXME: private or public must be a different call
  public async updatePrivacy(req: Request, res: Response) {
    //TODO: only admins can change the privacy

  }


  public addMember(req: Request, res: Response) {
    //TODO: only admins can change
  }

  public removeMember(req: Request, res: Response) {
    //TODO: only admins can change
  }

  public updateMember(req: Request, res: Response) {
    //TODO: only admins can change
  }


}

export default new JsonDocController();