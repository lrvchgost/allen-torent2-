'use strict';

const message = require('../message');
const REQUEST_TIMEOUT = require('./request-timeout');

module.exports = function requestPiece(socket, pieces, queue) {
  if (queue.choked) {
    return null;
  }

  if (queue.length() === 0 && !pieces.isDone()) {
    const indexes = [...new Set(pieces.expiredBlocks(REQUEST_TIMEOUT).map(b => b.index))];
    indexes.forEach(i => queue.queue(i));
  }

  while (queue.length()) {
    const pieceBlock = queue.deque();
    if (pieces.needed(pieceBlock)) {
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }
};
