import { Router } from 'express';
import controller from './user.controller';
import utils from '../../util/helper.service';

const userRouter: Router = Router();

userRouter.use(utils.prepareRequestUser);

userRouter.post('/', controller.create);
userRouter.get('/email', controller.emailTest);
userRouter.get('/me', controller.me);
userRouter.get('/:id', controller.retrieve);
//FIXME: return only visible data
userRouter.put('/', controller.update);
userRouter.delete('/', controller.remove);

export default userRouter;