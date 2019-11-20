import { Request, Response } from 'express';
import { config } from "../config/environment";
import { getLogger, Logger } from 'log4js';

class HelperFunctions {
  private static instance: HelperFunctions;
  private _logger: Logger;

  private constructor() {

    this._logger = getLogger();
    this._logger.level = 'debug';

    this._logger.info('Helper Function Instantiated');

  }

  static getInstance() {

    if (!HelperFunctions.instance)
      HelperFunctions.instance = new HelperFunctions();

    return HelperFunctions.instance;

  }


  public get Logger(): Logger {

    return this._logger;

  }

  basicAuthentication(req: Request, res: Response, next: Function) {

    if (req.query.secret !== config.secrets.authentication) {

      res.status(401).json('Unauthorized');
      return;

    }

    next();

  }

}

export default HelperFunctions.getInstance();