var express = require('express');
var router = express.Router();

router.post('/register', function(req, res, next) {
  const data = JSON.parse(req.body);
  try {
    const users = await db.getUsersByName(data.login);
    
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

router.post('/login', function(req, res, next) {
  const data = JSON.parse(req.body);
  const users = 
  res.json({
    userid: 1,
    username: 'Andrzej dupa'
  });
});

module.exports = router;
