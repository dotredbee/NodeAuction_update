const AuctionService = require('../services/auction')
const { cookie : { strict } } = require('../config')

const Redis = require('../modules/redis.module')
exports.renderIndex = async (req, res, next) => {
    const csrfToken = req.csrfToken()
    res.cookie('csrfToken', csrfToken, strict)

    try {
        const goods = await AuctionService.showAll()
        res.render('index', {
            title: 'NodeAuction',
            _csrf : csrfToken,
            goods,
        });
    } catch (error) {
        res.status(203).render('index', {
            title : 'NodeAuction',
            _csrf : csrfToken,
            goods : [],
        })
    }
}


exports.renderJoin = (req, res,) => {
    const csrfToken = req.csrfToken();
  
    res.cookie('csrfToken', csrfToken, strict)

    res.render('join', {
        title : '회원가입 - NodeAuction',
        _csrf : csrfToken,
        joinError: req.flash('joinError'),
    });
}

exports.renderGood = async (req, res, next) => {
    res.render('good', { title: '상품 등록 - NodeAuction' });
}