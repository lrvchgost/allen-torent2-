'use strict';

jest.mock('../torrent-parser', () => ({
  BLOCK_LEN: 16384,
  blocksPerPiece: jest.fn(() => 2),
  blockLen: jest.fn((torrent, pieceIndex, blockIndex) => (blockIndex === 1 ? 1000 : 16384))
}));

const Queue = require('./index');

const makeTorrent = () => ({ info: {} });

describe('constructor', () => {
  test('is choked by default', () => {
    expect(new Queue(makeTorrent()).choked).toBe(true);
  });
});

describe('queue', () => {
  test('generates blocks with correct begin/length', () => {
    const q = new Queue(makeTorrent());
    q.queue(3);
    expect(q.length()).toBe(2);
    expect(q.peek()).toEqual({ index: 3, begin: 0, length: 16384 });
  });
});

describe('deque', () => {
  test('removes and returns the first block', () => {
    const q = new Queue(makeTorrent());
    q.queue(0);

    expect(q.deque()).toEqual({ index: 0, begin: 0, length: 16384 });
    expect(q.peek()).toEqual({ index: 0, begin: 16384, length: 1000 });
    expect(q.length()).toBe(1);
  });
});

describe('peek', () => {
  test('returns the first block without removing it', () => {
    const q = new Queue(makeTorrent());
    q.queue(0);
    expect(q.peek()).toEqual({ index: 0, begin: 0, length: 16384 });
    expect(q.length()).toBe(2);
  });
});

describe('length', () => {
  test('is 0 for an empty queue', () => {
    expect(new Queue(makeTorrent()).length()).toBe(0);
  });
});
