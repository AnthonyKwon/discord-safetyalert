/* https://stackoverflow.com/a/18405800 */
function format() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
        ;
        });
}

/* https://stackoverflow.com/a/52184527 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    format,
    sleep
}