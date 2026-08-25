'use strict';

const tp = require('../torrent-parser');

function buildPiecesArray(torrent) {
  const nPieces = torrent.info.pieces.length / 20;
  const arr = new Array(nPieces).fill(null);
  return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(false));
}

function percentDone(received) {
  const downloaded = received.reduce((totalBlocks, blocks) => {
    return blocks.filter(i => i).length + totalBlocks;
  }, 0);

  const total = received.reduce((totalBlocks, blocks) => {
    return blocks.length + totalBlocks;
  }, 0);

  return Math.floor(downloaded / total * 100);
}

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
