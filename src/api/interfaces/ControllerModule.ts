import { Response } from "express";

export abstract class ControllerModule {

  protected handleError(res: Response, error: Error, status = 500) {

    return res.status(status).json({
      message: error.message,
      status: status
    });

  }

}