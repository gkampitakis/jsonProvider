import { UserI, User } from "../../user/user.model";
import { TokenController, TokenModel } from './token.controller';
import { Router, Request, Response } from 'express';
import { Container } from "typedi";
import { setup } from '../local/passport';
import passport from 'passport';


const tokenRouter = Router();
const tokenControllerDI = Container.get(TokenController);

setup(User);

tokenRouter.post('/', (req: Request, res: Response, next: Function) => {

  passport.authenticate('local', async (err: Error, user: UserI, info: string) => {

    const error = err || info;

    if (error) return res.status(401).json(error);
    if (!user) return res.status(404).json({ message: 'Something went wrong, please try again.' });

    try {

      const token: TokenModel = await tokenControllerDI.create(user._id) as TokenModel;

      return res.status(200).json(token);

    } catch (error) {

      return res.status(500).json(error);

    }

  })(req, res, next);

});

export default tokenRouter;