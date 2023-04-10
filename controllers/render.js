const AuctionService = require('../services/auction')
const { cookie : { strict } } = require('../config')

exports.renderIndex = async (req, res, next) => {
    try {
        const goods = await AuctionService.showAll()
        const csrfToken = req.csrfToken()
        
        res.cookie('csrfToken', csrfToken, strict)

        res.render('index', {
            title: 'NodeAuction',
            _csrf : csrfToken,
            goods,
            loginError: req.flash('loginError'),
        });
    } catch (error) {
        next(error);
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