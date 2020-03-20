import mongoose, { Mongoose } from 'mongoose';
import { UserService } from './user.service';
import { UserI, UserModel } from './user.model';
import { JsonDoc } from '../jsonDocument/jsonDoc.model';

jest.mock('../auth/token/token.service');
jest.mock('@gkampitakis/email-provider');
jest.mock('../jsonDocument/jsonDoc.service');

let connection: Mongoose;

describe('User Service', () => {
	const EmailProviderMock = jest.requireMock('@gkampitakis/email-provider').EmailProvider,
		TokenServiceMock = jest.requireMock('../auth/token/token.service').TokenService,
		JsonDocumentMock = jest.requireMock('../jsonDocument/jsonDoc.service').JsonDocService,
		userService = new UserService();

	beforeAll(async () => {
		connection = await mongoose.connect(process.env.MONGO_URL, {
			useNewUrlParser: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
			useCreateIndex: true
		});
	});

	afterAll(async () => {
		await connection.disconnect();
	});

	beforeEach(async () => {
		await UserModel.deleteMany({});
		EmailProviderMock.EmailSendSpy.mockClear();
		TokenServiceMock.RetrieveTokenSpy.mockClear();
		TokenServiceMock.TokenPasswordRequestSpy.mockClear();
		TokenServiceMock.TokenInvalidateSpy.mockClear();
		TokenServiceMock.Token = '';
		TokenServiceMock.UserId = '';
		TokenServiceMock.Type = '';
	});

	describe('Create User', () => {
		it('User with this email already exists', async () => {
			const payload = {
				body: {
					username: 'Giorgos Kampitakis',
					email: 'gkabitakis@gmail.com',
					password: '12345'
				}
			};

			await userService.createUser(payload);
			payload.body.username = 'anotherName';

			return userService.createUser(payload).catch(e => {
				expect(e).toBeDefined();
			});
		});

		it('User with this username already exists', async () => {
			const payload = {
				body: {
					username: 'Giorgos Kampitakis',
					email: 'gkabitakis@gmail.com',
					password: '12345'
				}
			};

			await userService.createUser(payload);
			payload.body.email = 'test@mail.com';

			return userService.createUser(payload).catch(e => {
				expect(e).toBeDefined();
			});
		});

		it('Wrong email', async () => {
			const payload = {
				body: {
					username: 'testUser',
					email: 'gkabitakis',
					password: '12345'
				}
			};

			return userService.createUser(payload).catch(e => {
				expect(e).toBeDefined();
			});
		});

		it('Missing required fields', async () => {
			const payload = {
				body: {
					username: 'Giorgos Kampitakis',
					password: '12345'
				}
			};

			return userService.createUser(payload).catch(e => {
				expect(e).toBeDefined();
			});
		});

		it('Should create the user', async () => {
			const payload = {
					body: {
						username: 'Giorgos Kampitakis',
						email: 'gkabitakis@gmail.com',
						password: '12345'
					}
				},
				user: UserI = await userService.createUser(payload);

			expect(user.username).toEqual(payload.body.username);
			expect(user.email).toEqual(payload.body.email);
		});
	});

	describe('Retrieve User', () => {
		it('Should return user not found', () => {
			return userService.retrieveUser({ id: '12312321' }).catch(e => {
				expect(e).toEqual({
					status: 404,
					error: Error('User not found')
				});
			});
		});
		it('Should return user without password or hash', async () => {
			const payload = {
					body: {
						username: 'Giorgos Kampitakis',
						email: 'gkabitakis@gmail.com',
						password: '12345'
					}
				},
				user: UserI = await userService.createUser(payload),
				retrievedUser = await userService.retrieveUser({ id: user._id });

			expect(retrievedUser).toEqual(user);
			expect(retrievedUser).not.toHaveProperty('password');
			expect(retrievedUser).not.toHaveProperty('hash');
		});
	});

	describe('Remove User', () => {
		it('Should be registered', () => {
			return userService.removeUser({ user: '' }).catch(e => {
				expect(e).toEqual({
					status: 401,
					error: Error('Need to be registered')
				});
			});
		});

		it('Should return user not found', () => {
			return userService.removeUser({ user: '5e0a02aed716316c24be80b5' }).catch(e => {
				expect(e).toEqual({
					status: 404,
					error: Error('User not found')
				});
			});
		});

		it('Should remove user', async () => {
			const payload = {
					body: {
						username: 'Giorgos Kampitakis',
						email: 'gkabitakis@gmail.com',
						password: '12345'
					}
				},
				user: UserI = await userService.createUser(payload),
				result = await userService.removeUser({ user: user._id.toString() });

			expect(result).toBeUndefined;
			expect(TokenServiceMock.TokenInvalidateSpy).toBeCalledTimes(1);
		});
	});

	describe('Update User', () => {
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
					body: {
						username: 'Giorgos Kampitakis',
						email: 'gkabitakis@gmail.com',
						password: '12345'
					}
				},
				user: UserI = await userService.createUser(payload);

			payload.body = {
				password: '9876',
				username: 'NewName',
				email: 'papaki@gmail.com'
			};

			const updatedUser: UserI = await userService.updateUser({ ...payload, user: user._id });

			expect(updatedUser.username).toEqual(payload.body.username);
			expect(updatedUser.email).toEqual(payload.body.email);
			expect(updatedUser.password).not.toEqual(user.password);
		});
	});

	// describe('Add Document', () => {
	// 	it('should not add document twice', async () => {
	// 		const payload = {
	// 				body: {
	// 					username: 'Giorgos Kampitakis',
	// 					email: 'gkabitakis@gmail.com',
	// 					password: '12345'
	// 				}
	// 			},
	// 			user: UserI = await userService.createUser(payload);

	// 		await userService.addDocument('5e0a02aed716316c24be80b5', user._id.toString());
	// 		await userService.addDocument('5e0a02aed716316c24be80b5', user._id.toString());
	// 		const result: UserI = await userService.retrieveUser({
	// 			id: user._id.toString()
	// 		});

	// 		expect(result.documents.length).toEqual(1);
	// 	});

	// 	it('Should add document to user', async () => {
	// 		const payload = {
	// 				body: {
	// 					username: 'secondUser',
	// 					email: 'secondUser@gmail.com',
	// 					password: '12345'
	// 				}
	// 			},
	// 			user: UserI = await userService.createUser(payload);

	// 		await userService.addDocument('5e0a02aed716316c24be80b5', user._id.toString());
	// 		const result: UserI = await userService.retrieveUser({
	// 			id: user._id.toString()
	// 		});

	// 		console.log(result);

	// 		expect(result.documents.length).toEqual(1);
	// 	});
	// });

	describe('when search if a user exists', () => {
		it('should return user exists if user exists', async () => {
			const payload = {
				body: {
					username: 'test',
					email: 'test@gmail.com',
					password: '12345'
				}
			};

			await userService.createUser(payload);

			return expect(
				userService.userExists({
					id: 'test',
					field: 'username'
				})
			).resolves.toEqual({
				message: 'User Exists',
				status: 200
			});
		});

		it("should return user does not exist if user doesn't exists", () => {
			const payload = {
				id: 'notExistentUser',
				field: 'username'
			};

			return expect(userService.userExists(payload)).resolves.toEqual({
				message: 'User Does Not Exist',
				status: 400
			});
		});

		it("should return user doesn't exist if query with wrong field", () => {
			const payload = {
				id: 'test',
				field: 'notExistentField'
			};

			return expect(userService.userExists(payload)).resolves.toEqual({
				message: 'User Does Not Exist',
				status: 400
			});
		});
	});

	describe('when verifying email should retrieve token', () => {
		it('if existent update user', async () => {
			const payload = {
					body: {
						username: 'Giorgos Kampitakis',
						email: 'gkabitakis@gmail.com',
						password: '12345'
					}
				},
				user: UserI = await userService.createUser(payload);

			TokenServiceMock.Token = '123456789';
			TokenServiceMock.UserId = user._id.toString();

			await userService.verifyEmail({ token: '123456789' });

			const result: UserI = await userService.retrieveMe({
				user: user._id.toString()
			});

			expect(result.verified).toBe(true);
			expect(TokenServiceMock.RetrieveTokenSpy).toHaveBeenNthCalledWith(1, {
				token: '123456789',
				type: 'verification'
			});
		});

		it('if not existent not update user and throw error', async () => {
			const payload = {
					body: {
						username: 'Giorgos Kampitakis',
						email: 'gkabitakis@gmail.com',
						password: '12345'
					}
				},
				user: UserI = await userService.createUser(payload);

			TokenServiceMock.Token = '123456789';
			TokenServiceMock.UserId = user._id.toString();

			try {
				await userService.verifyEmail({ token: '123456789' });
			} catch ({ error, status }) {
				expect(status).toEqual(404);
				expect(error.message).toEqual('Token not found');
				expect(TokenServiceMock.RetrieveTokenSpy).toHaveBeenNthCalledWith(1, {
					token: '123456789',
					type: 'verification'
				});
			}
		});
	});

	describe('When requesting for password request', () => {
		it('if user not found throw error', async () => {
			try {
				await userService.passwordResetRequest({ email: 'notfound@gmail.com' });
			} catch ({ error, status }) {
				expect(status).toBe(404);
				expect(error.message).toBe('User not found');
			}
		});

		it('should create a token and send an email', async done => {
			const payload = {
					body: {
						username: 'test',
						email: 'test@gmail.com',
						password: '12345'
					}
				},
				user = await userService.createUser(payload);

			setTimeout(async () => {
				TokenServiceMock.TokenPasswordRequestSpy.mockClear();
				EmailProviderMock.EmailSendSpy.mockClear();

				TokenServiceMock.Token = '123456789';

				await userService.passwordResetRequest({ email: 'test@gmail.com' });

				expect(TokenServiceMock.TokenPasswordRequestSpy).toHaveBeenNthCalledWith(
					1,
					user._id.toString(),
					'passwordReset'
				);
				expect(EmailProviderMock.EmailSendSpy).toHaveBeenNthCalledWith(
					1,
					'test@gmail.com',
					'Password Reset',
					{ link: 'http://localhost:3000/password/new?t=123456789' },
					'changePassword'
				);
				done();
			}, 100);
		});
	});
});

