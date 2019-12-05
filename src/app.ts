import * as http from 'http';
import express from 'express';
import bluebird from 'bluebird';
import mongoose from 'mongoose';
import { setupExpress } from './config/express';
import { setupRoutes } from './routes';
import $ from './util/helper';
import { config } from './config/environment';

export class App {

  private app: express.Application;
  private server: http.Server;

  constructor() {

    this.connectDatabase();

    this.app = express();
    this.server = http.createServer(this.app);

    this.setupGlobals();
    setupExpress(this.app);
    setupRoutes(this.app);
    this.startServer();

  }

  private connectDatabase() {

    if (!config.mongo.connect) return;

    mongoose.connect(config.mongo.uri, config.mongo.options)
      .then(() => $.Logger.info('MongoDB is connected on ' + config.mongo.uri));

    mongoose.connection.on('error', err => {
      $.Logger.error(`MongoDB connection error: ${err}`);
      process.exit(-1);
    });

  }

  private setupGlobals() {

    (mongoose as any).Promise = bluebird;

  }

  private startServer() {

    this.server.listen(config.port, () => {
      $.Logger.info(`Express server listening on port ${config.port}`);
    });

  }
}