'use strict';

const tp = require('./index');
const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');

describe('BLOCK_LEN', () => {
  test('is 16 KiB', () => {
    expect(tp.BLOCK_LEN).toBe(16384);
  });
});

describe('open', () => {
  afterEach(() => jest.restoreAllMocks());

  test('decodes the file', () => {
    const info = { length: 10, 'piece length': 4 };
    const encoded = bencode.encode({ info });
    jest.spyOn(fs, 'readFileSync').mockReturnValue(encoded);

    const result = tp.open('foo.torrent');
    expect(result.info.length).toBe(10);
    expect(result.info['piece length']).toBe(4);
  });
});

describe('infoHash', () => {
  test('is sha1 of bencoded info', () => {
    const info = { length: 10 };
    const torrent = { info };
    const expected = crypto.createHash('sha1').update(bencode.encode(info)).digest();
    expect(tp.infoHash(torrent)).toEqual(expected);
  });
});

describe('size', () => {
  test('of a single-file torrent', () => {
    const torrent = { info: { length: 42 } };
    const buf = tp.size(torrent);
    expect(buf).toHaveLength(8);
    expect(buf.readBigUInt64BE(0)).toBe(42n);
  });

  test('sums multi-file lengths', () => {
    const torrent = { info: { files: [{ length: 10 }, { length: 20 }, { length: 5 }] } };
    expect(tp.size(torrent).readBigUInt64BE(0)).toBe(35n);
  });
});

describe('pieceLen', () => {
  test('returns full piece length for regular pieces', () => {
    const torrent = { info: { length: 1000, 'piece length': 100 } };
    expect(tp.pieceLen(torrent, 0)).toBe(100);
    expect(tp.pieceLen(torrent, 5)).toBe(100);
  });

  test('returns remainder for the last piece', () => {
    const torrent = { info: { length: 250, 'piece length': 100 } };
    expect(tp.pieceLen(torrent, 2)).toBe(50);
    expect(tp.pieceLen(torrent, 0)).toBe(100);
  });
});

describe('blocksPerPiece', () => {
  test('computes the number of blocks', () => {
    const torrent = { info: { length: 200000, 'piece length': 65536 } };
    expect(tp.blocksPerPiece(torrent, 0)).toBe(4);
  });
});

describe('blockLen', () => {
  test('returns BLOCK_LEN except for the last block', () => {
    const torrent = { info: { length: 200000, 'piece length': 50000 } };
    expect(tp.blockLen(torrent, 0, 0)).toBe(16384);
    expect(tp.blockLen(torrent, 0, 3)).toBe(848);
  });
});
