var express = require('express');
var router = express.Router();
const DatabaseWrapper = require('../db');
const db = new DatabaseWrapper();

router.get('/friends/:userId', async function(req, res) {
  try {
    let friends = await db.getFriendsById(req.params.userId);
    res.json(friends);
  } catch (err) {
    res.statusCode = 500;
    res.send('db error');
  }
});

router.post('/follow', async function(req, res) {
  try {
    const data = JSON.parse(req.body);
    await db.follow(data.user, data.followedUser);
  } catch (err) {
    res.statusCode = 500;
    return res.send('error');
  }
  res.send('OK');
});

module.exports = router;
