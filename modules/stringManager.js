const fs = require('fs');
const path = require('path');
const logger = require('./logger.js');
const config = require('../config/settings.json');

/* get localization id from localized string */
function getLocalizedIdfromString(string) {
    const localized = JSON.parse(fs.readFileSync(path.join('./locales/', config.locale + '.json')));
    const result = Object.keys(localized).find(key => localized[key] == string);
    if (result) return result;
    else return string;
}

/* get localized string from localization id */
function getLocalizedStringfromId(id, ...formatString) {
    let result = undefined;
    const localized = JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/', config.locale + '.json')));
    if (localized[id]) {
        result = localized[id];
    } else {
        return `${config.locale}.${id}`;
    }

    // format string by provided argument(s)
    if (formatString) {
        for (let i = 0; i < formatString.length; i++) {
            result = result.replace(`\{${i}\}`, formatString[i]);
        }
    }
    return result;
}

module.exports = {
    idFromString: getLocalizedIdfromString,
    stringFromId: getLocalizedStringfromId,
    locale: config.locale
}
