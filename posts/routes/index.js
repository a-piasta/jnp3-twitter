var express = require('express');
var router = express.Router();

const DatabaseWrapper = require('../db');
const db = new DatabaseWrapper();

router.post('/create_post', async function(req, res, next) {
  try {
    await db.createPost(req.body);
    res.send('ok');
  } catch (err) {
    res.statusCode = 500;
    res.send('db error');
  }
});

router.get('/posts/:userid', async function(req, res) {
  try {
    const posts = await db.getPostsByUser(req.params.userid);
    res.json(posts);
  } catch (err) {
    res.statusCode = 500;
    res.send('db error');
  }
});

module.exports = router;
