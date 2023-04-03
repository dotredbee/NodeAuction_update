const xss = require('xss')

const xssOptions = {
    stripignoreTag : true,
    stripignoreTagBody : [ 'script' ]
}
/**
 * 입력값 검증
 * xss 방어 모듈
 * 
 * @param {joi.objectShema<any>} schema 
 * @param {Object} obj 
 */
exports.userInputObjectValidateAsync = async (schema, obj) => {
    try{
        await schema.validateAsync(obj)
        
        await Promise.all(
            Object.entries(obj).map(([key, val]) => xss(val, xssOptions))   
        )
    }catch(err){
        throw err;
    }
}

