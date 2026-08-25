'use strict';

const tp = require('../torrent-parser');

module.exports = function buildBlock(torrent, pieceIndex, blockIndex) {
  return {
    index: pieceIndex,
    begin: blockIndex * tp.BLOCK_LEN,
    length: tp.blockLen(torrent, pieceIndex, blockIndex)
  };
};
