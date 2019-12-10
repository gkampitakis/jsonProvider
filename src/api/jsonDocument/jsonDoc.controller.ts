import { Request, Response } from 'express';
import { JsonDocModel } from './jsonDoc.model';
import { ObjectID } from 'mongodb';
import $ from '../../util/helper';
import _ from 'lodash';

class JsonDocController {

  private static handleError(res: Response, error: Error, status = 500) {

    $.Logger.error(error.message);
    return res.status(status).json({
      message: error.message,
      status: status
    });

  }

  public create(req: Request, res: Response) {
    //TODO: only a registered user can create an object and his id is added to the members array
    if (!req.user) return JsonDocController.handleError(res, new Error('Need to be registered'), 401);
    try {

      const doc: any = new JsonDocModel(req.body);
      doc.members.push({ userId: req.user, access: 'admin' });

      doc.save((err, data) => {

        if (err) return JsonDocController.handleError(res, err);

        res.status(200).json(data);

      });

    } catch (error) {

      JsonDocController.handleError(res, error);

    }

  }

  public async retrieve(req: Request, res: Response) {
    //TODO: check if public and just return it.
    //if not public check if we have a user
    //if we don't throw 401
    //if we do check we has access and retrieve or again 401

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const doc = await JsonDocModel.findById(req.params.id).lean().exec();

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