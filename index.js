'use strict';

const download = require('./src/download');
const torrentParser = require('./src/torrent-parser');

const torrent = torrentParser.open(process.argv[2]);
const size = torrentParser.size(torrent).readBigUInt64BE(0).toString();
const pieces = torrent.info.pieces.length / 20;

console.log(`[index] opened ${torrent.info.name} (size=${size}, pieces=${pieces}, piece length=${torrent.info['piece length']})`);

download(torrent, torrent.info.name);
