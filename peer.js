const net = require('net'),
  singleton = require('./Singleton'),
  handler = require('./ClientsHandler');

let HOST_TO_CONNECT, PORT_TO_CONNECT, MAX_PEER, VERSION;

// Assign HOST and PORT address found in command
let addressNdx = process.argv.findIndex('-p');
let isServer = addressNdx !== -1;
[HOST_TO_CONNECT, PORT_TO_CONNECT] =
  (!isServer) ? process.argv[addressNdx + 1].split(':') : null;

// Assign max peer count
let maxPeerNdx = process.argv.findIndex('-n');
const MAX_PEER = maxPeerNdx !== -1 ? process.argv[maxPeerNdx + 1] : 2;
// Initialize client handler to assign table size
handler.init(MAX_PEER);

// Assign version
let versionNdx = process.argv.findIndex('-v');
const VERSION = versionNdx !== -1 ? process.argv[versionNdx + 1] : 3314;

// Peer acts as a server
if (isServer) {
  let peer = net.createServer();
  // Assigning 0 to the port will cause OS to automatically assign an open port.
  peer.listen(0, '127.0.0.1', () => {
    console.log('This peer address is ' + peer.address().address + ':' + peer.address().port + ' located at XXX');
  });

  peer.on('connection', (sock) => {
    handler.handleClientJoining(sock);
  });
}
// Peer acts as a client
else {
  // Create client socket connection
  const client = new net.Socket();
  client.connect(PORT, HOST, () => {
    console.log('\nConnected to ImageDB server on: ' + HOST + ':' + PORT);
    client.write(packet);
  })

  client.on('data', (data) => {
    
  })

  client.on('close', () => {
    console.log('\nConnection closed\n')
  })
}
