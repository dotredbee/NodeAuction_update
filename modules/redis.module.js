const redis = require('redis')
const config = require('../config')

/**
 * reids의 저장되는 데이터가 object인지 아닌지 맵핑 테이블
 */
const ValueTypes = {
    'goods' : true,
}

module.exports = class Redis{ 
    /**
     * 
     * 싱글톤 방식으로 redis 클라이언트 관리 
     * 
     */

    
    constructor() {
        this.client = redis.createClient(config.redis)

        // 만약 redis socket이 닫혀있다면 재연결 시도를 함.
        this._count = 0
    }
    
    static getInstance() {
        if(!Redis.instance) {
            Redis.instance = new Redis()   
        }
        
        return Redis.instance;
    }

    /**
     * 
     * redis에서 데이터를 불러온다.
     * 저장된 데이터가 객체인지 맵핑테이블을 통해 확인 후 json 변환 까지 진행
     * 
     * @param {String} key      redis의 key값
     * @returns {null | any}    redis에서 불러온 데이터, 없으면 null 반환
     */
    async get(key){
        try{
            let item = null
            if(ValueTypes[key]){
                const tmp = await this.client.get(key)
                if(!tmp) return null
                item = JSON.parse(tmp)
            }else{ 
                item = await this.client.get(key)
            }
            
            this._count = 0;
            if(!item) return null
            return item
        }catch(err){
            if(err.message === "The client is closed"){
                await this._open()
                
                if(this._count < 5){
                    this._count++;
                    return this.get(key)
                }else{
                    return null;
                }
            }
            throw err;
        }
    }    

    /**
     * 
     * @param {String}} key 
     * @param {any} val 
     * @param {Boolean} type 
     */
    async set(key, val, type = true) {
        try{
            if(type)
                await this.client.set(key, JSON.stringify(val))
            else 
                await this.client.set(key, val)
            this._count = 0;
        }catch(err){
            if(err.message === "The Client is closed"){
                await this._open()
                
                if(this._count < 5) {
                    this._count++;
                    return this.set(key, val, type)
                }else{
                    return
                }
            }
        }
    }

    _open(){
        return new Promise(async (resolve, reject) => {
            try{
                await this.client.connect()
                resolve()
            }catch(err){ 
                reject(err.message)
            }
        })             
    }

    _close(){
        return new Promise((resolve, reject) => {
            this.client.disconnect()
        })    
    }
}