const CPTPPacket = require('./_packet/CPTPPacket'),
  ITPPacket = require('./_packet/ITPPacket'),
  PeerInfo = require('./_proto/PeerInfo'),
  singleton = require('./Singleton'),
  net = require('net'),
  ds = require('./_data/DataSource'),
  fs = require('fs');

let clientSocket;
let currImgName;

module.exports = {

  /**
   * handle client join request
   *
   * @param maxPeerCount
   * @param sock
   */
  handlePeerJoin: (version, maxPeerCount, sock) => {
    // Creating packet to send
    let cPTPPeerPacket = CPTPPacket.createPeerPacket(
      version,
      ds.peerTable.isFull() ? 2 : 1,
      ds.myId,
      ds.peerTable
    );
    sock.write(cPTPPeerPacket);

    // TABLE NOT FULL
    if (ds.peerTable.size() < maxPeerCount) {
      const peer = new PeerInfo(sock.remoteAddress, null, sock.remotePort);
      peer.setSocket(sock);
      ds.peerTable.add(peer);
    }
    // TABLE FULL
    else {
      console.log('[SERVER] Peer table full, redirected ' + sock.remoteAddress + ':' + sock.remotePort);
    }

    // Data received event
    sock.on('data', (data) => {
      if (data.length <= 2) {
        // Linux specific bug fix. Linux OS only lets the program use single 
        // socket for connnection. ex) cannot use same socket that is being
        // used as server to create client connection to another port. Therefore,
        // must update the table to replace remote port with actual local port.
        const peer = new PeerInfo(sock.remoteAddress, data.slice(0, 2).readUInt16BE())

        if (ds.peerTable.contains(peer.host, peer.localPort)) {
          console.log('[SERVER] Connection exists, quit ' + peer.getAddress());
          sock.destroy();
          return;
        }

        // updates the peer table
        for (let p of ds.peerTable.table) {
          if (p.host === sock.remoteAddress && p.remotePort === sock.remotePort) {
            p.localPort = peer.localPort;
            p.isPending = false;
            console.log('[SERVER] Connected from peer: ' + peer.getAddress());
          }
        }
        return;
      }

      const searchPacket = CPTPPacket.decodeSearchPacket(data);

      if (ds.recentQueryTable.search(
        searchPacket.srcImgPort,
        searchPacket.imgName
      )) {
        console.log('This image query has been seen already.')
        return;
      }

      ds.recentQueryTable.add(searchPacket.srcImgPort, searchPacket.imgName);

      const image = getImage(searchPacket.imgName);
      if (image) {
        const client = new net.Socket();
        client.connect(searchPacket.srcImgPort, searchPacket.srcPeerHost, () => {
          client.write(
            ITPPacket.createResPacket(
              version,
              1, // image is found therefore 1
              singleton.getSequenceNumber(),
              singleton.getTimestamp(),
              image
            )
          );
          client.destroy();
        });
      }
      else {
        ds.peerTable.getConnectedPeers().forEach((peer) => {
          peer.sock.write(peer);
        })
      }
    });

    // Handle disconnection
    sock.on('close', (res) => {
      let removedPeer = ds.peerTable.removePeerByAddress(
        sock.remoteAddress, sock.remotePort, false
      );
      if (removedPeer) {
        console.log('[SERVER] CLOSED: ' + removedPeer.getAddress());
      }
    });
  },

  handleImageClientJoin: (sock) => {
    console.log('[IMAGE CLIENT] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    sock.on('data', (res) => {
      // if not it's ITP Req packet from client
      if (ITPPacket.isReq(res)) {
        // decode request packet
        const reqPacket = ITPPacket.decodeReqPacket(res);

        let imgData = getImage(reqPacket.imgName);
        currImgName = reqPacket.imgName;
        let resType = imgData ? 1 : 2;

        if (!imgData) {
          sendSearchPackets(
            CPTPPacket.createSearchPacket(
              3314,
              2, // Image search packet is redirecting to connected peers
              ds.myId,
              0,
              0,
              sock.localPort,
              sock.localAddress,
              reqPacket.imgName
            )
          );
          clientSocket = sock;
          return;
        }

        resType = imgData ? 1 : 2;

        // Create ITP packet using data from the client
        const resPacket = ITPPacket.createResPacket(
          reqPacket.version,
          resType,
          singleton.getSequenceNumber(),
          singleton.getTimestamp(),
          imgData
        );
        sock.write(resPacket);
      }
      // When packet length > 16, it's response package from different peer
      else {
        const resPacket = ITPPacket.decodeResPacket(res);

        switch (resPacket.resType) {
          case 0:
            console.log('\nServer in Query state\n');
            break;
          case 1:
            console.log('\nImage Found\n');
            fs.writeFileSync(
              currImgName, 
              resPacket.imgData
            );
            break;
          case 2:
            console.log('\nImage Not Found\n');
            break;
          default:
            console.log('\nServer Busy\n');
            break;
        }

        clientSocket.write(res);
        clientSocket.destroy();
      }

      sock.destroy();
    })

    sock.on('close', (res) => {
      console.log('[IMAGE CLIENT] CLOSED: ' + sock.remoteAddress + ':' + sock.remotePort);
    })
  }
}

function getImage(imgName) {
  let imgData;
  try {
    console.log(process.cwd());
    // TODO: Where to place db
    imgData = fs.readFileSync('./' + imgName);
  }
  catch (e) {
    console.error('image not found: ' + imgName)
  }
  return imgData;
}

function sendSearchPackets(packet) {
  ds.peerTable.getConnectedPeers().forEach((peer) => {
    console.log('forwarding to ' + peer.localPort)
    peer.sock.write(packet);
  });
}