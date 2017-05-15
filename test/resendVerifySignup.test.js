
/* global assert, describe, it */
/* eslint  no-param-reassign: 0, no-shadow: 0, no-unused-vars: 0, no-var: 0, one-var: 0,
one-var-declaration-per-line: 0 */

const util = require('util');

const assert = require('chai').assert;
const feathersStubs = require('./../test/helpers/feathersStubs');
const authManagementService = require('../src/index');
const SpyOn = require('./../test/helpers/basicSpy');

const defaultVerifyDelay = 1000 * 60 * 60 * 24 * 5; // 5 days

// user DB

const now = Date.now();
const usersDb = [
  { _id: 'a', email: 'a', is_verified: false, verify_token: '000', verify_short_token: '00099', verify_expires: now + 50000, username: 'Doe' },
  { _id: 'b', email: 'b', is_verified: true, verify_token: null, verify_short_token: null, verify_expires: null },
  { _id: 'c', email: 'c', is_verified: true, verify_token: '999', verify_short_token: '99900', verify_expires: null }, // impossible
];

// Tests

['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`resendVerifySignup ${pagination} ${idType}`, () => {
      const ifNonPaginated = pagination === 'non-paginated';

      function basicTest1(desc, values) {
        describe(desc, () => {
          var db;
          var app;
          var users;
          var authManagement;

          beforeEach(() => {
            db = clone(usersDb);
            app = feathersStubs.app();
            users = feathersStubs.users(app, db, ifNonPaginated, idType);
            authManagementService().call(app); // define and attach authManagement service
            authManagement = app.service('authManagement'); // get handle to authManagement
          });

          it('authManagement::create exists', () => {
            assert.isFunction(authManagement.create);
          });

          it('updates unverified user', (done) => {
            const i = 0;

            authManagement.create({ action: 'resendVerifySignup', value: values[0] })
              .then(user => {
                assert.strictEqual(user.is_verified, false, 'user.is_verified not false');
                assert.strictEqual(db[i].is_verified, false, 'is_verified not false');
                assert.isString(db[i].verify_token, 'verify_token not String');
                assert.equal(db[i].verify_token.length, 30, 'verify token wrong length');
                assert.equal(db[i].verify_short_token.length, 6, 'verify short token wrong length');
                assert.match(db[i].verify_short_token, /^[0-9]+$/);
                aboutEqualDateTime(db[i].verify_expires, makeDateTime());
                done();
              })
              .catch(err => {
                assert.strictEqual(err, null, 'err code set');
                done();
              });
          });

          it('sanitizes user', (done) => {
            authManagement.create({ action: 'resendVerifySignup', value: values[1] })
              .then(user => {
                assert.strictEqual(user.is_verified, false, 'is_verified not false');
                assert.strictEqual(user.verify_token, undefined, 'verify_token not undefined');
                assert.strictEqual(user.verify_short_token, undefined, 'verify_short_token not undefined');
                assert.strictEqual(user.verify_expires, undefined, 'verify_expires not undefined');
                done();
              })
              .catch(err => {
                assert.strictEqual(err, null, 'err code set');
                done();
              });
          });

          it('error on verified user', (done) => {
            authManagement.create({ action: 'resendVerifySignup', value: values[2] })
              .then(user => {
                assert.fail(true, false);
                done();
              })
              .catch(err => {
                assert.isString(err.message);
                assert.isNotFalse(err.message);
                done();
              });
          });

          it('error on email not found', (done) => {
            authManagement.create({ action: 'resendVerifySignup', value: values[3] })
              .then(user => {
                assert.fail(true, false);
                done();
              })
              .catch(err => {
                assert.isString(err.message);
                assert.isNotFalse(err.message);
                done();
              });
          });
        });
      }

      basicTest1('emailOfToken is {email}', [
        { email: 'a' },
        { email: 'a' },
        { email: 'b' },
        { email: 'x' }
      ]);

      basicTest1('emailOfToken is {verify_token}', [
        { verify_token: '000' },
        { verify_token: '000' },
        { verify_token: '999' },
        { verify_token: 'xxx' },
      ]);

      basicTest1('emailOfToken is {verify_short_token}', [
        { verify_short_token: '00099' },
        { verify_short_token: '00099' },
        { verify_short_token: '99900' },
        { verify_short_token: 'xxx' },
      ]);

      describe('emailOfToken is {verify_token} can change len', () => {
        var db;
        var app;
        var users;
        var authManagement;

        beforeEach(() => {
          db = clone(usersDb);
          app = feathersStubs.app();
          users = feathersStubs.users(app, db, ifNonPaginated, idType);
          authManagementService({
            long_token_len: 10,
          }).call(app); // define and attach authManagement service
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('can change', (done) => {
          const verify_token = '000';
          const i = 0;

          authManagement.create({ action: 'resendVerifySignup', value: { verify_token } })
            .then(user => {
              assert.strictEqual(user.is_verified, false, 'user.is_verified not false');
              assert.strictEqual(db[i].is_verified, false, 'is_verified not false');
              assert.isString(db[i].verify_token, 'verify_token not String');
              assert.equal(db[i].verify_token.length, 20, 'verify token wrong length');
              assert.equal(db[i].verify_short_token.length, 6, 'verify short token wrong length');
              assert.match(db[i].verify_short_token, /^[0-9]+$/);
              aboutEqualDateTime(db[i].verify_expires, makeDateTime());
              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });
      });

      describe('short token (digit) can change length', () => {
        var db;
        var app;
        var users;
        var authManagement;

        beforeEach(() => {
          db = clone(usersDb);
          app = feathersStubs.app();
          users = feathersStubs.users(app, db, ifNonPaginated, idType);
          authManagementService({
            long_token_len: 15, // need to reset this
            short_token_len: 8,
          }).call(app); // define and attach authManagement service
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('can change', (done) => {
          const verify_token = '000';
          const i = 0;

          authManagement.create({ action: 'resendVerifySignup', value: { verify_token } })
            .then(user => {
              assert.strictEqual(user.is_verified, false, 'user.is_verified not false');
              assert.strictEqual(db[i].is_verified, false, 'is_verified not false');
              assert.isString(db[i].verify_token, 'verify_token not String');
              assert.equal(db[i].verify_token.length, 30, 'verify token wrong length');
              assert.equal(db[i].verify_short_token.length, 8, 'verify short token wrong length');
              assert.match(db[i].verify_short_token, /^[0-9]+$/);
              aboutEqualDateTime(db[i].verify_expires, makeDateTime());
              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });
      });

      describe('short token (alpha) can change length', () => {
        var db;
        var app;
        var users;
        var authManagement;

        beforeEach(() => {
          db = clone(usersDb);
          app = feathersStubs.app();
          users = feathersStubs.users(app, db, ifNonPaginated, idType);
          authManagementService({
            long_token_len: 15, // need to reset this
            short_token_len: 9,
            short_token_digits: false,
          }).call(app); // define and attach authManagement service
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('can change', (done) => {
          const verify_token = '000';
          const i = 0;

          authManagement.create({ action: 'resendVerifySignup', value: { verify_token } })
            .then(user => {
              assert.strictEqual(user.is_verified, false, 'user.is_verified not false');
              assert.strictEqual(db[i].is_verified, false, 'is_verified not false');
              assert.isString(db[i].verify_token, 'verify_token not String');
              assert.equal(db[i].verify_token.length, 30, 'verify token wrong length');
              assert.equal(db[i].verify_short_token.length, 9, 'verify short token wrong length');
              assert.notMatch(db[i].verify_short_token, /^[0-9]+$/);
              aboutEqualDateTime(db[i].verify_expires, makeDateTime());
              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });
      });

      describe('use affirming properties', () => {
        var db;
        var app;
        var users;
        var authManagement;

        beforeEach(() => {
          db = clone(usersDb);
          app = feathersStubs.app();
          users = feathersStubs.users(app, db, ifNonPaginated, idType);
          authManagementService({
            long_token_len: 15, // need to reset this
            short_token_len: 6,
            short_token_digits: false,
          }).call(app); // define and attach authManagement service
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('verifies when correct', (done) => {
          const verify_token = '000';
          const i = 0;

          authManagement.create({ action: 'resendVerifySignup', value: {
            verify_token, email: 'a'
          } })
            .then(user => {
              assert.strictEqual(user.is_verified, false, 'user.is_verified not false');
              assert.strictEqual(db[i].is_verified, false, 'is_verified not false');
              assert.isString(db[i].verify_token, 'verify_token not String');
              assert.equal(db[i].verify_token.length, 30, 'verify token wrong length');
              assert.equal(db[i].verify_short_token.length, 6, 'verify short token wrong length');
              assert.notMatch(db[i].verify_short_token, /^[0-9]+$/);
              aboutEqualDateTime(db[i].verify_expires, makeDateTime());
              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });

        it('fails when incorrect', (done) => {
          const verify_token = '000';
          const i = 0;

          authManagement.create({ action: 'resendVerifySignup', value: {
            verify_token, email: 'a', username: 'Doexxxxxxx'
          } })
            .then(user => {
              assert.fail(true, false);
              done();
            })
            .catch(err => {
              assert.isString(err.message);
              assert.isNotFalse(err.message);
              done();
            });
        });

        it('fails when hacks attempted', (done) => {
          const verify_token = '000';
          const i = 0;

          authManagement.create({ action: 'resendVerifySignup', value: {
            username: 'Doe'
          } })
            .then(user => {
              assert.fail(true, false);
              done();
            })
            .catch(err => {
              assert.isString(err.message);
              assert.isNotFalse(err.message);
              done();
            });
        });
      });

      describe('with notification', () => {
        var db;
        var app;
        var users;
        var spyNotifier;
        var authManagement;

        beforeEach(() => {
          db = clone(usersDb);
          app = feathersStubs.app();
          users = feathersStubs.users(app, db, ifNonPaginated, idType);
          spyNotifier = new SpyOn(notifier);

          authManagementService({
            long_token_len: 15, // need to reset this
            short_token_len: 6, // need to reset this
            short_token_digits: true, // need to reset this
            notifier: spyNotifier.callWith
          }).call(app);
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('is called', (done) => {
          const email = 'a';
          const i = 0;

          authManagement.create({
              action: 'resendVerifySignup',
              value: { email },
              notifierOptions: { transport: 'email' }
            })
            .then(user => {
              assert.strictEqual(user.is_verified, false, 'user.is_verified not false');
              assert.strictEqual(db[i].is_verified, false, 'is_verified not false');
              assert.isString(db[i].verify_token, 'verify_token not String');
              assert.equal(db[i].verify_token.length, 30, 'verify token wrong length');
              assert.equal(db[i].verify_short_token.length, 6, 'verify short token wrong length');
              assert.match(db[i].verify_short_token, /^[0-9]+$/);
              aboutEqualDateTime(db[i].verify_expires, makeDateTime());
              assert.deepEqual(
                spyNotifier.result()[0].args,
                [
                  'resendVerifySignup',
                  sanitizeUserForEmail(db[i]),
                  { transport: 'email' }
                ]);
              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });
      });
    });
  });
});

// Helpers

function notifier(action, user, notifierOptions, newEmail) {
  return Promise.resolve(user);
}

function makeDateTime(options1) {
  options1 = options1 || {};
  return Date.now() + (options1.delay || defaultVerifyDelay);
}

function aboutEqualDateTime(time1, time2, msg, delta) {
  delta = delta || 500;
  const diff = Math.abs(time1 - time2);
  assert.isAtMost(diff, delta, msg || `times differ by ${diff}ms`);
}

function sanitizeUserForEmail(user) {
  const user1 = clone(user);

  delete user1.password;

  return user1;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
