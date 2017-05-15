
/* global assert, describe, it */
/* eslint no-param-reassign: 0, no-shadow: 0, no-var: 0, one-var: 0,
 one-var-declaration-per-line: 0 */

const assert = require('chai').assert;
const feathersStubs = require('./../test/helpers/feathersStubs');
const authManagementService = require('../src/index');
const hooks = require('../src/index').hooks;

const defaultVerifyDelay = 1000 * 60 * 60 * 24 * 5; // 5 days

var hookIn;

describe('hook:addVerification', () => {
  beforeEach(() => {
    const app = feathersStubs.app();
    authManagementService().call(app); // define and attach authManagement service

    hookIn = {
      type: 'before',
      method: 'create',
      data: { email: 'a@a.com', password: '0000000000' },
      app,
    };
  });

  describe('basics', () => {
    it('works with no options', (done) => {
      const app = feathersStubs.app();
      authManagementService().call(app); // define and attach authManagement service

      hookIn = {
        type: 'before',
        method: 'create',
        data: { email: 'a@a.com', password: '0000000000' },
        app,
      };

      hooks.addVerification()(hookIn)
        .then(hook => {
          const user = hook.data;

          assert.strictEqual(user.is_verified, false, 'is_verified not false');
          assert.isString(user.verify_token, 'verify_token not String');
          assert.equal(user.verify_token.length, 30, 'verify token wrong length');
          assert.equal(user.verify_short_token.length, 6, 'verify short token wrong length');
          assert.match(user.verify_short_token, /^[0-9]+$/);
          aboutEqualDateTime(user.verify_expires, makeDateTime());
          assert.deepEqual(user.verify_changes, {}, 'verify_changes not empty object');

          done();
        })
        .catch(() => {
          assert.fail(true, false, 'unexpected error');

          done();
        });
    });

    it('delay option works', (done) => {
      const options = { delay: 1000 * 60 * 60 * 24 * 5 }; // 5 days}

      const app = feathersStubs.app();
      authManagementService(options).call(app); // define and attach authManagement service

      hookIn = {
        type: 'before',
        method: 'create',
        data: { email: 'a@a.com', password: '0000000000' },
        app,
      };

      hooks.addVerification()(hookIn)
        .then(hook => {
          const user = hook.data;

          assert.strictEqual(user.is_verified, false, 'is_verified not false');
          assert.isString(user.verify_token, 'verify_token not String');
          assert.equal(user.verify_token.length, 30, 'verify token wrong length');
          assert.equal(user.verify_short_token.length, 6, 'verify short token wrong length');
          assert.match(user.verify_short_token, /^[0-9]+$/);
          aboutEqualDateTime(user.verify_expires, makeDateTime(options));
          assert.deepEqual(user.verify_changes, {}, 'verify_changes not empty object');

          done();
        })
        .catch(() => {
          assert.fail(true, false, 'unexpected error');

          done();
        });
    });
  });

  describe('long token', () => {
    it('length option works', (done) => {
      const options = { long_token_len: 10 };

      const app = feathersStubs.app();
      authManagementService(options).call(app); // define and attach authManagement service

      hookIn = {
        type: 'before',
        method: 'create',
        data: { email: 'a@a.com', password: '0000000000' },
        app,
      };

      hooks.addVerification()(hookIn)
        .then(hook => {
          const user = hook.data;

          assert.strictEqual(user.is_verified, false, 'is_verified not false');
          assert.isString(user.verify_token, 'verify_token not String');
          assert.equal(user.verify_token.length, (options.len || options.long_token_len) * 2, 'verify token wrong length');
          assert.equal(user.verify_short_token.length, 6, 'verify short token wrong length');
          assert.match(user.verify_short_token, /^[0-9]+$/); // small chance of false negative
          aboutEqualDateTime(user.verify_expires, makeDateTime(options));
          assert.deepEqual(user.verify_changes, {}, 'verify_changes not empty object');

          done();
        })
        .catch(() => {
          assert.fail(true, false, 'unexpected error');

          done();
        });
    });
  });

  describe('shortToken', () => {
    it('produces digit short token', (done) => {
      const options = { short_token_digits: true };

      const app = feathersStubs.app();
      authManagementService(options).call(app); // define and attach authManagement service

      hookIn = {
        type: 'before',
        method: 'create',
        data: { email: 'a@a.com', password: '0000000000' },
        app,
      };

      hooks.addVerification()(hookIn)
        .then(hook => {
          const user = hook.data;

          assert.strictEqual(user.is_verified, false, 'is_verified not false');
          assert.equal(user.verify_short_token.length, 6, 'verify short token wrong length');
          assert.match(user.verify_short_token, /^[0-9]+$/);
          aboutEqualDateTime(user.verify_expires, makeDateTime(options));
          assert.deepEqual(user.verify_changes, {}, 'verify_changes not empty object');

          done();
        })
        .catch(() => {
          assert.fail(true, false, 'unexpected error');

          done();
        });
    });

    it('produces alpha short token', (done) => {
      const options = { short_token_digits: false };

      const app = feathersStubs.app();
      authManagementService(options).call(app); // define and attach authManagement service

      hookIn = {
        type: 'before',
        method: 'create',
        data: { email: 'a@a.com', password: '0000000000' },
        app,
      };

      hooks.addVerification()(hookIn)
        .then(hook => {
          const user = hook.data;

          assert.strictEqual(user.is_verified, false, 'is_verified not false');
          assert.equal(user.verify_short_token.length, 6, 'verify short token wrong length');
          assert.notMatch(user.verify_short_token, /^[0-9]+$/);
          aboutEqualDateTime(user.verify_expires, makeDateTime(options));
          assert.deepEqual(user.verify_changes, {}, 'verify_changes not empty object');

          done();
        })
        .catch(() => {
          assert.fail(true, false, 'unexpected error');

          done();
        });
    });

    it('length option works with digits', (done) => {
      const options = { short_token_len: 7 };

      const app = feathersStubs.app();
      authManagementService(options).call(app); // define and attach authManagement service

      hookIn = {
        type: 'before',
        method: 'create',
        data: { email: 'a@a.com', password: '0000000000' },
        app,
      };

      hooks.addVerification()(hookIn)
        .then(hook => {
          const user = hook.data;

          assert.strictEqual(user.is_verified, false, 'is_verified not false');
          assert.equal(user.verify_short_token.length, 7, 'verify short token wrong length');
          assert.match(user.verify_short_token, /^[0-9]+$/);
          aboutEqualDateTime(user.verify_expires, makeDateTime(options));
          assert.deepEqual(user.verify_changes, {}, 'verify_changes not empty object');

          done();
        })
        .catch(() => {
          assert.fail(true, false, 'unexpected error');

          done();
        });
    });

    it('length option works with alpha', (done) => {
      const options = { short_token_len: 9, short_token_digits: false };

      const app = feathersStubs.app();
      authManagementService(options).call(app); // define and attach authManagement service

      hookIn = {
        type: 'before',
        method: 'create',
        data: { email: 'a@a.com', password: '0000000000' },
        app,
      };

      hooks.addVerification()(hookIn)
        .then(hook => {
          const user = hook.data;

          assert.strictEqual(user.is_verified, false, 'is_verified not false');
          assert.equal(user.verify_short_token.length, 9, 'verify short token wrong length');
          assert.notMatch(user.verify_short_token, /^[0-9]+$/);
          aboutEqualDateTime(user.verify_expires, makeDateTime(options));
          assert.deepEqual(user.verify_changes, {}, 'verify_changes not empty object');

          done();
        })
        .catch(() => {
          assert.fail(true, false, 'unexpected error');

          done();
        });
    });
  });


  it('throws if not before', () => {
    hookIn.type = 'after';

    assert.throws(() => { hooks.isVerified()(hookIn); });
  });

  it('throws if not create', () => {
    hookIn.method = 'update';

    assert.throws(() => { hooks.isVerified()(hookIn); });
  });
});

function makeDateTime(options1) {
  options1 = options1 || {};
  return Date.now() + (options1.delay || defaultVerifyDelay);
}

function aboutEqualDateTime(time1, time2, msg, delta) {
  delta = delta || 500;
  const diff = Math.abs(time1 - time2);
  assert.isAtMost(diff, delta, msg || `times differ by ${diff}ms`);
}
