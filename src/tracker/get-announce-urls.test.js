'use strict';

const getAnnounceUrls = require('./get-announce-urls');

describe('getAnnounceUrls', () => {
  test('returns announce as single url', () => {
    const torrent = { announce: Buffer.from('udp://example.com:1337') };
    expect(getAnnounceUrls(torrent)).toEqual(['udp://example.com:1337']);
  });

  test('flattens announce-list and dedupes', () => {
    const torrent = {
      announce: Buffer.from('http://a/ann'),
      'announce-list': [
        [Buffer.from('http://a/ann'), Buffer.from('http://b/ann')],
        [Buffer.from('http://c/ann')]
      ]
    };
    expect(getAnnounceUrls(torrent)).toEqual([
      'http://a/ann',
      'http://b/ann',
      'http://c/ann'
    ]);
  });

  test('returns empty array when no announce', () => {
    expect(getAnnounceUrls({})).toEqual([]);
  });
});
