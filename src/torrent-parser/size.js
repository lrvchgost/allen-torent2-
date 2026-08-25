'use strict';

module.exports = function size(torrent) {
  const size = torrent.info.files ?
    torrent.info.files.map(file => file.length).reduce((a, b) => a + b) :
    torrent.info.length;

  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(size));
  return buf;
};
