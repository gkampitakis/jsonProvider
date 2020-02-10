import mongoose from 'mongoose';
import { TokenModel, TokenI } from './token.model';
import { TokenService } from './token.service';

let connection,
  token: string,
  result: TokenI;

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

    await TokenModel.deleteMany({});
    await connection.close();

  });

  it('should create a token containing the provided userId', async () => {

    const { token, userId } = await tokenService.create(user_Id, 'authorization');

    expect(token).not.toBe(undefined);
    expect(user_Id).toEqual(userId);

  });

});

describe('Remove Token', () => {

  beforeAll(async () => {

    await tokenService.create(user_Id, 'authorization');

  });

  afterAll(async () => {

    await TokenModel.deleteMany({});

  });

  it('should remove token', async () => {

    await tokenService.remove(user_Id);

    const token = await tokenService.retrieveToken({ userId: user_Id });

    expect(token).toBe(null);

  });

});

describe('Update Token', () => {

  beforeAll(async () => {

    result = await tokenService.create(user_Id, 'authorization');

  });

  afterAll(async () => {

    await TokenModel.deleteMany({});

  });

  it('should update token', async () => {

    await tokenService.updateToken(result._id.toString(), {
      requestThrottle: {
        date: Date.now(),
        counter: 10
      }
    });

    result = await tokenService.retrieveToken({ _id: result._id.toString() });

    expect(result.requestThrottle.counter).toBe(10);

  }, 30000);

});

describe('Retrieve Token', () => {

  beforeAll(async () => {

    await tokenService.create(user_Id, 'authorization');

  });

  afterAll(async () => {

    await TokenModel.deleteMany({});

  });

  it('should remove token', async () => {

    const token = await tokenService.retrieveToken({ userId: user_Id });

    expect(token).not.toBe(undefined);

  });

});

describe('Retrieve Verification Token', () => {

  beforeAll(async () => {

    const result = await tokenService.create(user_Id, 'verification');
    token = result.token;

  });

  afterAll(async () => {

    await TokenModel.deleteMany({});

  });

  it('should retrieve token', async () => {

    const result = await tokenService
      .retrieveToken({ token: token, type: 'verification' });

    expect(result).not.toBe(undefined);

  });

});

describe('Password Create Throttled Token', () => {


  afterEach(async () => {

    await TokenModel.deleteMany({});

  });

  it('should create a token for password request', async () => {

    await tokenService.createThrottledToken(user_Id, 'passwordReset');

    result = await tokenService.retrieveToken({ userId: user_Id });

    expect(result).not.toBe(null);
    expect(result.userId).toBe(user_Id);
    expect(result.requestThrottle.counter).toBe(1);
    expect(result.type).toBe('passwordReset');

  });

  it('should return same token with updated counter', async () => {

    const req1 = await tokenService.createThrottledToken(user_Id, 'verification'),
      req2 = await tokenService.createThrottledToken(user_Id, 'verification'),
      req3 = await tokenService.createThrottledToken(user_Id, 'verification');

    expect(req1.token).toBe(req2.token);
    expect(req2.token).toBe(req3.token);
    expect(req2.requestThrottle.counter).toBe(2);
    expect(req3.requestThrottle.counter).toBe(3);

  });

  it('should reset the counter if date changed', async () => {

    await tokenService.createThrottledToken(user_Id, 'passwordReset');
    await tokenService.createThrottledToken(user_Id, 'passwordReset');
    await tokenService.createThrottledToken(user_Id, 'passwordReset');
    const req = await tokenService.createThrottledToken(user_Id, 'passwordReset', true);

    expect(req.requestThrottle.counter).toBe(1);

  });

  it('should throw error of maximum requests', async () => {

    try {

      await tokenService.createThrottledToken(user_Id, 'passwordReset');
      await tokenService.createThrottledToken(user_Id, 'passwordReset');
      await tokenService.createThrottledToken(user_Id, 'passwordReset');
      await tokenService.createThrottledToken(user_Id, 'passwordReset');

    } catch (error) {

      expect(error.message).toBe('Reached maximum requests for today');

    }

  });

});