'use strict';

const requestPiece = require('./request-piece');

module.exports = function unchokeHandler(socket, pieces, queue) {
  queue.choked = false;
  console.log('[download] unchoked, requesting blocks');
  requestPiece(socket, pieces, queue);
};
