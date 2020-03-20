import { UserI, UserModel } from './user.model';
import { TokenService } from '../auth/token/token.service';
import { ServiceModule } from '../interfaces/ServiceModule';
import { EmailProvider } from '@gkampitakis/email-provider';
import { TokenI } from '../auth/token/token.model';
import { Configurator } from '../../util/decorators/configurator';
import { JsonDoc, JsonDocModel } from '../jsonDocument/jsonDoc.model';

export class UserService extends ServiceModule {
	@Configurator('communication')
	private config;
	private tokenService = new TokenService();
	private emailProvider = new EmailProvider();

	public createUser(payload: { body: any }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			try {
				delete payload.body.verified;

				const user: UserI = new UserModel(payload.body) as UserI;

				const doc = await user.save();

				resolve(this.stripPassword(doc.toObject()));

				await this.sendVerificationEmail({ email: user.email, userId: user._id.toString() });
			} catch (error) {
				reject({ error: error });
			}
		});
	}

	public verifyEmail(payload: { token: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			let token: TokenI;

			try {
				token = await this.tokenService.retrieveToken({ token: payload.token, type: 'verification' });

				if (!token) return reject(this.errorObject('Token not found', 404));

				const user: any = await this._updateUser({ _id: token.userId }, { verified: true });

				if (!user) return reject(this.errorObject('User not found', 404));

				resolve();
			} catch (error) {
				reject(this.errorObject(error.message, 500));
			} finally {
				if (token) this.tokenService.removeToken({ _id: token._id });
			}
		});
	}

	public passwordResetRequest(payload: { email: string }) {
		return new Promise(async (resolve, reject) => {
			try {
				const { email } = payload;

				const user: UserI = await UserModel.findOne({ email: email })
					.lean()
					.exec();

				if (!user) return reject(this.errorObject('User not found', 404));

				const result: TokenI = await this.tokenService.createThrottledToken(
					user._id.toString(),
					'passwordReset'
				);

				await this.emailProvider.send(
					email,
					'Password Reset',
					{
						link: `${this.config.communication.changePassUrl}${result.token}`
					},
					'changePassword'
				);

				resolve();
			} catch (error) {
				reject(this.errorObject(error.message, 500));
			}
		});
	}

	public passwordReset(payload: { token: string; password: string }) {
		return new Promise(async (resolve, reject) => {
			let result: TokenI;

			try {
				const { token, password: newPassword } = payload;
				result = await this.tokenService.retrieveToken({ token: token, type: 'passwordReset' });

				if (!result) return reject(this.errorObject('Token not found', 404));

				await this._updateUser({ _id: result.userId }, { password: newPassword });

				resolve();
			} catch (error) {
				reject(this.errorObject(error.message, 500));
			} finally {
				if (result) this.tokenService.removeToken({ _id: result._id });
			}
		});
	}

	private async _updateUser(filter: any, payload: any): Promise<any> {
		let user = await UserModel.findById(filter).exec();

		user = this.mergeUserChanges(user, payload);

		return user.save();
	}

	private mergeUserChanges(oldUser: any, newUser: any) {
		oldUser.username = newUser?.username ?? oldUser.username;
		oldUser.email = newUser?.email ?? oldUser.email;
		oldUser.password = newUser?.password ?? oldUser.password;
		oldUser.verified = newUser?.verified ?? oldUser.verified;

		return oldUser;
	}

	public retrieveUser(payload: { id: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { id } = payload;

			if (!this.isValidId(id)) return reject(this.errorObject('User not found', 404));

			try {
				const user = await UserModel.findById(id)
					.populate('documents') //FIXME:
					.lean()
					.exec();

				if (!user) return reject(this.errorObject('User not found', 404));

				resolve(this.stripPassword(user));
			} catch (error) {
				reject({ error: error });
			}
		});
	}

	public removeUser(payload: { user: string }): Promise<any> {
		//TODO: write tests
		return new Promise(async (resolve, reject) => {
			const { user } = payload;

			if (!user) return reject(this.errorObject('Need to be registered', 401));

			try {
				const doc: UserI = (await UserModel.findById(user).exec()) as UserI;

				if (!doc)
					//NOTE: if we end up here something has gone really bad
					return reject(this.errorObject('User not found', 404));

				const documents = [...doc.documents];

				await doc.remove();

				this.tokenService.invalidateTokens(doc._id);

				this.handleDanglingJson({ documents, user });

				resolve();
			} catch (error) {
				reject({ error: error });
			}
		});
	}

	public updateUser(payload: { user: string; body: any }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { user, body } = payload;

			if (!user) return reject(this.errorObject('Need to be registered', 401));

			try {
				let doc: UserI = (await UserModel.findById(user).exec()) as UserI;

				if (!doc)
					//NOTE: if we end up here something has gone really bad
					return reject(this.errorObject('User not found', 404));
				//TODO: if update email again verify email for updating email
				//or maybe support array of emails or just ignore the update later
				doc = this.mergeUserChanges(doc, body);

				await doc.save();
				resolve(this.stripPassword(doc));
			} catch (error) {
				reject({ error: error });
			}
		});
	}

	public retrieveMe(payload: { user: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { user } = payload;

			if (!user) return reject(this.errorObject('Need to be registered', 401));

			try {
				const doc = await UserModel.findById(user)
					.populate('documents', '-_id -__v')
					.lean()
					.exec();

				if (!doc)
					//NOTE: if we end up here something has gone really bad
					return reject(this.errorObject('User not found', 404));

				resolve(this.stripPassword(doc));
			} catch (error) {
				reject({ error: error });
			}
		});
	}

	public userExists(payload: { id: string; field: string }): Promise<any> {
		const { id, field } = payload,
			query = {};

		query[field] = id;

		return UserModel.findOne(query)
			.lean()
			.exec()
			.then(data => {
				if (data) return { message: 'User Exists', status: 200 };

				return { message: 'User Does Not Exist', status: 400 };
			});
	}

	public addDocument(documentId: string, ...id: string[]): Promise<any> {
		const promises: Promise<any>[] = [];

		for (let i = 0; i < id.length; i++) {
			const promise = new Promise(async (resolve, reject) => {
				try {
					const user: UserI = (await UserModel.findById(id[i]).exec()) as UserI;

					if (!user) return reject(this.errorObject('User not found', 404));

					const idx = user.documents.findIndex((document: any) => document.toString() === documentId);

					if (idx !== -1) return resolve();

					user.documents.push(documentId);

					await user.save();

					resolve();
				} catch (error) {
					reject({ error: error });
				}
			});

			promises.push(promise);
		}

		return Promise.all(promises);
	}

	public removeDocument(documentId: string, ...id: string[]): Promise<any> {
		const promises: Promise<any>[] = [];

		for (let i = 0; i < id.length; i++) {
			const promise = new Promise(async (resolve, reject) => {
				try {
					const user: UserI = (await UserModel.findById(id).exec()) as UserI;

					if (!user) return reject(this.errorObject('User not found', 404));

					const idx = user.documents.findIndex((document: any) => document.toString() === documentId);

					if (idx === -1) return resolve();

					user.documents.splice(idx, 1);

					await user.save();

					resolve();
				} catch (error) {
					reject({ error: error });
				}
			});

			promises.push(promise);
		}

		return Promise.all(promises);
	}

	private stripPassword(user: UserI): Partial<UserI> {
		delete user.password;
		delete user.salt;

		return user;
	}

	public sendVerificationEmail(payload: { email: string; userId?: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { email } = payload;
			let { userId } = payload;

			try {
				if (!userId) {
					const user: UserI = await UserModel.findOne({ email: email })
						.lean()
						.exec();

					if (!user) return reject(this.errorObject('User not found', 404));

					if (user.verified) return reject(this.errorObject('User already verified', 400));

					userId = user._id.toString();
				}

				const token = await this.tokenService.createThrottledToken(userId, 'verification');

				await this.emailProvider.send(
					email,
					'Please Verify your email',
					{
						link: `${this.config.communication.verifyEmailUrl}${token.token}`
					},
					'verifyEmail'
				);

				resolve();
			} catch (error) {
				reject({ error: error });
			}
		});
	}

	private handleDanglingJson(payload: { documents: string[]; user: string }): Promise<any> {
		//TODO: write tests

		const promises = [],
			{ documents, user } = payload;

		documents.forEach(docId => {
			const promise = new Promise(async (resolve, reject) => {
				try {
					const doc: JsonDoc = (await JsonDocModel.findById(docId).exec()) as JsonDoc;

					const idx = doc.members.findIndex(member => member.userId.toString() === user);

					if (idx === -1) return reject(this.errorObject('User not found', 404));

					doc.members.splice(idx, 1);

					if (doc.members.length === 0) {
						await doc.remove();
						return resolve();
					}

					await doc.save();
					return resolve();
				} catch {
				} finally {
					resolve();
				}
			});

			promises.push(promise);
		});

		return Promise.all(promises);
	}
}
