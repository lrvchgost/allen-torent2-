'use strict';

const message = require('../message');
const isHandshake = require('./is-handshake');
const chokeHandler = require('./choke-handler');
const unchokeHandler = require('./unchoke-handler');
const haveHandler = require('./have-handler');
const bitfieldHandler = require('./bitfield-handler');
const pieceHandler = require('./piece-handler');

module.exports = function msgHandler(msg, socket, pieces, queue, torrent, file) {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested());
  } else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler(socket);
    if (m.id === 1) unchokeHandler(socket, pieces, queue);
    if (m.id === 4) haveHandler(socket, pieces, queue, m.payload);
    if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload);
    if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, file, m.payload);
  }
};
