import { Router } from 'express';
import UserController from './user.controller';
import { TokenService } from '../auth/token/token.service';

const controller = new UserController(),
	tokenService: TokenService = new TokenService(),
	userRouter: Router = Router();

userRouter.post('/exists/:field', controller.userExists);
userRouter.get('/verify', controller.verifyEmail);
userRouter.post('/', controller.create);
userRouter.get('/resend/verify', controller.sendVerificationEmail);

userRouter.use(tokenService.prepareRequestUser);

userRouter.post('/password', controller.passwordResetRequest);
userRouter.put('/password', controller.passwordReset);
userRouter.get('/me', controller.me);
userRouter.put('/', controller.update);
userRouter.delete('/', controller.remove);

export default userRouter;
