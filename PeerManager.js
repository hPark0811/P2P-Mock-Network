const net = require('net'),
  singleton = require('./Singleton'),
  handler = require('./ClientsHandler');

module.exports = {
  /**
   * handles P2P related actions, initiates connections
   *
   * @param connectingHost: Host to connect to
   * @param connectingPort: Port to connect to
   * @param maxPeer: nax number of peers allowed to connect
   * @param version
   * @param dir: name of the directory where program was executed
   */
  init: function (connectingHost, connectingPort, maxPeer, version, dir) {
    // Initialize timestamp
    singleton.init();
    // Initialize client handler to assign table size
    handler.init(maxPeer, dir);

    // Hosting server by a peer
    let peer = net.createServer();
    // Assigning 0 to the port will cause OS to automatically assign an open port.
    peer.listen(0, '127.0.0.1', () => {
      const MY_PORT = peer.address().port;
      const MY_HOST = peer.address().address;

      if (connectingPort && connectingHost) {
        // Peer acts as a client
        if (version !== 3314) {
          throw Error('INCORRECT VERSION! MUST BE 3314!');
        }

        // Create client socket connection
        const client = new net.Socket();
        client.connect(connectingPort, connectingHost, () => {
          let peerPortBuffer = Buffer.alloc(2);
          peerPortBuffer.writeUInt16BE(MY_PORT);
          client.write(peerPortBuffer);
        });

        client.on('data', (data) => {
          const msgType = data.slice(3, 4).readInt8();
          const senderId = data.slice(4, 8).toString().replace(/&/g, ''); // replacing sender id filler character
          const numOfPeers = data.slice(8, 12).readInt32BE();
          console.log('Connected to peer: ' + senderId + ':' + connectingPort + ' at timestamp: ' + singleton.getTimestamp());
          console.log('This peer address is ' + MY_HOST + ':' + MY_PORT + ' located at ' + dir);
          console.log('Received ACK from ' + senderId + ':' + connectingPort);

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
          console.log('\nConnection closed\n');
          process.exit();
        })
      } else {
        console.log('This peer address is ' + MY_HOST + ':' + MY_PORT + ' located at ' + dir);
      }
    });

    peer.on('connection', (sock) => {
      handler.handleClientJoining(sock);
    });
  }
};
