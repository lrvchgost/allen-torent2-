'use strict';

module.exports = function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) {
    return 'connect';
  }
  if (action === 1) {
    return 'announce';
  }
};
