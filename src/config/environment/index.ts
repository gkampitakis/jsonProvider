import dotenv from 'dotenv';
import *  as path from 'path';

let _path;

switch (process.env.NODE_ENV) {
  case 'development':
    _path = path.join(__dirname, '/../../../.env.development');
    break;
  case 'production':
    _path = path.join(__dirname, '/../../../.env.production');
    break;
  case 'test':
    _path = path.join(__dirname, '/../../../.env.test');
    break;
  default:
    process.env.NODE_ENV = 'development';
    _path = path.join(__dirname, '/../../../.env.development');
    break;
}

dotenv.config({ path: _path });

const all = {

  env: process.env.NODE_ENV,
  port: process.env.PORT,
  secrets: {
    authentication: process.env.SECRET
  },
  mongo: {
    connect: true,
    options: {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    },
    uri: process.env.MONGODB_URI
  },
  root: path.normalize(`${__dirname}/../../..`)
};

export const config = (
  all
);
