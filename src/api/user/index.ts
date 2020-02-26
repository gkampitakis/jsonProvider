import { Router } from 'express';
import controller from './user.controller';
import { TokenService } from "../auth/token/token.service";
import { Container } from "typedi";

const controllerDI = Container.get(controller),
  tokenController: TokenService = new TokenService(),
  userRouter: Router = Router();

userRouter.post('/exists/:field', controllerDI.userExists);
userRouter.get('/verify', controllerDI.verifyEmail);
userRouter.post('/', controllerDI.create);
userRouter.get('/resend/verify', controllerDI.sendVerificationEmail);

userRouter.use(tokenController.prepareRequestUser);

userRouter.post('/password', controllerDI.passwordResetRequest);
userRouter.put('/password', controllerDI.passwordReset);
userRouter.get('/me', controllerDI.me);
userRouter.put('/', controllerDI.update);
userRouter.delete('/', controllerDI.remove);

export default userRouter;