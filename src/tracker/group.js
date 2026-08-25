'use strict';

module.exports = function group(iterable, groupSize) {
  const groups = [];
  for (let i = 0; i < iterable.length; i += groupSize) {
    groups.push(iterable.slice(i, i + groupSize));
  }
  return groups;
};
