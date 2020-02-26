const CPTPPacket = require('./CPTPPacket');

class PeerInfo {
  constructor(IPv4, port) {
    this.IPv4 = IPv4;
    this.port = port;
  }
  getAddress() {
    return this.IPv4 + ':' + this.port;
  }
}

let peerTable = [];
let maxPeerCount;

module.exports = {
  init: function (maxCount) {
    maxPeerCount = maxCount;
  },
  handleClientJoining: function (sock) {
    let messageType;

    // TABLE NOT FULL
    if (peerTable.length < maxPeerCount) {
      console.log('Connected from peer: ' + sock.remoteAddress + ':' + sock.remotePort);
      peerTable.push(new PeerInfo(sock.remoteAddress, sock.remotePort));
      messageType = 1 // Welcome type
    }
    // TABLE FULL
    else {
      console.log('Peer table full: ' + sock.remoteAddress + ':' + sock.remotePort + ' redirected');
      messageType = 2 // Redirect type
    }

    sock.on('data', (res) => {
      let cPTPPacket = CPTPPacket.createPacket(
        3314,
        messageType,
        'p1', // TODO: TEST VALUE FIX TO FOLDER NAME
        (peerTable.length) ? 1 : 0, // For this assignment, only attach max of 1 peer address
        null,
        (peerTable.length) ? peerTable[0].port : null,
        (peerTable.length) ? peerTable[0].IPv4 : null,
      );
      sock.write(cPTPPacket);
    });
    
    sock.on('close', (res) => {
      console.log('CLOSED: ' + sock.remoteAddress +':'+ sock.remotePort);
      peerTable = peerTable.filter((peer) => {
        return !(peer.IPv4 == sock.remoteAddress && peer.port == sock.remotePort);
      })
    })
  }
}