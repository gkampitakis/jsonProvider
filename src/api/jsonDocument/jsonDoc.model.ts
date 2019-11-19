import { Schema, model } from 'mongoose';


const JsonDocSchema = new Schema({
  privacy: {
    type: String,
    enum: ['private', 'public'],
    default: 'public'
  },
  _schema: {
    type: Schema.Types.Mixed,
    required: true
  }
});

export const JsonDoc = model('JsonDoc', JsonDocSchema, 'JsonDoc');
