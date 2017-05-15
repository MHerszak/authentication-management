
/* eslint-env node */

const debug = require('debug')('authManagement:resendVerifySignup');

const {
  getUserData,
  ensureObjPropsValid,
  sanitizeUserForClient,
  getLongToken,
  getShortToken,
  notifier
} = require('./helpers');

// {email}, {cellphone}, {verify_token}, {verify_short_token},
// {email, cellphone, verify_token, verify_short_token}
module.exports = function resendVerifySignup (options, identifyUser, notifierOptions) {
  debug('resendVerifySignup', identifyUser);
  const users = options.app.service(options.service);
  const usersIdName = users.id;

  return Promise.resolve()
    .then(() => {
      ensureObjPropsValid(identifyUser,
        options.identifyUserProps.concat('verify_token', 'verify_short_token')
      );

      return identifyUser;
    })
    .then(query =>
      Promise.all([
        users.find({ query })
          .then(data => getUserData(data, ['isNotVerified'])),
        getLongToken(options.long_token_len),
        getShortToken(options.short_token_len, options.short_token_digits)
      ])
    )
    .then(([user, longToken, shortToken]) =>
      patchUser(user, {
        is_verified: false,
        verify_expires: Date.now() + options.delay,
        verify_token: longToken,
        verify_short_token: shortToken
      })
    )
    .then(user => notifier(options.notifier, 'resendVerifySignup', user, notifierOptions))
    .then(user => sanitizeUserForClient(user));

  function patchUser (user, patchToUser) {
    return users.patch(user[usersIdName], patchToUser, {}) // needs users from closure
      .then(() => Object.assign(user, patchToUser));
  }
};
