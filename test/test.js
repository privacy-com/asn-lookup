const assert = require('assert');

const asnLookup = require('../index.js');

// **TODO(mnisjk): Real unit testing
async function test() {
    console.log('Testing asn-lookup version', asnLookup.version());

    const googleASNumber = 15169;
    const asn = await asnLookup.lookup('8.8.8.8');

    assert.strictEqual(googleASNumber, asn, 'Expected 8.8.8.8 to be owned by Google AS Number');

    const ipAddresses = await asnLookup.search(133612);
    let count = 0;
    for (ip of ipAddresses) {
        count++;
        if (count>1000) break;
    }

    // Not a great test, but networks change, so it's hard to write
    // a *perfect* test.
    assert.ok(count>1000, 'Expected ASN 133612 (VODAFONE Australia) to have many, many IP addresses');

    const cidrs = await asnLookup.search(133612, asnLookup.SEARCH_RESULT_FORMAT.CIDR);
    count = 0;
    for (cidr of cidrs) {
        count++;
    }

    // Again, not a great test, but at least we're testing the scale is right... Vodaphone should have
    // a dozen or so networks, with thousands of IPs
    assert.ok(count>10 && count<100, 'Expected ASN 133612 (VODAFONE Australia) to have dozens of networks');

    const rir = await asnLookup.rir(133612);
    assert.strictEqual('apnic', rir, 'Expected VODAPHONE Australia to be an apnic delegation');

    console.log('Test complete');
}

test()
