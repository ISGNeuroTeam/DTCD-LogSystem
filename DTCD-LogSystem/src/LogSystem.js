import { SystemPlugin } from '../../DTCD-SDK/index';
import sizeof from './utils/sizeof';
import { version } from './../package.json';

export class LogSystem extends SystemPlugin {
  #guid;
  #logLevels;
  #logs;
  #config;
  #globalLogLevel;
  #bufferSize;
  #intervalSeconds;
  #intervalID;
  #consoleOutputMode;
  #username = null;
  /**
   * @constructor
   * @param {String} guid guid of system instance
   */
  constructor(guid) {
    super();
    this.#guid = guid;
    this.#logLevels = {
      fatal: 1,
      error: 2,
      warn: 3,
      info: 4,
      debug: 5,
    };
    this.#logs = [];
    this.#config = {};
    this.#consoleOutputMode = false;
  }

  /**
   * Returns meta information about plugin for registration in application
   * @returns {Object} - meta-info
   */
  static getRegistrationMeta() {
    return {
      type: 'core',
      title: 'Система логирования',
      name: 'LogSystem',
      version,
      withDependencies: false,
      priority: 7,
    };
  }

  /**
   * Returns guid of LogSystem instance
   * @returns {String} - guid
   */
  get guid() {
    return this.#guid;
  }

  /**
   * Returns availiable log levels (keys) and their priority(values) of LogSystem instance
   * @returns {Object} - meta-info
   */
  get logLevels() {
    return this.#logLevels;
  }

  /**
   * Returns log buffer of LogSystem instance
   * @returns {Array} - meta-info
   */
  get logs() {
    return this.#logs;
  }

  /**
   * Returns current global log level of LogSystem instance
   * @returns {String} - meta-info
   */
  get globalLogLevel() {
    return this.#globalLogLevel;
  }

  /**
   * Returns scheduler interval in seconds of LogSystem instance
   * @returns {Number} - meta-info
   */
  get intervalSeconds() {
    return this.#intervalSeconds;
  }

  /**
   * Returns buffer size of LogSystem instance
   * @returns {Number} - buffer size in bytes
   */
  get bufferSize() {
    return this.#bufferSize;
  }

  get consoleOutputMode() {
    return this.#consoleOutputMode;
  }

  set consoleOutputMode(value) {
    if (typeof value != 'boolean') return;
    let config = this.#getConfig();
    config['consoleOutputMode'] = value;
    this.#consoleOutputMode = value;
    this.#saveConfig(config);
  }

  /**
   * Initializes system configuration after creation of instance.  Must be called after creation!
   */
  async init() {
    try {
      const response = await fetch('/dtcd_utils/v1/logs/object');
      this.#config = await response.json();
    } catch (err) {
      this.#config = {
        GlobalLogLevel: 'fatal',
        BufferSize: 11122,
        SendInterval: 144,
        consoleOutputMode: false,
      };
    } finally {
      let localStorageConfig = this.#getConfig();

      if (!localStorageConfig) {
        localStorageConfig = {};
        this.#saveConfig(localStorageConfig);
      }

      for (let prop in localStorageConfig) {
        this.#config[prop] = localStorageConfig[prop];
      }

      await this.setUsername();

      this.#globalLogLevel = this.#config?.GlobalLogLevel || 'fatal';

      this.#bufferSize = this.#config?.BufferSize || 11122;

      this.#intervalSeconds = this.#config?.SendInterval || 144;
      this.#consoleOutputMode = this.#config?.consoleOutputMode || false;

      this.#intervalID = this.#createTimeInterval(this.#intervalSeconds);
    }
  }

  /**
   * Sets the username for logs based on app authorization
   * @returns {String | null} - current username or null
   */
  async setUsername() {
    const response = await fetch('/dtcd_utils/v1/user?username');
    const userData = await response.json();
    this.#username = response.status === 200 ? userData.username : null;
    console.log('USER SET TO =>', this.#username);
    return this.#username;
  }

  /**
   * Creates scheduler for sendign logs to server
   * @param {Number} seconds - interval in seconds
   * @returns {Number} - id of created interval
   */
  #createTimeInterval(seconds) {
    return setInterval(() => {
      if (this.#logs.length > 0) {
        this.#uploadLogs();
        this.#logs = [];
      }
    }, seconds * 1000);
  }

  /**
   * Creates log record object and pushes it to system buffer for logs
   * @param {String} logLevel - interval in seconds
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  #log(logLevel, guid, pluginName, message) {
    if (
      typeof guid === 'string' &&
      typeof pluginName === 'string' &&
      typeof message === 'string' &&
      guid.length > 0 &&
      pluginName.length > 0 &&
      message.length > 0
    ) {
      const time = Date.now();
      const caller = this.#getFunctionCaller();
      const object = {
        guid,
        caller,
        logLevel,
        message: message,
        timestamps: time,
        plugin: pluginName,
        appID: Application.appID,
      };

      if (this.#username) {
        object.username = this.#username;
      }

      if (sizeof(object) > this.#bufferSize) {
        return false;
      } else if (sizeof(object) + sizeof(this.#logs) > this.#bufferSize) {
        try {
          this.#uploadLogs();
        } catch (err) {
          console.log(err);
        } finally {
          this.#logs = [];
          if (this.#intervalSeconds) {
            clearInterval(this.#intervalID);
            this.#intervalID = this.#createTimeInterval(this.#intervalSeconds);
          }
          this.#logs.push(object);
        }
      } else {
        this.#logs.push(object);
      }

      if (this.#consoleOutputMode) {
        // prettier-ignore
        console.log(`%ctimestamp:%c ${object.timestamps},
%cguid:%c ${object.guid},
%cplugin:%c ${object.plugin},
%clogLevel:%c ${object.logLevel},
%ccaller:%c ${object.caller},
%cmessage:%c ${object.message}`,
        'font-weight:bold','',
        'font-weight:bold','',
        'font-weight:bold','',
        'font-weight:bold','',
        'font-weight:bold','',
        'font-weight:bold',''
        );
      }

      return true;
    } else return false;
  }

  /**
   * Uploads log buffer to server
   * @returns {Promise} Logs upload request promise
   */
  #uploadLogs() {
    try {
      return fetch('/dtcd_utils/v1/logs/object', {
        method: 'POST',
        body: JSON.stringify(this.#logs),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Upload logs error:', error);
      throw error;
    }
  }

  /**
   * Return current configuration of LogSystem stored in localStorage
   * @returns {Object} - configuration
   */
  #getConfig() {
    const config = localStorage.getItem('logSystemConfig');
    if (config) {
      return JSON.parse(config);
    } else {
      return false;
    }
  }

  /**
   * Saves given configuration of LogSystem in localStorage (overwrites if already exists)
   * @returns {Object} - configuration
   */
  #saveConfig(config) {
    localStorage.setItem('logSystemConfig', JSON.stringify(config));
  }

  /**
   * Checks given logLevel to be correct
   * @param {(String | Number)} - log level to check
   * @returns {String} - log level if exist in system
   */
  #checkLogLevel(logLevel) {
    if (
      typeof logLevel == 'string' &&
      Object.keys(this.#logLevels).indexOf(logLevel.toLocaleLowerCase()) > -1
    ) {
      return logLevel.toLocaleLowerCase();
    } else if (
      typeof logLevel == 'number' &&
      Object.values(this.#logLevels).indexOf(logLevel) > -1
    ) {
      return Object.keys(this.#logLevels).find(key => this.#logLevels[key] == logLevel);
    } else return false;
  }

  /**
   * Returns log functrion caller name
   * @returns {String} - log functrion caller name
   */
  #getFunctionCaller() {
    const oldStackTrace = Error.prepareStackTrace;
    try {
      // eslint-disable-next-line handle-callback-err
      Error.prepareStackTrace = (err, structuredStackTrace) => structuredStackTrace;
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this);
        if (this.stack[4]) {
          return this.stack[4].getFunctionName();
        } else {
          return '';
        }
      } else {
        this.stack = new Error().stack.split('\n');
        if (this.stack[4]) return this.stack[4].split('@')[0];
        else return '';
      }
    } finally {
      Error.prepareStackTrace = oldStackTrace;
    }
  }

  /**
   * Adds new fatal level log record to the system
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  fatal(guid, pluginName, message) {
    const level = this.getPluginLogLevel(guid, pluginName);
    if (this.#logLevels[level] >= this.#logLevels['fatal']) {
      return this.#log('fatal', guid, pluginName, message);
    }
  }

  /**
   * Adds new error level log record to the system
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  error(guid, pluginName, message) {
    const level = this.getPluginLogLevel(guid, pluginName);
    if (this.#logLevels[level] >= this.#logLevels['error']) {
      return this.#log('error', guid, pluginName, message);
    }
  }

  /**
   * Adds new warn level log record to the system
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  warn(guid, pluginName, message) {
    const level = this.getPluginLogLevel(guid, pluginName);
    if (this.#logLevels[level] >= this.#logLevels['warn']) {
      return this.#log('warn', guid, pluginName, message);
    }
  }

  /**
   * Adds new info level log record to the system
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  info(guid, pluginName, message) {
    const level = this.getPluginLogLevel(guid, pluginName);
    if (this.#logLevels[level] >= this.#logLevels['info']) {
      return this.#log('info', guid, pluginName, message);
    }
  }

  /**
   * Adds new debug level log record to the system
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  debug(guid, pluginName, message) {
    const level = this.getPluginLogLevel(guid, pluginName);
    if (this.#logLevels[level] >= this.#logLevels['debug']) {
      return this.#log('debug', guid, pluginName, message);
    }
  }

  /**
   * Invokes callback if current log level is above or equel to the given, otherwise nothing happens
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @param {(String|Number)} logLevel - level on what callback should be invoked
   * @param {callback} callback - callback which should be invoked if level is suitable, should return String message!
   * @returns {Boolean} - indicatior of success
   */
  invokeOnLevel(guid, pluginName, logLevel, callback) {
    if (typeof callback != 'function') return false;
    const givenLevel = this.#checkLogLevel(logLevel);
    const pluginLevel = this.#config[`${guid}${pluginName}`] || this.#globalLogLevel;
    if (givenLevel && this.#logLevels[pluginLevel] >= this.#logLevels[givenLevel]) {
      const result = callback();
      if (result instanceof Promise) {
        result.then(message => {
          return this[givenLevel](guid, pluginName, message);
        });
      } else return this[givenLevel](guid, pluginName, result);
    } else return false;
  }

  /**
   * Returns current global log level
   * @returns {String} - current global log level
   */
  getGlobalLogLevel() {
    return this.#globalLogLevel;
  }

  /**
   * Sets new global log level
   * @param {(String|Number)} logLevel - new log level
   * @returns {Boolean} - indicatior of success
   */
  setGlobalLogLevel(logLevel) {
    const level = this.#checkLogLevel(logLevel);
    let config = this.#getConfig();
    if (level && config) {
      const tempLevel = this.#globalLogLevel;
      this.#globalLogLevel = level;
      config[`GlobalLogLevel`] = level;
      this.#saveConfig(config);
      this.info(
        this.guid,
        'LogSystem',
        `Global log level changed from "${tempLevel}" to "${level}"`
      );
      return true;
    } else return false;
  }

  /**
   * Returns current log level of plugin
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @returns {String} - current log level of plugin
   */
  getPluginLogLevel(guid, pluginName) {
    return this.#config[`${guid}${pluginName}`] || this.#globalLogLevel;
  }

  /**
   * Sets new plugin log level
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @param {(String|Number)} logLevel - new log level
   * @returns {Boolean} - indicatior of success
   */
  setPluginLogLevel(guid, pluginName, logLevel) {
    let level = this.#checkLogLevel(logLevel);
    let config = this.#getConfig();
    if (config && level) {
      config[`${guid}${pluginName}`] = level;
      this.#config[`${guid}${pluginName}`] = level;
      this.#saveConfig(config);
      this.info(
        this.guid,
        'LogSystem',
        `Log level of plugin "${pluginName}" with guid "${guid}" changed to "${logLevel}"`
      );
      return true;
    } else {
      return false;
    }
  }

  /**
   * Removes current log level of plugin
   * @param {String} guid - guid of plugin instance
   * @param {String} pluginName - name of plugin instance
   * @returns {Boolean} - indicatior of success
   */
  removePluginLogLevel(guid, pluginName) {
    let config = this.#getConfig();
    if (config) {
      delete config[`${guid}${pluginName}`];
      delete this.#config[`${guid}${pluginName}`];
      this.#saveConfig(config);
      this.info(
        this.guid,
        'LogSystem',
        `Log level of plugin "${pluginName}" with guid "${guid}" was reseted`
      );
      return true;
    } else {
      return false;
    }
  }

  /**
   * Sets new interval for sending logs, work only after page reload
   * @param {Number} seconds - interval in seconds
   * @returns {Boolean} - indicatior of success
   */
  setSendInerval(seconds) {
    if (typeof seconds != 'number') return false;
    let config = this.#getConfig();
    if (config) {
      config['SendInterval'] = seconds;
      this.#saveConfig(config);
      this.info(this.guid, 'LogSystem', `Logs send interval was changed to ${seconds} seconds`);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Sets new buffer size logs, work only after page reload
   * @param {Number} bytes - buffer size in bytes
   * @returns {Boolean} - indicatior of success
   */
  setBufferSize(bytes) {
    if (typeof bytes != 'number') return false;
    let config = this.#getConfig();
    if (config) {
      config['BufferSize'] = bytes;
      this.#saveConfig(config);
      this.info(this.guid, 'LogSystem', `Buffer size was changed to ${bytes} bytes`);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Resets current configuration of LogSystem
   */
  resetConfiguration() {
    localStorage.removeItem('logSystemConfig');
    this.info(this.guid, 'LogSystem', `Log system configuration was reseted!`);
  }
}
