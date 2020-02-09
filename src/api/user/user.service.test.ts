import { Container } from 'typedi';
import mongoose from 'mongoose';
import { UserService } from './user.service';
import { UserI, UserModel } from './user.model';
import { TokenService } from '../auth/token/token.service';
import { TokenService as TokenFakeService } from '../../__mocks__/tokenService';
import { EmailProvider as EmailFakeProvider } from '../../__mocks__/emailProvider';
import { JsonDoc } from '../jsonDocument/jsonDoc.model';
import JsonDocService from '../jsonDocument/jsonDoc.service';
import { EmailProvider } from '@gkampitakis/email-provider';

let connection,
  tokenInvalidateSpy: jest.SpyInstance,
  tokenRetrieveSpy: jest.SpyInstance,
  tokenPasswordRequest: jest.SpyInstance,
  emailSendSpy: jest.SpyInstance,
  user: UserI;

const tokenFakeService = new TokenFakeService(),
  emailFakeProvider = new EmailFakeProvider();
Container.set(TokenService, tokenFakeService);
Container.set(EmailProvider, emailFakeProvider);

const userService = Container.get(UserService);

const jsonService: JsonDocService = Container.get(JsonDocService);

describe('Create User', () => {

  beforeAll(async () => {

    connection = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    emailSendSpy = jest.spyOn(emailFakeProvider, 'send');
    tokenRetrieveSpy = jest.spyOn(tokenFakeService, 'retrieveToken');
    tokenPasswordRequest = jest.spyOn(tokenFakeService, 'passwordRequestThrottle');

    TokenFakeService.token = '123456789';

  });

  afterAll(async () => {

    await connection.close();

  });

  afterEach(async () => {

    await UserModel.deleteMany({});
    emailSendSpy.mockClear();
    tokenRetrieveSpy.mockClear();
    tokenPasswordRequest.mockClear();

  });


  it('User with this email already exists', async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    try {

      await userService.createUser(payload);
      payload.body.username = 'anotherName';
      await userService.createUser(payload);

    } catch ({ error }) {

      expect(error.message).toEqual('User validation failed: email: The specified email address is already in use');

    }

  });

  it('User with this username already exists', async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    try {

      await userService.createUser(payload);
      payload.body.email = 'test@gmail.com';
      await userService.createUser(payload);

    } catch ({ error }) {

      expect(error.message).toEqual('User validation failed: username: The specified username is already in use');

    }

  });

  it('Wrong email', async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis',
        password: '12345'
      }
    };

    try {

      await userService.createUser(payload);

    } catch ({ error }) {

      expect(error.message).toEqual('User validation failed: email: Validator failed for path `email` with value `gkabitakis`');

    }

  });

  it('Missing required fields', async () => {

    try {

      const payload = {
        body: {
          username: 'Giorgos Kampitakis',
          password: '12345'
        }
      };

      await userService.createUser(payload);

    } catch ({ error }) {

      expect(error.message).toEqual('User validation failed: email: Path `email` is required.');

    }

  });

  it('Should create the user', async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    const user: UserI = await userService.createUser(payload);

    expect(user.username).toEqual(payload.body.username);
    expect(user.email).toEqual(payload.body.email);
    expect(emailSendSpy).toHaveBeenNthCalledWith(1,
      payload.body.email,
      'Please Verify your email', {
      "link": "http://localhost:3000/verify?t=123456789"
    }, 'verifyEmail');

  });

});


describe('Retrieve User', () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    user = await userService.createUser(payload);

  });

  afterAll(async () => {

    await UserModel.deleteMany({});

  });

  it('Should return user not found', async () => {

    try {

      await userService.retrieveUser({ id: '12312321' });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual('User not found');

    }

  });

  it('Should return user not found', async () => {

    try {

      await userService.retrieveUser({ id: '5e0a02aed716316c24be80b5' });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual('User not found');

    }

  });

  it('Should return user without password or hash', async () => {

    const retrievedUser = await userService.retrieveUser({ id: user._id });
    expect(retrievedUser).toEqual(user);
    expect(retrievedUser).not.toHaveProperty('password');
    expect(retrievedUser).not.toHaveProperty('hash');

  });

});

