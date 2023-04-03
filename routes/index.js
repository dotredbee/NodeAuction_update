const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule')
const { Good, Auction, User, sequelize } = require('../models');
const { isLoggedIn, isNotLoggedIn, csurfProtection } = require('./middlewares');
const { userInputObjectValidateAsync } = require('../utils/validate')
const joi = require('joi')
const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});


router.get('/', csurfProtection,async (req, res, next) => {
  try {
    const goods = await Good.findAll({ where: { soldId: null } });
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
    name : joi.string().alphanum().min(12).max(40).required(),
    price : joi.string().number().required()
  })
  try {
    await userInputObjectValidateAsync(schema, body)
    const { name, price } = body;

    const good = await Good.create({
      ownerId: req.user.id,
      name,
      img: req.file.filename,
      price,
    });
    const end = new Date()
    end.setDate(end.getDate() + 1)

    schedule.scheduleJob(end, async () => {
      const success = await Auction.findOne({
        where : { goodId : good.id },
        order : [[ 'bid', 'DESC' ]] 
      })

      await Good.update({ soldId : success.userId }, { where : { id : good.id } })
      await User.update({
        money : sequelize.literal(`money - ${success.bid}`)
      }, {
        where : { id : success.userId }
      })
    })
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});
router.get('/good/:id', isLoggedIn, async (req, res, next) => {
  const schema = joi.object().keys({
    id : joi.string().required()
  })
  try {
    await userInputObjectValidateAsync(schema, req.parmas)
    const [good, auction] = await Promise.all([
      Good.findOne({
        where: { id: req.params.id },
        include: {
          model: User,
          as: 'owner',
        },
      }),
      Auction.findAll({
        where: { goodId: req.params.id },
        include: { model: User },
        order: [['bid', 'ASC']],
      }),
    ]);
    res.render('auction', {
      title: `${good.name} - NodeAuction`,
      good,
      auction,
      auctionError: req.flash('auctionError'),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/good/:id/bid', isLoggedIn, async (req, res, next) => {
  const bodySchema = joi.object.keys({
    bid : joi.number().required(),
    msg : joi.string().required()
  })
  
  const paramsSchema = joi.object.keys({
    id : joi.string().required()
  })
  try {
    const [ ret1, ret2 ] = await Promise.all([
      userInputObjectValidateAsync(bodySchema, req.body),
      userInputObjectValidateAsync(paramsSchema, req.params)
    ])

    if(!ret1 || !ret2) throw Error('wrong request')

    const { bid, msg } = req.body;
    const good = await Good.findOne({
      where: { id: req.params.id },
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });
    if (good.price > bid) { // 시작 가격보다 낮게 입찰하면
      return res.status(403).send('시작 가격보다 높게 입찰해야 합니다.');
    }
    // 경매 종료 시간이 지났으면
    if (new Date(good.createdAt).valueOf() + (24 * 60 * 60 * 1000) < new Date()) {
      return res.status(403).send('경매가 이미 종료되었습니다');
    }
    // 직전 입찰가와 현재 입찰가 비교
    if (good.auctions[0] && good.auctions[0].bid >= bid) {
      return res.status(403).send('이전 입찰가보다 높아야 합니다');
    }
    const result = await Auction.create({
      bid,
      msg,
      userId: req.user.id,
      goodId: req.params.id,
    });
    req.app.get('io').to(req.params.id).emit('bid', {
      bid: result.bid,
      msg: result.msg,
      nick: req.user.nick,
    });
    return res.send('ok');
  } catch (error) {
    return next(error);
  }
});
module.exports = router;