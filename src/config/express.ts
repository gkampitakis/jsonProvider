import express from 'express';
import bodyParser from 'body-parser';
import errorHandler from 'errorhandler';
import methodOverride from 'method-override';
import cors from 'cors';
import { config } from './environment';

export function setupExpress(app: express.Application) {

  const env: string = config.env;

  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  if (env === 'development') {
    app.use(errorHandler()); // Error handler - has to be last
  }

}
