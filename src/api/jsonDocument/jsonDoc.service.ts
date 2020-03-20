import { JsonDoc, access, privacy, JsonDocModel } from './jsonDoc.model';
import { UserService } from '../user/user.service';
import _ from 'lodash';
import { ServiceModule } from '../interfaces/ServiceModule';

class JsonDocService extends ServiceModule {
	private userService = new UserService();

	private authorizedRetrieval(userId: string, jsonDoc: JsonDoc): boolean {
		if (jsonDoc.privacy === privacy.public) return true;

		//NOTE: Future work connect it with dock access (the dock access is like a revoke token)

		if (!userId) return false;

		const idx: number = jsonDoc.members.findIndex(member => userId === member.userId.toString());

		return idx !== -1;
	}

	private isAdmin(userId: string, jsonDoc: JsonDoc): boolean {
		if (!userId) return false;

		const idx: number = jsonDoc.members.findIndex(
			member => userId === member.userId.toString() && member.access === access.admin
		);

		return idx !== -1;
	}

	private authorizedUpdate(userId: string, jsonDoc: JsonDoc): boolean {
		if (!userId) return false;

		const idx: number = jsonDoc.members.findIndex(
			member => userId === member.userId.toString() && member.access >= access.write
		);

		return idx !== -1;
	}

	public createJson(payload: { user: string; body: any }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { user, body } = payload;

			if (!user) return reject(this.errorObject('Need to be registered', 401));

			const doc: any = new JsonDocModel(body);
			doc.members.push({ userId: user });

			try {
				const jsonDoc = await doc.save();
				await this.userService.addDocument(jsonDoc._id.toString(), user);

				resolve(jsonDoc);
			} catch (error) {
				if (error.status) return reject(error);
				reject({ error: error });
			}
		});
	}

	public retrieveJson(payload: { user: string; id: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { user, id } = payload;

			try {
				if (!this.isValidId(payload.id)) return reject(this.errorObject('Bad Parameters Provided', 400));

				const document = await JsonDocModel.findById(id)
					.lean()
					.exec();
				if (!document) return reject(this.errorObject('File not found', 404));

				if (!this.authorizedRetrieval(user, document))
					return reject(this.errorObject('Unauthorized Access', 401));

				resolve(document);
			} catch (error) {
				reject({ error: error });
			}
		});
	}

	public removeJson(payload: { user: string; id: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { user, id } = payload;

			try {
				if (!this.isValidId(payload.id)) return reject(this.errorObject('Bad Parameters Provided', 400));

				const document: any = await JsonDocModel.findById(id).exec();
				if (!document) return reject(this.errorObject('File not found', 404));

				if (!this.isAdmin(user, document)) return reject(this.errorObject('Unauthorized Access', 401));

				await document.remove();
				resolve();

				const userIds: string[] = [];
				document.members.forEach(member => {
					userIds.push(member.userId.toString());
				});

				this.userService.removeDocument(id, ...userIds);
			} catch (error) {
				if (error.status) return reject(error);
				reject({ error: error });
			}
		});
	}

	public updateJson(payload: { _schema: any; id: string; user: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { user, id, _schema } = payload;

			try {
				if (!this.isValidId(payload.id)) return reject(this.errorObject('Bad Parameters Provided', 400));

				if (_.isEmpty(_schema)) return reject(this.errorObject('Bad Parameters Provided', 400));

				const document: any = await JsonDocModel.findById(id).exec();

				if (!document) return reject(this.errorObject('File not found', 404));

				if (!this.authorizedUpdate(user, document.toObject() as JsonDoc))
					return reject(this.errorObject('Unauthorized Access', 401));

				document._schema = _schema;

				await document.save();
				resolve(document);
			} catch (error) {
				reject({ error: error });
			}
		});
	}

	public updateJsonPrivacy(payload: { id: string; user: string; privacy: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { user, id } = payload;

			try {
				if (!this.isValidId(payload.id, user)) return reject(this.errorObject('Bad Parameters Provided', 400));

				if (!(payload.privacy in privacy)) return reject(this.errorObject('Bad Parameters Provided', 400));

				const document: any = await JsonDocModel.findById(id).exec();

				if (!document) return reject(this.errorObject('File not found', 404));

				if (!this.isAdmin(user, document)) return reject(this.errorObject('Unauthorized Access', 401));

				document.privacy = privacy[payload.privacy];

				await document.save();
				resolve();
			} catch (error) {
				reject({ error: error });
			}
		});
	}

	public addMemberJson(payload: { userId: string; id: string; user: string; access: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { userId, id, user } = payload;

			try {
				if (!this.isValidId(id, userId)) return reject(this.errorObject('Bad Parameters Provided', 400));

				if (userId === user) return reject(this.errorObject('Unauthorized Access', 401));

				if (!(payload.access in access)) return reject(this.errorObject('Bad Parameters Provided', 400));

				const document: any = await JsonDocModel.findById(id).exec();

				if (!document) return reject(this.errorObject('File not found', 404));

				if (!this.isAdmin(user, document)) return reject(this.errorObject('Unauthorized Access', 401));

				const idx = document.members.findIndex(member => member.userId.toString() === userId);

				if (idx === -1) {
					document.members.push({ userId: userId, access: access[payload.access] });
					await this.userService.addDocument(id, userId);
				} else document.members[idx].access = access[payload.access];

				await document.save();
				resolve();
			} catch (error) {
				if (error.status) return reject(error);
				reject({ error: error });
			}
		});
	}

	public removeMemberJson(payload: { userId: string; id: string; user: string }): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { userId, id, user } = payload;

			try {
				if (!this.isValidId(id, userId)) return reject(this.errorObject('Bad Parameters Provided', 400));

				const document: any = await JsonDocModel.findById(id).exec();

				if (!document) return reject(this.errorObject('File not found', 404));

				if (!this.isAdmin(user, document)) return reject(this.errorObject('Unauthorized Access', 401));

				if (_.isEmpty(document.members)) return reject(this.errorObject("Can't remove last member'", 400));

				const idx = document.members.findIndex(member => member.userId.toString() === userId);

				if (idx === -1) return reject(this.errorObject('User not found', 404));

				document.members.splice(idx, 1);
				await document.save();
				await this.userService.removeDocument(id, userId);

				resolve();
			} catch (error) {
				if (error.status) return reject(error);
				reject({ error: error });
			}
		});
	}
}

export default JsonDocService;
