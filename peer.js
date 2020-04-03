const p2pDB = require('./p2p_search/peer2peerDB'),
  singleton = require('./p2p_search/Singleton');

// Initialize timestamp
singleton.init();

let connectingHost, connectingPort, maxPeer, version;

// Assign HOST and PORT address found in command
let addressNdx = process.argv.findIndex((param) => param === '-p');
[connectingHost, connectingPort] =
  (addressNdx !== -1) ? process.argv[addressNdx + 1].split(':') : [null, null];

let maxPeerNdx = process.argv.findIndex((param) => param === '-n');
if (maxPeerNdx === -1) {
  console.log('max peer is not specified, assigning default value of 6');
  maxPeer = 6;
} 
else if (process.argv[maxPeerNdx + 1] <= 0) {
  maxPeer = process.argv[maxPeerNdx + 1];
}
else {
  throw new Error('max peer cannot be zero or negative value');
}

// Assign version
let versionNdx = process.argv.findIndex((param) => param === '-v');
version = versionNdx !== -1 ? process.argv[versionNdx + 1] : 3314;

p2pDB.initPeer(connectingHost, connectingPort, maxPeer, version);
p2pDB.initImageServer();