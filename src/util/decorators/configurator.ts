import configuration from '../../config';

export function Configurator(...args: Array<string>) {
	return function(target: object, propertyKey: string) {
		if (!args.length) {
			target[propertyKey] = configuration;
			return;
		}

		target[propertyKey] = {};

		args.forEach((element: string) => {
			const fields = element.split('.'),
				lastField = fields[fields.length - 1];

			try {
				const chunk: object = fields.reduce((reduced, key) => {
					return reduced[key];
				}, configuration);

				target[propertyKey][lastField] = chunk;
			} catch {
				target[propertyKey][lastField] = null;
			}
		});
	};
}
