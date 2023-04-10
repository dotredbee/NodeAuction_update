

module.exports = {
    serverSecret : process.env.COOKIE_SECRET,
    
    cookie : {
        strict : {
            httpOnly    : true,
            secure      : false, 
            sameSite    : 'strict',
        },
        
        lax : {
            httpOnly    : true,
            secure      : false,
            sameSite    : 'lax' 
        }
        
    },

    sessionDetail : { 
        resave              : false,
        saveUninitialized   : false,
        secret              : process.env.COOKIE_SECRET,
        cookie : {
            httpOnly    : true,
            secure      : false, 
            sameSite    : 'strict',
        },
    },

    redis : {
        password : process.env.REDIS_PASSWORD,
        socket : {
            host : process.env.REDIS_HOST,
            port : process.env.PORT 
        }
    }
}