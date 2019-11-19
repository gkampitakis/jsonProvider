import { Router } from 'express';
import controller from './jsonDoc.controller';

const jsonDocRouter = Router();

//FIXME: add middleware for create delete and update

jsonDocRouter.get('/:id', controller.retrieve);
jsonDocRouter.delete('/:id', controller.remove);
jsonDocRouter.post('/', controller.create);
jsonDocRouter.put('/:id', controller.update);

export default jsonDocRouter;