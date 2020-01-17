import { Router } from 'express';
import controller from './user.controller';
import { TokenController } from "../auth/token/token.controller";
import { Container } from "typedi";

const controllerDI = Container.get(controller);
const tokenController: TokenController = new TokenController();
const userRouter: Router = Router();

userRouter.get('/verify', controllerDI.verifyEmail);

userRouter.use(tokenController.prepareRequestUser);

userRouter.post('/', controllerDI.create);
userRouter.get('/me', controllerDI.me);
userRouter.get('/:id', controllerDI.retrieve);
//FIXME: return only visible data
userRouter.put('/', controllerDI.update);
userRouter.delete('/', controllerDI.remove);


export default userRouter;