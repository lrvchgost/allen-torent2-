'use strict';

const fs = require('fs');
const requestPiece = require('./request-piece');

module.exports = function pieceHandler(socket, pieces, queue, torrent, file, pieceResp) {
  pieces.printPercentDone();

  pieces.addReceived(pieceResp);

  const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
  const done = pieces.isDone();
  fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {
    if (done) {
      console.log('[download] DONE!');
      socket.end();
      try { fs.closeSync(file); } catch (e) {}
      process.exit(0);
    }
  });

  if (!done) {
    requestPiece(socket, pieces, queue);
  }
};
