const { User, Good, Auction, sequelize } = require('../models')
const schedule = require('node-schedule')
module.exports = {

    /**
     * 
     * 경매 상품 등록 
     * 
     * @param {object} goodDTO OwnerId, name, img, price
     * @param {Callback} done callbcak : err success info
     */
    register : async function(goodDTO, done) {
        try{
            const good = await Good.create(goodDTO)
            
            const endTime = new Date()
            endTime.setDate(endTime.getDate() - 1);
            
            this._setSoldOutSchedule(endTime, good.id)
            
            done(null, true)
        }catch(err){
            done(err, false)
        }
    },

    /**
     *
     * id에 일치하는 경매중인 상품 보여줍니다.
     * 
     * @param {String} id       상품 id 
     * @param {Callback} done   err, success info(message, good, auction)
     */
    show : async function(id, done) {
        try{
            const [ good, auction ] = await Promise.all([
                Good.findOne({
                    where : { id },
                    include : {
                        model : User,
                        as : 'owner'
                    }
                }),
                Auction.findAll({
                    where : { goodId : id },
                    include : { model : User },
                    order : [[ 'bid', 'ASC' ]]
                })
            ])

            done(null, true, {
                good,
                auction
            })
        }catch(err){
            done(err, false, { message : "조회에 실패했습니다." })
        }
    },
    
    showAll : async function(){
        try{
            return await Good.findAll({ where : { soldId : null }})
        }catch(err){
            throw err
        }
    },

    /**
     * 
     * 경매 상품 입찰 신청
     * 
     * @param {Object} bidDTO   userId, goodId, bid, msg 
     * @param {Callback} done   callback : err, success, info
     * @returns 
     */
    bid : async function(bidDTO, done){
        try{
            const good = await Good.findOne({
                where : { id : bidDTO.goodId },
                include : { model : Auction },
                order : [[ {model : Auction }, 'bid', 'DESC' ]]
            })
            if(good.price > bidDTO.bid)
                return done(null, false, { message : "시장 가격보다 높게 입찰해야 합니다."})
            
            if(new Date(good.createdAt).valueOf() + (24 * 60 * 60 * 1000) < new Date())
                return done(null, false, { message : "경매가 이미 종료되었습니다."})

            if(good.auctions[0] && good.auctions[0].bid >= bidDTO.bid)
                return done(null, false, { message : "이전 입찰가보다 높아야 합니다." })
            
            const result = await Auction.create({
                bid : bidDTO.bid,
                msg : bidDTO.msg,
                userId : bidDTO.userId,
                goodId : bidDTO.goodId
            })

            done(null, true, result) 
        }catch(err){
            done(err, false)
        }
    },
    /**
     * 
     * 입력받은 경매 마감 시간이 지나면 경매 마감 합니다.
     * 
     *  - 경매 물품 판매 처리
     *  - 구매자 등록 처리
     *  - 구매자 결산 처리
     * 
     * @param {Date} endTime    경매 마감 시간
     * @param {String} id       good id 
     */
    _setSoldOutSchedule : function(endTime, id) {
        try{
            schedule.scheduleJob(endTime, async () => {
                const success = await Auction.findOne({
                    where : { goodId : id },
                    order : [[ 'bid', 'DESC' ]]
                })
    
                await Good.update(
                    { soldId : success.userId },
                    { where : { id }}    
                )
    
                await User.update(
                    { money : sequelize.literal(`money - ${success.bid}`) },
                    { where : { id : success.userId } }
                )
            })
        }catch(err){
            throw err;
        }
    }
}