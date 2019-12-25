import * as http from 'http';
import express from 'express';
import bluebird from 'bluebird';
import mongoose from 'mongoose';
import { setupExpress } from './config/express';
import { setupRoutes } from './routes';
import { Configurator } from './util/decorators/configurator';
import { Logger, _Logger } from './util/decorators/logger';

export class App {

  private app: express.Application;
  private server: http.Server;
  @Configurator()
  private config;
  @Logger('App')
  private logger: _Logger;

  constructor() {

    this.app = express();
    this.server = http.createServer(this.app);

    this.setupGlobals();
    setupExpress(this.app);
    setupRoutes(this.app);
    this.connectDatabase()
      .then(() => this.startServer())
      .catch(() => process.exit(-1));

  }

  private connectDatabase() {

    return new Promise((resolve, reject) => {

      if (!this.config.mongo.connect) reject();

      mongoose.connect(this.config.mongo.uri, this.config.mongo.options)
        .then(() => {

          this.logger.info('MongoDB is connected on ' + this.config.mongo.uri);

          resolve();

        });

      mongoose.connection.on('error', err => {

        this.logger.error(`MongoDB connection error: ${err}`);

        reject();

      });

    });

  }

  private setupGlobals() {

    (mongoose as any).Promise = bluebird;

  }

  private startServer() {

    this.server.listen(this.config.port, () => {
      this.logger.info(`Express server listening on port ${this.config.port}`);
    });

  }
}