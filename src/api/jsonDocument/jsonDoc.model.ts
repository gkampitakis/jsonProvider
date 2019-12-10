import { Schema, model } from 'mongoose';

const authorizationSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  access: {
    type: String,
    enum: ['read', 'write', 'admin'],
    default: 'admin'
  }
}, { _id: false });

const jsonDocSchema = new Schema({
  privacy: {
    type: String,
    enum: ['private', 'public'],
    default: 'public'
  },
  _schema: {
    type: Schema.Types.Mixed,
    required: true
  },
  members: {
    type: [authorizationSchema],
    required: true
  }
});

export const JsonDocModel = model('JsonDoc', jsonDocSchema, 'JsonDoc');
