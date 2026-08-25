'use strict';

const BLOCK_LEN = require('./constants');
const pieceLen = require('./piece-len');

module.exports = function blockLen(torrent, pieceIndex, blockIndex) {
  const pieceLength = pieceLen(torrent, pieceIndex);

  const lastPieceLength = pieceLength % BLOCK_LEN;
  const lastPieceIndex = Math.floor(pieceLength / BLOCK_LEN);

  return blockIndex === lastPieceIndex ? lastPieceLength : BLOCK_LEN;
};
