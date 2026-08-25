'use strict';

const BLOCK_LEN = require('./constants');
const pieceLen = require('./piece-len');

module.exports = function blocksPerPiece(torrent, pieceIndex) {
  const pieceLength = pieceLen(torrent, pieceIndex);
  return Math.ceil(pieceLength / BLOCK_LEN);
};
