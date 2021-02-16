var express = require('express');
var router = express.Router();
const { promisify } = require("util");
const redis = require('redis');
const { cached } = require('sqlite3');
var redisClient = redis.createClient(process.env.REDIS_URL);

const DatabaseWrapper = require('../db');
const db = new DatabaseWrapper();

const redisGet = promisify(redisClient.get).bind(redisClient);

router.post('/register', async function(req, res, next) {
  data = req.body;
  try {
    console.log(data);
    const users = await db.getUsersByName(data.login);
    console.log(users);
    if (users.length == 0) {
      try {
        await db.createUser(data.login, data.pass);
        return res.json({
          status: 'correct'
        });
      } catch (err) {
        res.statusCode = 500;
        return res.send('db error');
      }
    } else {
      return res.json({
        status: 'user already exists'
      });
    }
  } catch (err) {
    res.statusCode = 500;
    return res.send('db error');
  }
});

router.post('/login', async function(req, res, next) {
  const data = req.body;
  try {
    console.log(data);
    const users = await db.getUsersByName(data.login);
    console.log(users);
    if (users.length == 0) {
      return res.json({});
    }
    if (users.length > 1) {
      res.statusCode = 500;
      return res.send('error');
    }
    if (users[0].password != data.password) {
      return res.json({});
    }
    return res.json({
      userid: users[0].id,
      username: users[0].username
    });
  } catch (err) {
    res.statusCode = 500;
    return res.send('db error');
  }
});

router.get('/users/:userid', async function(req, res) {
  try {
    let user = await db.getUserById(req.params.userid);
    res.json(user);
  } catch (err) {
    res.statusCode = 500;
    res.send('db error');
  }
});

router.get('/all/:userid', async function(req, res) {
  try {
    requestingUid = req.params.userid;
    cachedFriends = await redisGet(`friends-${requestingUid}`);
    if (!cachedFriends) {
      cachedFriends = [];
    }
    cachedFriends = JSON.parse(cachedFriends).map(el => el.followed_id);
    let users = await db.getAllUsers(cachedFriends);
    res.json(users);
  } catch (err) {
    res.statusCode = 500;
    console.log(err);
    res.send('db error');
  }
});

module.exports = router;
