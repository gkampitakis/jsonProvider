import { Request, Response } from 'express';
import { ObjectID } from 'mongodb';
import version from '../version.json';
import { _Logger } from "./decorators/logger";
import { Service } from "typedi";
import "reflect-metadata";
@Service()
export class HelperService {

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