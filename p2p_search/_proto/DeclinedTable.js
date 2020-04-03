const PeerTable = require('./PeerTable');

/**
 * Table of declined peer connection
 *
 * @class DeclinedTable
 * @extends {PeerTable}
 */
class DeclinedTable extends PeerTable {
  /**
   * overwrites peer table add method by providing extra functionality to limit
   * the maximum number of peers disconnected.
   *
   * @param peerInfo
   * @memberof DeclinedTable
   */
  add(peerInfo) {
    if (this.contains(peerInfo.host, peerInfo.localPort)) {
      this.removePeerByAddress(peerInfo.host, peerInfo.localPort);
    }
    if (this.isFull()) {
      this.table.shift();
    }
    super.add(peerInfo);
  }
}

module.exports = DeclinedTable;