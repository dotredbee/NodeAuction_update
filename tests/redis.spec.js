
const Redis = require('../modules/redis.module');
const goodSubscribe = require('../sub/good')

describe('redis test : good', () => {
    let instance;

    const test = {
        name : "test",
        endTime : new Date(),
        price : 20000
    }
    beforeEach(() => {
        instance = Redis.getInstance()
    })

    it('set test', done => {
        instance.set('goods', test)
        done() 
    })

    
})