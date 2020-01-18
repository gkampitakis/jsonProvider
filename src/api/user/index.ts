import { Router } from 'express';
import controller from './user.controller';
import { TokenService } from "../auth/token/token.service";
import { Container } from "typedi";

const controllerDI = Container.get(controller);
const tokenController: TokenService = new TokenService();
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