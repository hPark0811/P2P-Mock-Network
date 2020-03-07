const CPTPPacket = require('./CPTPPacket');

/**
 * Peer information proto
 *
 * @class PeerInfo
 */
class PeerInfo {
  constructor(IPv4, rPort, lPort = null) {
    this.IPv4 = IPv4;
    this.remotePort = rPort;
    this.localPort = lPort;
  }
  getAddress() {
    return this.IPv4 + ':' + this.localPort;
  }
}

let peerTable = [];
let maxPeerCount;
let sender;


module.exports = {
  /**
   *  inits clients handler module with necessary inforamation
   *
   * @param maxCount: number of peers allowed to connect
   * @param s: sender id
   */
  init: function (maxCount, s) {
    maxPeerCount = maxCount;
    sender = s;
  },

  /**
   *  Handles client joining request and generates packet using necessary data
   *
   * @param sock
   */
  handleClientJoining: function (sock) {
    // Creating packet to send
    let cPTPPacket = CPTPPacket.createPacket(
      3314,
      peerTable.length < maxPeerCount ? 1 : 2,
      sender,
      (peerTable.length) ? 1 : 0, // For this assignment, only attach max of 1 peer address
      null,
      (peerTable.length) ? peerTable[0].localPort : null,
      (peerTable.length) ? peerTable[0].IPv4 : null,
    );
    sock.write(cPTPPacket);

    // TABLE NOT FULL
    if (peerTable.length < maxPeerCount) {
      peerTable.push(new PeerInfo(sock.remoteAddress, sock.remotePort));
    }
    // TABLE FULL
    else {
      console.log('Peer table full: ' + sock.remoteAddress + ':' + sock.remotePort + ' redirected');
    }

    // Data received event
    sock.on('data', (data) => {
      // updates the peer table
      peerTable = peerTable.map((peer) => {
        if (peer.IPv4 === sock.remoteAddress && peer.remotePort === sock.remotePort) {
          peer.localPort = data.slice(0, 2).readUInt16BE();
          console.log('Connected from peer: ' + peer.getAddress());
        }
        return peer;
      })
    })

    // Handle disconnection
    sock.on('close', (res) => {
      peerTable = peerTable.filter((peer) => {
        if (peer.IPv4 == sock.remoteAddress && peer.remotePort == sock.remotePort) {
          console.log('CLOSED: ' + peer.IPv4 + ':' + peer.localPort);
          return false;
        } else {
          return true;
        }
      })
    })
  }
}