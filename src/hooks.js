
/* eslint no-param-reassign: 0 */

const errors = require('feathers-errors');
const { checkContext } = require('feathers-hooks-common');
const { getLongToken, getShortToken } = require('./helpers');

module.exports.addVerification = path => hook => {
  checkContext(hook, 'before', 'create');

  return Promise.resolve()
    .then(() => hook.app.service(path || 'authManagement').create({ action: 'options' }))
    .then(options => Promise.all([
      options,
      getLongToken(options.long_token_len),
      getShortToken(options.short_token_len, options.short_token_digits)
    ]))
    .then(([options, longToken, shortToken]) => {
      hook.data.is_verified = false;
      hook.data.verify_expires = Date.now() + options.delay;
      hook.data.verify_token = longToken;
      hook.data.verify_short_token = shortToken;
      hook.data.verify_changes = {};

      return hook;
    })
    .catch(err => { throw new errors.GeneralError(err); });
};

module.exports.isVerified = () => hook => {
  checkContext(hook, 'before');

  if (!hook.params.user || !hook.params.user.is_verified) {
    throw new errors.BadRequest('User\'s email is not yet verified.');
  }
};

module.exports.removeVerification = ifReturnTokens => (hook) => {
  checkContext(hook, 'after');
  const user = hook.result || {};

  if (!('is_verified' in user) && hook.method === 'create') {
    /* eslint-disable no-console */
    console.warn('Property is_verified not found in user properties. (removeVerification)');
    console.warn('Have you added authManagement\'s properties to your model? (Refer to README.md)');
    console.warn('Have you added the addVerification hook on users::create?');
    /* eslint-enable */
  }

  if (hook.params.provider && user) { // noop if initiated by server
    delete user.verify_expires;
    delete user.reset_expires;
    delete user.verify_changes;
    if (!ifReturnTokens) {
      delete user.verify_token;
      delete user.verify_short_token;
      delete user.reset_token;
      delete user.reset_short_token;
    }
  }
};
