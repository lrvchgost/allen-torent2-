'use strict';

jest.mock('../message', () => ({
  buildRequest: jest.fn(() => Buffer.from('REQUEST'))
}));

const message = require('../message');
const requestPiece = require('./request-piece');

const makeQueue = () => {
  const queue = {
    choked: false,
    _items: [],
    queue(pieceIndex) { this._items.push({ index: pieceIndex, begin: 0 }); },
    length() { return this._items.length; },
    deque() { return this._items.shift(); }
  };
  return queue;
};

describe('requestPiece', () => {
  let socket, pieces, queue;

  beforeEach(() => {
    socket = { write: jest.fn() };
    pieces = {
      isDone: jest.fn(() => false),
      expiredBlocks: jest.fn(() => []),
      needed: jest.fn(() => true),
      addRequested: jest.fn()
    };
    queue = makeQueue();
  });

  test('does nothing while choked', () => {
    queue.choked = true;
    queue._items = [{ index: 0, begin: 0 }];

    const result = requestPiece(socket, pieces, queue);

    expect(result).toBeNull();
    expect(socket.write).not.toHaveBeenCalled();
  });

  test('requests the next needed block from the queue', () => {
    queue._items = [{ index: 0, begin: 0 }];

    requestPiece(socket, pieces, queue);

    expect(message.buildRequest).toHaveBeenCalledWith({ index: 0, begin: 0 });
    expect(socket.write).toHaveBeenCalledWith(Buffer.from('REQUEST'));
    expect(pieces.addRequested).toHaveBeenCalledWith({ index: 0, begin: 0 });
    expect(pieces.expiredBlocks).not.toHaveBeenCalled();
  });

  test('re-queues expired pieces and requests them when the queue is empty', () => {
    pieces.expiredBlocks.mockReturnValue([{ index: 7, begin: 0 }]);

    requestPiece(socket, pieces, queue);

    expect(pieces.expiredBlocks).toHaveBeenCalledWith(5000);
    expect(message.buildRequest).toHaveBeenCalledWith({ index: 7, begin: 0 });
    expect(socket.write).toHaveBeenCalledWith(Buffer.from('REQUEST'));
    expect(pieces.addRequested).toHaveBeenCalledWith({ index: 7, begin: 0 });
  });

  test('de-duplicates piece indexes when re-queueing expired blocks', () => {
    pieces.expiredBlocks.mockReturnValue([{ index: 7, begin: 0 }, { index: 7, begin: 16384 }, { index: 9, begin: 0 }]);
    const queueSpy = jest.spyOn(queue, 'queue');

    requestPiece(socket, pieces, queue);

    expect(queueSpy).toHaveBeenCalledTimes(2);
    expect(queueSpy).toHaveBeenCalledWith(7);
    expect(queueSpy).toHaveBeenCalledWith(9);
  });

  test('does nothing when queue is empty and download is done', () => {
    pieces.isDone.mockReturnValue(true);

    requestPiece(socket, pieces, queue);

    expect(socket.write).not.toHaveBeenCalled();
    expect(pieces.expiredBlocks).not.toHaveBeenCalled();
  });

  test('does nothing when queue is empty and no blocks expired yet', () => {
    pieces.expiredBlocks.mockReturnValue([]);

    requestPiece(socket, pieces, queue);

    expect(socket.write).not.toHaveBeenCalled();
  });
});