// describe('Remove Document', () => {
// 	let doc: JsonDoc, user2: UserI;

// 	beforeAll(async () => {
// 		const payload = {
// 			body: {
// 				username: 'Giorgos Kampitakis',
// 				email: 'gkabitakis@gmail.com',
// 				password: '12345'
// 			}
// 		};

// 		user = await userService.createUser(payload);

// 		const payload2 = {
// 			body: {
// 				username: 'test',
// 				email: 'test@gmail.com',
// 				password: '12345'
// 			}
// 		};

// 		user2 = await userService.createUser(payload2);

// 		const payloadDoc = {
// 			user: user._id.toString(),
// 			body: {
// 				privacy: 1,
// 				_schema: {
// 					test: 'hello World'
// 				}
// 			}
// 		};

// 		doc = await jsonService.createJson(payloadDoc);
// 		await userService.addDocument(doc._id.toString(), user2._id.toString());
// 	});

// 	afterAll(async () => {
// 		await UserModel.deleteMany({});
// 	});

// 	it('Should remove document from user', async () => {
// 		await userService.removeDocument(doc._id.toString(), user2._id.toString());
// 		const result: UserI = await userService.retrieveUser({
// 			id: user2._id.toString()
// 		});

// 		expect(result.documents.length).toEqual(0);
// 	});

