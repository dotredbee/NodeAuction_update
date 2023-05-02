

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
            httpOnly        : true,
            secure          : false, 
            sameSite        : 'strict',
        },
    },

    mysqlDetail : {
        host                : 'localhost',
        dialect             : 'mysql',
        pool                : { 
            max     : 10,
            min     : 0,
            acquire : 30000,
            idle    : 10000
        },
        dialectOptions: {
            maxRetries: 10,
            retry: {
              match: [
                /ETIMEDOUT/,
                /EHOSTUNREACH/,
                /ECONNRESET/,
                /ECONNREFUSED/,
                /ETIMEDOUT/,
                /ESOCKETTIMEDOUT/,
                /EHOSTUNREACH/,
                /EPIPE/,
                /EAI_AGAIN/,
                /SequelizeConnectionError/
              ],
              max: 5
            }
        }
    },
    
    redis : {
        password : process.env.REDIS_PASSWORD,
        socket : {
            host : process.env.REDIS_HOST,
            port : process.env.PORT 
        }
    }
}