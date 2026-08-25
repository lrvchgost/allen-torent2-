'use strict';

module.exports = function chokeHandler(socket) {
  socket.end();
};
