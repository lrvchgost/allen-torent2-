'use strict';

const urlParse = require('url').parse;

module.exports = function udpSend(socket, message, rawUrl, callback = () => {}) {
  const url = urlParse(rawUrl);
  socket.send(message, 0, message.length, url.port, url.hostname, callback);
};
