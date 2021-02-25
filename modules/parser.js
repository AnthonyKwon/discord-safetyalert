const axios = require('axios');
const logger = require('./logger.js');

const apiUrl = 'http://www.safekorea.go.kr/idsiSFK/neo/ext/json/disasterDataList/disasterDataList.json';

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
            value = data.match(/^\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}/);
            break;
        case 'location':
            value = data.match(/.{4}\[.*\]$/);
        case 'message':
            const replaceTable = createReplaceTable(); // Get replace table
            value = data;
            for ([from, to] of replaceTable)
                value = value.split(from).join(to); // replace strFrom(from replace) to strTo(to replace)
    }
    return value;
}

// Parse message data from api
async function parse(data=undefined) {
    logger.log('verbose', `[parser|axios] Connecting to ${apiUrl}...`);
    const response = await axios.get(apiUrl);

    if (response.status !== 200)
        throw new NetworkException(response.status, 'CONNECTION_ERROR');

    // check if message data is updated
    if (data && response.data[0].SJ === data[0].SJ)
        return undefined;
    
    // return updated message data
    let newData = []; // data to be returned
    for (let i = 0; i < response.data.length; i++) {
        newData.push(new AlertMessage(
            response.data[i].SJ,
            response.data[i].CONT
        ));

        if (!data || newData[i].SJ === data[0].SJ)
            break;
    }
    return newData;
}

module.exports = {
    AlertMessage, parse, readData
};