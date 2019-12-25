import { Request, Response } from 'express';
import tokenParser from 'parse-bearer-token';
import { tokenController } from '../api/auth/token/token.controller';
import { ObjectID } from 'mongodb';
import version from '../version.json';
import { _Logger, Logger } from "./decorators/logger";

class HelperService {
  private static instance: HelperService;
  @Logger('HelperService')
  private logger: _Logger;

  private constructor() {

    this.logger.info('Helper Service Instantiated');

  }

  static getInstance() {

    if (!HelperService.instance)
      HelperService.instance = new HelperService();

    return HelperService.instance;

  }

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

export default HelperService.getInstance();