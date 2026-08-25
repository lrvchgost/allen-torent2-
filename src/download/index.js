'use strict';

const fs = require('fs');
const tracker = require('../tracker');
const Pieces = require('../pieces');
const Queue = require('../queue');
const download = require('./download');

module.exports = (torrent, path) => {
  tracker.getPeers(torrent, peers => {
    const pieces = new Pieces(torrent);
    const file = fs.openSync(path, 'w');
    peers.forEach(peer => download(peer, torrent, pieces, file));
  });
};