describe('Remove User', () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    user = await userService.createUser(payload);
    tokenInvalidateSpy = jest.spyOn(tokenFakeService, 'invalidateTokens');

  });

  afterAll(async () => {

    await UserModel.deleteMany({});
    tokenInvalidateSpy.mockClear();

  });

  it('Should be registered', async () => {

    try {

      await userService.removeUser({ user: '' });

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual('Need to be registered');

    }

  });

  it('Should return user not found', async () => {

    try {

      await userService.removeUser({ user: '5e0a02aed716316c24be80b5' });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual('User not found');

    }

  });

  it('Should remove user', async () => {

    const result = await userService.removeUser({ user: user._id.toString() });

    expect(result).toBeUndefined;
    expect(tokenInvalidateSpy).toBeCalledTimes(1);

  });

});

describe('Update User', () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    user = await userService.createUser(payload);
    tokenInvalidateSpy = jest.spyOn(tokenFakeService, 'invalidateTokens');

  });

  afterAll(async () => {

    await UserModel.deleteMany({});
    tokenInvalidateSpy.mockClear();

  });

  it('Should be registered', async () => {

    try {

      await userService.removeUser({ user: '' });

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual('Need to be registered');

    }

  });

  it('Should return user not found', async () => {

    try {

      await userService.removeUser({ user: '5e0a02aed716316c24be80b5' });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual('User not found');

    }

  });

  it('Should update user', async () => {

    const payload = {
      user: user._id.toString(),
      body: {
        password: '9876',
        username: 'NewName',
        email: 'papaki@gmail.com'
      }
    };

    const updatedUser: UserI = await userService.updateUser(payload);

    expect(updatedUser.username).toEqual(payload.body.username);
    expect(updatedUser.email).toEqual(payload.body.email);
    expect(updatedUser.password).not.toEqual(user.password);

  });

});

describe('Retrieve Me', () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    user = await userService.createUser(payload);
    tokenInvalidateSpy = jest.spyOn(tokenFakeService, 'invalidateTokens');

  });

  afterAll(async () => {

    await UserModel.deleteMany({});
    tokenInvalidateSpy.mockClear();

  });

  it('Should be registered', async () => {

    try {

      await userService.removeUser({ user: '' });

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual('Need to be registered');

    }

  });

  it('Should return user not found', async () => {

    try {

      await userService.removeUser({ user: '5e0a02aed716316c24be80b5' });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual('User not found');

    }

  });

  it('Should return user without password or hash', async () => {

    const retrievedUser = await userService.retrieveUser({ id: user._id });
    expect(retrievedUser).toEqual(user);
    expect(retrievedUser).not.toHaveProperty('password');
    expect(retrievedUser).not.toHaveProperty('hash');

  });

});

describe('Add Document', () => {

  let doc: JsonDoc,
    user2: UserI;

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    user = await userService.createUser(payload);

    const payload2 = {
      body: {
        username: 'test',
        email: 'test@gmail.com',
        password: '12345'
      }
    };


    user2 = await userService.createUser(payload2);

    const payloadDoc = {
      user: user._id.toString(),
      body: {
        privacy: 1,
        _schema: {
          test: 'hello World'
        }
      }
    };

    doc = await jsonService.createJson(payloadDoc);

  });

  afterAll(async () => {

    await UserModel.deleteMany({});

  });

  it('should not add document twice', async () => {

    await userService.addDocument(doc._id.toString(), user._id.toString());
    const result: UserI = await userService.retrieveUser({ id: user._id.toString() });

    expect(result.documents.length).toEqual(1);

  });


  it('Should add document to user', async () => {

    await userService.addDocument(doc._id.toString(), user2._id.toString());
    const result: UserI = await userService.retrieveUser({ id: user2._id.toString() });

    expect(result.documents.length).toEqual(1);

  });

});

describe('Remove Document', () => {

  let doc: JsonDoc,
    user2: UserI;

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    user = await userService.createUser(payload);

    const payload2 = {
      body: {
        username: 'test',
        email: 'test@gmail.com',
        password: '12345'
      }
    };


    user2 = await userService.createUser(payload2);

    const payloadDoc = {
      user: user._id.toString(),
      body: {
        privacy: 1,
        _schema: {
          test: 'hello World'
        }
      }
    };

    doc = await jsonService.createJson(payloadDoc);
    await userService.addDocument(doc._id.toString(), user2._id.toString());

  });

  afterAll(async () => {

    await UserModel.deleteMany({});

  });

  it('Should remove document from user', async () => {

    await userService.removeDocument(doc._id.toString(), user2._id.toString());
    const result: UserI = await userService.retrieveUser({ id: user2._id.toString() });

    expect(result.documents.length).toEqual(0);

  });

  it('What happens here', async () => {

    await userService.removeDocument(doc._id.toString(), user2._id.toString());
    await userService.removeDocument(doc._id.toString(), user._id.toString());
    const result: UserI = await userService.retrieveUser({ id: user2._id.toString() });
    const result1: UserI = await userService.retrieveUser({ id: user._id.toString() });

    expect(result.documents.length).toEqual(0);
    expect(result1.documents.length).toEqual(0);

  });

});

