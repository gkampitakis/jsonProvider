import { Schema, model } from 'mongoose';

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
    enum: ['authorization', 'verification'],
    required: true,
    default: 'authorization'
  },
  userId: {
    type: String,
    required: true
  }
});

TokenSchema.index({ created: 1 }, {
  expireAfterSeconds: 604800 //1 week in seconds //TODO: think about invalidation method
});


export const Token = model('Token', TokenSchema, 'Token');