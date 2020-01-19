import { UserModel } from "../user/user.model";
import { Router } from 'express';
import { setup } from './local/passport';
import { Container } from "typedi";
import controller from './token/token.controller';

const controllerDI = Container.get(controller),
  authRouter = Router();

setup(UserModel);

authRouter.post('/', controllerDI.authenticate);

export default authRouter;