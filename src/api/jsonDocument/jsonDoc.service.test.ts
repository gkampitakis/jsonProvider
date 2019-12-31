import Container from "typedi";
import JsonDocService from "./jsonDoc.service";
import mongoose from "mongoose";
import { UserService } from "../user/user.service";
import { UserI } from "../user/user.model";
import { JsonDoc } from "./jsonDoc.model";

const jsonService: JsonDocService = Container.get(JsonDocService);
const userService: UserService = Container.get(UserService);
let connection, user: UserI, docId: string, unauthorizedUser: UserI;

describe("create document", () => {

  beforeAll(async () => {

    connection = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    user = await userService.createUser({
      body: {
        username: "Giorgos Kampitakis",
        email: "gkabitakis@gmail.com",
        password: "12345"
      }
    }) as UserI;

    unauthorizedUser = await userService.createUser({
      body: {
        username: "unauthorizedUser",
        email: "unauthorizedUser@gmail.com",
        password: "12345"
      }
    }) as UserI;

  });

  afterAll(async () => {

    await connection.close();

  });

  it("should insert a doc into collection and retrieve it", async () => {

    const payload = {
      user: user._id,
      body: {
        privacy: 1,
        _schema: {
          test: "hello World"
        }
      }
    };

    const result: JsonDoc = await jsonService.createJson(payload);
    const insertedDoc: JsonDoc = await jsonService.retrieveJson({ user: user._id, id: result._id });

    expect(insertedDoc._schema).toEqual(payload.body._schema);
    expect(insertedDoc.privacy).toEqual(payload.body.privacy);
    expect(insertedDoc.members[0].userId).toEqual(user._id);

  });


  it("should return unauthorized access if no user", async () => {

    const payload = {
      user: "",
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
      expect(error.message).toEqual("Need to be registered");

    }
  });

});

describe("retrieveJson", () => {

  beforeAll(async () => {

    const payload = {
      user: user._id,
      body: {
        privacy: 1,
        _schema: {
          test: "hello World"
        }
      }
    };

    const result: JsonDoc = await jsonService.createJson(payload);
    docId = result._id;

  });

  it("should return file not found", async () => {

    const payload = {
      user: user._id,
      id: "5df415fdbc982579da9786f1"
    };

    try {

      await jsonService.retrieveJson(payload);


    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("File not found");

    }

  });

  it("should return unauthorized access", async () => {

    try {

      const payload = {
        id: docId,
        user: unauthorizedUser._id.toString()
      };

      await jsonService.retrieveJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual("Unauthorized Access");

    }

  });

  it("should return bad Parameters provider", async () => {

    try {

      const payload = {
        id: "12312312",
        user: user._id
      };

      await jsonService.retrieveJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(400);
      expect(error.message).toEqual("Bad Parameters Provided");

    }

  });

  it("Should return the correct json", async () => {

    const payload = {
      id: docId,
      user: user._id
    };

    const result: JsonDoc = await jsonService.retrieveJson(payload);

    expect(result._schema).toEqual({ test: "hello World" });
    expect(result.privacy).toEqual(1);
    expect(result.members[0].userId).toEqual(user._id);

  });

});


describe("UpdateJson", () => {

  it("Bad Parameters Provided", async () => {

    try {

      const payload = {
        user: "123123",
        _schema: {},
        id: "5df415fdbc982579da9786f1"
      };

      await jsonService.updateJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(400);
      expect(error.message).toEqual("Bad Parameters Provided");

    }

  });

  it("Bad Parameters Provided", async () => {

    try {

      const payload = {
        user: user._id,
        _schema: {},
        id: "5df415fdbc982579da9786f1"
      };

      await jsonService.updateJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(400);
      expect(error.message).toEqual("Bad Parameters Provided");

    }

  });

  it("File not Found", async () => {

    const payload = {
      user: user._id,
      _schema: {
        test: "te"
      },
      id: "5df415fdbc982579da9786f1"
    };

    try {

      await jsonService.updateJson(payload);


    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("File not found");

    }

  });

  it("Unauthorized Access", async () => {

    try {

      const payload = {
        user: unauthorizedUser._id.toString(),
        _schema: {
          test: "te"
        },
        id: docId
      };

      await jsonService.updateJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual("Unauthorized Access");

    }

  });

  it("should update the json", async () => {

    const payload = {
      user: user._id.toString(),
      id: docId,
      _schema: {
        updatedField: "Hello World"
      }
    };

    const result: JsonDoc = await jsonService.updateJson(payload);
    expect(result._schema).toEqual(payload._schema);

  });

});

