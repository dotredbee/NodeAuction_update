const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn, csurfProtection } = require('./middlewares');
const { userInputObjectValidateAsync } = require('../utils/validate')
const { User } = require('../models');
const AuthService = require('../services/auth')
const joi = require('joi')
const router = express.Router();

router.post('/join', isNotLoggedIn, csurfProtection, async (req, res, next) => {
  const body = req.body;
  const schema = joi.object().keys({
    email : joi.string().email({
      minDomainSegments : 1, tlds : { allow : [ "com" ]}
    }).required(),
    nick : joi.string().alphanum().min(2).max(24).required(),
    password : joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/).required(),
    money : joi.number().required(),
    _csrf : joi.string().required(),
  })
  try {
    await userInputObjectValidateAsync(schema, body)
    const userDTO = Object.assign(req.body)
    
    delete userDTO._csrf
    
    AuthService.join(userDTO, (err, success, info) => {
      if(err) return next(err)
      if(!success && info) {
        req.flash('joinError', info.message)
        return res.redirect('/join')
      }

      return res.redirect('/')
    })
    
  } catch (error) {
    return next(error);
  }
});

router.post('/login', isNotLoggedIn, csurfProtection, async (req, res, next) => {
  const body = req.body;
  const schema = joi.object().keys({
    email : joi.string().email({
      minDomainSegments : 1, tlds : { allow : [ "com" ] } 
    }).required(),
    password : joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/).required(), 
    _csrf : joi.string().required()
  })

  try{
    await userInputObjectValidateAsync(schema, body)
    passport.authenticate('local', (authError, user, info) => {
      if (authError) {
        return next(authError);
      }
      if (!user) {
        req.flash('loginError', info.message);
        return res.redirect('/');
      }
      return req.login(user, (loginError) => {
        if (loginError) {
          return next(loginError);
        }
        return res.redirect('/');
      });
    })(req, res, next);
  }catch(err) {
    next(err)
  }
  
});

router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;