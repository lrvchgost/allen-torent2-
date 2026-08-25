'use strict';

const size = require('./size');

module.exports = function pieceLen(torrent, pieceIndex) {
  const totalLength = Number(size(torrent).readBigUInt64BE());
  const pieceLength = torrent.info['piece length'];

  const lastPieceLength = totalLength % pieceLength;
  const lastPieceIndex = Math.floor(totalLength / pieceLength);

  return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
};
