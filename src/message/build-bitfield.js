'use strict';

const Buffer = require('buffer').Buffer;

module.exports = function buildBitfield(bitfield) {
  const buf = Buffer.alloc(bitfield.length + 1 + 4);
  // length
  buf.writeUInt32BE(bitfield.length + 1, 0);
  // id
  buf.writeUInt8(5, 4);
  // bitfield
  bitfield.copy(buf, 5);
  return buf;
};
