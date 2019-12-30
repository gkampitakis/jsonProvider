import { Request, Response } from 'express';
import tokenParser from 'parse-bearer-token';
import { tokenController } from '../api/auth/token/token.controller';
import { ObjectID } from 'mongodb';
import version from '../version.json';
import { _Logger } from "./decorators/logger";

export class HelperService {

  public async prepareRequestUser(req: Request, res: Response, next: Function) {

    const token = tokenParser(req);

    if (!token) return next();

    try {

      req.user = await tokenController.retrieveUser(token);

    } catch { }

    next();

  }

  public isValidId(...ids): boolean {

    for (const id of ids) {

      if (!ObjectID.isValid(id)) return false;

    }

    return true;
  }

  public versionInfo(req: Request, res: Response) {

    res.status(200).json(version);

  }

  public routerLogger(req: Request, res: Response, next: Function) {

    const logger = new _Logger('Router', true);
    logger.log(`${req.method} |`, req.path);

    next();

  }

}