'use strict';

jest.mock('../torrent-parser', () => ({
  infoHash: jest.fn(() => Buffer.alloc(20, 3)),
  size: jest.fn(() => Buffer.alloc(8))
}));

jest.mock('../util', () => ({
  genId: jest.fn(() => Buffer.alloc(20))
}));

jest.mock('dgram', () => ({
  createSocket: jest.fn(() => ({
    on: jest.fn(),
    send: jest.fn()
  }))
}));

const dgram = require('dgram');
const tracker = require('./index');

describe('getPeers', () => {
  beforeEach(() => {
    dgram.createSocket.mockClear();
  });

  test('sends connect then announce and returns peers', (done) => {
    const torrent = { announce: Buffer.from('udp://example.com:1337') };

    tracker.getPeers(torrent, (peers) => {
      expect(peers).toEqual([{ ip: '127.0.0.1', port: 6881 }]);
      done();
    });

    const socket = dgram.createSocket.mock.results[0].value;
    const handler = socket.on.mock.calls.find(c => c[0] === 'message')[1];

    const connResp = Buffer.alloc(16);
    connResp.writeUInt32BE(0, 0);
    connResp.writeUInt32BE(0x11111111, 4);
    connResp.writeUInt32BE(0x01020304, 8);
    connResp.writeUInt32BE(0x05060708, 12);

    handler(connResp);

    const annResp = Buffer.alloc(20 + 6);
    annResp.writeUInt32BE(1, 0);
    annResp.writeUInt32BE(0x22222222, 4);
    annResp.writeUInt32BE(0, 8);
    annResp.writeUInt32BE(1, 12);
    annResp.writeUInt8(127, 20);
    annResp.writeUInt8(0, 21);
    annResp.writeUInt8(0, 22);
    annResp.writeUInt8(1, 23);
    annResp.writeUInt16BE(6881, 24);

    handler(annResp);
  });
});
