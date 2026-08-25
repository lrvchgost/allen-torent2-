'use strict';

jest.mock('../torrent-parser', () => ({
  BLOCK_LEN: 16384,
  blocksPerPiece: jest.fn(() => 4)
}));

const Pieces = require('./index');

const makeTorrent = () => ({ info: { pieces: Buffer.alloc(40) } }); // 2 pieces

describe('constructor', () => {
  test('starts with nothing requested or received', () => {
    const p = new Pieces(makeTorrent());
    expect(p.isDone()).toBe(false);
    expect(p.needed({ index: 0, begin: 0 })).toBe(true);
  });
});

describe('addRequested', () => {
  test('marks a block as requested', () => {
    const p = new Pieces(makeTorrent());
    p.addRequested({ index: 0, begin: 0 });
    expect(p.needed({ index: 0, begin: 0 })).toBe(false);
    expect(p.needed({ index: 0, begin: 16384 })).toBe(true);
  });
});

describe('addReceived', () => {
  test('marks a block as received', () => {
    const p = new Pieces(makeTorrent());
    p.addReceived({ index: 0, begin: 0 });
    for (let b = 1; b < 4; b++) {
      p.addReceived({ index: 0, begin: b * 16384 });
    }
    for (let b = 0; b < 4; b++) {
      p.addReceived({ index: 1, begin: b * 16384 });
    }
    expect(p.isDone()).toBe(true);
  });
});

describe('needed', () => {
  test('is true for a fresh block', () => {
    const p = new Pieces(makeTorrent());
    expect(p.needed({ index: 0, begin: 0 })).toBe(true);
  });

  test('resets _requested from _received once everything is requested', () => {
    const p = new Pieces(makeTorrent());
    for (let i = 0; i < 2; i++) {
      for (let b = 0; b < 4; b++) {
        p.addRequested({ index: i, begin: b * 16384 });
      }
    }
    expect(p.needed({ index: 0, begin: 0 })).toBe(true);
  });
});

describe('isDone', () => {
  test('is false initially and true after all blocks received', () => {
    const p = new Pieces(makeTorrent());
    expect(p.isDone()).toBe(false);

    for (let i = 0; i < 2; i++) {
      for (let b = 0; b < 4; b++) {
        p.addReceived({ index: i, begin: b * 16384 });
      }
    }
    expect(p.isDone()).toBe(true);
  });
});

describe('printPercentDone', () => {
  test('writes progress', () => {
    const p = new Pieces(makeTorrent());
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    p.printPercentDone();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('progress: 0%'));
    spy.mockRestore();
  });
});
