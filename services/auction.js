const { User, Good, Auction, sequelize } = require('../models')
const schedule = require('node-schedule')
module.exports = {

    /**
     * 
     * 경매 상품 등록 
     * 
     * @param {object} goodDTO OwnerId, name, img, price, endTime
     * @param {Callback} done callbcak : err success info
     */
    register : async function(goodDTO, done) {
        try{
            const good = await Good.create(goodDTO)
            
            // const endTime = new Date()
            // endTime.setDate(endTime.getDate() - 1);
            
            this.auctionSchedule(goodDTO.endTime, good.id)
            
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
                        as : 'Owner'
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

            if(good.OwnerId === bidDTO.userId)
                return done(null, false, { message : "상품 등록자는 입찰이 불가합니다." })
                
            if(good.price > bidDTO.bid)
                return done(null, false, { message : "시장 가격보다 높게 입찰해야 합니다."})
            
            if(new Date(good.endTime).valueOf() < new Date())
                return done(null, false, { message : "경매가 이미 종료되었습니다."})

            if(good.Auctions?.bid >= bidDTO.bid)
                return done(null, false, { message : "이전 입찰가보다 높아야 합니다." })
            
            const result = await Auction.create({
                bid : bidDTO.bid,
                msg : bidDTO.msg,
                UserId : bidDTO.userId,
                GoodId : bidDTO.goodId
            })

            done(null, true, result) 
        }catch(err){
            done(err, false)
        }
    },

    /**
     * 
     * 입찰 금액이 가장 높은 사용자에게 낙찰처리
     * 아무도 입찰하지 않았다면 해당 상품은 삭제 처리 
     * 
     * @param {string} 상품 Id 
     */
    successfulBid : async function(goodId) {
       try{
            const success = await Auction.findOne({
                where : { goodId },
                order : [[ 'bid', 'DESC' ]]
            })

            // 입찰자가 없다면 
            if(!success) {
                await Good.destroy({
                    where : { id : goodId }
                })
                return;        
            }

            await Promise.all([
                Good.update(
                    { SoldId : success.UserId },
                    { where : { id : goodId }}
                ),
                User.update(
                    { money : sequelize.literal(`money - ${success.bid}`)},
                    { where : { id : success.UserId }}
                )
            ])
       }catch(err){
            throw err;
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
    auctionSchedule : function(endTime, id){
        try{
            schedule.scheduleJob(endTime, async () => {
                await this.successfulBid(id)
            })
        }catch(err){
            throw err;
        }
    }
}