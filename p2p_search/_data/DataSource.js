const PeerTable = require('../_proto/PeerTable');
const DeclinedTable = require('../_proto/DeclinedTable');
const RecentQueryTable = require('../_proto/RecentQueryTable');


const DataStore = {
  peerTable: null,
  declinedTable: null,
  recentQueryTable: null,
  myId: process.cwd().split('/').pop(),
  init: (maxPeer) => {
    DataStore.peerTable = new PeerTable(maxPeer);
    DataStore.declinedTable = new DeclinedTable(maxPeer);
    DataStore.recentQueryTable = new RecentQueryTable(maxPeer);
  }
}

module.exports = DataStore;