'use strict';

const tp = require('../torrent-parser');
const buildPiecesArray = require('./build-pieces-array');
const percentDone = require('./percent-done');

module.exports = class {
  constructor(torrent) {
    this._requested = buildPiecesArray(torrent);
    this._received = buildPiecesArray(torrent);
  }

  addRequested(pieceBlock) {
    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    this._requested[pieceBlock.index][blockIndex] = true;
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

  isDone() {
    return this._received.every(blocks => blocks.every(i => i));
  }

  printPercentDone() {
    process.stdout.write('progress: ' + percentDone(this._received) + '%\r');
  }
};