// 	it('What happens here', async () => {
// 		await userService.removeDocument(doc._id.toString(), user2._id.toString());
// 		await userService.removeDocument(doc._id.toString(), user._id.toString());
// 		const result: UserI = await userService.retrieveUser({
// 			id: user2._id.toString()
// 		});
// 		const result1: UserI = await userService.retrieveUser({
// 			id: user._id.toString()
// 		});

// 		expect(result.documents.length).toEqual(0);
// 		expect(result1.documents.length).toEqual(0);
// 	});
// });

// describe('When resetting password', () => {
// 	beforeAll(async () => {
// 		const payload = {
// 			body: {
// 				username: 'test',
// 				email: 'test@gmail.com',
// 				password: '12345'
// 			}
// 		};

// 		TokenFakeService.token = '123456789';

// 		user = await userService.createUser(payload);
// 	});

// 	afterAll(async () => {
// 		await UserModel.deleteMany({});
// 	});

// 	afterEach(() => {
// 		emailSendSpy.mockClear();
// 		tokenPasswordRequest.mockClear();
// 	});

// 	it('if the token not existent throw error', async () => {
// 		try {
// 			TokenFakeService.token = undefined;

// 			await userService.passwordReset({ token: '99999', password: '00000' });
// 		} catch ({ error, status }) {
// 			expect(error.message).toBe('Token not found');
// 			expect(status).toBe(404);
// 		}
// 	});

// 	it('should change password and remove the token', async () => {
// 		TokenFakeService.token = '123456789';
// 		TokenFakeService.userId = user._id.toString();

// 		const result = userService.passwordReset({
// 			token: '123456789',
// 			password: '00000'
// 		});

// 		expect(result).resolves;
// 	});
// });

// describe('when request for new verification  email', () => {
// 	beforeAll(async () => {
// 		const payload = {
// 			body: {
// 				username: 'test',
// 				email: 'test@gmail.com',
// 				password: '12345'
// 			}
// 		};

// 		TokenFakeService.token = '123456789';

// 		user = await userService.createUser(payload);
// 	});

// 	afterAll(async () => {
// 		await UserModel.deleteMany({});
// 	});

// 	it('should call the createThrottledToken and call email send', () => {
// 		expect(userService.sendVerificationEmail({ email: 'test@gmail.com' }))
// 			.resolves;
// 		expect(emailSendSpy).toHaveBeenNthCalledWith(
// 			1,
// 			'test@gmail.com',
// 			'Please Verify your email',
// 			{
// 				'link': 'http://localhost:3000/verify?t=123456789'
// 			},
// 			'verifyEmail'
// 		);
// 	});

// 	it("should throw error if user doesn't exist with this email", async () => {
// 		try {
// 			await userService.sendVerificationEmail({
// 				email: 'notExistent@gmail.com'
// 			});
// 		} catch ({ error, status }) {
// 			expect(status).toEqual(404);
// 			expect(error.message).toEqual('User not found');
// 		}
// 	});
// });
