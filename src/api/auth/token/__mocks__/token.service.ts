export class TokenService {
	public static RetrieveTokenSpy = jest.fn();
	public static TokenPasswordRequestSpy = jest.fn();
	public static TokenInvalidateSpy = jest.fn();
	public static RemoveTokenSpy = jest.fn();
	public static Token = '';
	public static UserId = '';
	public static Type = '';

	// public async create(userId: string, type: string) {
	// 	return { token: TokenService.token, userId: userId };
	// }

	// public updateToken(id: string, payload: any): Promise<any> {
	// 	return Promise.resolve(
	// 		this.tokenFactory({
	// 			token: TokenService.token,
	// 			type: TokenService.type,
	// 			userId: TokenService.userId
	// 		})
	// 	);
	// }

	// public async remove(userId: string) {
	// 	return;
	// }

	public removeToken(filter: any): Promise<any> {
		TokenService.RemoveTokenSpy(filter);
		return Promise.resolve();
	}

	public async createThrottledToken(userId: string, type: string): Promise<any> {
		TokenService.TokenPasswordRequestSpy(userId, type);
		return {
			token: TokenService.Token,
			type: type,
			userId: userId
		};
	}

	// public retrieveUser(token: string): Promise<string> {
	// 	return Promise.resolve('5e0a02aed716316c24be80b5');
	// }

	public async invalidateTokens(userId: string): Promise<any> {
		TokenService.TokenInvalidateSpy(userId);
		return Promise.resolve();
	}

	public async retrieveToken(payload: any) {
		TokenService.RetrieveTokenSpy(payload);

		if (!TokenService.Token) return null;

		return {
			token: TokenService.Token,
			type: payload.type,
			userId: TokenService.UserId
		};
	}

	// private tokenFactory(payload: any): TokenI {
	// 	return new TokenModel(payload) as TokenI;
	// }
}
