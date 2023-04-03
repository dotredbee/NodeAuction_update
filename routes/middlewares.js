const csurf = require('csurf')
exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) next()
    else {
        req.flash('loginError', '로그인이 필요합니다.')
        res.redirect('/')
    }
}

exports.isNotLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) next()
    else {
        res.redirect('/')
    }
}

/**
 * CSRF Token 인증 필요한 라우터에 등록
 * 
 * secure : false   / http
 * secure : true    / https
 * 
 * sameSite : strict
 * 다른 도메인에서는 사용하지 않을 예정입니다.
 */
exports.csurfProtection = csurf({
    cookie : {
        httpOnly : true, 
        secure : false,
        sameSite : 'strict'
    }
})