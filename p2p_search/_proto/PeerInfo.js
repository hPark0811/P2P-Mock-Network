
/**
 * Peer information proto
 *
 * @class PeerInfo
 */
class PeerInfo {
  /**
   * Creates an instance of PeerInfo.
   * @param host IPv4
   * @param lPort local port number
   * @param rPort remote port number
   * @param {boolean} [isPending=true] peer connection state
   * @memberof PeerInfo
   */
  constructor(host, lPort, rPort = null, isPending = true) {
    this.host = host;
    this.remotePort = rPort;
    this.localPort = lPort;
    this.isPending = isPending;
  }
  setSocket(sock) {
    this.sock = sock;
  }
  getAddress() {
    return this.host + ':' + this.localPort;
  }
}

module.exports = PeerInfo;