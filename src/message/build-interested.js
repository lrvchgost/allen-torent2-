'use strict';

const Buffer = require('buffer').Buffer;

module.exports = function buildInterested() {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(2, 4);
  return buf;
};
