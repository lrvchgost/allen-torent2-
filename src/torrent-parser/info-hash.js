'use strict';

const bencode = require('bencode');
const crypto = require('crypto');

module.exports = function infoHash(torrent) {
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
};
