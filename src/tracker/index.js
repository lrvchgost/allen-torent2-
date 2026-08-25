'use strict';

const dgram = require('dgram');
const udpSend = require('./udp-send');
const buildConnReq = require('./build-conn-req');
const respType = require('./resp-type');
const parseConnResp = require('./parse-conn-resp');
const buildAnnounceReq = require('./build-announce-req');
const parseAnnounceResp = require('./parse-announce-resp');
const getAnnounceUrls = require('./get-announce-urls');
const httpGetPeers = require('./http');

const UDP_TIMEOUT = 8000;

function udpGetPeers(url, torrent, callback) {
  const socket = dgram.createSocket('udp4');
  let done = false;

  const finish = (err, peers) => {
    if (done) {
      return;
    }
    done = true;
    clearTimeout(timer);
    socket.close();
    callback(err, peers);
  };

  const timer = setTimeout(() => finish(new Error('timeout')), UDP_TIMEOUT);

  socket.on('error', err => finish(err));

  console.log('[tracker] udp connect ->', url);
  udpSend(socket, buildConnReq(), url);

  socket.on('message', response => {
    if (respType(response) === 'connect') {
      const connResp = parseConnResp(response);
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      console.log('[tracker] udp announce ->', url);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === 'announce') {
      const announceResp = parseAnnounceResp(response);
      finish(null, announceResp.peers);
    }
  });
}

module.exports.getPeers = (torrent, callback) => {
  const urls = getAnnounceUrls(torrent);
  console.log('[tracker] announce urls:', urls.join(', '));

  const tryNext = index => {
    if (index >= urls.length) {
      callback([]);
      return;
    }

    const url = urls[index];
    console.log('[tracker] trying', url);

    if (url.startsWith('http')) {
      httpGetPeers(url, torrent, (err, peers) => {
        if (err) {
          console.error('[tracker]', url, 'failed:', err.message);
          tryNext(index + 1);
        } else {
          console.log('[tracker]', url, 'returned', peers.length, 'peers');
          callback(peers);
        }
      });
    } else {
      udpGetPeers(url, torrent, (err, peers) => {
        if (err) {
          console.error('[tracker]', url, 'failed:', err.message);
          tryNext(index + 1);
        } else {
          console.log('[tracker]', url, 'returned', peers.length, 'peers');
          callback(peers);
        }
      });
    }
  };

  tryNext(0);
};
