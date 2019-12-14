import { Request, Response } from 'express';
import { getLogger, Logger } from 'log4js';
import tokenParser from 'parse-bearer-token';
import { tokenController } from '../api/auth/token/token.controller';
import { ObjectID } from 'mongodb';

class HelperService {
  private static instance: HelperService;
  private _logger: Logger;

  private constructor() {

    this._logger = getLogger();
    this._logger.level = 'debug';

    this._logger.info('Helper Function Instantiated');

  }

  static getInstance() {

    if (!HelperService.instance)
      HelperService.instance = new HelperService();

    return HelperService.instance;

  }


  public get Logger(): Logger {

    return this._logger;

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

}

export default HelperService.getInstance();