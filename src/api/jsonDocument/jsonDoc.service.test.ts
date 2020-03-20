import Container from 'typedi';
import JsonDocService from './jsonDoc.service';
import mongoose from 'mongoose';
import { JsonDoc } from './jsonDoc.model';
import { UserService as FakeService } from '../user/__mocks__/user.service';
import { UserService } from '../user/user.service';

const fakeService = new FakeService();
Container.set(UserService, fakeService);
const jsonService: JsonDocService = Container.get(JsonDocService);

let connection, docId: string, addDocumentSpy: jest.SpyInstance, removeDocumentSpy: jest.SpyInstance;

const user = '5e0a02aed716316c24be80b5',
	unauthorizedUser = '5e0a02aed716316c24be80b4';

beforeEach(() => {
	addDocumentSpy.mockClear();
	removeDocumentSpy.mockClear();
});

describe('create document', () => {
	beforeAll(async () => {
		connection = await mongoose.connect(process.env.MONGO_URL, {
			useNewUrlParser: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
			useCreateIndex: true
		});

		addDocumentSpy = jest.spyOn(fakeService, 'addDocument');
		removeDocumentSpy = jest.spyOn(fakeService, 'removeDocument');
	});

	afterAll(async () => {
		await connection.close();
	});

	it('should insert a doc into collection and retrieve it', async () => {
		const payload = {
			user: user,
			body: {
				privacy: 1,
				_schema: {
					test: 'hello World'
				}
			}
		};
		const result: JsonDoc = await jsonService.createJson(payload);
		const insertedDoc: JsonDoc = await jsonService.retrieveJson({ user: user, id: result._id });

		expect(insertedDoc._schema).toEqual(payload.body._schema);
		expect(insertedDoc.privacy).toEqual(payload.body.privacy);
		expect(insertedDoc.members[0].userId.toString()).toEqual(user);
		expect(addDocumentSpy).toBeCalledTimes(1);
	});

	it('should return unauthorized access if no user', async () => {
		const payload = {
			user: '',
			body: {
				_schema: {
					test: 'hello World'
				}
			}
		};

		try {
			await jsonService.createJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(401);
			expect(error.message).toEqual('Need to be registered');
			expect(addDocumentSpy).toBeCalledTimes(0);
		}
	});
});

