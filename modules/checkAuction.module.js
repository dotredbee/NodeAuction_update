const { Good } = require('../models')
const { successfulBid, auctionSchedule } = require('../services/auction')

/**
 * 
 * 서버 시잔 전 (재시작 포함)
 * 
 * - 경매 종료 시간이 지난 상품 낙찰 처리
 * - 재시작 된 경우 기존 실행되었던 스케줄러가 종료되었으므로 재실행 
 */
module.exports = async function checkAuction() {
    try{
        const now = new Date();
        const tomorrow = now.setDate(now.getDate() + 1);
    
        const targets = await Good.findAll({
            where : {
                SoldId : null,
            }
        })
  
        targets.forEach(async (target) => {
            if(target.endTime.valueOf() <= now){
                await successfulBid(target.id)
            }
            else{
                //  입찰 기한이 하루 이하로 남은 애들만 스케줄 등록 
                if(target.endTime.valueOf() <= tomorrow.valueOf())
                    auctionSchedule(target.endTime, target.id)
            }

        })
    }catch(err){
        console.error(err)
        throw err;
    }
} 