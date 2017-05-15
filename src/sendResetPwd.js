
/* eslint-env node */

const debug = require('debug')('authManagement:sendResetPwd');

const {
  getUserData,
  ensureObjPropsValid,
  sanitizeUserForClient,
  getLongToken,
  getShortToken,
  notifier
} = require('./helpers');

module.exports = function sendResetPwd (options, identifyUser, notifierOptions) {
  debug('sendResetPwd');
  const users = options.app.service(options.service);
  const usersIdName = users.id;

  return Promise.resolve()
    .then(() => {
      ensureObjPropsValid(identifyUser, options.identifyUserProps);

      return Promise.all([
        users.find({ query: identifyUser })
          .then(data => getUserData(data, ['is_verified'])),
        getLongToken(options.long_token_len),
        getShortToken(options.short_token_len, options.short_token_digits)
      ]);
    })
    .then(([user, longToken, shortToken]) =>
      patchUser(user, {
        reset_expires: Date.now() + options.resetDelay,
        reset_token: longToken,
        reset_short_token: shortToken
      })
    )
    .then(user => notifier(options.notifier, 'sendResetPwd', user, notifierOptions))
    .then(user => sanitizeUserForClient(user));

  function patchUser (user, patchToUser) {
    return users.patch(user[usersIdName], patchToUser, {}) // needs users from closure
      .then(() => Object.assign(user, patchToUser));
  }
};