describe('retrieveJson', () => {
	beforeAll(async () => {
		const payload = {
			user: user,
			body: {
				privacy: 1,
				_schema: {
					test: 'hello World'
				}
			}
		};

		const result: JsonDoc = await jsonService.createJson(payload);
		docId = result._id;
	});

	it('should return file not found', async () => {
		const payload = {
			user: user,
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
		try {
			const payload = {
				id: docId,
				user: unauthorizedUser.toString()
			};

			await jsonService.retrieveJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(401);
			expect(error.message).toEqual('Unauthorized Access');
		}
	});

	it('should return bad Parameters provider', async () => {
		try {
			const payload = {
				id: '12312312',
				user: user
			};

			await jsonService.retrieveJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(400);
			expect(error.message).toEqual('Bad Parameters Provided');
		}
	});

	it('Should return the correct json', async () => {
		const payload = {
			id: docId,
			user: user
		};

		const result: JsonDoc = await jsonService.retrieveJson(payload);

		expect(result._schema).toEqual({ test: 'hello World' });
		expect(result.privacy).toEqual(1);
		expect(result.members[0].userId.toString()).toEqual(user);
	});
});

describe('UpdateJson', () => {
	it('Bad Parameters Provided', async () => {
		try {
			const payload = {
				user: '123123',
				_schema: {},
				id: '5df415fdbc982579da9786f1'
			};

			await jsonService.updateJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(400);
			expect(error.message).toEqual('Bad Parameters Provided');
		}
	});

	it('Bad Parameters Provided', async () => {
		try {
			const payload = {
				user: user,
				_schema: {},
				id: '5df415fdbc982579da9786f1'
			};

			await jsonService.updateJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(400);
			expect(error.message).toEqual('Bad Parameters Provided');
		}
	});

	it('File not Found', async () => {
		const payload = {
			user: user,
			_schema: {
				test: 'te'
			},
			id: '5df415fdbc982579da9786f1'
		};

		try {
			await jsonService.updateJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(404);
			expect(error.message).toEqual('File not found');
		}
	});

	it('Unauthorized Access', async () => {
		try {
			const payload = {
				user: unauthorizedUser.toString(),
				_schema: {
					test: 'te'
				},
				id: docId
			};

			await jsonService.updateJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(401);
			expect(error.message).toEqual('Unauthorized Access');
		}
	});

	it('should update the json', async () => {
		const payload = {
			user: user.toString(),
			id: docId,
			_schema: {
				updatedField: 'Hello World'
			}
		};

		const result: JsonDoc = await jsonService.updateJson(payload);
		expect(result._schema).toEqual(payload._schema);
	});
});

describe('updateJsonPrivacy', () => {
	it('Bad Parameters Provided', async () => {
		try {
			const payload = {
				user: '123123',
				privacy: 'private',
				id: docId
			};

			await jsonService.updateJsonPrivacy(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(400);
			expect(error.message).toEqual('Bad Parameters Provided');
		}
	});

	it('Bad Parameters Provided', async () => {
		try {
			const payload = {
				user: user,
				privacy: 'test',
				id: '5df415fdbc982579da9786f1'
			};

			await jsonService.updateJsonPrivacy(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(400);
			expect(error.message).toEqual('Bad Parameters Provided');
		}
	});

	it('File not Found', async () => {
		const payload = {
			user: user,
			privacy: 'public',
			id: '5df415fdbc982579da9786f1'
		};

		try {
			await jsonService.updateJsonPrivacy(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(404);
			expect(error.message).toEqual('File not found');
		}
	});

	it('Unauthorized Access', async () => {
		try {
			const payload = {
				user: unauthorizedUser.toString(),
				privacy: 'public',
				id: docId
			};

			await jsonService.updateJsonPrivacy(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(401);
			expect(error.message).toEqual('Unauthorized Access');
		}
	});

	it('should update the json', async () => {
		const payload = {
			user: user.toString(),
			privacy: 'public',
			id: docId
		};

		const result: JsonDoc = await jsonService.updateJsonPrivacy(payload);
		expect(result).toBe(undefined);
	});
});

describe('addMemberJson', () => {
	it('Bad Parameters Provided', async () => {
		try {
			const payload = {
				user: user,
				userId: '123123',
				access: 'write',
				id: docId
			};

			await jsonService.addMemberJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(400);
			expect(error.message).toEqual('Bad Parameters Provided');
			expect(addDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('Bad Parameters Provided', async () => {
		try {
			const payload = {
				user: user,
				userId: unauthorizedUser.toString(),
				access: 'test',
				id: docId
			};

			await jsonService.addMemberJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(400);
			expect(error.message).toEqual('Bad Parameters Provided');
			expect(addDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('File not Found', async () => {
		const payload = {
			user: user,
			userId: unauthorizedUser.toString(),
			access: 'write',
			id: '5df415fdbc982579da9786f1'
		};

		try {
			await jsonService.addMemberJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(404);
			expect(error.message).toEqual('File not found');
			expect(addDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('Unauthorized Access', async () => {
		try {
			const payload = {
				user: unauthorizedUser.toString(),
				userId: unauthorizedUser.toString(),
				access: 'write',
				id: docId
			};

			await jsonService.addMemberJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(401);
			expect(error.message).toEqual('Unauthorized Access');
			expect(addDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('should update the json', async () => {
		const payload = {
			user: user.toString(),
			userId: unauthorizedUser.toString(),
			access: 'write',
			id: docId
		};

		const result = await jsonService.addMemberJson(payload);
		expect(result).toBe(undefined);
		expect(addDocumentSpy).toBeCalledTimes(1);
	});
});

describe('removeMemberJson', () => {
	it('Bad Parameters Provided', async () => {
		try {
			const payload = {
				user: user,
				userId: '123123',
				id: docId
			};

			await jsonService.removeMemberJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(400);
			expect(error.message).toEqual('Bad Parameters Provided');
			expect(removeDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('File not Found', async () => {
		const payload = {
			user: user,
			userId: unauthorizedUser.toString(),
			id: '5df415fdbc982579da9786f1'
		};

		try {
			await jsonService.removeMemberJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(404);
			expect(error.message).toEqual('File not found');
			expect(removeDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('Unauthorized Access', async () => {
		try {
			const payload = {
				user: unauthorizedUser.toString(),
				userId: unauthorizedUser.toString(),
				id: docId
			};

			await jsonService.removeMemberJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(401);
			expect(error.message).toEqual('Unauthorized Access');
			expect(removeDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('should update the json', async () => {
		const payload = {
			user: user.toString(),
			userId: unauthorizedUser.toString(),
			id: docId
		};

		const result = await jsonService.removeMemberJson(payload);
		expect(result).toBe(undefined);
		expect(removeDocumentSpy).toBeCalledTimes(1);
	});
});

describe('RemoveJson', () => {
	it('Bad Parameters Provided', async () => {
		try {
			const payload = {
				id: '12312312',
				user: user
			};

			await jsonService.removeJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(400);
			expect(error.message).toEqual('Bad Parameters Provided');
			expect(removeDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('File not Found', async () => {
		const payload = {
			user: user,
			id: '5df415fdbc982579da9786f1'
		};

		try {
			await jsonService.removeJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(404);
			expect(error.message).toEqual('File not found');
			expect(removeDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('Unauthorized Access', async () => {
		try {
			const payload = {
				id: docId,
				user: unauthorizedUser.toString()
			};

			await jsonService.removeJson(payload);
		} catch ({ error, status }) {
			expect(status).toEqual(401);
			expect(error.message).toEqual('Unauthorized Access');
			expect(removeDocumentSpy).toBeCalledTimes(0);
		}
	});

	it('It should remove the json', async () => {
		const payload = {
			id: docId,
			user: user.toString()
		};

		const result = await jsonService.removeJson(payload);
		expect(result).toBe(undefined);
		expect(removeDocumentSpy).toBeCalledTimes(1);
	});
});
