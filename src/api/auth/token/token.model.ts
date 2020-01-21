import { Schema, model, Document } from 'mongoose';

export type TokenType =
  'authorization' |
  'verification' |
  'passwordReset';

export interface TokenI extends Document {
  token: string;
  created: Date;
  type: TokenType;
  userId?: string;
  requestThrottle: {
    date: Date;
    counter: number;
  };
};

const TokenSchema = new Schema({
  token: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now()
  },
  type: {
    type: String,
    enum: [
      'authorization',
      'verification',
      'passwordReset'
    ],
    required: true,
    default: 'authorization'
  },
  userId: {
    type: String
  },
  requestThrottle: {
    date: {
      type: Date,
      default: Date.now()
    },
    counter: {
      type: Number,
      default: 1
    }
  }
});

TokenSchema.index({ created: 1 }, {
  expireAfterSeconds: 604800 //1 week in seconds //TODO: think about invalidation method
});


export const TokenModel = model('Token', TokenSchema, 'Token');