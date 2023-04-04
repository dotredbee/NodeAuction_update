const { User } = require('../models')
const bcrypt = require('bcrypt')
const saltRound = 12;

module.exports = {
    
    /**
     * 
     * 회원 가입 서비스
     * 
     *  - password 암호화
     *  - 전달받은 user 정보를 저장
     * 
     * @param {object} userDTO email, nick, password, money
     * @param {Callback} done callback : err, success, info
     */
    join : async function(userDTO, done){
        try{
            const exUser = await User.findOne({ where : { email : userDTO.email }})
            
            if(exUser) 
                done(null, false, { message : "이미 가입된 이메일입니다."})
            
            const hash = await bcrypt.hash(userDTO.password, saltRound)
            
            userDTO.password = hash;

            await User.create(userDTO)
            
            done(null, true)
            
        }catch(err){
            done(err, false) 
        }
    },

    /**
     * 
     * service for test,
     * development, production => passport
     * 
     * 로그인 서비스 
     * 
     * @param {object} userDTO  email, password 
     * @param {Callback} done   callback : err, success, info
     */
    _login : async function(userDTO, done) {
        try{
            const exUser = await User.findOne({ where : { email : userDTO.email }})
            
            if(!exUser)
                return done(null, false, { message : "일치하는 이메일이 없습니다." })
            
            const ret = await bcrypt.compare(userDTO.password, exUser.password)
            
            if(!ret)
                return done(null, false, { message : "패스워드가 일치하지 않습니다." })
            
            done(null, true, {
                id : exUser.id
            })
        }catch(err){
            done(err, false)
        }
    }
}