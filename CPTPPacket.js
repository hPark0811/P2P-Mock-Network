module.exports = {
  createPacket: function (
    version,
    msgType, // 1: Welcome, 2: Redirect
    senderId,
    numOfPeers,
    reserved,
    peerPort,
    peerIP
  ) {
    reserved = null; // not used for this assignment

    let versionBuffer = Buffer.alloc(3);
    let msgTypeBuffer = Buffer.alloc(1);
    let senderBuffer = Buffer.alloc(4, senderId.toString()); // name, which gets cut off after 4 letters
    let numOfPeersBuffer = Buffer.alloc(4);
    let reservedBuffer = Buffer.alloc(2);
    let peerPortBuffer = Buffer.alloc(2);
    let peerIPBuffer;


    if (numOfPeers > 0) {
      reservedBuffer = Buffer.alloc(2);
      peerPortBuffer = Buffer.alloc(2);
      peerIPBuffer = Buffer.from(
        peerIP.split('.').map((str) => parseInt(str))
      ); // Converting string IP address to array of unsigned int to fit in 4 bytes
    }

    versionBuffer.writeInt16BE(version);
    msgTypeBuffer.writeInt8(msgType);
    numOfPeersBuffer.writeInt32BE(numOfPeers);
    reservedBuffer.writeInt16BE(reserved);
    peerPortBuffer.writeUInt16BE(peerPort);

    return numOfPeers === 0 ?
      // Packet doesn't need to include reserved, peer address if there are peers
      Buffer.concat([
        versionBuffer,
        msgTypeBuffer,
        senderBuffer,
        numOfPeersBuffer
      ]) :
      Buffer.concat([
        versionBuffer,
        msgTypeBuffer,
        senderBuffer,
        numOfPeersBuffer,
        reservedBuffer,
        peerPortBuffer,
        peerIPBuffer
      ]);
  }
}