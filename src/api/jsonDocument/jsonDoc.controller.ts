import { Request, Response } from 'express';
import { JsonDoc } from './jsonDoc.model';
import { ObjectID } from 'mongodb';
import $ from '../../util/helper';
import _ from 'lodash';

class JsonDocController {

  private static handleError(res: Response, error: Error, status = 500) {

    $.Logger.error(error.message);
    return res.status(status).json(error);

  }

  public create(req: Request, res: Response) {

    try {

      const doc = new JsonDoc(req.body);

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

      const doc = await JsonDoc.findById(req.params.id).lean().exec();

      if (!doc) return res.status(404).send({});

      return res.status(200).json(doc._schema);

    } catch (error) {

      JsonDocController.handleError(res, error);

    }

  }

  public async remove(req: Request, res: Response) {

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const document = await JsonDoc.findById(req.params.id).exec();

      if (!document) return res.status(404).json({});

      await document.remove();

      res.status(200).send({});

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

  public async update(req: Request, res: Response) {

    //FIXME: private or public must be a different call

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      if (_.isEmpty(req.body._schema)) return res.status(422).json({
        status: 422,
        message: "Body is empty"
      });

      const document: any = await JsonDoc.findById(req.params.id).exec();

      if (!document) return res.status(404).send({});

      document._schema = req.body._schema;

      await document.save();

      return res.status(200).json(document);

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }
}

export default new JsonDocController();