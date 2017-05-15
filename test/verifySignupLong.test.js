
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
  { _id: 'a', email: 'a', is_verified: false, verify_token: '000', verify_expires: now + 200000 },
  { _id: 'b', email: 'b', is_verified: false, verify_token: null, verify_expires: null },
  { _id: 'c', email: 'c', is_verified: false, verify_token: '111', verify_expires: now - 200000 },
  { _id: 'd', email: 'd', is_verified: true, verify_token: '222', verify_expires: now - 200000 },
  { _id: 'e', email: 'e', is_verified: true, verify_token: '800', verify_expires: now + 200000,
    verify_changes: { cellphone: '800' } },
];

// Tests
['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`verifySignupWithLongToken ${pagination} ${idType}`, function () {
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

        it('verifies valid token if not verified', (done) => {
          const verify_token = '000';
          const i = 0;

          authManagement.create({ action: 'verifySignupLong', value: verify_token })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');

              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.strictEqual(db[i].verify_token, null, 'verify_token not null');
              assert.strictEqual(db[i].verify_short_token, null, 'verify_short_token not null');
              assert.strictEqual(db[i].verify_expires, null, 'verify_expires not null');
              assert.deepEqual(db[i].verify_changes, {}, 'verify_changes not empty object');

              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });

        it('verifies valid token if verify_changes', (done) => {
          const verify_token = '800';
          const i = 4;

          authManagement.create({ action: 'verifySignupLong', value: verify_token })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');

              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.strictEqual(db[i].verify_token, null, 'verify_token not null');
              assert.strictEqual(db[i].verify_short_token, null, 'verify_short_token not null');
              assert.strictEqual(db[i].verify_expires, null, 'verify_expires not null');
              assert.deepEqual(db[i].verify_changes, {}, 'verify_changes not empty object');

              assert.strictEqual(db[i].cellphone, '800', 'cellphone wrong');

              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });

        it('user is sanitized', (done) => {
          const verify_token = '000';
          const i = 0;

          authManagement.create({ action: 'verifySignupLong', value: verify_token })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'is_verified not true');
              assert.strictEqual(user.verify_token, undefined, 'verify_token not undefined');
              assert.strictEqual(user.verify_short_token, undefined, 'verify_short_token not undefined');
              assert.strictEqual(user.verify_expires, undefined, 'verify_expires not undefined');
              assert.strictEqual(user.verify_changes, undefined, 'verify_changes not undefined');

              done();
            })
            .catch(err => {
              assert.strictEqual(err, null, 'err code set');
              done();
            });
        });

        it('error on verified user without verifyChange', (done) => {
          const verify_token = '222';
          authManagement.create({ action: 'verifySignupLong', value: verify_token }, {},
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
          const verify_token = '111';
          authManagement.create({ action: 'verifySignupLong', value: verify_token })
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
          const verify_token = '999';
          authManagement.create({ action: 'verifySignupLong', value: verify_token })
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
          const verify_token = '000';
          const i = 0;

          authManagement.create({
            action: 'verifySignupLong',
            value: verify_token
          })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');

              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.strictEqual(db[i].verify_token, null, 'verify_token not null');
              assert.strictEqual(db[i].verify_expires, null, 'verify_expires not null');

              assert.deepEqual(
                spyNotifier.result()[0].args,
                [
                  'verifySignup',
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
