import { Router } from 'express';
import controller from './user.controller';

const userController: Router = Router();

userController.post('/', controller.create);
userController.get('/me', controller.me);
userController.get('/:id', controller.retrieve);
//FIXME: return only visible data
userController.put('/', controller.update);
userController.delete('/', controller.remove);

export default userController;