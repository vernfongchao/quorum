const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { login, logout } = require('../auth');
const db = require('../db/models');
const { User } = db;
const { csrfProtection, userValidators,loginValidators, asyncHandler } = require('./utils');
const bcrypt = require('bcryptjs')


router.get('/login', csrfProtection, asyncHandler(async (req, res) => {
  res.render('user-login', { title: 'Hello From user Route', csrfToken: req.csrfToken() });
}));

router.post('/login', csrfProtection, loginValidators,
asyncHandler(async (req, res) => {
  const {
    email,
    password,
  } = req.body;

  let errors = []
  const validatorErrors = validationResult(req);

  if (validatorErrors.isEmpty()) {
    const user = await db.User.findOne({ where: { email } });
    if (user !== null) {
      const passwordMatch = await bcrypt.compare(password, user.hashedPassword.toString());
      if (passwordMatch) {
        login(req, res, user);
        // return res.redirect('/questions');
      }
    }
    errors.push('Login failed for the email address and password given');
  } else {
    errors = validatorErrors.array().map((error) => error.msg);
  }
  res.render('user-login', {
    title: 'Login',
    email,
    errors,
    csrfToken: req.csrfToken(),
  });
}));

router.get('/signup', csrfProtection, asyncHandler(async (req, res) => {
  const user = User.build();
  res.render('user-signup', { title: 'Hello From sign-up Route', user, csrfToken: req.csrfToken() });
}));

router.post('/signup', userValidators, csrfProtection, asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    userName,
    email,
    favFood,
    password,
    confirmPassword,
  } = req.body;
  console.log(password)
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = User.build({
    firstName,
    lastName,
    userName,
    email,
    favFood,
    hashedPassword,
  });

  const validatorErrors = validationResult(req);
  if (validatorErrors.isEmpty()) {
    await user.save();
    login(req, res, user);
    // res.redirect('/questions');
  } else {
    const errors = validatorErrors.array().map((error) => error.msg);
    res.render('user-signup', {
      title: 'Signup',
      user,
      errors,
      csrfToken: req.csrfToken(),
    });
  }
}));

router.post('/logout', (req, res) => {
  logout(req, res);
  res.redirect('/users/login');
});


module.exports = router;
