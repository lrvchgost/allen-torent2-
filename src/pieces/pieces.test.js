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

describe('pendingBlocks', () => {
  test('returns every block for a fresh torrent', () => {
    const p = new Pieces(makeTorrent());
    expect(p.pendingBlocks()).toHaveLength(8);
  });

  test('excludes received blocks', () => {
    const p = new Pieces(makeTorrent());
    p.addReceived({ index: 0, begin: 0 });
    p.addReceived({ index: 0, begin: 16384 });
    const pending = p.pendingBlocks();
    expect(pending).toHaveLength(6);
    expect(pending).not.toContainEqual({ index: 0, begin: 0 });
    expect(pending).toContainEqual({ index: 0, begin: 32768 });
  });

  test('is empty when done', () => {
    const p = new Pieces(makeTorrent());
    for (let i = 0; i < 2; i++) {
      for (let b = 0; b < 4; b++) {
        p.addReceived({ index: i, begin: b * 16384 });
      }
    }
    expect(p.pendingBlocks()).toHaveLength(0);
  });
});

describe('expiredBlocks', () => {
  test('returns never-requested blocks immediately', () => {
    const p = new Pieces(makeTorrent());
    expect(p.expiredBlocks(5000)).toHaveLength(8);
  });

  test('returns requested blocks only after the timeout', () => {
    jest.useFakeTimers();
    const p = new Pieces(makeTorrent());
    p.addRequested({ index: 0, begin: 0 });
    p.addReceived({ index: 0, begin: 16384 });
    p.addRequested({ index: 0, begin: 16384 });

    expect(p.expiredBlocks(5000)).toHaveLength(6);

    jest.advanceTimersByTime(4999);
    expect(p.expiredBlocks(5000)).toHaveLength(6);

    jest.advanceTimersByTime(1);
    const expired = p.expiredBlocks(5000);
    expect(expired).toHaveLength(7);
    expect(expired).toContainEqual({ index: 0, begin: 0 });

    jest.useRealTimers();
  });

  test('is empty when all blocks are received', () => {
    const p = new Pieces(makeTorrent());
    for (let i = 0; i < 2; i++) {
      for (let b = 0; b < 4; b++) {
        p.addReceived({ index: i, begin: b * 16384 });
      }
    }
    expect(p.expiredBlocks(5000)).toHaveLength(0);
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
