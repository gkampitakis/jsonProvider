import { Request, Response } from 'express';
import { User, UserI } from './user.model';
import { ObjectID } from 'mongodb';
import _ from '../../util/helper';

class UserController {

  private static handleError(res: Response, error: Error, status = 500) {

    _.Logger.error(error.message);
    return res.status(status).json(error);

  }

  public async create(req: Request, res: Response) {

    try {

      const user: any = new User(req.body);

      const doc = await user.save().toObject();

      delete doc.password;
      delete doc.salt;

      res.status(200).json(doc);

    } catch (error) {

      UserController.handleError(res, error);

    }

  }

  public async retrieve(req: Request, res: Response) {

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const user = await User.findById(req.params.id).lean().exec();

      if (!user) return res.status(404).send({});

      return res.status(200).json(user);

    } catch (error) {

      UserController.handleError(res, error);

    }

  }

  // public me(req: Request, res: Response) {
  //FIXME: when tokens are implemented pass the userId on the req object
  // }

  public async remove(req: Request, res: Response) {

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const user = await User.findById(req.params.id).exec();

      if (!user) return res.status(404).json({});

      await user.remove();

      res.status(200).send({});

    } catch (error) {

      UserController.handleError(res, error);

    }

  }

  // public update(req: Request, res: Response) {


  // }

}


export default new UserController();
