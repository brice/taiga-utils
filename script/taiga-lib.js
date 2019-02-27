const parse = require('minimist');
const rp = require('request-promise');

require('dotenv').config();

class TaigaLib {

	/**
	 * Creates a new instance of the object Taiga Lib converter.
	 *
	 * @param {object[]} options
	 */
	constructor(options){
		if (!Array.isArray(options)) {
			throw new Error('The input to taiga-lib must be an array.');
		}

		this.options = options;
	}

	// Send Auth connection
	async requestAuth(){
		if (!this.options.Url) {
			throw new Error('Empty URL when trying to connect to the app.');
		}

		if (!this.options.user || !this.options.password) {
			throw new Error('Empty auth parameters, that\'s sadly important in order to connect to the app.');
		}

		let urlAuth = this.options.Url+'auth';
		let options = {
			method: 'POST',
			uri: urlAuth,
			json: true,
			form: {
				type: 'normal',
				username: this.options.user,
				password: this.options.password
			}
		};
		return rp(options);
	}
}
