const PeerInfo = require('../_proto/PeerInfo')

class CPTPPacket {
  constructor(msgType, sender, peerList) {
    this.msgType = msgType;
    this.sender = sender;
    this.peerList = peerList;
  }
}

module.exports = {
  /**
   *
   * creates the cPTP packet using buffer that will be used as a medium between peers
   *
   * @param version: packet verstion
   * @param msgType: message type 1: Welcome, 2: Redirect
   * @param senderId: sender id (directory name of peer)
   * @param peerTable: table with peer connection information
   * @returns buffer of cPTP message
   */

  createPacket: function (
    version,
    msgType,
    senderId,
    peerTable
  ) {
    while (senderId.length < 4) {
      // Filler to fill allocated space of sender id
      senderId += '&';
    }

    let versionBuffer = Buffer.alloc(3);
    let msgTypeBuffer = Buffer.alloc(1);
    let senderBuffer = Buffer.alloc(4, senderId); // name, which gets cut off after 4 letters
    let numOfPeersBuffer = Buffer.alloc(4);

    versionBuffer.writeInt16BE(version);
    msgTypeBuffer.writeInt8(msgType);
    numOfPeersBuffer.writeInt32BE(peerTable.size());

    const peerList = peerTable.table.flatMap((peer) => {
      let reservedBuffer;
      let peerPortBuffer;
      let peerIPBuffer;
      reservedBuffer = Buffer.alloc(2);
      peerPortBuffer = Buffer.alloc(2);
      // Converting string IP address to array of unsigned int to fit in 4 bytes
      peerIPBuffer = Buffer.from(
        peer.host.split('.').map((str) => parseInt(str))
      );
      reservedBuffer.writeInt16BE(null);
      peerPortBuffer.writeUInt16BE(peer.localPort);
      return [reservedBuffer, peerPortBuffer, peerIPBuffer]
    })

    return Buffer.concat([
      versionBuffer,
      msgTypeBuffer,
      senderBuffer,
      numOfPeersBuffer,
      ...peerList
    ]);
  },

  decodePacket: function(packet) {
    const msgType = packet.slice(3, 4).readInt8();
    const senderId = packet.slice(4, 8).toString().replace(/&/g, ''); // replacing sender id filler character
    const numOfPeers = packet.slice(8, 12).readInt32BE();
    let receivedPeers = [];

    for (let i = 0; i < numOfPeers; i++) {
      let bufResNdxA = 12 + 8 * i;
      let bufResNdxB = bufResNdxA + 2;
      let bufPortNdxA = bufResNdxB;
      let bufPortNdxB = bufPortNdxA + 2;
      let bufHostNdxA = bufPortNdxB;
      let bufHostNdxB = bufHostNdxA + 4;

      const reserved = packet.slice(bufResNdxA, bufResNdxB).readUInt16BE();
      const peerPort = packet.slice(bufPortNdxA, bufPortNdxB).readUInt16BE();
      const peerHost = packet.slice(bufHostNdxA, bufHostNdxB).join('.');
      receivedPeers.push(new PeerInfo(peerHost, peerPort));
    }

    return new CPTPPacket(msgType, senderId, receivedPeers);
  }
}