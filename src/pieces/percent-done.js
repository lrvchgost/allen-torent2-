'use strict';

module.exports = function percentDone(received) {
  const downloaded = received.reduce((totalBlocks, blocks) => {
    return blocks.filter(i => i).length + totalBlocks;
  }, 0);

  const total = received.reduce((totalBlocks, blocks) => {
    return blocks.length + totalBlocks;
  }, 0);

  return Math.floor(downloaded / total * 100);
};
