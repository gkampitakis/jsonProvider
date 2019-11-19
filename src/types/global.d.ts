import { Logger } from 'log4js';

declare global {
  namespace NodeJS {
    interface Global {
      logger: Logger;
    }
  }
}
