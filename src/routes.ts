import { HelperService } from './util/helper.service';
import express from 'express';
import jsonDocRouter from './api/jsonDocument';
import userRouter from './api/user';
import authRouter from './api/auth';

export function setupRoutes(app: express.Application) {
	const $ = new HelperService();
	app.use($.routerLogger);

	app.use('/json/doc', jsonDocRouter);
	app.use('/user', userRouter);
	app.use('/auth', authRouter);

	app.use('/version', $.versionInfo);

	// All other routes should return a 404
	app.route('/*').get((req: express.Request, res: express.Response) => {
		res.sendStatus(404);
	});
}
