'use strict';

const dgram = require('dgram');
const udpSend = require('./udp-send');
const buildConnReq = require('./build-conn-req');
const respType = require('./resp-type');
const parseConnResp = require('./parse-conn-resp');
const buildAnnounceReq = require('./build-announce-req');
const parseAnnounceResp = require('./parse-announce-resp');

module.exports.getPeers = (torrent, callback) => {
  const socket = dgram.createSocket('udp4');
  const url = torrent.announce.toString('utf8');

  // 1. send connect request
  udpSend(socket, buildConnReq(), url);

  socket.on('message', response => {
    if (respType(response) === 'connect') {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === 'announce') {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });
};
