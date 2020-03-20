import { Request, Response } from 'express'; //TODO: remove
import { _Logger, Logger } from '../../../util/decorators/logger';
import passport from 'passport';
import { TokenI } from '.././token/token.model';
import { TokenService } from './token.service';
import { UserI } from '../../user/user.model';
import { ControllerModule } from '../../interfaces/ControllerModule';

//TODO: then remove tests and rewrite them with the mongodriver

class TokenController extends ControllerModule {
	@Logger('TokenController')
	private logger: _Logger;
	private tokenService = new TokenService();

	public authenticate(req: Request, res: Response) {
		passport.authenticate('local', async (err: Error, user: UserI, info: string) => {
			const error = err || info;

			if (error) return res.status(401).json(error);
			if (!user) return res.status(404).json({ message: 'Something went wrong, please try again.' });

			try {
				const { token, _id: userId } = (await this.tokenService.create(user._id, 'authorization')) as TokenI;

				return res.status(200).json({
					token: token,
					userId: userId
				});
			} catch (error) {
				this.logger.error(error);
				return res.status(500).json(error);
			}
		})(req, res);
	}

	public async invalidateToken(req: Request, res: Response) {
		try {
			const { t: token } = req.query;

			if (!token) return this.handleError(res, new Error('Token not provided'), 400);

			await this.tokenService.removeToken({ token });
			res.status(200).json({
				message: 'Removed successfully'
			});
		} catch ({ error, status }) {
			this.logger.error(error.message);
			this.handleError(res, error, status);
		}
	}
}

export default TokenController;
