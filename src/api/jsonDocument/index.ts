import { Router } from 'express';
import controller from './jsonDoc.controller';
import utils from '../../util/helper.service';

const jsonDocRouter = Router();

jsonDocRouter.use(utils.prepareRequestUser);

jsonDocRouter.get('/:id', controller.retrieve);
jsonDocRouter.delete('/:id', controller.remove);
jsonDocRouter.post('/', controller.create);
jsonDocRouter.put('/:id', controller.update);

export default jsonDocRouter;