'use strict';

const net = require('net');
const message = require('../message');
const Queue = require('../queue');
const onWholeMsg = require('./on-whole-msg');
const msgHandler = require('./msg-handler');
const requestPiece = require('./request-piece');
const REQUEST_TIMEOUT = require('./request-timeout');

module.exports = function download(peer, torrent, pieces, file) {
  const socket = new net.Socket();
  socket.on('error', err => console.error('[download] socket error:', err.message));
  socket.connect(peer.port, peer.ip, () => {
    console.log('[download] connected to', peer.ip + ':' + peer.port);
    socket.write(message.buildHandshake(torrent));
  });
  const queue = new Queue(torrent);
  onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue, torrent, file));
  const retry = setInterval(() => requestPiece(socket, pieces, queue), REQUEST_TIMEOUT);
  retry.unref();
  socket.on('close', () => clearInterval(retry));
};
