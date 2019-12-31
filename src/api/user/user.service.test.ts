import { Container } from "typedi";
import mongoose from "mongoose";
import { UserService } from "./user.service";
import { UserI, User } from './user.model';

let connection;
const userService = Container.get(UserService);

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


// describe("test", () => {
//   it('test', () => {
//     expect(true).toBe(true);
//   });
// });