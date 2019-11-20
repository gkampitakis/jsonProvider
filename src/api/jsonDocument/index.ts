import { Router } from 'express';
import controller from './jsonDoc.controller';
import utils from '../../util/helper';

const jsonDocRouter = Router();

jsonDocRouter.get('/:id', controller.retrieve);
jsonDocRouter.delete('/:id', utils.basicAuthentication, controller.remove);
jsonDocRouter.post('/', utils.basicAuthentication, controller.create);
jsonDocRouter.put('/:id', utils.basicAuthentication, controller.update);

export default jsonDocRouter;