
/* global assert, describe, it */
/* eslint  no-shadow: 0, no-var: 0, one-var: 0, one-var-declaration-per-line: 0 */

const assert = require('chai').assert;
const hooks = require('../src/index').hooks;

var hookIn;

describe('hook:remove verification', () => {
  beforeEach(() => {
    hookIn = {
      type: 'after',
      method: 'create',
      params: { provider: 'socketio' },
      result: {
        email: 'a@a.com',
        password: '0000000000',
        is_verified: true,
        verify_token: '000',
        verify_expires: Date.now(),
        verify_changes: {},
        reset_token: '000',
        reset_expires: Date.now(),
      },
    };
  });

  it('works with verified user', () => {
    assert.doesNotThrow(() => { hooks.removeVerification()(hookIn); });

    const user = hookIn.result;
    assert.property(user, 'is_verified');
    assert.equal(user.is_verified, true);
    assert.notProperty(user, 'verify_token');
    assert.notProperty(user, 'verify_expires');
    assert.notProperty(user, 'reset_token');
    assert.notProperty(user, 'reset_expires');
    assert.notProperty(user, 'verify_changes');
  });

  it('works with unverified used', () => {
    hookIn.result.is_verified = false;

    assert.doesNotThrow(() => { hooks.removeVerification()(hookIn); });

    const user = hookIn.result;
    assert.property(user, 'is_verified');
    assert.equal(user.is_verified, false);
    assert.notProperty(user, 'verify_token');
    assert.notProperty(user, 'verify_expires');
    assert.notProperty(user, 'reset_token');
    assert.notProperty(user, 'reset_expires');
    assert.notProperty(user, 'verify_changes');
  });

  it('works if addVerification not run', () => {
    hookIn.result = {};

    assert.doesNotThrow(() => { hooks.removeVerification()(hookIn); });
  });

  it('noop if server initiated', () => {
    hookIn.params.provider = undefined;
    assert.doesNotThrow(() => { hooks.removeVerification()(hookIn); });

    const user = hookIn.result;
    assert.property(user, 'is_verified');
    assert.equal(user.is_verified, true);
    assert.property(user, 'verify_token');
    assert.property(user, 'verify_expires');
    assert.property(user, 'reset_token');
    assert.property(user, 'reset_expires');
    assert.property(user, 'verify_changes');
  });

  it('throws with damaged hook', () => {
    delete hookIn.result;

    assert.doesNotThrow(() => { hooks.removeVerification()(hookIn); });
  });

  it('throws if not after', () => {
    hookIn.type = 'before';

    assert.throws(() => { hooks.removeVerification()(hookIn); });
  });
});
