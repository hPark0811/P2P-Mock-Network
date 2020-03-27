
/**
 * Peer information proto
 *
 * @class PeerInfo
 */
class PeerInfo {
  constructor(host, lPort, rPort = null) {
    this.host = host;
    this.remotePort = rPort;
    this.localPort = lPort;
  }
  getAddress() {
    return this.host + ':' + this.localPort;
  }
}

module.exports = PeerInfo;