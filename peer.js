const net = require('net'),
  singleton = require('./Singleton'),
  handler = require('./ClientsHandler');

let HOST_TO_CONNECT, PORT_TO_CONNECT, MAX_PEER, VERSION;

// Assign HOST and PORT address found in command
let addressNdx = process.argv.findIndex((param) => param === '-p');
[HOST_TO_CONNECT, PORT_TO_CONNECT] =
  (addressNdx !== -1) ? process.argv[addressNdx + 1].split(':') : [null, null];

// Assign max peer count
let maxPeerNdx = process.argv.findIndex((param) => param === '-n');
MAX_PEER = maxPeerNdx !== -1 ? process.argv[maxPeerNdx + 1] : 2;

// Assign version
let versionNdx = process.argv.findIndex((param) => param === '-v');
VERSION = versionNdx !== -1 ? process.argv[versionNdx + 1] : 3314;

// Get current working directory
var loc = process.cwd().split('/');
var dir = loc.pop();

// Initialize timestamp
singleton.init();
// Initialize client handler to assign table size
handler.init(MAX_PEER, dir);

// Hosting server by a peer
let peer = net.createServer();
// Assigning 0 to the port will cause OS to automatically assign an open port.
peer.listen(0, '127.0.0.1', () => {
  const MY_PORT = peer.address().port;
  const MY_HOST = peer.address().address;
  console.log('This peer address is ' + MY_HOST + ':' + MY_PORT + ' located at ' + dir);

  if (PORT_TO_CONNECT && HOST_TO_CONNECT) {
    // Peer acts as a client
    if (VERSION !== 3314) {
      throw Error('INCORRECT VERSION! MUST BE 3314!');
    }

    // Create client socket connection
    const client = new net.Socket();
    client.connect(PORT_TO_CONNECT, HOST_TO_CONNECT, () => {
      console.log('Connected to peer: ' + HOST_TO_CONNECT + ':' + PORT_TO_CONNECT + ' at timestamp: ' + singleton.getTimestamp());
    });

    client.on('data', (data) => {
      console.log('Received ACK from ' + HOST_TO_CONNECT + ':' + PORT_TO_CONNECT);

      const msgType = data.slice(3, 4).readInt8();
      const senderId = data.slice(4, 8).toString();
      const numOfPeers = data.slice(8, 12).readInt32BE();

      console.log('Sender is: ' + senderId);

      if (numOfPeers > 0) {
        const peerPort = data.slice(14, 16).readUInt16BE();
        const peerHost = data.slice(16, 20).join('.');
        console.log('   which is peered with: ' + peerHost + ':' + peerPort);
      }

      if (msgType === 2) {
        console.log('Join redirected, try connecting to the peer above.');
        client.destroy();
      }
    })

    client.on('close', () => {
      console.log('\nConnection closed\n')
    })
  }
});

peer.on('connection', (sock) => {
  handler.handleClientJoining(sock);
});