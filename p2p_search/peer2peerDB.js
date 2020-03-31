//
// DO NOT change or add any code in this file //
//
let net = require('net'),
  singleton = require('./Singleton'),
  handler = require('./ClientsHandler'),
  ITPPacket = require('./_packet/ITPPacket'),
  CPTPPacket = require('./_packet/CPTPPacket'),
  PeerInfo = require('./_proto/PeerInfo'),
  ds = require('./_data/DataSource'),
  fs = require('fs'),
  opn = require('opn');

let myPeerHost, myPeerPort, myImageHost, myImagePort;

module.exports = {
  /**
   * handles P2P related actions, initiates connections
   *
   * @param connectingHost: Host to connect to
   * @param connectingPort: Port to connect to
   * @param maxPeer: nax number of peers allowed to connect
   * @param version=
   */
  initPeer: (
    connectingHost,
    connectingPort,
    maxPeer,
    version
  ) => {
    ds.init(maxPeer);

    // Hosting server by a peer
    let peer = net.createServer();
    // Assigning 0 to the port will cause OS to automatically assign open port.
    peer.listen(0, '127.0.0.1', () => {
      myPeerPort = peer.address().port;
      myPeerHost = peer.address().address;
      console.log('\nThis peer address is ' + myPeerHost + ':' + myPeerPort + ' at ' + ds.myId);

      if (connectingPort && connectingHost) {
        // Peer acts as a client
        if (version !== 3314) {
          throw Error('INCORRECT VERSION! MUST BE 3314!');
        }
        // Create client socket connection
        const client = new net.Socket();
        initPeerConnection(client, connectingPort, connectingHost);
      }
    });

    peer.on('connection', (sock) => {
      handler.handlePeerJoin(
        version,
        maxPeer,
        sock
      );
    });
  },
  initImageServer: () => {
    let p2pDB = net.createServer();

    p2pDB.listen(0, '127.0.0.1', () => {
      myImagePort = p2pDB.address().port;
      myImageHost = p2pDB.address().address;
      console.log('p2pDB server is started at timestamp: ' + singleton.getTimestamp() + ' and is listening on ' + myImageHost + ':' + myImagePort);
    });

    p2pDB.on('connection', function (sock) {
      handler.handleImageClientJoin(sock); //called for each client joining
    });

  },
  initImageClient: (
    destHost,
    destPort,
    imgName,
    version
  ) => {
    const packet = ITPPacket.createReqPacket(version, 0, imgName);

    // Create client socket connection
    const client = new net.Socket();

    client.connect(destPort, destHost, () => {
      console.log('\nConnected to p2pDB server on: ' + destHost + ':' + destPort);
      console.log('from ' + client.localAddress + ":" + client.localPort);
      client.write(packet);
    });

    client.on('data', (data) => {
      const resPacket = ITPPacket.decodeResPacket(data);

      console.log('\nServer sent:\n')
      console.log(' --ITP Version = ' + resPacket.version);
      console.log(' --Response Type = ' + resPacket.resType);
      console.log(' --Sequence Number = ' + resPacket.seqNum);
      console.log(' --Timestamp = ' + resPacket.timestamp);
      console.log(' --Image Size = ' + resPacket.imgSize);

      switch (resPacket.resType) {
        case 0:
          console.log('\nServer in Query state\n');
          break;
        case 1:
          console.log('\nImage Found\n');
          fs.writeFileSync(imgName, resPacket.imgData);
          opn('./' + imgName, { wait: true });
          break;
        case 2:
          console.log('\nImage Not Found\n');
          break;
        default:
          console.log('\nServer Busy\n');
          break;
      }
      client.destroy();
    });
  }
}

function initPeerConnection(client, connectingPort, connectingHost) {
  // refill peer table.
  // Regardless of connection result, when starting to attempt connection to
  // another peer, it gets inserted into peer table as 'Pending' state needs to
  // be treated like a connection until disconnected.
  const currPeer = new PeerInfo(connectingHost, connectingPort)
  currPeer.setSocket(client);
  ds.peerTable.add(currPeer);

  try {
    client.connect(connectingPort, connectingHost, () => {
      console.log('\n[CLIENT] Connected to peer: ' + connectingHost + ':' + connectingPort + ' at timestamp: ' + singleton.getTimestamp());
      let peerPortBuffer = Buffer.alloc(2);
      peerPortBuffer.writeUInt16BE(myPeerPort);
      client.write(peerPortBuffer);
    });

    client.on('data', (data) => {
      // Decipher CPTP Packet into CPTPpacket class Object
      const CPTPObj = CPTPPacket.decodePeerPacket(data);

      // Generate connection logs
      // console.log('\n[CLIENT] Connected to peer: ' + CPTPObj.sender + ':' + connectingPort + ' at timestamp: ' + singleton.getTimestamp());
      console.log('[CLIENT] Received ACK from ' + CPTPObj.sender + ':' + connectingPort);

      for (let peer of CPTPObj.peerList) {
        console.log('   which is peered with: ' + peer.host + ':' + peer.localPort);
      }

      if (CPTPObj.msgType === 1) {
        currPeer.isPending = false;
      }
      else {
        console.log('[CLIENT] Join redirected from ' + CPTPObj.sender + ':' + connectingPort);
        ds.declinedTable.add(new PeerInfo(connectingHost, connectingPort));
        client.destroy();
      }

      for (let peer of CPTPObj.peerList) {
        // Avoid connecting more then its limit
        if (ds.peerTable.isFull()) {
          console.log('[CLIENT] Peer table full, quit ' + peer.host + ":" + peer.localPort)
          return;
        }
        // Avoid connecting to duplicate port or declined port. 
        // Skips to next peer in list.
        if (
          ds.peerTable.contains(peer.host, peer.localPort) ||
          ds.declinedTable.contains(peer.host, peer.localPort)
        ) {
          continue;
        }

        initPeerConnection(
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
      ds.peerTable.removePeerByAddress(
        connectingHost,
        connectingPort,
        true
      );
    });
  }
  // In case of error occured during connection, peer table is sanitized.
  catch (connectionError) {
    console.log("[CLIENT] Error occured while connecting to: " + connectingHost + ":" + connectingPort);
    ds.peerTable.removePeerByAddress(connectingHost, connectingPort);
  }
}