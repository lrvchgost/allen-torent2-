'use strict';

const buildAnnounceUrl = require('./build-announce-url');
const parseAnnounceResp = require('./parse-announce-resp');

const HTTP_TIMEOUT = 8000;

module.exports = function getPeers(announceUrl, torrent, callback) {
  const transport = announceUrl.startsWith('https') ? require('https') : require('http');
  const url = buildAnnounceUrl(announceUrl, torrent);
  let done = false;

  const finish = (err, peers) => {
    if (done) {
      return;
    }
    done = true;
    callback(err, peers);
  };

  console.log('[tracker] http announce ->', announceUrl);

  const req = transport.get(url, res => {
    if (res.statusCode !== 200) {
      res.resume();
      finish(new Error('HTTP status ' + res.statusCode));
      return;
    }

    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      try {
        const { failureReason, peers } = parseAnnounceResp(Buffer.concat(chunks));
        if (failureReason) {
          finish(new Error(failureReason));
        } else {
          finish(null, peers);
        }
      } catch (err) {
        finish(err);
      }
    });
  });

  req.on('error', err => finish(err));
  req.setTimeout(HTTP_TIMEOUT, () => req.destroy(new Error('HTTP timeout')));
};
