const EventEmitter = require('events')
const Redis = require('../modules/redis.module')

class GoodSubscribe extends EventEmitter{
    constructor() {
        super()
        this.redis = Redis.getInstance()
    }
}

const goodSubscribe = new GoodSubscribe()


goodSubscribe.on('save', (obj) => {
    if(goodSubscribe.redis) 
        goodSubscribe.redis.set('goods', obj)

})

module.exports = goodSubscribe;