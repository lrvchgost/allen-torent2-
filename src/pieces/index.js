'use strict';

const tp = require('../torrent-parser');
const buildPiecesArray = require('./build-pieces-array');
const percentDone = require('./percent-done');

module.exports = class {
  constructor(torrent) {
    this._requested = buildPiecesArray(torrent);
    this._received = buildPiecesArray(torrent);
    this._requestedAt = buildPiecesArray(torrent);
  }

  addRequested(pieceBlock) {
    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    this._requested[pieceBlock.index][blockIndex] = true;
    this._requestedAt[pieceBlock.index][blockIndex] = Date.now();
  }

  addReceived(pieceBlock) {
    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    this._received[pieceBlock.index][blockIndex] = true;
  }

  needed(pieceBlock) {
    if (this._requested.every(blocks => blocks.every(i => i))) {
      this._requested = this._received.map(blocks => blocks.slice());
    }
    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    return !this._requested[pieceBlock.index][blockIndex];
  }

  pendingBlocks() {
    const blocks = [];
    this._received.forEach((pieceBlocks, pieceIndex) => {
      pieceBlocks.forEach((received, blockIndex) => {
        if (!received) blocks.push({ index: pieceIndex, begin: blockIndex * tp.BLOCK_LEN });
      });
    });
    return blocks;
  }

  expiredBlocks(timeout) {
    const now = Date.now();
    return this.pendingBlocks().filter(block => {
      const blockIndex = block.begin / tp.BLOCK_LEN;
      const requestedAt = this._requestedAt[block.index][blockIndex];
      return requestedAt === 0 || now - requestedAt >= timeout;
    });
  }

  isDone() {
    return this._received.every(blocks => blocks.every(i => i));
  }

  printPercentDone() {
    process.stdout.write('progress: ' + percentDone(this._received) + '%\r');
  }
};
