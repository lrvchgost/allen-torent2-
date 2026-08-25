'use strict';

const tp = require('../torrent-parser');
const buildBlock = require('./build-block');

module.exports = class {
  constructor(torrent) {
    this._torrent = torrent;
    this._queue = [];
    this.choked = true;
  }

  queue(pieceIndex) {
    const nBlocks = tp.blocksPerPiece(this._torrent, pieceIndex);
    for (let i = 0; i < nBlocks; i++) {
      this._queue.push(buildBlock(this._torrent, pieceIndex, i));
    }
  }

  deque() { return this._queue.shift(); }

  peek() { return this._queue[0]; }

  length() { return this._queue.length; }
};
