
/* global module: 0 */
// Wrapper for client interface to feathers-authenticate-management

function AuthManagement (app) { // eslint-disable-line no-unused-vars
  if (!(this instanceof AuthManagement)) {
    return new AuthManagement(app);
  }

  const authManagement = app.service('authManagement');

  this.checkUnique = (identifyUser, ownId, ifErrMsg, cb) => authManagement.create({
    action: 'checkUnique',
    value: identifyUser,
    ownId,
    meta: { noErrMsg: ifErrMsg }
  }, {}, cb);

  this.resendVerifySignup = (identifyUser, notifierOptions, cb) => authManagement.create({
    action: 'resendVerifySignup',
    value: identifyUser,
    notifierOptions
  }, {}, cb);

  this.verifySignupLong = (verify_token, cb) => authManagement.create({
    action: 'verifySignupLong',
    value: verify_token
  }, {}, cb);

  this.verifySignupShort = (verify_short_token, identifyUser, cb) => authManagement.create({
    action: 'verifySignupShort',
    value: { user: identifyUser, token: verify_short_token }
  }, {}, cb);

  this.sendResetPwd = (identifyUser, notifierOptions, cb) => authManagement.create({
    action: 'sendResetPwd',
    value: identifyUser,
    notifierOptions
  }, {}, cb);

  this.resetPwdLong = (reset_token, password, cb) => authManagement.create({
    action: 'resetPwdLong',
    value: { token: reset_token, password }
  }, {}, cb);

  this.resetPwdShort = (reset_short_token, identifyUser, password, cb) => authManagement.create({
    action: 'resetPwdShort',
    value: { user: identifyUser, token: reset_short_token, password }
  }, {}, cb);

  this.passwordChange = (oldPassword, password, identifyUser, cb) => authManagement.create({
    action: 'passwordChange',
    value: { user: identifyUser, oldPassword, password }
  }, {}, cb);

  this.identityChange = (password, changesIdentifyUser, identifyUser, cb) => authManagement.create({
    action: 'identityChange',
    value: { user: identifyUser, password, changes: changesIdentifyUser }
  }, {}, cb);

  this.authenticate = (email, password, cb) => {
    let cbCalled = false;

    return app.authenticate({ type: 'local', email, password })
      .then(result => {
        const user = result.data;

        if (!user || !user.is_verified) {
          app.logout();
          return cb(new Error(user ? 'User\'s email is not verified.' : 'No user returned.'));
        }

        if (cb) {
          cbCalled = true;
          return cb(null, user);
        }

        return user;
      })
      .catch((err) => {
        if (!cbCalled) {
          cb(err);
        }
      });
  };
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = AuthManagement;
}
