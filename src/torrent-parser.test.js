'use strict';


const tp = require('./torrent-parser');
const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');

describe('torrent-parser', () => {
  afterEach(() => jest.restoreAllMocks());

  test('BLOCK_LEN is 16 KiB', () => {
    expect(tp.BLOCK_LEN).toBe(16384);
  });

  test('open decodes the file', () => {
    const info = { length: 10, 'piece length': 4 };
    const encoded = bencode.encode({ info });
    jest.spyOn(fs, 'readFileSync').mockReturnValue(encoded);

    const result = tp.open('foo.torrent');
    expect(result.info.length).toBe(10);
    expect(result.info['piece length']).toBe(4);
  });

  test('infoHash is sha1 of bencoded info', () => {
    const info = { length: 10 };
    const torrent = { info };
    const expected = crypto.createHash('sha1').update(bencode.encode(info)).digest();
    expect(tp.infoHash(torrent)).toEqual(expected);
  });

  test('size of a single-file torrent', () => {
    const torrent = { info: { length: 42 } };
    const buf = tp.size(torrent);
    expect(buf).toHaveLength(8);
    expect(buf.readBigUInt64BE(0)).toBe(42n);
  });

  test('size sums multi-file lengths', () => {
    const torrent = { info: { files: [{ length: 10 }, { length: 20 }, { length: 5 }] } };
    expect(tp.size(torrent).readBigUInt64BE(0)).toBe(35n);
  });

  test('pieceLen returns full piece length for regular pieces', () => {
    const torrent = { info: { length: 1000, 'piece length': 100 } };
    expect(tp.pieceLen(torrent, 0)).toBe(100);
    expect(tp.pieceLen(torrent, 5)).toBe(100);
  });

  test('pieceLen returns remainder for the last piece', () => {
    const torrent = { info: { length: 250, 'piece length': 100 } };
    expect(tp.pieceLen(torrent, 2)).toBe(50);
    expect(tp.pieceLen(torrent, 0)).toBe(100);
  });

  test('blocksPerPiece', () => {
    const torrent = { info: { length: 200000, 'piece length': 65536 } };
    expect(tp.blocksPerPiece(torrent, 0)).toBe(4);
  });

  test('blockLen returns BLOCK_LEN except for the last block', () => {
    const torrent = { info: { length: 200000, 'piece length': 50000 } };
    expect(tp.blockLen(torrent, 0, 0)).toBe(16384);
    expect(tp.blockLen(torrent, 0, 3)).toBe(848);
  });
});
