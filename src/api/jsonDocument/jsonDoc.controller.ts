import { Request, Response } from 'express';
import { JsonDoc } from './jsonDoc.model';
import { ObjectID } from 'mongodb';

class JsonDocController {

  private static handleError(res: Response, error: Error, status = 500) {

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

      if (!ObjectID.isValid(req.params.id)) res.status(404).send({});

      const document = await JsonDoc.findById(req.params.id).lean().exec();

      if (!document) return res.status(404).send({});

      return res.status(200).json(document._schema);

    } catch (error) {

      JsonDocController.handleError(res, error);

    }

  }

  public async remove(req: Request, res: Response) {

    try {

      if (!ObjectID.isValid(req.params.id)) res.status(404).send({});

      const document = await JsonDoc.findById(req.params.id).exec();

      if (!document) return res.status(404).json({});

      res.status(200).send({});

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }

  public async update(req: Request, res: Response) {

    //FIXME: private or public

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const document: any = await JsonDoc.findById(req.params.id).exec();

      if (!document) return res.status(404).send({});

      document._schema = { ...document._schema, ...req.body._schema };

      await document.save();

      return res.status(200).json(document);

    } catch (error) {

      return JsonDocController.handleError(res, error);

    }

  }
}

export default new JsonDocController();