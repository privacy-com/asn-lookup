// TODO(mnisjk) More header/documentation/licensing
//
// Usage:
//
//      lookup('134.173.42.100')
//          .then(asn => console.log(asn));

module.exports = {
    version,
    lookup,
}

const path   = require('path');
const SQL    = require('sql-template-strings');
const sqlite = require('sqlite');

const VERSION = '1.0.0';
let g_asnDb = null;

/*String*/
function version() {
    return VERSION;
}

/*int*/
async function lookup(/*String*/ ipAddress) {
    //TODO(mnisjk) validation on ipAddress
    try {
        if (!g_asnDb) {
            g_asnDb = await sqlite.open(path.join(__dirname, 'assets/asns.db'));
        }
        const ipv4 = _ipDotDecimalToInt32(ipAddress);
        const rows = await g_asnDb.all(SQL`SELECT asn FROM prefixes WHERE prefix<=${ipv4} ORDER BY prefix DESC LIMIT 1;`);
        return rows[0].asn;
    } catch (e) {
        // FIXME(mnisjk): Should we raise exception to caller? For now always resolving promise to caller.
        return null;
    }
}


/*int*/
function _ipDotDecimalToInt32(/*String*/ ipAddress) {
    const d = ipAddress.split('.');
    return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
}
