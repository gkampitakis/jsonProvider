import express from 'express';
import jsonDocRouter from './api/jsonDocument';
import userRouter from './api/user';

export function setupRoutes(app: express.Application) {

  app.use('/json/doc', jsonDocRouter);
  app.use('/user', userRouter);

  // All other routes should return a 404
  app.route('/*').get((req: express.Request, res: express.Response) => {
    res.sendStatus(404);
  });

}