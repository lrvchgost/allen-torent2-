'use strict';

jest.mock('./torrent-parser', () => ({
  BLOCK_LEN: 16384,
  blocksPerPiece: jest.fn(() => 1),
  blockLen: jest.fn(() => 16384)
}));

jest.mock('./tracker', () => ({
  getPeers: jest.fn()
}));

jest.mock('./message', () => ({
  buildHandshake: jest.fn(() => Buffer.from('HANDSHAKE')),
  buildInterested: jest.fn(() => Buffer.from('INTERESTED')),
  buildRequest: jest.fn(() => Buffer.from('REQUEST')),
  parse: jest.fn()
}));

jest.mock('fs', () => ({
  openSync: jest.fn(() => 42),
  write: jest.fn(),
  closeSync: jest.fn()
}));

jest.mock('net', () => ({
  Socket: jest.fn()
}));

const fs = require('fs');
const net = require('net');
const tracker = require('./tracker');
const message = require('./message');
const download = require('./download');

describe('download', () => {
  let socket;

  beforeEach(() => {
    socket = {
      on: jest.fn(),
      connect: jest.fn((port, ip, cb) => cb()),
      write: jest.fn(),
      end: jest.fn()
    };
    net.Socket.mockImplementation(() => socket);
    tracker.getPeers.mockImplementation((torrent, cb) => cb([{ ip: '1.2.3.4', port: 6881 }]));
  });

  const dataHandler = () => socket.on.mock.calls.find(c => c[0] === 'data')[1];

  test('connects to each peer and sends handshake', () => {
    download({ info: { name: 'file.bin', pieces: Buffer.alloc(40) } }, '/tmp/out.bin');

    expect(fs.openSync).toHaveBeenCalledWith('/tmp/out.bin', 'w');
    expect(net.Socket).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledWith(6881, '1.2.3.4', expect.any(Function));
    expect(socket.write).toHaveBeenCalledWith(Buffer.from('HANDSHAKE'));
    expect(socket.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('data', expect.any(Function));
  });

  test('sends interested after receiving handshake', () => {
    download({ info: { name: 'file.bin', pieces: Buffer.alloc(40) } }, '/tmp/out.bin');

    const hs = Buffer.alloc(68);
    hs.writeUInt8(19, 0);
    hs.write('BitTorrent protocol', 1);
    dataHandler()(hs);

    expect(socket.write).toHaveBeenCalledWith(Buffer.from('INTERESTED'));
  });

  test('choke message ends the socket', () => {
    message.parse.mockReturnValue({ id: 0, payload: null });
    download({ info: { name: 'file.bin', pieces: Buffer.alloc(40) } }, '/tmp/out.bin');

    const hs = Buffer.alloc(68);
    hs.writeUInt8(19, 0);
    hs.write('BitTorrent protocol', 1);
    dataHandler()(hs);

    dataHandler()(Buffer.alloc(4));
    expect(socket.end).toHaveBeenCalled();
  });
});
