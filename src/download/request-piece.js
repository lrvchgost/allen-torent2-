'use strict';

const message = require('../message');

module.exports = function requestPiece(socket, pieces, queue) {
  if (queue.choked) {
    return null;
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
