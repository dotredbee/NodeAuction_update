const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isLoggedIn, isNotLoggedIn, csurfProtection } = require('./middlewares');
const AuctionService = require('../services/auction')
const router = express.Router();

const { registerGood, showGood, bidGood } = require('../controllers/auction')
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

/**
 * 경매 상품 등록 라우터
 */
router.post('/good', isLoggedIn, upload.single('img'), registerGood);

router.get('/good/:id', isLoggedIn, showGood);

router.post('/good/:id/bid', isLoggedIn, bidGood);
module.exports = router;