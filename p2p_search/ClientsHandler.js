const CPTPPacket = require('./_packet/CPTPPacket'),
  ITPPacket = require('./_packet/ITPPacket'),
  PeerInfo = require('./_proto/PeerInfo'),
  singleton = require('./Singleton'),
  fs = require('fs');

module.exports = {

  /**
   * handle client join request
   *
   * @param maxPeerCount
   * @param sender
   * @param sock
   */
  handlePeerJoin: (maxPeerCount, sender, peerTable, sock) => {
    // Creating packet to send
    let cPTPPacket = CPTPPacket.createPacket(
      3314,
      peerTable.isFull() ? 2 : 1,
      sender,
      peerTable
    );
    sock.write(cPTPPacket);

    // TABLE NOT FULL
    if (peerTable.size() < maxPeerCount) {
      peerTable.add(new PeerInfo(sock.remoteAddress, null, sock.remotePort));
    }
    // TABLE FULL
    else {
      console.log('[SERVER] Peer table full, redirected ' + sock.remoteAddress + ':' + sock.remotePort);
    }

    // Data received event
    sock.on('data', (data) => {
      const peer = new PeerInfo(sock.remoteAddress, data.slice(0, 2).readUInt16BE())

      if (peerTable.contains(peer.host, peer.localPort)) {
        console.log('[SERVER] Connection exists, quit ' + peer.getAddress());
        sock.destroy();
        return;
      }

      // updates the peer table
      for (let p of peerTable.table) {
        if (p.host === sock.remoteAddress && p.remotePort === sock.remotePort) {
          p.localPort = peer.localPort;
          console.log('[SERVER] Connected from peer: ' + peer.getAddress());
        }
      }
    });

    // Handle disconnection
    sock.on('close', (res) => {
      let removedPeer = peerTable.removePeerByAddress(
        sock.remoteAddress, sock.remotePort, false
      );
      if (removedPeer) {
        console.log('[SERVER] CLOSED: ' + removedPeer.getAddress());
      }
    });
  },
  handleImageClientJoin: (sock) => {
    console.log('[IMAGE CLIENT] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    sock.on('data', (res) => {
      // decode request packet
      const reqPacket = ITPPacket.decodeReqPacket(res)

      let resType = 3;
      let imgData;
      // TODO: Figure out if image server is being used.
      const isBusy = false;
      if (!isBusy) {
        imgData = getImage(reqPacket.imgName);
        resType = imgData ? 1 : 2;
      }

      // Create ITP packet using data from the client
      const resPacket = ITPPacket.createResPacket(
        reqPacket.version,
        resType,
        singleton.getSequenceNumber(),
        singleton.getTimestamp(),
        imgData
      );
      sock.write(resPacket);
      sock.destroy();
    })

    sock.on('close', (res) => {
      console.log('[IMAGE CLIENT] CLOSED: ' + sock.remoteAddress + ':' + sock.remotePort);
    })
  }
}

function getImage(imgName) {
  let imgData;
  try {
    console.log(process.cwd());
    imgData = fs.readFileSync('./p2p_search/_res/' + imgName);
  }
  catch (e) {
    console.error('image not found: ' + imgName)
  }
  return imgData;
}