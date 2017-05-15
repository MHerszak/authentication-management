
/* global assert, describe, it */

const assert = require('chai').assert;
const feathers = require('feathers');
const hooks = require('feathers-hooks');
const authManagement = require('../src/index');

const optionsDefault = {
  app: null,
  service: '/users', // need exactly this for test suite
  path: 'authManagement',
  notifier: () => Promise.resolve(),
  long_token_len: 15, // token's length will be twice this
  short_token_len: 6,
  short_token_digits: true,
  resetDelay: 1000 * 60 * 60 * 2, // 2 hours
  delay: 1000 * 60 * 60 * 24 * 5, // 5 days
  identifyUserProps: ['email']
};

const userMgntOptions = {
  service: '/users',
  notifier: () => Promise.resolve(),
  short_token_len: 8,
};

const orgMgntOptions = {
  service: '/organizations',
  path: 'authManagement/org', // *** specify path for this instance of service
  notifier: () => Promise.resolve(),
  short_token_len: 10,
};

function services() {
  const app = this;
  app.configure(user);
  app.configure(organization);
}

function user() {
  const app = this;

  app.use('/users', {
    before: { create: authManagement.hooks.addVerification() },
    create: data => Promise.resolve(data)
  });
}

function organization() {
  const app = this;

  app.use('/organizations', {
    before: { create: authManagement.hooks.addVerification('authManagement/org') }, // *** which one
    create: data => Promise.resolve(data)
  });
}

describe('multiple services', () => {
  describe('can configure 1 service', () => {
    var app;

    beforeEach(() => {
      app = feathers()
        .configure(hooks())
        .configure(authManagement(userMgntOptions))
        .configure(services);
    });

    it('can create an item', (done) => {
      const user = app.service('/users');

      user.create({ username: 'John Doe' })
        .catch(err => {
          console.log(err);
          done();
        })
        .then(result => {
          assert.equal(result.username, 'John Doe');
          assert.equal(result.verify_short_token.length, 8);

          done();
        });
    });

    it('can call service', (done) => {
      const userMgnt = app.service('authManagement');

      const options = userMgnt.create({ action: 'options' })
        .catch(err => console.log(err))
        .then(options => {
          assert.property(options, 'app');
          assert.property(options, 'notifier');
          delete options.app;
          delete options.notifier;

          const expected = Object.assign({}, optionsDefault, userMgntOptions);
          delete expected.app;
          delete expected.notifier;

          assert.deepEqual(options, expected);

          done();
        });
    });
  });

  describe('can configure 2 services', () => {
    var app;

    beforeEach(() => {
      app = feathers()
        .configure(hooks())
        .configure(authManagement(userMgntOptions))
        .configure(authManagement(orgMgntOptions))
        .configure(services);
    });

    it('can create items', (done) => {
      const user = app.service('/users');
      const organization = app.service('/organizations');

      // create a user item
      user.create({ username: 'John Doe' })
        .catch(err => {
          console.log(err);
          done();
        })
        .then(result => {
          assert.equal(result.username, 'John Doe');
          assert.equal(result.verify_short_token.length, 8);

          // create an organization item
          organization.create({ organization: 'Black Ice' })
            .catch(err => {
              console.log(err);
              done();
            })
            .then(result => {
              assert.equal(result.organization, 'Black Ice');
              assert.equal(result.verify_short_token.length, 10);

              done();
            });

        });
    });

    it('can call services', (done) => {
      const userMgnt = app.service('authManagement'); // *** the default
      const orgMgnt = app.service('authManagement/org'); // *** which one

      // call the user instance
      userMgnt.create({ action: 'options' })
        .catch(err => console.log(err))
        .then(options => {
          assert.property(options, 'app');
          assert.property(options, 'notifier');
          delete options.app;
          delete options.notifier;

          const expected = Object.assign({}, optionsDefault, userMgntOptions);
          delete expected.app;
          delete expected.notifier;

          assert.deepEqual(options, expected);

          // call the organization instance
          orgMgnt.create({ action: 'options' })
            .catch(err => console.log(err))
            .then(options => {
              assert.property(options, 'app');
              assert.property(options, 'notifier');
              delete options.app;
              delete options.notifier;

              const expected = Object.assign({}, optionsDefault, orgMgntOptions);
              delete expected.app;
              delete expected.notifier;

              assert.deepEqual(options, expected);

              done();
            })
        });

    });
  });
});
