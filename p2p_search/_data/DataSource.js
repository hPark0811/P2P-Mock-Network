const PeerTable = require('../_proto/PeerTable');
const DeclinedTable = require('../_proto/DeclinedTable');
const RecentQueryTable = require('../_proto/RecentQueryTable');

 /**
   * Global data store object that holds the reference to objects used 
   * throughout the codebase. 
   */
module.exports = {
  peerTable: null,
  declinedTable: null,
  recentQueryTable: null,
  myId: process.cwd().split('/').pop(),
  init: function(maxPeer) {
    this.peerTable = new PeerTable(maxPeer);
    this.declinedTable = new DeclinedTable(maxPeer);
    this.recentQueryTable = new RecentQueryTable(maxPeer);
  }
};