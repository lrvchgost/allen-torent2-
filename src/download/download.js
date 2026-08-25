'use strict';

const net = require('net');
const message = require('../message');
const Queue = require('../queue');
const onWholeMsg = require('./on-whole-msg');
const msgHandler = require('./msg-handler');

module.exports = function download(peer, torrent, pieces, file) {
  const socket = new net.Socket();
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });
  const queue = new Queue(torrent);
  onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue, torrent, file));
};
