export class EmailProvider {
	public static EmailSendSpy = jest.fn();

	public async send(receiver: string, subject: string, payload: any, template?: string) {
		EmailProvider.EmailSendSpy(...arguments);
		return Promise.resolve();
	}
}
