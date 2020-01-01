import { Container } from "typedi";
import mongoose from "mongoose";
import { UserService } from "./user.service";
import { UserI, User } from "./user.model";
import { TokenController } from "../auth/token/token.controller";
import { TokenController as FakeService } from "../auth/token/__mocks__/tokenController";
import { JsonDoc } from "../jsonDocument/jsonDoc.model";
import JsonDocService from "../jsonDocument/jsonDoc.service";

let connection,
  tokenInvalidateSpy: jest.SpyInstance,
  user: UserI;

const fakeService = new FakeService();
Container.set(TokenController, fakeService);
const userService = Container.get(UserService);

const jsonService: JsonDocService = Container.get(JsonDocService);

describe("Create User", () => {

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

    await User.deleteMany({});

  });


  it("User with this email already exists", async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    };

    try {

      await userService.createUser(payload);
      payload.body.username = "anotherName";
      await userService.createUser(payload);

    } catch ({ error }) {

      expect(error.message).toEqual("User validation failed: email: The specified email address is already in use");

    }

  });

  it("User with this username already exists", async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    };

    try {

      await userService.createUser(payload);
      payload.body.email = "test@gmail.com";
      await userService.createUser(payload);

    } catch ({ error }) {

      expect(error.message).toEqual("User validation failed: username: The specified username is already in use");

    }

  });

  it("Wrong email", async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis",
        password: "12345"
      }
    };

    try {

      await userService.createUser(payload);

    } catch ({ error }) {

      expect(error.message).toEqual("User validation failed: email: Validator failed for path `email` with value `gkabitakis`");

    }

  });

  it("Missing required fields", async () => {

    try {

      const payload = {
        body: {
          username: "Giorgos Kampitakis",
          password: "12345"
        }
      };

      await userService.createUser(payload);

    } catch ({ error }) {

      expect(error.message).toEqual("User validation failed: email: Path `email` is required.");

    }

  });

  it("Should create the user", async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    };

    const user: UserI = await userService.createUser(payload);;

    expect(user.username).toEqual(payload.body.username);
    expect(user.email).toEqual(payload.body.email);

  });

});


describe("Retrieve User", () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    };

    user = await userService.createUser(payload);

  });

  afterAll(async () => {

    await User.deleteMany({});

  });

  it("Should return user not found", async () => {

    try {

      await userService.retrieveUser({ id: "12312321" });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("User not found");

    }

  });

  it("Should return user not found", async () => {

    try {

      await userService.retrieveUser({ id: "5e0a02aed716316c24be80b5" });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("User not found");

    }

  });

  it("Should return user without password or hash", async () => {

    const retrievedUser = await userService.retrieveUser({ id: user._id });
    expect(retrievedUser).toEqual(user);
    expect(retrievedUser).not.toHaveProperty("password");
    expect(retrievedUser).not.toHaveProperty("hash");

  });

});

describe("Remove User", () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    };

    user = await userService.createUser(payload);
    tokenInvalidateSpy = jest.spyOn(fakeService, "invalidateTokens");

  });

  afterAll(async () => {

    await User.deleteMany({});
    tokenInvalidateSpy.mockReset();

  });

  it("Should be registered", async () => {

    try {

      await userService.removeUser({ user: "" });

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual("Need to be registered");

    }

  });

  it("Should return user not found", async () => {

    try {

      await userService.removeUser({ user: "5e0a02aed716316c24be80b5" });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("User not found");

    }

  });

  it("Should remove user", async () => {

    const result = await userService.removeUser({ user: user._id.toString() });

    expect(result).toBeUndefined;
    expect(tokenInvalidateSpy).toBeCalledTimes(1);

  });

});

