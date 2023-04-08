const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isLoggedIn, isNotLoggedIn, csurfProtection } = require('./middlewares');
const router = express.Router();

const { registerGood, showGood, bidGood } = require('../controllers/auction')
const { renderIndex, renderJoin, renderGood } = require('../controllers/render')


router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});


router.get('/', csurfProtection, renderIndex);

router.get('/join', isNotLoggedIn, csurfProtection, renderJoin);

router.get('/good', isLoggedIn, renderGood);

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