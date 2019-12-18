import { Router } from 'express';
import controller from './user.controller';

const userController: Router = Router();

userController.post('/', controller.create);
//FIXME: implement function
// userController.get('/me', controller.me);
userController.get('/:id', controller.retrieve);
//FIXME: return only visible data
userController.put('/:id', controller.update);
userController.delete('/:id', controller.remove);

export default userController;