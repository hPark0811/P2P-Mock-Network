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
let sender;

module.exports = {
  init: function (maxCount, s) {
    maxPeerCount = maxCount;
    sender = s;
  },
  handleClientJoining: function (sock) {
    // Creating packet to send
    let cPTPPacket = CPTPPacket.createPacket(
      3314,
      peerTable.length < maxPeerCount ? 1 : 2,
      sender,
      (peerTable.length) ? 1 : 0, // For this assignment, only attach max of 1 peer address
      null,
      (peerTable.length) ? peerTable[0].port : null,
      (peerTable.length) ? peerTable[0].IPv4 : null,
    );
    sock.write(cPTPPacket);

    // TABLE NOT FULL
    if (peerTable.length < maxPeerCount) {
      console.log('Connected from peer: ' + sock.remoteAddress + ':' + sock.remotePort);
      peerTable.push(new PeerInfo(sock.remoteAddress, sock.remotePort));
    }
    // TABLE FULL
    else {
      console.log('Peer table full: ' + sock.remoteAddress + ':' + sock.remotePort + ' redirected');
    }

    // Handle disconnection
    sock.on('close', (res) => {
      console.log('CLOSED: ' + sock.remoteAddress + ':' + sock.remotePort);
      peerTable = peerTable.filter((peer) => {
        return !(peer.IPv4 == sock.remoteAddress && peer.port == sock.remotePort);
      })
    })
  }
}