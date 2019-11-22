import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cors from 'cors';
import { config } from './environment';

export function setupExpress(app: express.Application) {

  const env: string = config.env;
  console.log(env);


  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
}
