'use strict';

const tp = require('../torrent-parser');

module.exports = function buildPiecesArray(torrent) {
  const nPieces = torrent.info.pieces.length / 20;
  const arr = new Array(nPieces).fill(null);
  return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(false));
};
