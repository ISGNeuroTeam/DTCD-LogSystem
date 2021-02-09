import {BaseAdapter} from './BaseAdapter';

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
	 * Adds new log record to the system
	 * @param {String} message - log message to record
	 */
	log(message) {
		this.instance.log(this.guid, this.pluginName, message);
	}
}
