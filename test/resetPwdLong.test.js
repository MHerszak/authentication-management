
/* global assert, describe, it */
/* eslint  no-shadow: 0, no-var: 0, one-var: 0, one-var-declaration-per-line: 0,
no-unused-vars: 0 */

const assert = require('chai').assert;
const feathersStubs = require('./../test/helpers/feathersStubs');
const authManagementService = require('../src/index');
const SpyOn = require('./helpers/basicSpy');

// user DB

const now = Date.now();
const usersDb = [
  // The added time interval must be longer than it takes to run ALL the tests
  { _id: 'a', email: 'a', is_verified: true, reset_token: '000', reset_expires: now + 200000 },
  { _id: 'b', email: 'b', is_verified: true, reset_token: null, reset_expires: null },
  { _id: 'c', email: 'c', is_verified: true, reset_token: '111', reset_expires: now - 200000 },
  { _id: 'd', email: 'd', is_verified: false, reset_token: '222', reset_expires: now - 200000 },
];

// Tests
['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`resetPwdWithLongToken ${pagination} ${idType}`, function () {
      this.timeout(5000);
      const ifNonPaginated = pagination === 'non-paginated';

      describe('basic', () => {
        var db;
        var app;
        var users;
        var authManagement;
        const password = '123456';

        beforeEach(() => {
          db = clone(usersDb);
          app = feathersStubs.app();
          users = feathersStubs.users(app, db, ifNonPaginated, idType);
          authManagementService().call(app); // define and attach authManagement service
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('verifies valid token', (done) => {
          const reset_token = '000';
          const i = 0;

          authManagement.create({ action: 'resetPwdLong', value: { token: reset_token, password } })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');
              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.strictEqual(db[i].reset_token, null, 'reset_token not null');
              assert.strictEqual(db[i].reset_short_token, null, 'reset_short_token not null');
              assert.strictEqual(db[i].reset_expires, null, 'reset_expires not null');
              assert.isString(db[i].password, 'password not a string');
              assert.equal(db[i].password.length, 60, 'password wrong length');
              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });

        it('user is sanitized', (done) => {
          const reset_token = '000';
          const i = 0;

          authManagement.create({ action: 'resetPwdLong', value: { token: reset_token, password } })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'is_verified not true');
              assert.strictEqual(user.reset_token, undefined, 'reset_token not undefined');
              assert.strictEqual(user.reset_short_token, undefined, 'reset_short_token not undefined');
              assert.strictEqual(user.reset_expires, undefined, 'reset_expires not undefined');
              assert.isString(db[i].password, 'password not a string');
              assert.equal(db[i].password.length, 60, 'password wrong length');
              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });

        it('error on unverified user', (done) => {
          const reset_token = '222';
          authManagement.create({ action: 'resetPwdLong', value: { token: reset_token, password } }, {},
            (err, user) => {

            })
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

        it('error on expired token', (done) => {
          const reset_token = '111';
          authManagement.create({ action: 'resetPwdLong', value: { token: reset_token, password } })
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

        it('error on token not found', (done) => {
          const reset_token = '999';
          authManagement.create({ action: 'resetPwdLong', value: { token: reset_token, password } })
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
        const password = '123456';

        beforeEach(() => {
          db = clone(usersDb);
          app = feathersStubs.app();
          users = feathersStubs.users(app, db, ifNonPaginated, idType);
          spyNotifier = new SpyOn(notifier);

          authManagementService({ notifier: spyNotifier.callWith, testMode: true }).call(app);
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('verifies valid token', (done) => {
          const reset_token = '000';
          const i = 0;

          authManagement.create({
            action: 'resetPwdLong',
            value: { token: reset_token, password } }
          )
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');

              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.strictEqual(db[i].reset_token, null, 'reset_token not null');
              assert.strictEqual(db[i].reset_expires, null, 'reset_expires not null');

              const hash = db[i].password;
              assert.isString(hash, 'password not a string');
              assert.equal(hash.length, 60, 'password wrong length');

              assert.deepEqual(
                spyNotifier.result()[0].args,
                [
                  'resetPwd',
                  Object.assign({}, sanitizeUserForEmail(db[i])),
                  {}
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

function sanitizeUserForEmail(user) {
  const user1 = Object.assign({}, user);

  delete user1.password;

  return user1;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
