
/* global assert, describe, it */
/* eslint  no-shadow: 0, no-var: 0, one-var: 0, one-var-declaration-per-line: 0,
no-param-reassign: 0, no-unused-vars: 0  */

const assert = require('chai').assert;
const feathersStubs = require('./../test/helpers/feathersStubs');
const authManagementService = require('../src/index');
const SpyOn = require('./helpers/basicSpy');

const defaultResetDelay = 1000 * 60 * 60 * 2; // 2 hours

// user DB

const now = Date.now();
const usersDb = [
  { _id: 'a', email: 'a', is_verified: false, verify_token: '000', verify_expires: now + 50000 },
  { _id: 'b', email: 'b', is_verified: true, verify_token: null, verify_expires: null },
];

// Tests

['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`sendResetPwd ${pagination} ${idType}`, () => {
      const ifNonPaginated = pagination === 'non-paginated';

      describe('basic', () => {
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

        it('updates verified user', (done) => {
          const email = 'b';
          const i = 1;

          authManagement.create({ action: 'sendResetPwd', value: { email } })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');

              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.isString(db[i].reset_token, 'reset_token not String');
              assert.equal(db[i].reset_token.length, 30, 'reset token wrong length');
              assert.equal(db[i].reset_short_token.length, 6, 'reset short token wrong length');
              assert.match(db[i].reset_short_token, /^[0-9]+$/);
              aboutEqualDateTime(db[i].reset_expires, makeDateTime());

              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });

        it('error on unverified user', (done) => {
          const email = 'a';
          authManagement.create({ action: 'sendResetPwd', value: { email } })
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
          const email = 'x';
          authManagement.create({ action: 'sendResetPwd', value: { email } })
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

        it('user is sanitized', (done) => {
          const email = 'b';

          authManagement.create({ action: 'sendResetPwd', value: { email } })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'is_verified not true');
              assert.strictEqual(user.reset_token, undefined, 'reset_token not undefined');
              assert.strictEqual(user.reset_short_token, undefined, 'reset_token not undefined');
              assert.strictEqual(user.reset_expires, undefined, 'reset_expires not undefined');
              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });
      });

      describe('length can change (digits)', () => {
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
            short_token_len: 9,
            short_token_digits: true,
          }).call(app); // define and attach authManagement service
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('updates verified user', (done) => {
          const email = 'b';
          const i = 1;

          authManagement.create({ action: 'sendResetPwd', value: { email } })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');

              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.isString(db[i].reset_token, 'reset_token not String');
              assert.equal(db[i].reset_token.length, 20, 'reset token wrong length');
              assert.equal(db[i].reset_short_token.length, 9, 'reset short token wrong length');
              assert.match(db[i].reset_short_token, /^[0-9]+$/);
              aboutEqualDateTime(db[i].reset_expires, makeDateTime());

              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });
      });

      describe('length can change (alpha)', () => {
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
            short_token_len: 9,
            short_token_digits: false,
          }).call(app); // define and attach authManagement service
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('updates verified user', (done) => {
          const email = 'b';
          const i = 1;

          authManagement.create({ action: 'sendResetPwd', value: { email } })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');

              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.isString(db[i].reset_token, 'reset_token not String');
              assert.equal(db[i].reset_token.length, 20, 'reset token wrong length');
              assert.equal(db[i].reset_short_token.length, 9, 'reset short token wrong length');
              assert.notMatch(db[i].reset_short_token, /^[0-9]+$/);
              aboutEqualDateTime(db[i].reset_expires, makeDateTime());

              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
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
            long_token_len: 15,
            short_token_len: 6,
            short_token_digits: true,
            notifier: spyNotifier.callWith,
          }).call(app);
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('is called', (done) => {
          const email = 'b';
          const i = 1;

          authManagement.create({
            action: 'sendResetPwd',
            value: { email },
            notifierOptions: { transport: 'sms' }
          })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');

              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.isString(db[i].reset_token, 'reset_token not String');
              assert.equal(db[i].reset_token.length, 30, 'reset token wrong length');
              aboutEqualDateTime(db[i].reset_expires, makeDateTime());

              assert.deepEqual(
                spyNotifier.result()[0].args,
                [
                  'sendResetPwd',
                  sanitizeUserForEmail(db[i]),
                  { transport: 'sms' }
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
  return Date.now() + (options1.delay || defaultResetDelay);
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
