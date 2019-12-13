import { Request, Response } from 'express';
import { User, UserI } from './user.model';
import { ObjectID } from 'mongodb';
import $ from '../../util/helper.service';

class UserController {

  public create = async (req: Request, res: Response) => {

    try {

      const user: UserI = new User(req.body) as UserI;

      const doc = await user.save(),
        result = doc.toObject();

      res.status(200).json(this.stripPassword(result));

    } catch (error) {

      this.handleError(res, error);

    }

  }

  public retrieve = async (req: Request, res: Response) => {

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const user = await User.findById(req.params.id).lean().exec();

      if (!user) return res.status(404).send({});

      return res.status(200).json(this.stripPassword(user));

    } catch (error) {

      this.handleError(res, error);

    }

  }


  public async remove(req: Request, res: Response) {

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const user: UserI = await User.findById(req.params.id).exec() as UserI;

      if (!user) return res.status(404).json({});

      await user.remove();

      res.status(200).send({});

    } catch (error) {

      this.handleError(res, error);

    }

  }

  public update = async (req: Request, res: Response) => {

    try {

      if (!ObjectID.isValid(req.params.id)) return res.status(404).send({});

      const user: UserI = await User.findById(req.params.id).exec() as UserI;

      if (!user) return res.status(404).json({});

      user.username = req.body?.username || user.username;
      user.email = req.body?.email || user.email;
      user.image = req.body?.image || user.image;
      user.password = req.body?.password || user.password;

      await user.save();

      return res.status(200).json(this.stripPassword(user.toObject()));

    } catch (error) {

      this.handleError(res, error);

    }

  }


  // public me(req: Request, res: Response) {
  //FIXME: when tokens are implemented pass the userId on the req object
  // }

  private stripPassword(user: UserI): Partial<UserI> {

    delete user.password;
    delete user.salt;

    return user;

  }

  private handleError(res: Response, error: Error, status = 500) {

    $.Logger.error(error.message);
    return res.status(status).json(error);

  }

}


export default new UserController();
