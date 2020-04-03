/**
 * peer table object that provides necessary methods to modify the stored
 * state of peer connections.
 *
 * @class PeerTable
 */
class PeerTable {
  /**
   *Creates an instance of PeerTable with maximum size.
   * @param {*} maxSize
   * @memberof PeerTable
   */
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
  /**
   * searches through peer table to find existing peer and removes it from the
   * table
   *
   * @param {*} host
   * @param {*} port
   * @param {boolean} [isLocalPort=true]
   * @returns
   * @memberof PeerTable
   */
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