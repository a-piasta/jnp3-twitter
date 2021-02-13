var express = require('express');
var router = express.Router();

const http = require('http');
const axios = require('axios');

const csrf = require('csurf');
const csrfProtection = csrf({cookie: true});

const createError = require('http-errors');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

async function requireAuth(req, res, next) {
  if (!req.user) return res.redirect('/login');
  let token = (await db.getUserByName(req.user.login)).token;
  if (req.cookies.token != token) return res.redirect('/login');
  return req.isAuthenticated() ? next() : res.redirect('/login');
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Albicla',
    username: req.session.username
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

function requireAuth(req, res, next) {
  if (!req.session.login) res.redirect('/login');
  next();
}

router.post('/login', csrfProtection, async function(req, res, next) {
  const data = JSON.stringify({
    login: req.body.login,
    password: req.body.pass
  });
  
  try {
    const response = await axios.request({
      url: 'http://localhost:8000/login',
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      data: data
    });
    
    req.session.userid = response.data.userid;
    req.session.username = response.data.username;
  } catch (err) {
    next(createError(500, err));
  }
  
  res.redirect('/');
});

router.post('/register', csrfProtection, function(req, res, next) {
  if (req.body.pass != req.body.pass2) {
    return next(createError(422));
  }
  
  const data = JSON.stringify({
    login: req.body.login,
    pass: req.body.pass
  });
  
  try {
    const response = await axios.request({
      url: 'http://localhost:8000/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      data: data
    });
    if (response.statusCode == 200) {
      if (response.data.status == 'correct')
        res.redirect('/');
      else
        res.render('login', {
          title: 'Rejestracja',
          actionTitle: 'Zarejestruj się',
          actionType: 'register',
          redirect: '/register',
          csrfToken: req.csrfToken(),
          error: 'Użytkownik już istnieje'
        });
    } else {
      next(createError(500, err));
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

router.get('/users/:userId', requireAuth, csrfProtection, async function(req, res, next) {
  try {
    response = await axios.get('http://localhost:8000/users/' + req.params.userId);
    if (response.statusCode == 200) {
      var username = response.data.username;
    } else {
      return res.render('user');
    }
  } catch (err) {
    console.log(err);
  }
  
  try {
    response = await axios.get('http://localhost:4000/posts/' + req.params.userId);
    if (response.statusCode == 200) {
      var posts = response.data;
    }
  } catch (err) {
    console.log(err);
  }
  
  try {
    response = await axios.get('http://localhost:5000/friends/' + req.params.userId);
    if (response.statusCode == 200) {
      var friends = response.data;
    }
  } catch (err) {
    console.log(err);
  }

  return res.render('user', {
    username: username,
    posts: posts,
    friends: friends 
  });
});

module.exports = router;