describe("updateJsonPrivacy", () => {

  it("Bad Parameters Provided", async () => {

    try {

      const payload = {
        user: "123123",
        privacy: "private",
        id: docId
      };

      await jsonService.updateJsonPrivacy(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(400);
      expect(error.message).toEqual("Bad Parameters Provided");

    }

  });

  it("Bad Parameters Provided", async () => {

    try {

      const payload = {
        user: user._id,
        privacy: "test",
        id: "5df415fdbc982579da9786f1"
      };

      await jsonService.updateJsonPrivacy(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(400);
      expect(error.message).toEqual("Bad Parameters Provided");

    }

  });

  it("File not Found", async () => {

    const payload = {
      user: user._id,
      privacy: "public",
      id: "5df415fdbc982579da9786f1"
    };

    try {

      await jsonService.updateJsonPrivacy(payload);


    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("File not found");

    }

  });

  it("Unauthorized Access", async () => {

    try {

      const payload = {
        user: unauthorizedUser._id.toString(),
        privacy: "public",
        id: docId
      };

      await jsonService.updateJsonPrivacy(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual("Unauthorized Access");

    }

  });

  it("should update the json", async () => {

    const payload = {
      user: user._id.toString(),
      privacy: "public",
      id: docId
    };

    const result: JsonDoc = await jsonService.updateJsonPrivacy(payload);
    expect(result).toBe(undefined);

  });

});

describe("addMemberJson", () => {

  it("Bad Parameters Provided", async () => {

    try {

      const payload = {
        user: user._id,
        userId: "123123",
        access: "write",
        id: docId
      };

      await jsonService.addMemberJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(400);
      expect(error.message).toEqual("Bad Parameters Provided");

    }

  });

  it("Bad Parameters Provided", async () => {

    try {

      const payload = {
        user: user._id,
        userId: unauthorizedUser._id.toString(),
        access: "test",
        id: docId
      };

      await jsonService.addMemberJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(400);
      expect(error.message).toEqual("Bad Parameters Provided");

    }

  });

  it("File not Found", async () => {

    const payload = {
      user: user._id,
      userId: unauthorizedUser._id.toString(),
      access: "write",
      id: "5df415fdbc982579da9786f1"
    };

    try {

      await jsonService.addMemberJson(payload);


    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("File not found");

    }

  });

  it("Unauthorized Access", async () => {

    try {

      const payload = {
        user: unauthorizedUser._id.toString(),
        userId: unauthorizedUser._id.toString(),
        access: "write",
        id: docId
      };

      await jsonService.addMemberJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual("Unauthorized Access");

    }

  });

  it("should update the json", async () => {

    const payload = {
      user: user._id.toString(),
      userId: unauthorizedUser._id.toString(),
      access: "write",
      id: docId
    };

    const result = await jsonService.addMemberJson(payload);
    expect(result).toBe(undefined);

  });

});


describe("removeMemberJson", () => {

  it("Bad Parameters Provided", async () => {

    try {

      const payload = {
        user: user._id,
        userId: "123123",
        id: docId
      };

      await jsonService.removeMemberJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(400);
      expect(error.message).toEqual("Bad Parameters Provided");

    }

  });

  it("File not Found", async () => {

    const payload = {
      user: user._id,
      userId: unauthorizedUser._id.toString(),
      id: "5df415fdbc982579da9786f1"
    };

    try {

      await jsonService.removeMemberJson(payload);


    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("File not found");

    }

  });

  it("Unauthorized Access", async () => {

    try {

      const payload = {
        user: unauthorizedUser._id.toString(),
        userId: unauthorizedUser._id.toString(),
        id: docId
      };

      await jsonService.removeMemberJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual("Unauthorized Access");

    }

  });

  it("should update the json", async () => {

    const payload = {
      user: user._id.toString(),
      userId: unauthorizedUser._id.toString(),
      id: docId
    };

    const result = await jsonService.removeMemberJson(payload);
    expect(result).toBe(undefined);

  });

});

describe("RemoveJson", () => {

  it("Bad Parameters Provided", async () => {

    try {

      const payload = {
        id: "12312312",
        user: user._id
      };

      await jsonService.removeJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(400);
      expect(error.message).toEqual("Bad Parameters Provided");

    }

  });

  it("File not Found", async () => {

    const payload = {
      user: user._id,
      id: "5df415fdbc982579da9786f1"
    };

    try {

      await jsonService.removeJson(payload);


    } catch ({ error, status }) {

      expect(status).toEqual(404);
      expect(error.message).toEqual("File not found");

    }

  });

  it("Unauthorized Access", async () => {

    try {

      const payload = {
        id: docId,
        user: unauthorizedUser._id.toString()
      };

      await jsonService.removeJson(payload);

    } catch ({ error, status }) {

      expect(status).toEqual(401);
      expect(error.message).toEqual("Unauthorized Access");

    }

  });

  it("It should remove the json", async () => {

    const payload = {
      id: docId,
      user: user._id.toString()
    };

    const result = await jsonService.removeJson(payload);
    expect(result).toBe(undefined);

  });

});
