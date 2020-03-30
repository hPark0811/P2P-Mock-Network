const PeerTable = require('../_proto/PeerTable');
const DeclinedTable = require('../_proto/DeclinedTable');

class RecentQueryTable {
  constructor(size) {
    this.size = size;
    this.queries = [];
  }
  add(srcImgPort, imgName) {
    if (this.queries.length >= this.size) {
      this.queries.shift();
    }
    this.queries.push({srcImgPort: srcImgPort, imgName: imgName});
  }
  search(srcImgPort, imgName) {
    return this.queries.some((q) => {
      return q.srcImgPort === srcImgPort && q.imgName === imgName;
    });
  }
}

const DataStore = {
  peerTable: null,
  declinedTable: null,
  recentQueryTable: null,
  init: (maxPeer) => {
    DataStore.peerTable = new PeerTable(maxPeer);
    DataStore.declinedTable = new DeclinedTable(maxPeer);
    DataStore.recentQueryTable = new RecentQueryTable(maxPeer);
  }
}

module.exports = DataStore;