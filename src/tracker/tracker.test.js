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
    send: jest.fn(),
    close: jest.fn()
  }))
}));

jest.mock('./http', () => jest.fn());

const dgram = require('dgram');
const httpGetPeers = require('./http');
const tracker = require('./index');

function buildConnResp() {
  const buf = Buffer.alloc(16);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(0x11111111, 4);
  buf.writeUInt32BE(0x01020304, 8);
  buf.writeUInt32BE(0x05060708, 12);
  return buf;
}

function buildAnnResp() {
  const buf = Buffer.alloc(20 + 6);
  buf.writeUInt32BE(1, 0);
  buf.writeUInt32BE(0x22222222, 4);
  buf.writeUInt32BE(0, 8);
  buf.writeUInt32BE(1, 12);
  buf.writeUInt8(127, 20);
  buf.writeUInt8(0, 21);
  buf.writeUInt8(0, 22);
  buf.writeUInt8(1, 23);
  buf.writeUInt16BE(6881, 24);
  return buf;
}

describe('getPeers', () => {
  beforeEach(() => {
    dgram.createSocket.mockClear();
    httpGetPeers.mockClear();
  });

  test('sends connect then announce and returns peers', (done) => {
    const torrent = { announce: Buffer.from('udp://example.com:1337') };

    tracker.getPeers(torrent, (peers) => {
      expect(peers).toEqual([{ ip: '127.0.0.1', port: 6881 }]);
      done();
    });

    const socket = dgram.createSocket.mock.results[0].value;
    const handler = socket.on.mock.calls.find(c => c[0] === 'message')[1];

    handler(buildConnResp());
    handler(buildAnnResp());
  });

  test('falls back to next tracker when http tracker fails', (done) => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    httpGetPeers
      .mockImplementationOnce((url, torrent, cb) => cb(new Error('failure reason')))
      .mockImplementationOnce((url, torrent, cb) => cb(null, [{ ip: '10.0.0.1', port: 1234 }]));

    const torrent = {
      announce: Buffer.from('http://first/ann'),
      'announce-list': [[Buffer.from('http://second/ann')]]
    };

    tracker.getPeers(torrent, (peers) => {
      expect(peers).toEqual([{ ip: '10.0.0.1', port: 1234 }]);
      errorSpy.mockRestore();
      done();
    });
  });

  test('falls back to next udp tracker on error', (done) => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const torrent = {
      announce: Buffer.from('udp://first:1111'),
      'announce-list': [[Buffer.from('udp://second:2222')]]
    };

    tracker.getPeers(torrent, (peers) => {
      expect(peers).toEqual([{ ip: '127.0.0.1', port: 6881 }]);
      errorSpy.mockRestore();
      done();
    });

    const socket1 = dgram.createSocket.mock.results[0].value;
    const errHandler = socket1.on.mock.calls.find(c => c[0] === 'error')[1];
    errHandler(new Error('boom'));

    const socket2 = dgram.createSocket.mock.results[1].value;
    const handler2 = socket2.on.mock.calls.find(c => c[0] === 'message')[1];
    handler2(buildConnResp());
    handler2(buildAnnResp());
  });

  test('falls back to next udp tracker on timeout', (done) => {
    jest.useFakeTimers();

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const torrent = {
      announce: Buffer.from('udp://first:1111'),
      'announce-list': [[Buffer.from('udp://second:2222')]]
    };

    tracker.getPeers(torrent, (peers) => {
      jest.useRealTimers();
      expect(peers).toEqual([{ ip: '127.0.0.1', port: 6881 }]);
      errorSpy.mockRestore();
      done();
    });

    jest.advanceTimersByTime(8000);

    const socket2 = dgram.createSocket.mock.results[1].value;
    const handler2 = socket2.on.mock.calls.find(c => c[0] === 'message')[1];
    handler2(buildConnResp());
    handler2(buildAnnResp());
  });
});
