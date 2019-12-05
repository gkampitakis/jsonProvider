import { Router, Request, Response } from 'express';
import passport from 'passport';
import { UserI, User } from "../../user/user.model";
import { tokenController, Token } from './token.controller';
import { setup } from '../local/passport';

const tokenRouter = Router();

setup(User);

tokenRouter.post('/', (req: Request, res: Response, next: Function) => {

  passport.authenticate('local', async (err: Error, user: UserI, info: string) => {

    const error = err || info;

    if (error) return res.status(401).json(error);
    if (!user) return res.status(404).json({ message: 'Something went wrong, please try again.' });

    try {

      const token: Token = await tokenController.create(user._id) as Token;//TEST: if this works

      return res.status(200).json(token);

    } catch (error) {

      return res.status(500).json(error);

    }

  })(req, res, next);

});

export default tokenRouter;