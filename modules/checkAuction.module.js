const { Good } = require('../models')
const { successfulBid, auctionSchedule } = require('../services/auction')
const schedule = require('node-schedule')
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

        const targets = await Good.findAll({
            where : {
                SoldId : null,
            }
        })
        targets.forEach(async (target) => {
            if(target.endTime.valueOf() <= now)
                await successfulBid(target.id)
            else
                auctionSchedule(target.endTime, target.id)

        })
    }catch(err){
        console.error(err)
        throw err;
    }
} 