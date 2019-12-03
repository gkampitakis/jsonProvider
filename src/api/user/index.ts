import { Router } from 'express';
import controller from './user.controller';
//FIXME: Authentication

const userController = Router();

userController.post('/', controller.create);
//FIXME: when tokens are implemented pass the userId on the req object
// userController.get('/me', controller.me);
userController.get('/:id', controller.retrieve);
userController.put('/:id', controller.update);
userController.delete('/:id', controller.remove);

export default userController;