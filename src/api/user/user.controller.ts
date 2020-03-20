import { Request, Response } from 'express';
import { _Logger, Logger } from "../../util/decorators/logger";
import { UserService } from "./user.service";
import { ControllerModule } from "../interfaces/ControllerModule";

class UserController extends ControllerModule {

  @Logger('UserController')
  private logger: _Logger;
  private userService = new UserService();

  public async create(req: Request, res: Response) {

    const payload = {
      body: req.body
    };

    try {

      const result = await this.userService.createUser(payload);
      res.status(200).json(result);

    } catch ({ error, status }) {

      this.logger.error(error.message);
      this.handleError(res, error, status);

    }

  }

  public async sendVerificationEmail(req: Request, res: Response) {

    const payload = {
      email: req.query.e
    };

    try {

      await this.userService.sendVerificationEmail(payload);
      res.status(200).json({
        message: 'Email was send successfully',
        status: 200
      });

    } catch ({ error, status }) {

      this.logger.error(error.message);
      this.handleError(res, error, status);

    }

  }

  public async userExists(req: Request, res: Response) {

    try {

      const payload = {
        id: req.body.id,
        field: req.params.field
      };

      const result = await this.userService.userExists(payload);

      return res.status(200).json(result);

    } catch ({ error, status }) {

      this.handleError(res, error);

    }

  }

  public async verifyEmail(req: Request, res: Response) {

    try {

      const payload = {
        token: req.query.t
      };

      await this.userService.verifyEmail(payload);
      res.status(200).json({
        message: "Successfully verified",
        status: 200
      });

    } catch ({ error, status }) {

      this.handleError(res, error);

    }

  }


  public async remove(req: Request, res: Response) {
    //TODO: need to delete all the files that he only has access :O 
    const payload = {
      user: req.user
    };

    try {

      await this.userService.removeUser(payload);
      res.status(200).send({});

    } catch ({ error, status }) {

      this.logger.error(error.message);
      this.handleError(res, error, status);

    }

  }

  public async update(req: Request, res: Response) {

    const payload = {
      user: req.user,
      body: req.body
    };

    try {

      const result = await this.userService.updateUser(payload);
      return res.status(200).json(result);

    } catch ({ error, status }) {

      this.logger.error(error.message);
      this.handleError(res, error, status);

    }

  }

  public async me(req: Request, res: Response) {

    const payload = {
      user: req.user
    };

    try {

      const result = await this.userService.retrieveMe(payload);
      return res.status(200).json(result);

    } catch ({ error, status }) {

      this.logger.error(error.message);
      this.handleError(res, error, status);

    }

  }

  public async passwordResetRequest(req: Request, res: Response) {

    try {

      const payload = {
        email: req.body.email
      };

      await this.userService.passwordResetRequest(payload);

      return res.status(200).json({
        message: "Reset email was sent"
      });

    } catch ({ error, status }) {

      this.logger.error(error.message);
      this.handleError(res, error, status);

    }

  }

  public async passwordReset(req: Request, res: Response) {

    try {

      const payload = {
        token: req.query.t,
        password: req.body.password
      };

      await this.userService.passwordReset(payload);

      return res.status(200).json({
        message: "Password Updated"
      });

    } catch ({ error, status }) {

      this.logger.error(error.message);
      this.handleError(res, error, status);

    }

  }

}

export default UserController;