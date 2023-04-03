const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const joi = require('joi')
const { userInputObjectValidateAsync } = require('../utils/validate')
const { User } = require('../models')

module.exports = (passport) => {
    passport.use(new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
    }, async ( email, password, done) => {
        const schema = joi.object().keys({
            email : joi.string().email({
                minDomainSegments : 1, tlds : { allow : [ "com" ] }
            }).required(),
            password : joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/).required()
        });
        try{
            await userInputObjectValidateAsync(schema, { email, password })
            const exUser = await User.findOne({ where : { email } })
            
            if(exUser) {
                const result = await bcrypt.compare(password, exUser.password)
                
                if(result)
                    done(null, exUser)
                else 
                    done(null, false, { message : "비밀번호가 일치하지 않습니다."})
            }else{
                done(null, false, { message : "가입하지 않은 회원입니다."})
            }
        }catch(err){
            console.error(err)
            done(err)
        }
    }))
}