describe("Update User", () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    };

    user = await userService.createUser(payload);
    tokenInvalidateSpy = jest.spyOn(fakeService, "invalidateTokens");

  });

  afterAll(async () => {

    await User.deleteMany({});
    tokenInvalidateSpy.mockReset();

  });

  it("Should be registered", async () => {

    try {

      await userService.removeUser({ user: "" });

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual("Need to be registered");

    }

  });

  it("Should return user not found", async () => {

    try {

      await userService.removeUser({ user: "5e0a02aed716316c24be80b5" });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("User not found");

    }

  });
  //FIXME: write test about validations being used on update

  it("Should update user", async () => {

    const payload = {
      user: user._id.toString(),
      body: {
        password: "9876",
        username: "NewName",
        email: "papaki@gmail.com"
      }
    };

    const updatedUser: UserI = await userService.updateUser(payload);

    expect(updatedUser.username).toEqual(payload.body.username);
    expect(updatedUser.email).toEqual(payload.body.email);
    expect(updatedUser.password).not.toEqual(user.password);

  });

});

describe("Retrieve Me", () => {

  beforeAll(async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    };

    user = await userService.createUser(payload);
    tokenInvalidateSpy = jest.spyOn(fakeService, "invalidateTokens");

  });

  afterAll(async () => {

    await User.deleteMany({});
    tokenInvalidateSpy.mockReset();

  });

  it("Should be registered", async () => {

    try {

      await userService.removeUser({ user: "" });

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual("Need to be registered");

    }

  });

  it("Should return user not found", async () => {

    try {

      await userService.removeUser({ user: "5e0a02aed716316c24be80b5" });

    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("User not found");

    }

  });

  it("Should return user without password or hash", async () => {

    const retrievedUser = await userService.retrieveUser({ id: user._id });
    expect(retrievedUser).toEqual(user);
    expect(retrievedUser).not.toHaveProperty("password");
    expect(retrievedUser).not.toHaveProperty("hash");

  });

});

describe("Add Document", () => {

  let doc: JsonDoc,
    user2: UserI;

  beforeAll(async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    };

    user = await userService.createUser(payload);

    const payload2 = {
      body: {
        username: "test",
        email: "test@gmail.com",
        password: "12345"
      }
    };


    user2 = await userService.createUser(payload2);

    const payloadDoc = {
      user: user._id.toString(),
      body: {
        privacy: 1,
        _schema: {
          test: "hello World"
        }
      }
    };

    doc = await jsonService.createJson(payloadDoc);

  });

  afterAll(async () => {

    await User.deleteMany({});

  });

  it("should not add document twice", async () => {

    await userService.addDocument(doc._id.toString(), user._id.toString());
    const result: UserI = await userService.retrieveUser({ id: user._id.toString() });

    expect(result.documents.length).toEqual(1);

  });


  it("Should add document to user", async () => {

    await userService.addDocument(doc._id.toString(), user2._id.toString());
    const result: UserI = await userService.retrieveUser({ id: user2._id.toString() });

    expect(result.documents.length).toEqual(1);

  });

});

describe("Remove Document", () => {

  let doc: JsonDoc,
    user2: UserI;

  beforeAll(async () => {

    const payload = {
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    };

    user = await userService.createUser(payload);

    const payload2 = {
      body: {
        username: "test",
        email: "test@gmail.com",
        password: "12345"
      }
    };


    user2 = await userService.createUser(payload2);

    const payloadDoc = {
      user: user._id.toString(),
      body: {
        privacy: 1,
        _schema: {
          test: "hello World"
        }
      }
    };

    doc = await jsonService.createJson(payloadDoc);
    await userService.addDocument(doc._id.toString(), user2._id.toString());

  });

  afterAll(async () => {

    await User.deleteMany({});

  });

  it("Should remove document from user", async () => {

    await userService.removeDocument(doc._id.toString(), user2._id.toString());
    const result: UserI = await userService.retrieveUser({ id: user2._id.toString() });

    expect(result.documents.length).toEqual(0);

  });

  it("What happens here", async () => {

    await userService.removeDocument(doc._id.toString(), user2._id.toString());
    await userService.removeDocument(doc._id.toString(), user._id.toString());
    const result: UserI = await userService.retrieveUser({ id: user2._id.toString() });
    const result1: UserI = await userService.retrieveUser({ id: user._id.toString() });

    expect(result.documents.length).toEqual(0);
    expect(result1.documents.length).toEqual(0);

  });
});