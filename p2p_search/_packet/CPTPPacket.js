const PeerInfo = require('../_proto/PeerInfo')

/**
 * CPTPPacket object blueprint.
 *
 * @class CPTPPacket
 */
class CPTPPacket {
  constructor(version, msgType, sender) {
    this.version = version;
    this.msgType = msgType;
    this.sender = sender;
  }
}

/**
 * CPTP Search Packet blueprint.
 *
 * @class CPTPSearchPacket
 * @extends {CPTPPacket}
 */
class CPTPSearchPacket extends CPTPPacket {
  constructor(
    version,
    msgType,
    sender,
    searchId,
    reserved,
    srcImgPort,
    srcPeerHost,
    imgName
  ) {
    super(version, msgType, sender)
    this.searchId = searchId;
    this.reserved = reserved;
    this.srcImgPort = srcImgPort;
    this.srcPeerHost = srcPeerHost;
    this.imgName = imgName;
  }
}

/**
 * CPTP peer connection request packet blueprint
 *
 * @class CPTPPeerPacket
 * @extends {CPTPPacket}
 */
class CPTPPeerPacket extends CPTPPacket {
  constructor(version, msgType, sender, peerList) {
    super(version, msgType, sender)
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
  createPeerPacket: (
    version,
    msgType,
    senderId,
    peerTable
  ) => {
    while (senderId.length < 4) {
      // Filler to fill allocated space of sender id
      senderId += '&';
    }

    const versionBuffer = Buffer.alloc(3);
    const msgTypeBuffer = Buffer.alloc(1);
    const senderBuffer = Buffer.alloc(4, senderId); // name, which gets cut off after 4 letters
    const numOfPeersBuffer = Buffer.alloc(4);

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
  /**
   * decode buffer of cPTP message into {CPTPPeerPacket} object
   * 
   * @param packet: CPTPPeerPacket buffer
   * 
   * @returns cPTPPeerPacket object
   */
  decodePeerPacket: (packet) => {
    const version = packet.slice(0, 3).readInt16BE();
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
      const srcPeerHost = packet.slice(bufHostNdxA, bufHostNdxB).join('.');
      receivedPeers.push(new PeerInfo(srcPeerHost, peerPort));
    }

    return new CPTPPeerPacket(version, msgType, senderId, receivedPeers);
  },

  /**
   *
   * creates cPTP search packet buffer.
   *
   * @param version: packet verstion
   * @param msgType: message type 1: Welcome, 2: Redirect
   * @param senderId: sender id (directory name of peer)
   * @param searchId: unique search id
   * @param reserved: reserved info of the packet
   * @param srcImgPort: port address of the source image socket
   * @param srcPeerHost: IPv4 address of the source image socket
   * @param imgName: image name
   * @returns buffer of cPTP message
   */
  createSearchPacket: (
    version,
    msgType,
    senderId,
    searchId,
    reserved,
    srcImgPort,
    srcPeerHost,
    imgName
  ) => {
    while (senderId.length < 4) {
      // Filler to fill allocated space of sender id
      senderId += '&';
    }

    const versionBuffer = Buffer.alloc(3);
    const msgTypeBuffer = Buffer.alloc(1);
    const senderBuffer = Buffer.alloc(4, senderId); // name, which gets cut off after 4 letters
    const searchIdBuffer = Buffer.alloc(4, searchId); // Enforce search id to be 4 letters
    const reservedBuffer = Buffer.alloc(2); // Unused
    const srcImgPortBuffer = Buffer.alloc(2);
    const imgNameBuffer = Buffer.from(imgName)
    const srcPeerHostBuffer = Buffer.from(
      srcPeerHost.split('.').map((str) => parseInt(str))
    );

    versionBuffer.writeInt16BE(version);
    msgTypeBuffer.writeInt8(msgType);
    srcImgPortBuffer.writeUInt16BE(srcImgPort);
    reservedBuffer.writeInt16BE(null);
    

    return Buffer.concat([
      versionBuffer,
      msgTypeBuffer,
      senderBuffer,
      searchIdBuffer,
      reservedBuffer,
      srcImgPortBuffer,
      srcPeerHostBuffer,
      imgNameBuffer
    ]);
  },
  /**
   * decode buffer of cPTP message into {CPTPSearchPacket} object
   * 
   * @param packet: CPTPSearchPacket buffer
   * 
   * @returns CPTPSearchPacket object
   */
  decodeSearchPacket: (packet) => {
    const version = packet.slice(0, 3).readInt16BE();
    const msgType = packet.slice(3, 4).readInt8();
    const senderId = packet.slice(4, 8).toString().replace(/&/g, ''); // replacing sender id filler character
    const searchId = packet.slice(8, 12).toString().replace(/&/g, '');
    const reserved = packet.slice(12, 14).readInt16BE();
    const srcImgPort = packet.slice(14, 16).readUInt16BE();
    const srcPeerHost = packet.slice(16, 20).join('.');
    const imgName = packet.slice(20).toString();

    return new CPTPSearchPacket(
      version,
      msgType,
      senderId,
      searchId,
      reserved,
      srcImgPort,
      srcPeerHost,
      imgName
    );
  }
}