class PeerTable {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.table = [];
  }
  size() {
    return this.table.length;
  }
  isFull() {
    return this.table.length >= this.maxSize;
  }
  removePeerByAddress(host, port, isLocalPort = true) {
    let removedPeer = null;
    let ndxOfPeer = this.table.findIndex((peer) => {
      if (
        host == peer.host &&
        port == (isLocalPort ? peer.localPort : peer.remotePort)
      ) {
        removedPeer = peer;
      }
    });
    this.table.splice(ndxOfPeer, 1);
    return removedPeer;
  }
  contains(host, port, isLocalPort = true) {
    return this.table.some((peer) => {
      return (
        host == peer.host &&
        port == (isLocalPort ? peer.localPort : peer.remotePort)
      )
    });
  }
  add(peerInfo) {
    this.table.push(peerInfo);
  }
  getConnectedPeers() {
    return this.table.filter((peer) => {
      return !peer.isPending;
    })
  }
}

module.exports = PeerTable;