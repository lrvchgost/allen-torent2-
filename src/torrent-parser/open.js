'use strict';

const fs = require('fs');
const bencode = require('bencode');

module.exports = function open(filepath) {
  return bencode.decode(fs.readFileSync(filepath));
};
