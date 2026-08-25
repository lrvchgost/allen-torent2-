'use strict';

jest.mock('../../torrent-parser', () => ({
  infoHash: jest.fn(() => Buffer.from([0x01, 0x02, 0x03, 0xff])),
  size: jest.fn(() => {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(12345));
    return buf;
  })
}));

jest.mock('../../util', () => ({
  genId: jest.fn(() => Buffer.from('-AT0001-0123456789AB'))
}));

jest.mock('bencode', () => ({
  decode: jest.fn()
}));

const mockHttp = {
  get: jest.fn()
};

jest.mock('http', () => mockHttp);

const EventEmitter = require('events');
const buildAnnounceUrl = require('./build-announce-url');
const parseAnnounceResp = require('./parse-announce-resp');
const bencode = require('bencode');
const getPeers = require('./index');

function compactPeers() {
  const buf = Buffer.alloc(6);
  buf[0] = 127;
  buf[1] = 0;
  buf[2] = 0;
  buf[3] = 1;
  buf.writeUInt16BE(6881, 4);
  return buf;
}

function makeResponse(statusCode = 200) {
  const res = new EventEmitter();
  res.statusCode = statusCode;
  res.resume = () => {};
  return res;
}

function makeRequest() {
  const req = new EventEmitter();
  req.setTimeout = jest.fn();
  req.destroy = jest.fn((err) => req.emit('error', err));
  return req;
}

describe('buildAnnounceUrl', () => {
  test('builds url with standard params and preserves existing query', () => {
    const url = buildAnnounceUrl('http://tracker/ann?pk=abc', {});
    expect(url).toContain('http://tracker/ann?pk=abc&');
    expect(url).toContain('info_hash=%01%02%03%ff');
    expect(url).toContain('peer_id=');
    expect(url).toContain('port=6881');
    expect(url).toContain('uploaded=0');
    expect(url).toContain('downloaded=0');
    expect(url).toContain('left=12345');
    expect(url).toContain('compact=1');
    expect(url).toContain('event=started');
  });

  test('uses "?" when announce url has no query', () => {
    const url = buildAnnounceUrl('http://tracker/ann', {});
    expect(url).toContain('http://tracker/ann?');
  });
});

describe('parseAnnounceResp', () => {
  beforeEach(() => {
    bencode.decode.mockReset();
  });

  test('parses compact peers', () => {
    bencode.decode.mockReturnValue({ peers: compactPeers() });

    const result = parseAnnounceResp(Buffer.alloc(0));
    expect(result.failureReason).toBeNull();
    expect(result.peers).toEqual([{ ip: '127.0.0.1', port: 6881 }]);
  });

  test('extracts failure reason and empty peers', () => {
    bencode.decode.mockReturnValue({ 'failure reason': Buffer.from('torrent not registered') });

    const result = parseAnnounceResp(Buffer.alloc(0));
    expect(result.failureReason).toBe('torrent not registered');
    expect(result.peers).toEqual([]);
  });

  test('throws when decode returns non-dictionary', () => {
    bencode.decode.mockReturnValue(Buffer.alloc(0));

    expect(() => parseAnnounceResp(Buffer.alloc(0))).toThrow('Invalid bencode response');
  });
});

describe('getPeers', () => {
  beforeEach(() => {
    mockHttp.get.mockReset();
    bencode.decode.mockReset();
  });

  test('returns peers on success', (done) => {
    bencode.decode.mockReturnValue({ peers: compactPeers() });

    const res = makeResponse(200);
    mockHttp.get.mockImplementation((url, cb) => {
      cb(res);
      return makeRequest();
    });

    getPeers('http://tracker/ann', {}, (err, peers) => {
      expect(err).toBeNull();
      expect(peers).toEqual([{ ip: '127.0.0.1', port: 6881 }]);
      done();
    });

    res.emit('data', Buffer.from('x'));
    res.emit('end');
  });

  test('returns error on failure reason', (done) => {
    bencode.decode.mockReturnValue({ 'failure reason': Buffer.from('nope') });

    const res = makeResponse(200);
    mockHttp.get.mockImplementation((url, cb) => {
      cb(res);
      return makeRequest();
    });

    getPeers('http://tracker/ann', {}, (err, peers) => {
      expect(err.message).toBe('nope');
      expect(peers).toBeUndefined();
      done();
    });

    res.emit('end');
  });

  test('returns error on non-200 status', (done) => {
    const res = makeResponse(403);
    mockHttp.get.mockImplementation((url, cb) => {
      cb(res);
      return makeRequest();
    });

    getPeers('http://tracker/ann', {}, (err, peers) => {
      expect(err.message).toBe('HTTP status 403');
      expect(peers).toBeUndefined();
      done();
    });
  });

  test('returns error on request error', (done) => {
    const req = makeRequest();
    mockHttp.get.mockImplementation(() => req);

    getPeers('http://tracker/ann', {}, (err, peers) => {
      expect(err.message).toBe('boom');
      expect(peers).toBeUndefined();
      done();
    });

    req.emit('error', new Error('boom'));
  });

  test('returns error on timeout', (done) => {
    const req = makeRequest();
    mockHttp.get.mockImplementation(() => req);

    getPeers('http://tracker/ann', {}, (err, peers) => {
      expect(err.message).toBe('HTTP timeout');
      expect(peers).toBeUndefined();
      done();
    });

    req.setTimeout.mock.calls[0][1]();
  });
});
