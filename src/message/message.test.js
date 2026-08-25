'use strict';

jest.mock('../torrent-parser', () => ({
  infoHash: jest.fn(() => Buffer.alloc(20, 1))
}));

jest.mock('../util', () => ({
  genId: jest.fn(() => Buffer.concat([Buffer.from('-AT0001-'), Buffer.alloc(12, 2)]))
}));

const message = require('./index');

describe('buildHandshake', () => {
  test('builds a 68-byte handshake', () => {
    const buf = message.buildHandshake({ info: {} });
    expect(buf).toHaveLength(68);
    expect(buf.readUInt8(0)).toBe(19);
    expect(buf.toString('utf8', 1, 20)).toBe('BitTorrent protocol');
    expect(buf.slice(28, 48).equals(Buffer.alloc(20, 1))).toBe(true);
    expect(buf.slice(48, 68).toString('utf8', 0, 8)).toBe('-AT0001-');
  });
});

describe('buildKeepAlive', () => {
  test('builds a 4-byte zero-length message', () => {
    const buf = message.buildKeepAlive();
    expect(buf).toHaveLength(4);
    expect(buf.readUInt32BE(0)).toBe(0);
  });
});

describe('buildChoke', () => {
  test('builds a message with id 0', () => {
    const buf = message.buildChoke();
    expect(buf.readUInt32BE(0)).toBe(1);
    expect(buf.readUInt8(4)).toBe(0);
  });
});

describe('buildUnchoke', () => {
  test('builds a message with id 1', () => {
    const buf = message.buildUnchoke();
    expect(buf.readUInt8(4)).toBe(1);
  });
});

describe('buildInterested', () => {
  test('builds a message with id 2', () => {
    expect(message.buildInterested().readUInt8(4)).toBe(2);
  });
});

describe('buildUninterested', () => {
  test('builds a message with id 3', () => {
    expect(message.buildUninterested().readUInt8(4)).toBe(3);
  });
});

describe('buildHave', () => {
  test('builds a message with the piece index', () => {
    const buf = message.buildHave(7);
    expect(buf.readUInt32BE(0)).toBe(5);
    expect(buf.readUInt8(4)).toBe(4);
    expect(buf.readUInt32BE(5)).toBe(7);
  });
});

describe('buildBitfield', () => {
  test('builds a message with the bitfield payload', () => {
    const bitfield = Buffer.from([0xff, 0x00]);
    const buf = message.buildBitfield(bitfield);
    expect(buf).toHaveLength(7);
    expect(buf.readUInt32BE(0)).toBe(3);
    expect(buf.readUInt8(4)).toBe(5);
    expect(buf.slice(5).equals(bitfield)).toBe(true);
  });
});

describe('buildRequest', () => {
  test('builds a message with index, begin and length', () => {
    const buf = message.buildRequest({ index: 2, begin: 16384, length: 16384 });
    expect(buf.readUInt32BE(0)).toBe(13);
    expect(buf.readUInt8(4)).toBe(6);
    expect(buf.readUInt32BE(5)).toBe(2);
    expect(buf.readUInt32BE(9)).toBe(16384);
    expect(buf.readUInt32BE(13)).toBe(16384);
  });
});

describe('buildPiece', () => {
  test('builds a message with index, begin and block', () => {
    const block = Buffer.from('hello');
    const buf = message.buildPiece({ index: 1, begin: 0, block });
    expect(buf.readUInt32BE(0)).toBe(block.length + 9);
    expect(buf.readUInt8(4)).toBe(7);
    expect(buf.readUInt32BE(5)).toBe(1);
    expect(buf.readUInt32BE(9)).toBe(0);
    expect(buf.slice(13).equals(block)).toBe(true);
  });
});

describe('buildCancel', () => {
  test('builds a message with index, begin and length', () => {
    const buf = message.buildCancel({ index: 2, begin: 16384, length: 16384 });
    expect(buf.readUInt8(4)).toBe(8);
    expect(buf.readUInt32BE(5)).toBe(2);
  });
});

describe('buildPort', () => {
  test('builds a message with the listen port', () => {
    const buf = message.buildPort(6881);
    expect(buf.readUInt32BE(0)).toBe(3);
    expect(buf.readUInt8(4)).toBe(9);
    expect(buf.readUInt16BE(5)).toBe(6881);
  });
});

describe('parse', () => {
  test('parses a keep-alive message', () => {
    const parsed = message.parse(Buffer.alloc(4));
    expect(parsed.size).toBe(0);
    expect(parsed.id).toBeNull();
    expect(parsed.payload).toBeNull();
  });

  test('parses a have message', () => {
    const parsed = message.parse(message.buildHave(9));
    expect(parsed.id).toBe(4);
    expect(parsed.payload.readUInt32BE(0)).toBe(9);
  });

  test('parses a request message', () => {
    const parsed = message.parse(message.buildRequest({ index: 3, begin: 0, length: 16384 }));
    expect(parsed.id).toBe(6);
    expect(parsed.payload.index).toBe(3);
    expect(parsed.payload.begin).toBe(0);
    expect(parsed.payload.length.readUInt32BE(0)).toBe(16384);
  });

  test('parses a piece message', () => {
    const block = Buffer.from('data');
    const parsed = message.parse(message.buildPiece({ index: 5, begin: 10, block }));
    expect(parsed.id).toBe(7);
    expect(parsed.payload.index).toBe(5);
    expect(parsed.payload.begin).toBe(10);
    expect(parsed.payload.block.equals(block)).toBe(true);
  });

  test('parses a cancel message', () => {
    const parsed = message.parse(message.buildCancel({ index: 4, begin: 1, length: 2 }));
    expect(parsed.id).toBe(8);
    expect(parsed.payload.index).toBe(4);
  });
});
