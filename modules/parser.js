const axios = require('axios');
const logger = require('./logger.js');

const header = {
	'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
	'Referer': 'http://m.safekorea.go.kr/idsiSFK/neo/main_m/dis/disasterDataList.html'
}
const apiUrl = 'http://m.safekorea.go.kr/idsiSFK/neo/ext/json/disasterDataList/disasterDataList.json';

class NetworkException {
    constructor(status, reason) {
        this.status = status;
        this.reason = reason;
    }
}

// AlertMessage object prototype
function AlertMessage(SJ, CONT) {
    this.SJ = SJ; // (unknown): date, time location information of the message
    this.CONT = CONT; // Content: content of the message (unformatted)
}

// Create html string replace table
function createReplaceTable() {
    const table = new Map();
    table.set('&middot;', String.fromCharCode(183));
    table.set('&lt;', '<');
    table.set('&gt;', '>');
    return table;
}

// Read parsed message from data
function readData(data, dataType) {
    let value = undefined;
    switch(dataType) {
        case 'datetime':
            value = data.match(/^\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}/)[0];
            break;
        case 'isodatetime':
            value = data.match(/^\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}/)[0];
            value = value.split(/\//).join('-'); // replace 'YYYY/MM/DD' to 'YYYY-MM-DD'
            value = value.split(' ').join('T'); // replace ' ' to 'T' (add time identifier)
            value = value + '+09:00'; // add timezone identifier
            break;
        case 'location':
            value = data.match(/\[.*\]$/)[0];
            value = value.slice(1, value.length - 1);
            break;
        case 'message':
            const replaceTable = createReplaceTable(); // Get replace table
            value = data;
            for ([from, to] of replaceTable)
                value = value.split(from).join(to); // replace strFrom(from replace) to strTo(to replace)
                value = value.replace(/^\[.[^\[\]]*\]\s?/, '');
            break;
    }
    return value;
}

// Parse message data from api
async function parse(data=undefined) {
    const currDate = new Date();
    logger.log('debug', `[parser|axios] Connecting to "${apiUrl}"?date=${Date.parse(currDate)}...`);
    const response = await axios.get(apiUrl);

    logger.log('debug', `[parser|axios] Server responded with ${response.status}.`);
    if (response.status !== 200)
        throw new NetworkException(response.status, 'CONNECTION_ERROR');

    // check if message data is updated
    if (data && response.data[0].SJ === data[0].SJ) {
        logger.log('verbose', 'No message(s) received.');
        return undefined;
    }
    
    // return updated message data
    let newData = []; // data to be returned
    for (let i = 0; i < response.data.length; i++) {
        // escape loop when previously received data found
        if (data && response.data[i].SJ === data[0].SJ)
            break;
        
        newData.push(new AlertMessage(
            response.data[i].SJ,
            response.data[i].CONT
        ));

        logger.log('debug', `[parser] newData[${i}].SJ: ${newData[i].SJ}, newData[${i}].CONT: ${newData[i].CONT}`);
        // escape loop if this is first call
        if (!data) break;
    }
    logger.log('info', `[parser] Received ${newData.length} new message(s).`);
    return newData;
}

module.exports = {
    AlertMessage, parse, readData
};
