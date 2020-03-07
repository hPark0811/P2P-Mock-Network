const peerManager = require('./PeerManager');

let connectingHost, connectingPort, maxPeer, version, dir;

// Assign HOST and PORT address found in command
let addressNdx = process.argv.findIndex((param) => param === '-p');
[connectingHost, connectingPort] =
  (addressNdx !== -1) ? process.argv[addressNdx + 1].split(':') : [null, null];

// Assign max peer count
let maxPeerNdx = process.argv.findIndex((param) => param === '-n');
maxPeer = maxPeerNdx !== -1 ? process.argv[maxPeerNdx + 1] : 2;

// Assign version
let versionNdx = process.argv.findIndex((param) => param === '-v');
version = versionNdx !== -1 ? process.argv[versionNdx + 1] : 3314;

// Get current working directory
dir = process.cwd().split('/').pop();

peerManager.init(connectingHost, connectingPort, maxPeer, version, dir);