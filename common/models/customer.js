'use strict';

module.exports = (Customer) => {
	Customer.hideEmail = (email) => {
		let name = email.substring(0, email.lastIndexOf("@"));
		name = name.substring(0, 2);
		let domain = email.substring(email.lastIndexOf("@") +1);
		return `${name}...@${domain}`;
	}
};