describe('when verifying email should retrieve token', () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'Giorgos Kampitakis',
        email: 'gkabitakis@gmail.com',
        password: '12345'
      }
    };

    user = await userService.createUser(payload);

  });

  afterAll(async () => {

    await UserModel.deleteMany({});

  });

  it('if existent update user', async () => {

    TokenFakeService.userId = user._id.toString();

    await userService.verifyEmail({ token: '123456789' });

    const result: UserI = await userService.retrieveMe({ user: user._id.toString() });

    expect(result.verified).toBe(true);
    expect(tokenRetrieveSpy).toHaveBeenNthCalledWith(1, { 'token': '123456789', 'type': 'verification' });

  });


  it('if not existent not update user and throw error', async () => {

    TokenFakeService.userId = user._id.toString();
    TokenFakeService.token = undefined;

    try {

      await userService.verifyEmail({ token: '123456789' });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual('Token not found');
      expect(tokenRetrieveSpy).toHaveBeenNthCalledWith(1, { 'token': '123456789', 'type': 'verification' });

    }

  });

});


describe('When requesting for password request', () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'test',
        email: 'test@gmail.com',
        password: '12345'
      }
    };

    TokenFakeService.token = '123456789';

    user = await userService.createUser(payload);

  });

  afterAll(async () => {

    await UserModel.deleteMany({});

  });

  afterEach(() => {

    emailSendSpy.mockClear();
    tokenPasswordRequest.mockClear();

  });

  it("if user not found throw error", async () => {

    try {

      await userService.passwordResetRequest({ email: 'notfound@gmail.com' });

    } catch ({ error, status }) {

      expect(status).toBe(404);
      expect(error.message).toBe('User not found');

    }

  });

  it('should create a token and send an email', async () => {

    await userService.passwordResetRequest({ email: 'test@gmail.com' });

    expect(tokenPasswordRequest).toHaveBeenNthCalledWith(1, user._id.toString());
    expect(emailSendSpy).toHaveBeenNthCalledWith(1,
      'test@gmail.com',
      'Password Reset',
      { link: 'http://localhost:3000/password/new?t=123456789' },
      'changePassword');

  });

});

describe('When resetting password', () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'test',
        email: 'test@gmail.com',
        password: '12345'
      }
    };

    TokenFakeService.token = '123456789';

    user = await userService.createUser(payload);

  });

  afterAll(async () => {

    await UserModel.deleteMany({});

  });

  afterEach(() => {

    emailSendSpy.mockClear();
    tokenPasswordRequest.mockClear();

  });

  it('if the token not existent throw error', async () => {

    try {

      TokenFakeService.token = undefined;

      await userService.passwordReset({ token: '99999', password: '00000' });

    } catch ({ error, status }) {

      expect(error.message).toBe('Token not found');
      expect(status).toBe(404);

    }

  });

  it('should change password and remove the token', async () => {

    TokenFakeService.token = '123456789';
    TokenFakeService.userId = user._id.toString();

    const result = userService.passwordReset({ token: '123456789', password: '00000' });

    expect(result).resolves;

  });

});

describe("when search if a user exists", () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: 'test',
        email: 'test@gmail.com',
        password: '12345'
      }
    };

    TokenFakeService.token = '123456789';

    user = await userService.createUser(payload);

  });

  afterAll(async () => {

    await UserModel.deleteMany({});

  });

  it("should return user exists if user exists", () => {

    const payload = {
      id: 'test',
      field: 'username'
    };

    expect(userService.userExists(payload))
      .resolves
      .toEqual({ message: 'User Exists', status: 200 });

  });

  it("should return user does not exist if user doesn't exists", () => {

    const payload = {
      id: 'notExistentUser',
      field: 'username'
    };

    expect(userService.userExists(payload))
      .resolves
      .toEqual({ message: 'User Does Not Exist', status: 400 });

  });

  it("should return user doesn't exist if query with wrong field", () => {

    const payload = {
      id: 'test',
      field: 'notExistentField'
    };

    expect(userService.userExists(payload))
      .resolves
      .toEqual({ message: 'User Does Not Exist', status: 400 });

  });

});