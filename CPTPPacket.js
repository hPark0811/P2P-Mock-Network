module.exports = {
  createPacket: function(
    version,
    msgType, // 1: Welcome, 2: Redirect
    senderId,
    numOfPeers,
    reserved,
    peerPort,
    peerIP
  ) {
    reserved = null; // not used for this assignment

    const versionBuffer = Buffer.alloc(3, version);
    const msgTypeBuffer = Buffer.alloc(1, msgType);
    const senderBuffer = Buffer.alloc(4, senderId);
    const numOfPeersBuffer = Buffer.alloc(4, numOfPeers);
    const reservedBuffer = Buffer.alloc(4, reserved);
    const peerPortBuffer = Buffer.alloc(4, peerPort);
    const peerIPBuffer = Buffer.alloc(4, peerIP);

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