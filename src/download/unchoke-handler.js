'use strict';

const requestPiece = require('./request-piece');

module.exports = function unchokeHandler(socket, pieces, queue) {
  queue.choked = false;
  requestPiece(socket, pieces, queue);
};
