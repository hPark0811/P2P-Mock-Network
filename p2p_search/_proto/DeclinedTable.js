const PeerTable = require('./PeerTable');

class DeclinedTable extends PeerTable {
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