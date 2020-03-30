const peerManager = require('./p2p_search/PeerManager'),
  p2pDB = require('./p2p_search/peer2peerDB'),
  singleton = require('./p2p_search/Singleton');

// Initialize timestamp
singleton.init();

let connectingHost, connectingPort, maxPeer, version;

// Assign HOST and PORT address found in command
let addressNdx = process.argv.findIndex((param) => param === '-p');
[connectingHost, connectingPort] =
  (addressNdx !== -1) ? process.argv[addressNdx + 1].split(':') : [null, null];

// Assign max peer count
let maxPeerNdx = process.argv.findIndex((param) => param === '-n');
maxPeer = maxPeerNdx !== -1 ? process.argv[maxPeerNdx + 1] : 6;
if (maxPeer <= 0) {
  console.log('max peer must be greater than 0. Assigning 6 as default.');
  maxPeer = 6;
}

// Assign version TODO: Check 3314 later
let versionNdx = process.argv.findIndex((param) => param === '-v');
if (versionNdx !== -1) {
  throw new Error('Missing version number, must include -v 3314');
}
version = process.argv[versionNdx + 1];
if (version !== 3314) {
  throw new Error('In order to proceed, version must be 3314.');
}

p2pDB.initPeer(connectingHost, connectingPort, maxPeer, version);
p2pDB.initImageServer();