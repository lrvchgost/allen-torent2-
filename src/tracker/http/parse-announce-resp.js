'use strict';

const bencode = require('bencode');
const group = require('../group');

module.exports = function parseAnnounceResp(resp) {
  const decoded = bencode.decode(resp);

  if (!decoded || typeof decoded !== 'object' || Buffer.isBuffer(decoded)) {
    throw new Error('Invalid bencode response');
  }

  const failureReason = decoded['failure reason'] ? decoded['failure reason'].toString() : null;
  const peers = Buffer.isBuffer(decoded.peers)
    ? group(decoded.peers, 6).map(address => ({
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4)
      }))
    : [];

  return { failureReason, peers };
};
