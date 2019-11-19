import * as http from 'http';
import express from 'express';
import bluebird from 'bluebird';
import mongoose from 'mongoose';
import { setupExpress } from './config/express';
import { setupRoutes } from './routes';
import _logger from './logger';
import { config } from './config/environment';

export class App {

  private app: express.Application;
  private server: http.Server;

  constructor() {

    this.connectDatabase();

    this.app = express();
    this.server = http.createServer(this.app);

    setupExpress(this.app);
    setupRoutes(this.app);
    this.setupGlobals();
    this.startServer();

  }

  private connectDatabase() {

    if (!config.mongo.connect) return;

    mongoose.connect(config.mongo.uri, config.mongo.options)
      .then(() => global.logger.info('MongoDB is connected on ' + config.mongo.uri));

    mongoose.connection.on('error', err => {
      global.logger.error(`MongoDB connection error: ${err}`);
      process.exit(-1);
    });

  }

  private setupGlobals() {

    (mongoose as any).Promise = bluebird;
    global.logger = _logger;

  }

  private startServer() {

    this.server.listen(5000, () => {
      global.logger.info(`Express server listening on port ${5000}`);
    });

  }
}