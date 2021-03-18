import { BaseAdapter } from './BaseAdapter';

export class LogSystemAdapter extends BaseAdapter {
  /**
   * @constructor
   * @param {String} guid guid of plugin instance
   * @param {String} pluginName name of plugin
   */
  constructor(guid, pluginName) {
    super();
    this.instance = this.getSystem('LogSystem');
    this.guid = guid;
    this.pluginName = pluginName;
  }

  /**
   * Adds new fatal level log record to the system
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  fatal(message) {
    return this.instance.fatal(this.guid, this.pluginName, message);
  }

  /**
   * Adds new error level log record to the system
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  error(message) {
    return this.instance.error(this.guid, this.pluginName, message);
  }

  /**
   * Adds new warn level log record to the system
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  warn(message) {
    return this.instance.warn(this.guid, this.pluginName, message);
  }

  /**
   * Adds new info level log record to the system
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  info(message) {
    return this.instance.info(this.guid, this.pluginName, message);
  }

  /**
   * Adds new debug level log record to the system
   * @param {String} message - log message to record
   * @returns {Boolean} - indicatior of success
   */
  debug(message) {
    return this.instance.debug(this.guid, this.pluginName, message);
  }

  /**
   * Invokes callback if current log level is above or equel to the given, otherwise nothing happens
   * @param {(String|Number)} logLevel - level on what callback should be invoked
   * @param {callback} callback - callback which should be invoked if level is suitable, should return String message!
   * @returns {Boolean} - indicatior of success
   */
  invokeOnLevel(logLevel, callback) {
    return this.instance.invokeOnLevel(this.guid, this.pluginName, logLevel, callback);
  }

  /**
   * Returns current global log level
   * @returns {String} - current global log level
   */
  getGlobalLogLevel() {
    return this.instance.getGlobalLogLevel();
  }

  /**
   * Sets new global log level
   * @param {(String|Number)} logLevel - new log level
   * @returns {Boolean} - indicatior of success
   */
  setGlobalLogLevel(logLevel) {
    this.instance.setGlobalLogLevel(logLevel);
  }

  /**
   * Returns current log level for plugin
   * @returns {String} - current log level of plugin
   */
  getPluginLogLevel() {
    return this.instance.getPluginLogLevel(this.guid, this.pluginName);
  }

  /**
   * Sets new plugin log level
   * @param {(String|Number)} logLevel - new log level
   * @returns {Boolean} - indicatior of success
   */
  setPluginLogLevel(logLevel) {
    return this.instance.setPluginLogLevel(this.guid, this.pluginName, logLevel);
  }

  /**
   * Removes current log level of plugin
   * @returns {Boolean} - indicatior of success
   */
  removePluginLogLevel() {
    return this.instance.removePluginLogLevel(this.guid, this.pluginName);
  }

  /**
   * Sets new interval for sending logs, work only after page reload
   * @param {Number} seconds - interval in seconds
   * @returns {Boolean} - indicatior of success
   */
  setSendInerval(seconds) {
    return this.instance.setSendInerval(seconds);
  }

  /**
   * Sets new buffer size logs, work only after page reload
   * @param {Number} bytes - buffer size in bytes
   * @returns {Boolean} - indicatior of success
   */
  setBufferSize(bytes) {
    return this.instance.setBufferSize(bytes);
  }

  /**
   * Resets current configuration of LogSystem
   */
  resetConfiguration() {
    this.instance.resetConfiguration();
  }
}
