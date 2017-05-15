
/* global assert, describe, it */
/* eslint  no-shadow: 0, no-var: 0, one-var: 0, one-var-declaration-per-line: 0,
no-unused-vars: 0, object-property-newline: 0 */

const assert = require('chai').assert;
const feathersStubs = require('./../test/helpers/feathersStubs');
const authManagementService = require('../src/index');
const SpyOn = require('./helpers/basicSpy');

// user DB

const now = Date.now();
const usersDb = [
  // The added time interval must be longer than it takes to run ALL the tests
  { _id: 'a', email: 'a', username: 'aa', is_verified: false, verify_token: '000', verify_short_token: '00099', verify_expires: now + 200000 },
  { _id: 'b', email: 'b', username: 'bb', is_verified: false, verify_token: null, verify_short_token: null, verify_expires: null },
  { _id: 'c', email: 'c', username: 'cc', is_verified: false, verify_token: '111', verify_short_token: '11199', verify_expires: now - 200000 },
  { _id: 'd', email: 'd', username: 'dd', is_verified: true, verify_token: '222', verify_short_token: '22299', verify_expires: now - 200000 },
  { _id: 'e', email: 'e', username: 'ee', is_verified: true, verify_token: '800', verify_short_token: '80099', verify_expires: now + 200000,
    verify_changes: { cellphone: '800' } },
];

// Tests
['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`verifySignUpWithShortToken ${pagination} ${idType}`, function () {
      this.timeout(5000);
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
          authManagementService({
            identifyUserProps: ['email', 'username'],
          }).call(app); // define and attach authManagement service
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('verifies valid token if not verified', (done) => {
          const verify_short_token = '00099';
          const i = 0;

          authManagement.create({ action: 'verifySignupShort', value: {
            token: verify_short_token, user: { email: db[i].email },
          } })
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
          const verify_short_token = '80099';
          const i = 4;

          authManagement.create({ action: 'verifySignupShort', value: {
            token: verify_short_token, user: { email: db[i].email },
          } })
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
          const verify_short_token = '00099';
          const i = 0;

          authManagement.create({ action: 'verifySignupShort', value: {
            token: verify_short_token, user: { username: db[i].username },
          } })
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

        it('handles multiple user ident', (done) => {
          const verify_short_token = '00099';
          const i = 0;

          authManagement.create({ action: 'verifySignupShort', value: {
            token: verify_short_token, user: { email: db[i].email, username: db[i].username },
          } })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'is_verified not true');
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

        it('requires user ident', (done) => {
          const verify_short_token = '00099';
          const i = 0;

          authManagement.create({ action: 'verifySignupShort', value: {
            token: verify_short_token, user: {},
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

        it('throws on non-configured user ident', (done) => {
          const verify_short_token = '00099';
          const i = 0;

          authManagement.create({ action: 'verifySignupShort', value: {
            token: verify_short_token, user: { email: db[i].email, verify_short_token },
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

        it('error on unverified user', (done) => {
          const verify_short_token = '22299';
          const i = 3;

          authManagement.create({ action: 'verifySignupShort', value: {
            token: verify_short_token, user: { email: db[i].email },
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

        it('error on expired token', (done) => {
          const verify_short_token = '11199';
          const i = 2;

          authManagement.create({ action: 'verifySignupShort', value: {
            token: verify_short_token, user: { username: db[i].username } },
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

        it('error on user not found', (done) => {
          const verify_short_token = '999';
          authManagement.create({ action: 'verifySignupShort', value: {
            token: verify_short_token, user: { email: '999' },
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

        it('error incorrect token', (done) => {
          const verify_short_token = '999';
          const i = 0;

          authManagement.create({
            action: 'verifySignupShort',
            value: { token: verify_short_token, user: { email: db[i].email } }
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

          authManagementService({
            // maybe reset identifyUserProps
            notifier: spyNotifier.callWith,
            testMode: true,
          }).call(app);
          authManagement = app.service('authManagement'); // get handle to authManagement
        });

        it('verifies valid token', (done) => {
          const verify_short_token = '00099';
          const i = 0;

          authManagement.create({
            action: 'verifySignupShort',
            value: { token: verify_short_token, user: { email: db[i].email } },
          })
            .then(user => {
              assert.strictEqual(user.is_verified, true, 'user.is_verified not true');

              assert.strictEqual(db[i].is_verified, true, 'is_verified not true');
              assert.strictEqual(db[i].verify_token, null, 'verify_token not null');
              assert.strictEqual(db[i].verify_short_token, null, 'verify_short_token not null');
              assert.strictEqual(db[i].verify_expires, null, 'verify_expires not null');
              assert.deepEqual(db[i].verify_changes, {}, 'verify_changes not empty object');

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
