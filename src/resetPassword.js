
/* eslint-env node */

const errors = require('feathers-errors');
const debug = require('debug')('authManagement:resetPassword');

const {
  getUserData,
  ensureObjPropsValid,
  ensureValuesAreStrings,
  sanitizeUserForClient,
  hashPassword,
  notifier
} = require('./helpers');

module.exports.resetPwdWithLongToken = function (options, reset_token, password) {
  return Promise.resolve()
    .then(() => {
      ensureValuesAreStrings(reset_token, password);

      return resetPassword(options, { reset_token }, { reset_token }, password);
    });
};

module.exports.resetPwdWithShortToken = function (options, reset_short_token, identifyUser, password) {
  return Promise.resolve()
    .then(() => {
      ensureValuesAreStrings(reset_short_token, password);
      ensureObjPropsValid(identifyUser, options.identifyUserProps);

      return resetPassword(options, identifyUser, { reset_short_token }, password);
    });
};

function resetPassword (options, query, tokens, password) {
  debug('resetPassword', query, tokens, password);
  const users = options.app.service(options.service);
  const usersIdName = users.id;

  return Promise.all([
    users.find({ query })
      .then(data => getUserData(data, ['is_verified', 'resetNotExpired'])),
    hashPassword(options.app, password)
  ])
    .then(([user, hashedPassword]) => {
      if (!Object.keys(tokens).every(key => tokens[key] === user[key])) {
        return patchUser(user, {
          reset_token: null,
          reset_short_token: null,
          reset_expires: null
        })
          .then(() => {
            throw new errors.BadRequest('Invalid token. Get for a new one. (authManagement)',
              { errors: { $className: 'badParam' } });
          });
      }

      return patchUser(user, {
        password: hashedPassword,
        reset_token: null,
        reset_short_token: null,
        reset_expires: null
      })
        .then(user1 => notifier(options.notifier, 'resetPwd', user1))
        .then(user1 => sanitizeUserForClient(user1));
    });

  function patchUser (user, patchToUser) {
    return users.patch(user[usersIdName], patchToUser, {}) // needs users from closure
      .then(() => Object.assign(user, patchToUser));
  }
}
