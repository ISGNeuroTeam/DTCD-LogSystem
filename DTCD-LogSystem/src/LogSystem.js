import { SystemPlugin } from '../../DTCD-SDK/index';

export class LogSystem extends SystemPlugin {
  static getRegistrationMeta() {
    return {
      type: 'core',
      title: 'Система логирования',
      name: 'LogSystem',
    };
  }

  constructor() {
    super();
    this.logs = [];
  }

  log(guid, pluginName, message) {
    if (
      typeof guid === 'string' &&
      typeof pluginName === 'string' &&
      typeof message === 'string' &&
      guid.length > 0 &&
      pluginName.length > 0 &&
      message.length > 0
    ) {
      let time = Date.now();
      this.logs.push({
        timestamps: time,
        plugin: pluginName,
        message: message,
        guid,
      });
      return true;
    } else return false;
  }
  uploadLogs() {
    console.log('coming soon...');
  }
}
