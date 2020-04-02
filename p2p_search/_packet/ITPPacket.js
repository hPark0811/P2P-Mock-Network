/**
 * ITPResPacket object
 *
 * @class ITPResPacket
 */
class ITPResPacket {
  constructor(
    version,
    resType, // 0: query, 1: found, 2: not found, 3: busy
    seqNum,
    timestamp,
    imgSize,
    imgData
  ) {
    this.version = version;
    this.resType = resType;
    this.seqNum = seqNum;
    this.timestamp = timestamp;
    this.imgSize = imgSize;
    this.imgData = imgData;
  }
}

/**
 * ITPReqPacket object
 *
 * @class ITPReqPacket
 */
class ITPReqPacket {
  constructor(
    version,
    reqType,
    imgName
  ) {
    this.version = version;
    this.reqType = reqType;
    this.imgName = imgName;
  }
}

module.exports = {
  isReq: (packet) => {
    const resType = packet.slice(3, 4).readInt8()
    return resType === 0;
  },
  /**
   * create ITP response packet buffer
   *
   * @param version version number of the packet 
   * @param resType 0: query, 1: found, 2: not found, 3: busy
   * @param seqNum seq number of the packet
   * @param timestamp when packet was generated
   * @param imgData decoded image data
   */
  createResPacket: (
    version,
    resType,
    seqNum,
    timestamp,
    imgData
  ) => {
    // Allocating proper size to each buffer
    const versionBuffer = Buffer.alloc(3);
    const resTypeBuffer = Buffer.alloc(1);
    const seqBuffer = Buffer.alloc(4);
    const timestampBuffer = Buffer.alloc(4);
    const imgSizeBuffer = Buffer.alloc(4);

    // Common buffer data
    versionBuffer.writeInt16BE(version);
    resTypeBuffer.writeInt8(resType);
    seqBuffer.writeInt32BE(seqNum);
    timestampBuffer.writeInt32BE(timestamp);
    imgSizeBuffer.writeInt32BE(imgData ? imgData.length : 0);
    const imgBuffer = resType === 1 ? Buffer.from(imgData) : Buffer.alloc(0);

    return Buffer.concat([
      versionBuffer,
      resTypeBuffer,
      seqBuffer,
      timestampBuffer,
      imgSizeBuffer,
      imgBuffer
    ]);
  },
  /**
   * decode response packet into ITPResPacket object from buffer
   *
   * @param data ITPResPacket buffer
   */
  decodeResPacket: (data) => {
    const version = data.slice(0, 3).readInt16BE();
    const resType = data.slice(3, 4).readInt8();
    const seqNum = data.slice(4, 8).readInt32BE();
    const timestamp = data.slice(8, 12).readInt32BE();
    const imgData = data.slice(12, 16).readInt32BE();
    const image = Buffer.from(data.slice(16));

    return new ITPResPacket(
      version,
      resType,
      seqNum,
      timestamp,
      imgData,
      image
    );
  },
  /**
   * create ITP request packet buffer
   *
   * @param version version number of the packet 
   * @param reqType 0: query, 1: found, 2: not found, 3: busy
   * @param imgName
   */
  createReqPacket: (
    version,
    reqType,
    imgName
  ) => {
    const versionBuffer = Buffer.alloc(3);
    const reqTypeBuffer = Buffer.alloc(1);
    const imgNameBuffer = Buffer.from(imgName);

    if (imgName.length > 12) {
      throw new Error('image name should not exceed 12 characters');
    }

    versionBuffer.writeInt16BE(version);
    reqTypeBuffer.writeInt8(reqType);

    return Buffer.concat([versionBuffer, reqTypeBuffer, imgNameBuffer])
  },
  /**
   * create ITP request packet buffer
   *
   * @param byteArrPacket
   * 
   * @returns ITPRequestPacket object 
   */
  decodeReqPacket: (byteArrPacket) => {
    // Decipher ITP packet received from client
    let version = byteArrPacket.slice(0, 3).readInt16BE();
    let reqType = byteArrPacket.slice(3, 4).readInt8();
    let imgName = byteArrPacket.slice(4).toString();

    return new ITPReqPacket(version, reqType, imgName);
  }
}