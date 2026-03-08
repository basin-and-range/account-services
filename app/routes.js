module.exports = function (app) {
  /*
  * Routes
  */
  app.use('/accounts', require('./routes/accounts.route'));
};
