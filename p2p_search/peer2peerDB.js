//
// DO NOT change or add any code in this file //
//
let net = require('net'),
  singleton = require('./Singleton'),
  handler = require('./ClientsHandler'),
  ITPPacket = require('./_packet/ITPPacket'),
  fs = require('fs'),
  opn = require('opn');

module.exports = {
  initServer: () => {
    let p2pDB = net.createServer();

    p2pDB.listen(0, '127.0.0.1', () => {
      const myPort = p2pDB.address().port;
      const myHost = p2pDB.address().address;
      console.log('p2pDB server is started at timestamp: ' + singleton.getTimestamp() + ' and is listening on ' + myHost + ':' + myPort);
    });

    p2pDB.on('connection', function (sock) {
      handler.handleImageClientJoin(sock); //called for each client joining
    });

    // TODO: Implement IMAGEDB as a client
  },
  initClient: (
    destHost,
    destPort,
    imgName,
    version
  ) => {
    const packet = ITPPacket.createReqPacket(version, 0, imgName);

    // Create client socket connection
    const client = new net.Socket();

    client.connect(destPort, destHost, () => {
      console.log('\nConnected to p2pDB server on: ' + destHost + ':' + destPort);
      client.write(packet);
    });

    client.on('data', (data) => {
      const resPacket = ITPPacket.decodeResPacket(data);

      console.log('\nServer sent:\n')
      console.log(' --ITP Version = ' + resPacket.version);
      console.log(' --Response Type = ' + resPacket.resType);
      console.log(' --Sequence Number = ' + resPacket.seqNum);
      console.log(' --Timestamp = ' + resPacket.timestamp);
      console.log(' --Image Size = ' + resPacket.imgSize);

      switch (resPacket.resType) {
        case 0:
          console.log('\nServer in Query state\n');
          break;
        case 1:
          console.log('\nImage Found\n');
          fs.writeFileSync(imgName, resPacket.imgData);
          opn('./' + imgName, { wait: true });
          break;
        case 2:
          console.log('\nImage Not Found\n');
          break;
        default:
          console.log('\nServer Busy\n');
          break;
      }
    });
  }
}