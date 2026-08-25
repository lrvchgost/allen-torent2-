'use strict';

module.exports = {
  BLOCK_LEN: require('./constants'),
  open: require('./open'),
  infoHash: require('./info-hash'),
  size: require('./size'),
  pieceLen: require('./piece-len'),
  blocksPerPiece: require('./blocks-per-piece'),
  blockLen: require('./block-len')
};
