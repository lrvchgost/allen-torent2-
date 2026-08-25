'use strict';

jest.mock('./torrent-parser', () => ({
  BLOCK_LEN: 16384,
  blocksPerPiece: jest.fn(() => 4)
}));

const Pieces = require('./Pieces');

const makeTorrent = () => ({ info: { pieces: Buffer.alloc(40) } }); // 2 pieces

describe('Pieces', () => {
  test('needed is true for a fresh block', () => {
    const p = new Pieces(makeTorrent());
    expect(p.needed({ index: 0, begin: 0 })).toBe(true);
  });

  test('addRequested marks a block as not needed', () => {
    const p = new Pieces(makeTorrent());
    p.addRequested({ index: 0, begin: 0 });
    expect(p.needed({ index: 0, begin: 0 })).toBe(false);
    expect(p.needed({ index: 0, begin: 16384 })).toBe(true);
  });

  test('isDone is false initially and true after all blocks received', () => {
    const p = new Pieces(makeTorrent());
    expect(p.isDone()).toBe(false);

    for (let i = 0; i < 2; i++) {
      for (let b = 0; b < 4; b++) {
        p.addReceived({ index: i, begin: b * 16384 });
      }
    }
    expect(p.isDone()).toBe(true);
  });

  test('needed resets _requested from _received once everything is requested', () => {
    const p = new Pieces(makeTorrent());
    for (let i = 0; i < 2; i++) {
      for (let b = 0; b < 4; b++) {
        p.addRequested({ index: i, begin: b * 16384 });
      }
    }
    expect(p.needed({ index: 0, begin: 0 })).toBe(true);
  });

  test('printPercentDone writes progress', () => {
    const p = new Pieces(makeTorrent());
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    p.printPercentDone();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('progress: 0%'));
    spy.mockRestore();
  });
});
