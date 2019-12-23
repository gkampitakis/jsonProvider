import * as http from 'http';
import express from 'express';
import bluebird from 'bluebird';
import mongoose from 'mongoose';
import { setupExpress } from './config/express';
import { setupRoutes } from './routes';
import $ from './util/helper.service';
import { Configurator } from './config/configurator';

export class App {

  private app: express.Application;
  private server: http.Server;
  @Configurator()
  private config;

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

          $.Logger.info('MongoDB is connected on ' + this.config.mongo.uri);

          resolve();

        });

      mongoose.connection.on('error', err => {

        $.Logger.error(`MongoDB connection error: ${err}`);

        reject();

      });

    });

  }

  private setupGlobals() {

    (mongoose as any).Promise = bluebird;

  }

  private startServer() {

    this.server.listen(this.config.port, () => {
      $.Logger.info(`Express server listening on port ${this.config.port}`);
    });

  }
}