import { Schema, model, Document } from 'mongoose';
import validator from 'validator';
import crypto from 'crypto';

export interface UserI extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  salt: string;
  image: string;
  verified: boolean;
  documents: Array<any>;
  authenticate(password: string, callback?: Function): Function | boolean;
  makeSalt(number, callback): Function;
  encryptPassword(pass, callback): Function;
};

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  salt: {
    type: String
  },
  verified: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  documents: {
    type: [{ type: Schema.Types.ObjectId, ref: 'JsonDoc' }],
    default: []
  }
});

/**
 * Validations
 */
userSchema
  .path('email')
  .validate(function (email: string) {

    return validator.isEmail(email);

  })
  .validate(function (value) {

    return this.constructor.findOne({ email: value }).exec()
      .then(user => {

        if (user && this.id !== user.id) {

          return false;

        }

        return true;

      })
      .catch(err => { throw err; });

  }, 'The specified email address is already in use.');

userSchema
  .path('username')
  .validate(function (value) {
    return this.constructor.findOne({ username: value }).exec()
      .then(user => {

        if (user && this.id !== user.id) {

          return false;

        }

        return true;

      })
      .catch((err) => { throw err; });
  }, 'The specified username is already in use');


const validatePresenceOf = (value) => {

  return value && value.length;

};


/**
 * Pre-save hook
 */
userSchema.pre<UserI>('save', function (next) {
  // Handle new/update passwords
  if (!this.isModified('password')) {

    return next();

  }

  if (!validatePresenceOf(this.password)) {

    return next(new Error('Invalid password'));

  }

  // Make salt with a callback
  this.makeSalt(16, (saltErr, salt) => {

    if (saltErr) {

      return next(saltErr);

    }

    this.salt = salt;

    this.encryptPassword(this.password, (encryptErr, hashedPassword) => {

      if (encryptErr) {

        return next(encryptErr);

      }

      this.password = hashedPassword;
      return next();

    });
  });
});

/**
 * Methods
 */

userSchema.methods = {
  authenticate(password: string, callback?: Function) {

    if (!callback) {

      return this.password === this.encryptPassword(password);

    }

    this.encryptPassword(password, (err, pwdGen) => {

      if (err) {

        return callback(err);

      }

      if (this.password === pwdGen) {
        return callback(null, true);
      }

      return callback(null, false);

    });

  },
  makeSalt(byteSize = 16, callback: Function) {

    return crypto.randomBytes(byteSize, (err, salt) => {

      if (err) {

        return callback(err);

      }

      return callback(null, salt.toString('base64'));

    });

  },
  encryptPassword(password: string, callback: Function) {

    if (!password || !this.salt) {

      if (!callback) {

        return null;

      } else {

        return callback('Missing password or salt');

      }

    }

    const defaultIterations = 872791,
      defaultKeyLength = 64,
      salt = new Buffer(this.salt, 'base64'),
      digest = 'sha512';

    if (!callback) {

      return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength, digest)
        .toString('base64');

    }

    return crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength, digest, (err, key) => {

      if (err) {

        return callback(err);

      }

      return callback(null, key.toString('base64'));

    });

  }
};

export const User = model('User', userSchema, 'User');