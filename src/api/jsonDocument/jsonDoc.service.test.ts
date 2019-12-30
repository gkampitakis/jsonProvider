import Container from "typedi";
import JsonDocService from "./jsonDoc.service";
import mongoose from 'mongoose';

//TODO: this needs to be finished waiting for dependency injection on user controller 
const jsonService: JsonDocService = Container.get(JsonDocService);

describe('create document', () => {

  let connection;

  beforeAll(async () => {

    connection = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

  });

  afterAll(async () => {

    await connection.close();

  });


  it('should insert a doc into collection and retrieve it', async () => {

    const payload = {
      user: '5df415fdbc982579da9786f1',
      body: {
        privacy: 1,
        _schema: {
          test: "hello World"
        }
      }
    };

    const result = await jsonService.createJson(payload);
    const insertedDoc = await jsonService.retrieveJson({ user: '5df415fdbc982579da9786f1', id: result._id });

    expect(insertedDoc._schema).toEqual(payload.body._schema);
    expect(insertedDoc.privacy).toEqual(payload.body.privacy);
    //FIXME: members have inside the user

  });


  it('should return unauthorized access if no user', async () => {

    const payload = {
      user: '',
      body: {
        _schema: {
          test: "hello World"
        }
      }
    };

    try {

      await jsonService.createJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual('Need to be registered');

    }
  });

});

describe('retrieveJson', () => {
  let connection;

  beforeAll(async () => {

    connection = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

  });

  afterAll(async () => {

    await connection.close();

  });


  it('should return file not found', async () => {

    const payload = {
      user: '5df415fdbc982579da9786f1',
      id: '5df415fdbc982579da9786f1'
    };

    try {

      await jsonService.retrieveJson(payload);


    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual('File not found');

    }

  });

  it('should return unauthorized access', async () => {

    const payload = {
      user: '5df415fdbc982579da9786f1',
      body: {
        privacy: 1,
        _schema: {
          test: "hello World"
        }
      }
    };

    try {

      const result = await jsonService.createJson(payload);
      await jsonService.retrieveJson({ id: result._id, user: '5df415fdbc982579da9786f2' });

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual('Unauthorized Access');

    }

  });

});
