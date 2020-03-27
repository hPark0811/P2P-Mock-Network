const CPTPPacket = require('./CPTPPacket'),
      PeerInfo = require('./proto/PeerInfo')

module.exports = {

  /**
   * handle client join request
   *
   * @param maxPeerCount
   * @param sender
   * @param sock
   */
  handleClientJoining: function (maxPeerCount, sender, peerTable, sock) {
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
  }
}