var express = require('express');
var router = express.Router();
const { promisify } = require("util");

const redis = require('redis');
var redisClient = redis.createClient(process.env.REDIS_URL);
const redisGet = promisify(redisClient.get).bind(redisClient);
const redisSetex = promisify(redisClient.setex).bind(redisClient);

const http = require('http');
const axios = require('axios');

var csrf = require('csurf');
var csrfProtection = csrf({cookie: false});

const createError = require('http-errors');

const relationsAddress = 'http://jnp3-relations:5000';
const usersAddress = 'http://varnish-users:8000';
const postsAddress = 'http://jnp3-posts:4000';

function requireAuth(req, res, next) {
  if (!req.session.userid) return res.redirect('/');
  return next();
}

/* GET home page. */
router.get('/', csrfProtection, async function(req, res, next) {
  friends = undefined;
  users = undefined;
  if (req.session.username) {
    try {
      cached = await redisGet(`friends-${req.session.userid}`);
      if (cached) {
        friends = JSON.parse(cached);
      } else {
        const response = await axios.get(relationsAddress + '/friends/' + req.session.userid);
        if (response.status == 200) {
          friends = response.data;
          await redisSetex(`friends-${req.session.userid}`, 60, JSON.stringify(response.data));
        }
      }
      for (i=0; i<friends.length; i++) {
        cached = await redisGet(`username-${friends[i].followed_id}`)
        if (cached) {
          friends[i].username = cached;
        } else {
          let resp = await axios.get(usersAddress + '/users/' + friends[i].followed_id);
          if (resp.status==200) {
            friends[i].username = resp.data.username;
            await redisSetex(`username-${friends[i].followed_id}`, 600, resp.data.username)
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
    try {
      const response = await axios.get(usersAddress + '/all/' + req.session.userid);
      if (response.status == 200) {
        users = response.data;
      }
    } catch (err) {
      console.log(err);
    }
  }
  if (users !== undefined) {
    friendIds = friends.map(friend => friend.followed_id);
    for (var index in users) {
      users[index].followed = friendIds.includes(users[index].id);
    }
  }
  res.render('index', {
    title: 'Albicla',
    myid: req.session.userid,
    username: req.session.username,
    friends: friends,
    users: users,
    csrfToken: req.csrfToken()
  });
});

router.get('/login', csrfProtection, function(req, res, next) {
  res.render('login', {
    title: 'Logowanie',
    actionTitle: 'Zaloguj się',
    actionType: 'login',
    redirect: '/login',
    csrfToken: req.csrfToken()
  });
});

router.get('/register', csrfProtection, function(req, res, next) {
  res.render('login', {
    title: 'Rejestracja',
    actionTitle: 'Zarejestruj się',
    actionType: 'register',
    redirect: '/register',
    csrfToken: req.csrfToken()
  });
});

router.post('/login', csrfProtection, async function(req, res, next) {
  const data = JSON.stringify({
    login: req.body.login,
    password: req.body.pass
  });
  console.log(data);
  try {
    console.log(usersAddress + '/login');
    const response = await axios.request({
      url: usersAddress + '/login',
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      data: data
    });
    
    req.session.userid = response.data.userid;
    req.session.username = response.data.username;
    
    console.log(response.data);
    
    if (response.data.userid === undefined) {
      res.statusCode = 401;
      return res.render('login', {
        error: 'Logowanie się nie powiodło',
        title: 'Logowanie',
        actionTitle: 'Zaloguj się',
        actionType: 'login',
        redirect: '/login',
        csrfToken: req.csrfToken()
      });
    }
  } catch (err) {
    return next(createError(500, err));
  }
  
  return res.redirect('/');
});

router.post('/register', csrfProtection, async function(req, res, next) {
  if (req.body.pass != req.body.pass2) {
    return next(createError(422));
  }
  
  const data = JSON.stringify({
    login: req.body.login,
    pass: req.body.pass
  });
  
  try {
    const response = await axios.request({
      url: usersAddress + '/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      data: data
    });
    
    console.log(response.data, response.statusCode);
    if (response.status == 200) {
      if (response.data.status == 'correct') {
        res.redirect('/');
      } else {
        res.render('login', {
          title: 'Rejestracja',
          actionTitle: 'Zarejestruj się',
          actionType: 'register',
          redirect: '/register',
          csrfToken: req.csrfToken(),
          error: 'Użytkownik już istnieje'
        });
      }
    } else {
      next(createError(500));
    }
  } catch (err) {
    next(createError(500, err));
  }
});

router.get('/logout', csrfProtection, function(req, res, next) {
  req.session.userid = undefined;
  req.session.username = undefined;
  res.redirect('/');
});

router.get('/users/:userId', csrfProtection, requireAuth, async function(req, res, next) {
  try {
    response = await axios.get(usersAddress + '/users/' + req.params.userId);
    if (response.status == 200) {
      var user = response.data;
    } else {
      return res.render('user');
    }
  } catch (err) {
    console.log(err);
  }
  
  try {
    response = await axios.get(postsAddress + '/posts/' + req.params.userId);
    if (response.status == 200) {
      var posts = response.data;
    }
  } catch (err) {
    console.log(err);
  }
  
  try {
    response = await axios.get(relationsAddress + '/friends/' + req.params.userId);
    if (response.status == 200) {
      var friends = response.data;
      for (i=0; i<friends.length; i++) {
        let resp = await axios.get(usersAddress + '/users/' + friends[i].followed_id);
        if (resp.status==200) {
          friends[i].username = resp.data.username;
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
  try {
    cached = await redisGet(`friends-${req.session.userid}`);
    if (cached) {
      currFriends = JSON.parse(cached);
    } else {
      const response = await axios.get(relationsAddress + '/friends/' + req.session.userid);
      if (response.status == 200) {
        currFriends = response.data;
        await redisSetex(`friends-${req.session.userid}`, 60, JSON.stringify(response.data));
      }
    }
  } catch (err) {
    console.log(err);
  }
  currFriends = new Set(currFriends.map(el => el.followed_id));
  friends.forEach(el => el.followed = currFriends.has(el.followed_id))
  return res.render('user', {
    user: user,
    posts: posts,
    friends: friends,
    curr_uid: req.session.userid,
    is_me: req.session.userid == req.params.userId,
    csrfToken: req.csrfToken()
  });
});

router.post('/follow/:userId', requireAuth, csrfProtection, async function(req, res, next) {
  let data = JSON.stringify({
    user: req.session.userid,
    followedUser: req.params.userId
  });
  try {
    response = await axios.request({
      url: relationsAddress + '/follow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      data: data
    });
    return res.redirect('/users/' + req.params.userId);
  } catch (err) {
    next(createError(500, err));
  }
});

router.post('/unfollow/:userId', csrfProtection, requireAuth, async function(req, res, next) {
  let data = JSON.stringify({
    user: req.session.userid,
    followedUser: req.params.userId
  });
  try {
    console.log('wchodzi w unfollow');
    response = await axios.request({
      url: relationsAddress + '/unfollow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      data: data
    });
    return res.redirect('/users/' + req.params.userId);
  } catch (err) {
    next(createError(500, err));
  }
});

router.post('/create_post', requireAuth, csrfProtection, async function(req, res, next) {
  let data = JSON.stringify({
    user: req.session.userid,
    title: req.body.title,
    message: req.body.message
  });
  try {
    response = await axios.request({
      url: postsAddress + '/create_post',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      data: data
    });
    return res.redirect('/');
  } catch (err) {
    next(createError(500, err));
  }
});

module.exports = router;
