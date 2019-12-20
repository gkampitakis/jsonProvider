import { Schema, model } from 'mongoose';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  access: {
    type: Number,
    min: 0,
    max: 2,
    default: access.admin
  }
}, { _id: false });

const jsonDocSchema = new Schema({
  privacy: {
    type: Number,
    min: 0,
    max: 1,
    default: privacy.public
  },
  _schema: {
    type: Schema.Types.Mixed,
    required: true
  },
  members: {
    type: [authorizationSchema],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  name: {
    type: String,
    unique: true
  }
});

jsonDocSchema.pre<any>('save', function (next) {

  if (this.name) return next();

  this.name = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: '-'
  });

  next();

});

export const JsonDocModel = model('JsonDoc', jsonDocSchema, 'JsonDoc');
