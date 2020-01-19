import mongoose from 'mongoose';
import { TokenModel } from "./token.model";
import { TokenService } from "./token.service";

let connection,
  token: string;

const tokenService = new TokenService(),
  user_Id = '5e190be690b8fb10d070dffe';

describe('Token Create', () => {

  beforeAll(async () => {

    connection = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

  });

  afterAll(async () => {

    await connection.close();

  });

  afterEach(async () => {

    await TokenModel.deleteMany({});

  });

  it("should create a token containing the provided userId", async () => {

    const { token, userId } = await tokenService.create(user_Id, 'authorization');

    expect(token).not.toBe(undefined);
    expect(user_Id).toEqual(userId);

  });

});

describe('Remove Token', () => {

  beforeEach(async () => {

    await tokenService.create(user_Id, 'authorization');

  });

  it("should remove token", async () => {

    await tokenService.remove(user_Id);

    try {

      await tokenService.retrieveByUser(user_Id);

    } catch (error) {

      expect(error.message).toBe('Token not found');

    }

  });

});


describe('Retrieve Token', () => {

  beforeEach(async () => {

    await tokenService.create(user_Id, 'authorization');

  });

  it("should remove token", async () => {


    const token = await tokenService.retrieveByUser(user_Id);

    expect(token).not.toBe(undefined);

  });

});

describe('Retrieve Verification Token', () => {

  beforeEach(async () => {

    const result = await tokenService.create(user_Id, 'verification');
    token = result.token;

  });

  it("should retrieve token", async () => {

    const result = await tokenService.retrieveByToken(token, 'verification');

    expect(result).not.toBe(undefined);

  });

});