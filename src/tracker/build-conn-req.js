'use strict';

const Buffer = require('buffer').Buffer;
const crypto = require('crypto');

module.exports = function buildConnReq() {
  const buf = Buffer.allocUnsafe(16);

  // connection id
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);
  // action
  buf.writeUInt32BE(0, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
};
