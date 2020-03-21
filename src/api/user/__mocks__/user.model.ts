export class UserModel {
	public static SaveSpy = jest.fn();
	public static FindByIdSpy = jest.fn();

	public static Username = '';
	public static Email = '';
	public static Password = '';
	public static Salt = '';
	public static Verified = false;
	public static documents = [];
	public static ID = '';

	public save() {
		UserModel.SaveSpy();
		console.log('test', UserModel.Username);

		return {
			toObject() {
				return {
					_id: UserModel.ID,
					username: UserModel.Username,
					email: UserModel.Email,
					password: UserModel.Password,
					salt: UserModel.Salt,
					verified: UserModel.Verified,
					documents: UserModel.documents
				};
			},
			_id: UserModel.ID,
			username: UserModel.Username,
			email: UserModel.Email,
			password: UserModel.Password,
			salt: UserModel.Salt,
			verified: UserModel.Verified,
			documents: UserModel.documents
		};
	}

	public static findById(id: any) {
		UserModel.FindByIdSpy(id);

		return {
			populate() {
				return {
					lean() {
						return {
							exec() {
								if (!UserModel.ID) return null;
								return {
									_id: UserModel.ID,
									username: UserModel.Username,
									email: UserModel.Email,
									password: UserModel.Password,
									salt: UserModel.Salt,
									verified: UserModel.Verified,
									documents: UserModel.documents
								};
							}
						};
					}
				};
			}
		};
	}
}
