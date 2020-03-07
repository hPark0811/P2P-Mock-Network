module.exports = {
  /**
   * creates the cPTP packet using buffer that will be used as a medium between peers
   *
   * @param version: packet verstion
   * @param msgType: message type 1: Welcome, 2: Redirect
   * @param senderId: sender id (directory name of peer)
   * @param numOfPeers: num of peers in peer table
   * @param reserved
   * @param peerPort: peer port number that is connected to the current peer
   * @param peerIP: peer ip address that is connected to the current peer
   */
  createPacket: function (
    version,
    msgType, 
    senderId,
    numOfPeers,
    reserved,
    peerPort,
    peerIP
  ) {
    reserved = null; // not used for this assignment

    let versionBuffer = Buffer.alloc(3);
    let msgTypeBuffer = Buffer.alloc(1);
    let senderBuffer = Buffer.alloc(4, "    "); // name, which gets cut off after 4 letters
    let numOfPeersBuffer = Buffer.alloc(4);
    let reservedBuffer;
    let peerPortBuffer;
    let peerIPBuffer;


    if (numOfPeers > 0) {
      reservedBuffer = Buffer.alloc(2);
      peerPortBuffer = Buffer.alloc(2);
      // Converting string IP address to array of unsigned int to fit in 4 bytes
      peerIPBuffer = Buffer.from(
        peerIP.split('.').map((str) => parseInt(str))
      );
      reservedBuffer.writeInt16BE(reserved);
      peerPortBuffer.writeUInt16BE(peerPort);
    }

    versionBuffer.writeInt16BE(version);
    msgTypeBuffer.writeInt8(msgType);
    numOfPeersBuffer.writeInt32BE(numOfPeers);

    while(senderId.length < 4) {
      // Filler to fill allocated space of sender id
      senderId += '&';
    }
    senderBuffer = Buffer.from(senderId);

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