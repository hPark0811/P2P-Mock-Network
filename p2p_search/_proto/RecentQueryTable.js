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

module.exports = RecentQueryTable;