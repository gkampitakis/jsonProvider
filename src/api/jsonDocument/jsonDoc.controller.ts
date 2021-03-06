import { Request, Response } from "express";
import { _Logger, Logger } from "../../util/decorators/logger";
import { Service } from 'typedi';
import JsonDocService from "./jsonDoc.service";
import autoBind from 'auto-bind';
import _ from 'lodash';
import { ControllerModule } from "../interfaces/ControllerModule";

@Service()
class JsonDocController extends ControllerModule {

  @Logger('JsonDocController')
  private logger: _Logger;

  constructor(
    private jsonService: JsonDocService
  ) {

    super();
    autoBind(this);

  }

  public async create(req: Request, res: Response) {

    const payload = {
      user: req.user,
      body: req.body
    };

    try {

      const result = await this.jsonService.createJson(payload);
      res.status(200).json(result);

    } catch ({ error, status }) {

      this.logger.error(error.message);
      this.handleError(res, error, status);

    }

  }

  public async retrieve(req: Request, res: Response) {

    const payload = {
      user: req.user,
      id: req.params.id
    };

    try {

      const result = await this.jsonService.retrieveJson(payload);
      res.status(200).json(result);

    } catch ({ error, status }) {


      this.logger.error(error.message);
      this.handleError(res, error, status);

    }

  }

  public async remove(req: Request, res: Response) {

    const payload = {
      user: req.user,
      id: req.params.id
    };

    try {

      await this.jsonService.removeJson(payload);
      res.status(200).send({});

    } catch (error) {

      return this.handleError(res, error);

    }

  }

  public async update(req: Request, res: Response) {

    const payload = {
      _schema: req.body._schema,
      id: req.params.id,
      user: req.user
    };

    if (_.isEmpty(payload._schema))
      return this.handleError(res, new Error("Body can\'t be empty"), 422);

    try {

      const result = this.jsonService.updateJson(payload);
      return res.status(200).json(result);

    } catch ({ error, status }) {

      this.logger.error(error.message);
      return this.handleError(res, error, status);

    }

  }

  public async updatePrivacy(req: Request, res: Response) {

    const payload = {
      id: req.params.id,
      user: req.user,
      privacy: req.params.privacy
    };

    try {

      await this.jsonService.updateJsonPrivacy(payload);
      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch ({ error, status }) {

      this.logger.error(error.message);
      return this.handleError(res, error, status);

    }

  }

  public async addMember(req: Request, res: Response) {

    const payload = {
      userId: req.params.userId,
      id: req.params.id,
      user: req.user,
      access: req.params.access
    };

    try {

      await this.jsonService.addMemberJson(payload);
      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch ({ error, status }) {

      this.logger.error(error.message);
      return this.handleError(res, error, status);

    }

  }

  public async removeMember(req: Request, res: Response) {

    const payload = {
      userId: req.params.userId,
      id: req.params.id,
      user: req.user
    };

    try {

      await this.jsonService.removeMemberJson(payload);
      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch ({ error, status }) {

      this.logger.error(error.message);
      return this.handleError(res, error, status);

    }

  }

}

export default JsonDocController;