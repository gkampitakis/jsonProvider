import dotenv from 'dotenv';
import * as path from 'path';
import config from '../config/config.json';

let _path;

switch (process.env.NODE_ENV) {
	case 'development':
		_path = path.join(process.cwd(), '/.env.development');
		break;
	case 'production':
		_path = path.join(process.cwd(), '/.env.production');
		break;
	default:
		process.env.NODE_ENV = 'development';
		_path = path.join(process.cwd(), '/.env.development');
		break;
}

dotenv.config({ path: _path });

export default {
	env: process.env.NODE_ENV,
	port: process.env.PORT,
	secrets: {
		authentication: process.env.SECRET
	},
	keys: {
		sendgrid: process.env.SENDGRID_KEY
	},
	mongo: {
		connect: true,
		options: {
			useNewUrlParser: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
			useCreateIndex: true
		},
		uri: process.env.MONGODB_URI
	},
	communication: {
		...config.communication,
		changePassUrl: process.env.CHANGE_PASS_EMAIL_URL,
		verifyEmailUrl: process.env.VERIFY_EMAIL_URL
	},
	root: path.normalize(`${__dirname}/../../..`)
};
