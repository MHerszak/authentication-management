const assert = require('chai').assert;
const helpers = require('../src/helpers');

describe('helpers - sanitization', () => {
  it('allows to stringify sanitized user object', () => {
    const user = {
      id: 1,
      email: 'test@test.test',
      password: '0000000000',
      reset_token: 'aaa',
    };

    const result1 = helpers.sanitizeUserForClient(user);
    const result2 = helpers.sanitizeUserForNotifier(user);

    assert.doesNotThrow(() => JSON.stringify(result1));
    assert.doesNotThrow(() => JSON.stringify(result2));
  });

  it('throws error when stringifying sanitized object with circular reference', () => {
    const user = {
      id: 1,
      email: 'test@test.test',
      password: '0000000000',
      reset_token: 'aaa'
    };

    user.self = user;

    const result1 = helpers.sanitizeUserForClient(user);
    const result2 = helpers.sanitizeUserForNotifier(user);

    assert.throws(() => JSON.stringify(result1), TypeError);
    assert.throws(() => JSON.stringify(result2), TypeError);
  });

  it('allows to stringify sanitized object with circular reference and custom toJSON()', () => {
    const user = {
      id: 1,
      email: 'test@test.test',
      password: '0000000000',
      reset_token: 'aaa',
      toJSON: function() {
        return Object.assign({}, this, { self: undefined });
      }
    };

    user.self = user;

    const result1 = helpers.sanitizeUserForClient(user);
    const result2 = helpers.sanitizeUserForNotifier(user);

    assert.doesNotThrow(() => JSON.stringify(result1));
    assert.doesNotThrow(() => JSON.stringify(result2));
  });

  it('allows to stringify sanitized object with circular reference and custom toObject()', () => {
    const user = {
      id: 1,
      email: 'test@test.test',
      password: '0000000000',
      reset_token: 'aaa',
      toObject: function() {
        return Object.assign({}, this, { self: undefined });
      }
    };

    user.self = user;

    const result1 = helpers.sanitizeUserForClient(user);
    const result2 = helpers.sanitizeUserForNotifier(user);

    assert.doesNotThrow(() => JSON.stringify(result1));
    assert.doesNotThrow(() => JSON.stringify(result2));
  });
});
