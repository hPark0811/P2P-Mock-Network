const net = require('net'),
  singleton = require('./Singleton'),
  CPTPPacket = require('./CPTPPacket'),
  handler = require('./ClientsHandler'),
  PeerInfo = require('./proto/PeerInfo');

// TODO: Somehow check the pushed element and change max type.
let peerTable, myHost, myPort;

class PeerTable {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.table = [];
  }
  size() {
    return this.table.length;
  }
  isFull() {
    return this.table.length >= this.maxSize;
  }
  removePeerByAddress(host, port, isLocalPort = true) {
    let removedPeer = null;
    let ndxOfPeer = this.table.findIndex((peer) => {
      if (
        host == peer.host &&
        port == (isLocalPort ? peer.localPort : peer.remotePort)
      ) {
        removedPeer = peer;
      }
    });
    this.table.splice(ndxOfPeer, 1);
    return removedPeer;
  }
  contains(host, port, isLocalPort = true) {
    return this.table.some((peer) => {
      return (
        host == peer.host &&
        port == (isLocalPort ? peer.localPort : peer.remotePort)
      )
    });
  }
  add(peerInfo) {
    this.table.push(peerInfo);
  }
}

class DeclinedTable extends PeerTable {
  add(peerInfo) {
    if (this.contains(peerInfo.host, peerInfo.localPort)) {
      this.removePeerByAddress(peerInfo.host, peerInfo.localPort);
    }
    if (this.isFull()) {
      this.table.shift();
    }
    super.add(peerInfo);
  }
}

const DIR = process.cwd().split('/').pop(); // get current working directory

module.exports = {
  /**
   * handles P2P related actions, initiates connections
   *
   * @param connectingHost: Host to connect to
   * @param connectingPort: Port to connect to
   * @param maxPeer: nax number of peers allowed to connect
   * @param version=
   */
  init: function (
    connectingHost,
    connectingPort,
    maxPeer,
    version
  ) {
    // Initialize timestamp
    singleton.init();
    peerTable = new PeerTable(maxPeer);
    declinedTable = new DeclinedTable(maxPeer);

    // Hosting server by a peer
    let peer = net.createServer();
    // Assigning 0 to the port will cause OS to automatically assign open port.
    peer.listen(0, '127.0.0.1', () => {
      myPort = peer.address().port;
      myHost = peer.address().address;
      console.log('\nThis peer address is ' + myHost + ':' + myPort + ' at ' + DIR);

      if (connectingPort && connectingHost) {
        // Peer acts as a client
        if (version !== 3314) {
          throw Error('INCORRECT VERSION! MUST BE 3314!');
        }
        // Create client socket connection
        const client = new net.Socket();
        initClientConnection(client, connectingPort, connectingHost);
      }
    });

    peer.on('connection', (sock) => {
      handler.handleClientJoining(
        maxPeer,
        DIR,
        peerTable,
        sock
      );
    });
  }
};

function initClientConnection(client, connectingPort, connectingHost) {
  // refill peer table.
  // Regardless of connection result, when starting to attempt connection to
  // another peer, it gets inserted into peer table as 'Pending' state needs to
  // be treated like a connection until disconnected.
  peerTable.add(new PeerInfo(connectingHost, connectingPort));

  try {
    client.connect(connectingPort, connectingHost, () => {
      console.log('\n[CLIENT] Connected to peer: ' + connectingHost + ':' + connectingPort + ' at timestamp: ' + singleton.getTimestamp());
      let peerPortBuffer = Buffer.alloc(2);
      peerPortBuffer.writeUInt16BE(myPort);
      client.write(peerPortBuffer);
    });

    client.on('data', (data) => {
      // Decipher CPTP Packet into CPTPpacket class Object
      const CPTPObj = CPTPPacket.decodePacket(data);

      // Generate connection logs
      // console.log('\n[CLIENT] Connected to peer: ' + CPTPObj.sender + ':' + connectingPort + ' at timestamp: ' + singleton.getTimestamp());
      console.log('[CLIENT] Received ACK from ' + CPTPObj.sender + ':' + connectingPort);

      for (let peer of CPTPObj.peerList) {
        console.log('   which is peered with: ' + peer.host + ':' + peer.localPort);
      }

      if (CPTPObj.msgType === 2) {
        console.log('[CLIENT] Join redirected from ' + CPTPObj.sender + ':' + connectingPort);
        declinedTable.add(new PeerInfo(connectingHost, connectingPort));
        client.destroy();
      }

      for (let peer of CPTPObj.peerList) {
        // Avoid connecting more then its limit
        if (peerTable.isFull()) {
          console.log('[CLIENT] Peer table full, quit ' + peer.host + ":" + peer.localPort)
          return;
        }
        // Avoid connecting to duplicate port or declined port. 
        // Skips to next peer in list.
        if (
          peerTable.contains(peer.host, peer.localPort) || 
          declinedTable.contains(peer.host, peer.localPort)
        ) {
          continue;
        }
        
        initClientConnection(
          new net.Socket(),
          peer.localPort,
          peer.host
        );
      }
    });

    client.on('close', () => {
      console.log('[CLIENT] Connection closed at port: ' + connectingPort);
      // Closing connection is handled gracefully, and peer is removed from peer
      // table as well.
      peerTable.removePeerByAddress(
        connectingHost,
        connectingPort,
        true
      );
    });
  }
  // In case of error occured during connection, peer table is sanitized.
  catch (connectionError) {
    console.log("[CLIENT] Error occured while connecting to: " + connectingHost + ":" + connectingPort);
    peerTable.removePeerByAddress(connectingHost, connectingPort);
  }
}