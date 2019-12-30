import { Request, Response } from "express";
import { HelperService } from "../../util/helper.service";
import { _Logger, Logger } from "../../util/decorators/logger";
import { Service } from 'typedi';
import JsonDocService from "./jsonDoc.service";
import autoBind from 'auto-bind';
import _ from 'lodash';
import { privacy, access } from "./jsonDoc.model";

@Service()
class JsonDocController {

  @Logger('JsonDocController')
  private logger: _Logger;

  constructor(
    private jsonService: JsonDocService,
    private helperService: HelperService
  ) {

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
      user: req.user,
      body: req.body
    };

    try {

      const result = await this.jsonService.createJson(payload);
      res.status(200).json(result);

    } catch ({ error, status }) {

      this.handleError(res, error, status);

    }

  }

  public async retrieve(req: Request, res: Response) {

    const payload = {
      user: req.user,
      id: req.params.id
    };

    if (!this.helperService.isValidId(payload.id))
      return this.handleError(res, new Error("Bad Parameters Provided"), 400);

    try {

      const result = await this.jsonService.retrieveJson(payload);
      res.status(200).json(result);

    } catch ({ error, status }) {

      this.handleError(res, error, status);

    }

  }

  public async remove(req: Request, res: Response) {

    const payload = {
      user: req.user,
      id: req.params.id
    };

    if (!this.helperService.isValidId(payload.id))
      return this.handleError(res, new Error("Bad Parameters Provided"), 400);

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

    if (!this.helperService.isValidId(payload.id))
      return this.handleError(res, new Error("Bad Parameters Provided"), 400);

    if (_.isEmpty(payload._schema))
      return this.handleError(res, new Error("Body can\'t be empty"), 422);

    try {

      const result = this.jsonService.updateJson(payload);
      return res.status(200).json(result);

    } catch ({ error, status }) {

      return this.handleError(res, error, status);

    }

  }

  public async updatePrivacy(req: Request, res: Response) {

    const payload = {
      id: req.params.id,
      user: req.user,
      privacy: req.params.privacy
    };

    if (!this.helperService.isValidId(payload.id))
      return this.handleError(res, new Error("Bad Parameters Provided"), 400);

    if (!(payload.privacy in privacy))
      return this.handleError(res, new Error("Bad Parameters Provided"), 400);

    try {

      await this.jsonService.updateJsonPrivacy(payload);
      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch ({ error, status }) {

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

    if (!this.helperService.isValidId(payload.id, payload.userId)) return res.status(404).send({});

    if (payload.userId === payload.user)
      return this.handleError(res, new Error("Unauthorized Action"), 401);

    if (!(payload.access in access))
      return this.handleError(res, new Error("Bad Parameters Provided"), 400);

    try {

      await this.jsonService.addMemberJson(payload);
      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch ({ error, status }) {

      return this.handleError(res, error, status);

    }

  }

  public async removeMember(req: Request, res: Response) {
    //TODO: what happens if you remove the last member
    const payload = {
      userId: req.params.userId,
      id: req.params.id,
      user: req.user
    };

    if (!this.helperService.isValidId(payload.id, payload.userId))
      return res.status(404).send({});

    try {

      await this.jsonService.removeMemberJson(payload);
      return res.status(200).json({ message: "Update was successful", status: 200 });

    } catch ({ error, status }) {

      return this.handleError(res, error, status);

    }

  }

}

export default JsonDocController;