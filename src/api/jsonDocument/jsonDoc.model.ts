import { Schema, model } from 'mongoose';

export enum access {
  read,
  write,
  admin
}

export enum privacy {
  private,
  public
}

export interface JsonDoc {
  privacy: privacy;
  _schema: {};
  members: [{
    userId: string;
    access: access;
  }];
}

const authorizationSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  access: {
    type: Number,
    default: access.admin
  }
}, { _id: false });

const jsonDocSchema = new Schema({
  privacy: {
    type: Number,
    default: privacy.public
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
