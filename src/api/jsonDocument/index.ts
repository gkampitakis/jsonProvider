import { Router } from 'express';
import controller from './jsonDoc.controller';
import utils from '../../util/helper';//FIXME: add here the authentication of user
import UserRequest from "../interfaces/userRequest.interface";

const jsonDocRouter = Router();

jsonDocRouter.use(utils.prepareRequestUser);

jsonDocRouter.get('/:id', controller.retrieve);
jsonDocRouter.delete('/:id', utils.basicAuthentication, controller.remove);
jsonDocRouter.post('/', utils.basicAuthentication, controller.create);
jsonDocRouter.put('/:id', utils.basicAuthentication, controller.update);

export default jsonDocRouter;