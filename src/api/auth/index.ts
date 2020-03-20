import { UserModel } from '../user/user.model';
import { Router } from 'express';
import { setup } from './local/passport';
import TokenController from './token/token.controller';

const controller = new TokenController(),
	authRouter = Router();

setup(UserModel);

authRouter.post('/', controller.authenticate);
authRouter.delete('/', controller.invalidateToken);

export default authRouter;
