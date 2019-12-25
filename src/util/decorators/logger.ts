import { Logger as _Logger } from '@gkampitakis/tslog';

function Logger(className: string, timestamp = true) {

  const logger: _Logger = new _Logger(className, timestamp);

  return function (target: object, propertyKey: string) {

    target[propertyKey] = logger;

  };

}

export {
  _Logger,
  Logger
};