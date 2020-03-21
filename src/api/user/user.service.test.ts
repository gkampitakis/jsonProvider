import { UserService } from './user.service';

jest.mock('../auth/token/token.service');
jest.mock('@gkampitakis/email-provider');
jest.mock('../jsonDocument/jsonDoc.service');
jest.mock('./user.model');

describe('User Service', () => {
	const EmailProviderMock = jest.requireMock('@gkampitakis/email-provider').EmailProvider,
		TokenServiceMock = jest.requireMock('../auth/token/token.service').TokenService,
		JsonDocumentMock = jest.requireMock('../jsonDocument/jsonDoc.service').JsonDocService,
		UserModelMock = jest.requireMock('./user.model').UserModel,
		userService = new UserService();

	beforeEach(() => {
		EmailProviderMock.EmailSendSpy.mockClear();

		TokenServiceMock.RetrieveTokenSpy.mockClear();
		TokenServiceMock.TokenPasswordRequestSpy.mockClear();
		TokenServiceMock.TokenInvalidateSpy.mockClear();

		UserModelMock.SaveSpy.mockClear();

		TokenServiceMock.Token = '';
		TokenServiceMock.UserId = '';
		TokenServiceMock.Type = '';

		UserModelMock.Username = '';
		UserModelMock.Password = '';
		UserModelMock.Salt = '';
		UserModelMock.Verified = false;
		UserModelMock.documents = [];
		UserModelMock.ID = '';
	});

	describe('Create User', () => {
		it('Should create the user', async () => {
			UserModelMock.Username = 'Giorgos Kampitakis';
			UserModelMock.Email = 'gkabitakis@gmail.com';

			const payload = {
					body: {
						username: 'Giorgos Kampitakis',
						email: 'gkabitakis@gmail.com',
						password: '12345'
					}
				},
				user = await userService.createUser(payload);

			expect(user.username).toEqual(payload.body.username);
			expect(user.email).toEqual(payload.body.email);
			expect(UserModelMock.SaveSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('Retrieve User', () => {
		it('Should return user not found', () => {
			return userService.retrieveUser({ id: '5e0a02aed716316c24be80b5' }).catch(e => {
				expect(e).toEqual({
					status: 404,
					error: Error('User not found')
				});
			});
		});
		it('Should return user without password or hash', async () => {
			UserModelMock.ID = '5e0a02aed716316c24be80b5';
			const user = await userService.retrieveUser({ id: '5e0a02aed716316c24be80b5' });

			expect(user._id).toBe('5e0a02aed716316c24be80b5');
			expect(user).not.toHaveProperty('password');
			expect(user).not.toHaveProperty('hash');
		});
	});

	describe.only('Remove User', () => {
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
				user = await userService.createUser(payload),
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
				user = await userService.createUser(payload);

			payload.body = {
				password: '9876',
				username: 'NewName',
				email: 'papaki@gmail.com'
			};

			const updatedUser = await userService.updateUser({ ...payload, user: user._id });

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
	// 			user = await userService.createUser(payload);

	// 		await userService.addDocument('5e0a02aed716316c24be80b5', user._id.toString());
	// 		await userService.addDocument('5e0a02aed716316c24be80b5', user._id.toString());
	// 		const result = await userService.retrieveUser({
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
	// 			user = await userService.createUser(payload);

	// 		await userService.addDocument('5e0a02aed716316c24be80b5', user._id.toString());
	// 		const result = await userService.retrieveUser({
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
				user = await userService.createUser(payload);

			TokenServiceMock.Token = '123456789';
			// TokenServiceMocd = user._id.toString();

			await userService.verifyEmail({ token: '123456789' });

			const result = await userService.retrieveMe({
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
				user = await userService.createUser(payload);

			TokenServiceMock.Token = '123456789';
			// TokenServiceMocd = user._id.toString();

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

	describe('When resetting password', () => {
		it('if the token not existent throw error', async () => {
			try {
				TokenServiceMock.Token = undefined;

				await userService.passwordReset({ token: '99999', password: '00000' });
			} catch ({ error, status }) {
				expect(error.message).toBe('Token not found');
				expect(status).toBe(404);
			}
		});

		it('should change password and remove the token', async () => {
			const payload = {
					body: {
						username: 'test',
						email: 'test@gmail.com',
						password: '12345'
					}
				},
				user = await userService.createUser(payload);

			TokenServiceMock.Token = '123456789';
			// TokenServiceMocd = user._id.toString();

			const result = userService.passwordReset({
				token: '123456789',
				password: '00000'
			});

			expect(result).resolves;
		});
	});

	describe('when request for new verification  email', () => {
		it('should call the createThrottledToken and call email send', async () => {
			const payload = {
				body: {
					username: 'test',
					email: 'test@gmail.com',
					password: '12345'
				}
			};

			await userService.createUser(payload);

			setTimeout(async () => {
				EmailProviderMock.EmailSendSpy.mockClear();
				await userService.sendVerificationEmail({ email: 'test@gmail.com' });
				expect(EmailProviderMock.EmailSendSpy).toHaveBeenNthCalledWith(
					1,
					'test@gmail.com',
					'Please Verify your email',
					{
						link: 'http://localhost:3000/verify?t=123456789'
					},
					'verifyEmail'
				);
			}, 100);
		});

		it("should throw error if user doesn't exist with this email", async () => {
			try {
				await userService.sendVerificationEmail({
					email: 'notExistent@gmail.com'
				});
			} catch ({ error, status }) {
				expect(status).toEqual(404);
				expect(error.message).toEqual('User not found');
			}
		});
	});

	describe('Remove Document', () => {
		it('Should remove document from user', async () => {
			const payload = {
					body: {
						username: 'test',
						email: 'test@gmail.com',
						password: '12345'
					}
				},
				user = await userService.createUser(payload);

			await userService.removeDocument('5e0a02aed716316c24be80b5', user._id.toString());
			const result = await userService.retrieveUser({
				id: user._id.toString()
			});

			expect(result.documents.length).toEqual(0);
		});

		it('What happens here', async () => {
			const payload = {
					body: {
						username: 'test',
						email: 'test@gmail.com',
						password: '12345'
					}
				},
				payload1 = {
					body: {
						username: 'test1',
						email: 'test1@gmail.com',
						password: '12345'
					}
				},
				user = await userService.createUser(payload),
				user1 = await userService.createUser(payload1);

			await userService.removeDocument('5e0a02aed716316c24be80b5', user1._id.toString());
			await userService.removeDocument('5e0a02aed716316c24be80b5', user._id.toString());
			const result = await userService.retrieveUser({
				id: user1._id.toString()
			});
			const result1 = await userService.retrieveUser({
				id: user._id.toString()
			});

			expect(result.documents.length).toEqual(0);
			expect(result1.documents.length).toEqual(0);
		});
	});
});
