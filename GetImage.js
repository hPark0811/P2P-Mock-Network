const p2pDB = require('./p2p_search/peer2peerDB'),
  singleton = require('./p2p_search/Singleton');

let destHost,
  destPort,
  imgName,
  version;

singleton.init();

if (process.argv[2] !== '-s' || process.argv[4] !== '-q' || process.argv[6] !== '-v') {
  throw Error('Incorrect client parameter.');
}
[destHost, destPort] = process.argv[3].split(':');
imgName = process.argv[5];
version = process.argv[7];

p2pDB.initClient(
  destHost,
  destPort,
  imgName,
  version
);