import { Request, Response } from 'express';
import { User, UserI } from './user.model';
import $ from '../../util/helper.service';
import { tokenController } from "../auth/token/token.controller";

class UserController {

  private static handleError(res: Response, error: Error, status = 500) {

    $.Logger.error(error.message);
    return res.status(status).json({
      message: error.message,
      status: status
    });

  }

  public async create(req: Request, res: Response) {

    try {

      const user: UserI = new User(req.body) as UserI;

      const doc = await user.save(),
        result = doc.toObject();

      res.status(200).json(this.stripPassword(result));

    } catch (error) {

      UserController.handleError(res, error);

    }

  }

  public async retrieve(req: Request, res: Response) {
    //TODO: this needs to see only the viewable fields
    try {

      if (!$.isValidId(req.params.id)) return res.status(404).send({});

      const user = await User.findById(req.params.id)
        .populate('documents')//FIXME:
        .lean()
        .exec();

      if (!user) return res.status(404).send({});

      return res.status(200).json(this.stripPassword(user));

    } catch (error) {

      UserController.handleError(res, error);

    }

  }


  public async remove(req: Request, res: Response) {

    const loggedUser = req.user;

    if (!loggedUser)
      return UserController.handleError(res, new Error("Need to be registered"), 401);

    try {

      const user: UserI = await User.findById(loggedUser).exec() as UserI;

      if (!user) //NOTE: if we end up here something has gone really bad
        return UserController.handleError(res, new Error("User not found"), 404);

      await user.remove();

      res.status(200).send({});
      tokenController.invalidateTokens(user._id);

    } catch (error) {

      UserController.handleError(res, error);

    }

  }

  public async update(req: Request, res: Response) {

    const loggedUser = req.user;

    if (!loggedUser)
      return UserController.handleError(res, new Error("Need to be registered"), 401);

    try {
      const user: UserI = await User.findById(loggedUser).exec() as UserI;

      if (!user)//NOTE: if we end up here something has gone really bad
        return UserController.handleError(res, new Error("User not found"), 404);

      user.username = req.body?.username || user.username;
      user.email = req.body?.email || user.email;
      user.image = req.body?.image || user.image;
      user.password = req.body?.password || user.password;

      await user.save();

      return res.status(200).json(this.stripPassword(user.toObject()));

    } catch (error) {

      UserController.handleError(res, error);

    }

  }


  public async me(req: Request, res: Response) {

    const loggedUser = req.user;

    if (!loggedUser)
      return UserController.handleError(res, new Error("Need to be registered"), 401);

    try {

      const user = await User.findById(loggedUser)
        .populate('documents')//FIXME:
        .lean()
        .exec();

      if (!user)//NOTE: if we end up here something has gone really bad
        return UserController.handleError(res, new Error("User not found"), 404);

      return res.status(200).json(this.stripPassword(user));

    } catch (error) {

      UserController.handleError(res, error);

    }

  }

  private stripPassword(user: UserI): Partial<UserI> {

    delete user.password;
    delete user.salt;

    return user;

  }

  public addDocument(id: string, documentId: string): Promise<Error> {

    return new Promise(async (resolve, reject) => {

      try {

        const user: UserI = await User.findById(id).exec() as UserI;

        if (!user) return reject(new Error('User not found'));

        const idx = user.documents.findIndex((document: any) => document === documentId);

        if (idx !== -1) return resolve();

        user.documents.push(documentId);

        await user.save();

        resolve();

      } catch (error) {

        reject(error);

      }

    });

  }

  public removeDocument(id: string, documentId: string): Promise<Error> {

    return new Promise(async (resolve, reject) => {

      try {

        const user: UserI = await User.findById(id).exec() as UserI;

        if (!user) return reject(new Error('User not found'));

        const idx = user.documents.findIndex((document: any) => document.toString() === documentId);

        if (idx === -1) return resolve();

        user.documents.splice(idx, 1);

        await user.save();

        resolve();

      } catch (error) {

        reject(error);

      }

    });

  }

}

export default new UserController();