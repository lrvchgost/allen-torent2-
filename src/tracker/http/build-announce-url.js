'use strict';

const torrentParser = require('../../torrent-parser');
const util = require('../../util');

function encodeBinary(buf) {
  let out = '';
  for (const byte of buf) {
    out += '%' + byte.toString(16).padStart(2, '0');
  }
  return out;
}

module.exports = function buildAnnounceUrl(announceUrl, torrent, port = 6881) {
  const infoHash = torrentParser.infoHash(torrent);
  const peerId = util.genId();
  const left = torrentParser.size(torrent).readBigUInt64BE(0).toString();

  const params = [
    'info_hash=' + encodeBinary(infoHash),
    'peer_id=' + encodeBinary(peerId),
    'port=' + port,
    'uploaded=0',
    'downloaded=0',
    'left=' + left,
    'compact=1',
    'event=started'
  ];

  const sep = announceUrl.includes('?') ? '&' : '?';
  return announceUrl + sep + params.join('&');
};
