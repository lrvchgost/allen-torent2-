'use strict';

module.exports = function chokeHandler(socket) {
  console.log('[download] choked, closing connection');
  socket.end();
};
