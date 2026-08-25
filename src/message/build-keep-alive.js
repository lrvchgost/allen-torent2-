'use strict';

const Buffer = require('buffer').Buffer;

module.exports = function buildKeepAlive() {
  return Buffer.alloc(4);
};
