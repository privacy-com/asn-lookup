// TODO(mnisjk) More header/documentation/licensing
//
// Usage:
//
//      // Lookup ASN for dot decimal IP
//      lookup('134.173.42.100')
//          .then(asn => console.log(asn));
//
//      // Search all IP addresses for an ASN
//      search(15169)
//          .then(ipAddreses => {
//              for (ip of ipAddresses) {
//                  console.log(ip);
//              }
//          });
//
//      // Find the RIR associated with an ASN
//      rir(15169)
//          .then(rir => console.log(rir));

const SEARCH_RESULT_FORMAT = {
    IP_ADDRESS: 'ipaddress',
    CIDR: 'cidr'
};

module.exports = {
    version,
    lookup,
    search,
    rir,
    SEARCH_RESULT_FORMAT,
}

const path   = require('path');
const SQL    = require('sql-template-strings');
const sqlite = require('sqlite');

const VERSION = '1.1.0';
let g_asnDb = null;

/*String*/
function version() {
    return VERSION;
}

/*@throws*/
/*int*/
async function lookup(/*String*/ ipAddress) {
    //TODO(mnisjk) validation on ipAddress
    const ipv4 = _ipDotDecimalToInt32(ipAddress);
    const db = await _db();
    const rows = await db.all(SQL`SELECT asn FROM prefixes WHERE prefix<=${ipv4} ORDER BY prefix DESC LIMIT 1;`);
    return rows[0].asn;
}

/*@throws*/
/*GeneratorFunction*/
async function search(/*int*/ asn, /*enum (String)*/ resultFormat = SEARCH_RESULT_FORMAT.IP_ADDRESS) {
    const db = await _db();
    const rows = await db.all(SQL`
        SELECT p1.prefix AS start,
            p2.prefix-1 AS end
        FROM prefixes p1
        JOIN prefixes p2
        ON p1._rowid_+1=p2._rowid_
        WHERE p1.asn=${asn};`);

    function* iterator() {
        for (const network of rows) {
            if (resultFormat === SEARCH_RESULT_FORMAT.IP_ADDRESS) {
                for (let ip=network.start;ip<=network.end;++ip) {
                    yield _ipInt32ToDotDecimal(ip);
                }
            } else if(resultFormat == SEARCH_RESULT_FORMAT.CIDR) {
                // Calculate the netmask.. We're calculating every mask. We may want to cache powers of 2 instead
                // shifting every time, but meh, its fast enough
                let mask = 32;
                for (let networkSize = network.end - network.start + 1; networkSize > 1; networkSize>>=1, mask-=1);
                yield `_ipInt32ToDotDecimal(${network.start})/${mask}`;
            } else {
                throw new Error('Invalid result format');
            }
        }
    }
    return iterator();
}

/*@throws*/
/*String*/
async function rir(/*int*/ asn) {
    const db = await _db();
    const rows = await db.all(SQL`
        SELECT r.name
        FROM delegations d
        JOIN rirs r
        ON r.id=d.ririd
        WHERE d.asn=${asn};`);
    return rows[0].name;
}

/*sqlite3 handle*/
async function _db() {
    if (!g_asnDb) {
        g_asnDb = await sqlite.open(path.join(__dirname, 'assets/asns.db'));
    }
    return g_asnDb;
}

/*int*/
function _ipDotDecimalToInt32(/*String*/ ipAddress) {
    const d = ipAddress.split('.');
    return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
}

/*String*/
function _ipInt32ToDotDecimal(/*int*/num) {
    let d = num % 256;
    for (let i=3;i>0;--i) {
        num = Math.floor(num/256);
        d = num % 256 + '.' + d;
    }
    return d;
}
