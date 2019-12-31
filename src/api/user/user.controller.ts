import { Request, Response } from 'express';
import { _Logger, Logger } from "../../util/decorators/logger";
import autoBind from 'auto-bind';
import { UserService } from "./user.service";

class UserController {

  @Logger('JsonDocController')
  private logger: _Logger

  constructor(private userService: UserService) {

    autoBind(this);

  }

  private handleError(res: Response, error: Error, status = 500) {

    this.logger.error(error.message);
    return res.status(status).json({
      message: error.message,
      status: status
    });

  }

  public async create(req: Request, res: Response) {

    const payload = {
      body: req.body
    };

    try {

      const result = await this.userService.createUser(payload);
      res.status(200).json(result);

    } catch ({ error, status }) {

      this.handleError(res, error, status);

    }

  }

  public async retrieve(req: Request, res: Response) {
    //TODO: this needs to see only the viewable fields
    try {

      const payload = {
        id: req.params.id
      };

      const result = await this.userService.retrieveUser(payload);

      return res.status(200).json(result);

    } catch ({ error, status }) {

      this.handleError(res, error, status);

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

      this.handleError(res, error, status);

    }

  }


  // public async emailTest(req: Request, res: Response) {
  //   //TODO: this will be removed
  //   try {

  //     const test = await emailController.send('gkabitakis@gmail.com', 'test',
  //       { password: 'test', fname: 'myname', lname: 'test2' }, 'changePassword');

  //     res.status(200).json(test);

  //   } catch ({ error, status }) {

  //     this.handleError(res, error, status);

  //   }

  // }

  public async me(req: Request, res: Response) {

    const payload = {
      user: req.user
    };

    try {

      const result = await this.userService.retrieveMe(payload);
      return res.status(200).json(result);

    } catch ({ error, status }) {

      this.handleError(res, error, status);

    }

  }

}

export default UserController;