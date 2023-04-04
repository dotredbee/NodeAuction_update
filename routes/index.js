const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule')
const { Good, Auction, User, sequelize } = require('../models');
const { isLoggedIn, isNotLoggedIn, csurfProtection } = require('./middlewares');
const { userInputObjectValidateAsync } = require('../utils/validate')
const AuctionService = require('../services/auction')
const joi = require('joi')
const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});


router.get('/', csurfProtection,async (req, res, next) => {
  try {
    const goods = await AuctionService.showAll()
    const csrfToken = req.csrfToken()
    
    res.cookie('csrfToken', csrfToken, {
      httpOnly : true,
      secure : false, 
      sameSite : 'strict'
    })

    res.render('index', {
      title: 'NodeAuction',
      _csrf : csrfToken,
      goods,
      loginError: req.flash('loginError'),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/join', isNotLoggedIn, csurfProtection,(req, res) => {
  const csrfToken = req.csrfToken();
  
  res.cookie('csrfToken', csrfToken, {
    httpOnly : true,
    secure : false,
    sameSite : 'strict'
  })

  res.render('join', {
    title : '회원가입 - NodeAuction',
    _csrf : csrfToken,
    joinError: req.flash('joinError'),
  });
});

router.get('/good', isLoggedIn, (req, res) => {
  res.render('good', { title: '상품 등록 - NodeAuction' });
});

fs.readdir('uploads', (error) => {
  if (error) {
    fs.mkdirSync('uploads');
  }
});
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post('/good', isLoggedIn, upload.single('img'), async (req, res, next) => {
  const body = req.body;
  const schema = joi.object().keys({
    name : joi.string().alphanum().min(4).max(40).required(),
    price : joi.number().required()
  })
  try {
    await userInputObjectValidateAsync(schema, body)
    const { name, price } = body;

    const goodDTO = {
      ownerId : req.user.id,
      name,
      img : req.file.filename,
      price 
    }

    AuctionService.register(goodDTO, (err, success) => {
      if(err) return next(err)
      
      if(success)
        res.redirect('/')
    })
  } catch (error) {
    next(error);
  }
});
router.get('/good/:id', isLoggedIn, async (req, res, next) => {
  const schema = joi.object().keys({
    id : joi.string().required()
  })
  try {
    await userInputObjectValidateAsync(schema, req.params)
    
    AuctionService.show(req.params.id, (err, success, info) => {
      if(err) return next(err)
      
      if(success && info && info.hasOwnProperty("good") && info.hasOwnProperty("auction")) {
        const { good, auction } = info;
        
        res.render('auction', {
          title : `${good.name} - NodeAuction}`,
          good,
          auction,
          auctionError : req.flash('auctionError')
        })
      }
    })
  } catch (error) {
    next(error);
  }
});

router.post('/good/:id/bid', isLoggedIn, async (req, res, next) => {
  const bodySchema = joi.object().keys({
    bid : joi.number().required(),
    msg : joi.string().required()
  })
  
  const paramsSchema = joi.object().keys({
    id : joi.string().required()
  })
  try {
    const [ ret1, ret2 ] = await Promise.all([
      userInputObjectValidateAsync(bodySchema, req.body),
      userInputObjectValidateAsync(paramsSchema, req.params)
    ])
    if(!ret1 || !ret2) throw Error('wrong request')

    const bidDTO = {
      userId : req.user.id,
      goodId : req.params.id,
      bid : req.body.bid,
      msg : req.body.msg
    }

    AuctionService.bid(bidDTO, (err, success, info) => {
      if(err) return next(err)
      
      if(!success)
        return res.status(403).send(info.message)

      req.app.get('io').to(req.params.id).emit('bid', {
        bid: info.bid,
        msg: info.msg,
        nick: req.user.nick,
      });

      return res.status(200).send("ok")
    })
  } catch (error) {
    return next(error);
  }
});
module.exports = router;