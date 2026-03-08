const express = require('express');
const accounts = require('../services/accounts');
const router = new express.Router();
 
router.post('/create', async (req, res, next) => {
  let options = { 
  };

  options.createInlineReqJson = req.body;

  try {
    const result = await accounts.create(options);
    res.status(result.status || 200).send(result.data);
  }
  catch (err) {
    return res.status(500).send({
      error: err || 'Something went wrong.'
    });
  }
});
 /*
router.delete('/:accountNumber', async (req, res, next) => {
  let options = { 
    "accountNumber": req.params.accountNumber,
  };
  console.log("Doing delete");

  try {
    const result = await accounts.deleteAccount(options);
    res.status(result.status || 200).send(result.data);
  }
  catch (err) {
    return res.status(500).send({
      error: err || 'Something went wrong.'
    });
  }
});
 */
router.get('/:accountNumber/overview', async (req, res, next) => {
  let options = { 
    "accountNumber": req.params.accountNumber,
  };


  try {
    const result = await accounts.overview(options);
    res.status(result.status || 200).send(result.data);
  }
  catch (err) {
    return res.status(500).send({
      error: err || 'Something went wrong.'
    });
  }
});
 
router.get('/:accountNumber/statement/date', async (req, res, next) => {
  let options = { 
    "accountNumber": req.params.accountNumber,
  };

  options.dateInlineReqUrlencoded = req.body;

  try {
    const result = await accounts.date(options);
    res.status(result.status || 200).send(result.data);
  }
  catch (err) {
    return res.status(500).send({
      error: err || 'Something went wrong.'
    });
  }
});
 
router.get('/:accountNumber/statement/latest', async (req, res, next) => {
  let options = { 
    "accountNumber": req.params.accountNumber,
    "route":"latest"
  };
  console.log("Options: ", options);


  try {
    const result = await accounts.latest(options);
    res.status(result.status || 200).send(result.data);
  }
  catch (err) {
    return res.status(500).send({
      error: err || 'Something went wrong.'
    });
  }
});
// 404 handler for missing routes
router.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});
module.exports = router;