'use strict';

module.exports = function getAnnounceUrls(torrent) {
  const urls = [];

  const push = value => {
    if (!value) {
      return;
    }
    const url = typeof value === 'string' ? value : value.toString();
    if (!urls.includes(url)) {
      urls.push(url);
    }
  };

  push(torrent.announce);

  if (torrent['announce-list']) {
    torrent['announce-list'].forEach(tier => tier.forEach(push));
  }

  return urls;
};
