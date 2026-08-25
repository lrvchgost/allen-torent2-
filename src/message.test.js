'use strict';

jest.mock('./torrent-parser', () => ({
  infoHash: jest.fn(() => Buffer.alloc(20, 1))
}));

jest.mock('./util', () => ({
  genId: jest.fn(() => Buffer.concat([Buffer.from('-AT0001-'), Buffer.alloc(12, 2)]))
}));

const message = require('./message');

describe('message builders', () => {
  test('buildHandshake', () => {
    const buf = message.buildHandshake({ info: {} });
    expect(buf).toHaveLength(68);
    expect(buf.readUInt8(0)).toBe(19);
    expect(buf.toString('utf8', 1, 20)).toBe('BitTorrent protocol');
    expect(buf.slice(28, 48).equals(Buffer.alloc(20, 1))).toBe(true);
    expect(buf.slice(48, 68).toString('utf8', 0, 8)).toBe('-AT0001-');
  });

  test('buildKeepAlive', () => {
    const buf = message.buildKeepAlive();
    expect(buf).toHaveLength(4);
    expect(buf.readUInt32BE(0)).toBe(0);
  });

  test('buildChoke', () => {
    const buf = message.buildChoke();
    expect(buf.readUInt32BE(0)).toBe(1);
    expect(buf.readUInt8(4)).toBe(0);
  });

  test('buildUnchoke', () => {
    const buf = message.buildUnchoke();
    expect(buf.readUInt8(4)).toBe(1);
  });

  test('buildInterested', () => {
    expect(message.buildInterested().readUInt8(4)).toBe(2);
  });

  test('buildUninterested', () => {
    expect(message.buildUninterested().readUInt8(4)).toBe(3);
  });

  test('buildHave', () => {
    const buf = message.buildHave(7);
    expect(buf.readUInt32BE(0)).toBe(5);
    expect(buf.readUInt8(4)).toBe(4);
    expect(buf.readUInt32BE(5)).toBe(7);
  });

  test('buildBitfield', () => {
    const bitfield = Buffer.from([0xff, 0x00]);
    const buf = message.buildBitfield(bitfield);
    expect(buf).toHaveLength(7);
    expect(buf.readUInt32BE(0)).toBe(3);
    expect(buf.readUInt8(4)).toBe(5);
    expect(buf.slice(5).equals(bitfield)).toBe(true);
  });

  test('buildRequest', () => {
    const buf = message.buildRequest({ index: 2, begin: 16384, length: 16384 });
    expect(buf.readUInt32BE(0)).toBe(13);
    expect(buf.readUInt8(4)).toBe(6);
    expect(buf.readUInt32BE(5)).toBe(2);
    expect(buf.readUInt32BE(9)).toBe(16384);
    expect(buf.readUInt32BE(13)).toBe(16384);
  });

  test('buildPiece', () => {
    const block = Buffer.from('hello');
    const buf = message.buildPiece({ index: 1, begin: 0, block });
    expect(buf.readUInt32BE(0)).toBe(block.length + 9);
    expect(buf.readUInt8(4)).toBe(7);
    expect(buf.readUInt32BE(5)).toBe(1);
    expect(buf.readUInt32BE(9)).toBe(0);
    expect(buf.slice(13).equals(block)).toBe(true);
  });

  test('buildCancel', () => {
    const buf = message.buildCancel({ index: 2, begin: 16384, length: 16384 });
    expect(buf.readUInt8(4)).toBe(8);
    expect(buf.readUInt32BE(5)).toBe(2);
  });

  test('buildPort', () => {
    const buf = message.buildPort(6881);
    expect(buf.readUInt32BE(0)).toBe(3);
    expect(buf.readUInt8(4)).toBe(9);
    expect(buf.readUInt16BE(5)).toBe(6881);
  });
});

describe('message.parse', () => {
  test('keep-alive', () => {
    const parsed = message.parse(Buffer.alloc(4));
    expect(parsed.size).toBe(0);
    expect(parsed.id).toBeNull();
    expect(parsed.payload).toBeNull();
  });

  test('have', () => {
    const parsed = message.parse(message.buildHave(9));
    expect(parsed.id).toBe(4);
    expect(parsed.payload.readUInt32BE(0)).toBe(9);
  });

  test('request', () => {
    const parsed = message.parse(message.buildRequest({ index: 3, begin: 0, length: 16384 }));
    expect(parsed.id).toBe(6);
    expect(parsed.payload.index).toBe(3);
    expect(parsed.payload.begin).toBe(0);
    expect(parsed.payload.length.readUInt32BE(0)).toBe(16384);
  });

  test('piece', () => {
    const block = Buffer.from('data');
    const parsed = message.parse(message.buildPiece({ index: 5, begin: 10, block }));
    expect(parsed.id).toBe(7);
    expect(parsed.payload.index).toBe(5);
    expect(parsed.payload.begin).toBe(10);
    expect(parsed.payload.block.equals(block)).toBe(true);
  });

  test('cancel', () => {
    const parsed = message.parse(message.buildCancel({ index: 4, begin: 1, length: 2 }));
    expect(parsed.id).toBe(8);
    expect(parsed.payload.index).toBe(4);
  });
});
