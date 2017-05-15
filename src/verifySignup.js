
/* eslint-env node */

const errors = require('feathers-errors');
const debug = require('debug')('authManagement:verifySignup');

const {
  getUserData,
  ensureObjPropsValid,
  ensureValuesAreStrings,
  sanitizeUserForClient,
  notifier
} = require('./helpers');

module.exports.verifySignupWithLongToken = function (options, verify_token) {
  return Promise.resolve()
    .then(() => {
      ensureValuesAreStrings(verify_token);

      return verifySignup(options, { verify_token }, { verify_token });
    });
};

module.exports.verifySignupWithShortToken = function (options, verify_short_token, identifyUser) {
  return Promise.resolve()
    .then(() => {
      ensureValuesAreStrings(verify_short_token);
      ensureObjPropsValid(identifyUser, options.identifyUserProps);

      return verifySignup(options, identifyUser, { verify_short_token });
    });
};

function verifySignup (options, query, tokens) {
  debug('verifySignup', query, tokens);
  const users = options.app.service(options.service);
  const usersIdName = users.id;

  return users.find({ query })
    .then(data => getUserData(data, ['isNotVerifiedOrHasVerifyChanges', 'verifyNotExpired']))
    .then(user => {
      if (!Object.keys(tokens).every(key => tokens[key] === user[key])) {
        return eraseVerifyProps(user, user.is_verified)
          .then(() => {
            throw new errors.BadRequest('Invalid token. Get for a new one. (authManagement)',
              { errors: { $className: 'badParam' } });
          });
      }

      return eraseVerifyProps(user, user.verify_expires > Date.now(), user.verify_changes || {})
        .then(user1 => notifier(options.notifier, 'verifySignup', user1))
        .then(user1 => sanitizeUserForClient(user1));
    });

  function eraseVerifyProps (user, is_verified, verify_changes) {
    const patchToUser = Object.assign({}, verify_changes || {}, {
      is_verified,
      verify_token: null,
      verify_short_token: null,
      verify_expires: null,
      verify_changes: {}
    });

    return patchUser(user, patchToUser);
  }

  function patchUser (user, patchToUser) {
    return users.patch(user[usersIdName], patchToUser, {}) // needs users from closure
      .then(() => Object.assign(user, patchToUser));
  }
}
