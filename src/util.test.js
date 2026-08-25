'use strict';

const util = require('./util');

describe('util.genId', () => {
  test('returns 20 bytes', () => {
    expect(util.genId()).toHaveLength(20);
  });

  test('has -AT0001- prefix', () => {
    expect(util.genId().toString('utf8', 0, 8)).toBe('-AT0001-');
  });

  test('caches the id (same reference)', () => {
    expect(util.genId()).toBe(util.genId());
  });
});
