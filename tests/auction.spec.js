const { expect } = require('expect')
describe('auction service test', () => {
    const AuthService = require('../services/auth')
    const AuctionService = require('../services/auction')    
    
    const tester = {
        email : "tester2@gmail.com",
        password : "Tester123@4"
    }

    // it('auction register service test', (done) => {
    //     AuthService._login(tester, (err, success, info) => {
    //         if(err) return done(err)
            
    //         if(!success) console.log(info.message)
            
    //         // user id
    //         const goodDTO = {
    //             ownerId : info.id,
    //             name : "testAuctionItem",
    //             img : "imgsource",
    //             price : 10000
    //         }
    //         AuctionService.register(goodDTO, (err, success, info) => {
    //             if(err) return done(err)
                
    //             expect(success).toEqual(true)
    //             done()
    //         })
    //     })
    // })

    it('auction bid service test', (done) => {
        AuthService._login(tester, (err, success, info) => {
            if(err) return done(err)
            
            if(!success) console.log(info.message)

            const bidDTO = {
                userId : 1,
                goodId : 1,
                bid : 20000,
                msg : "20000원 테스트",
            }

            AuctionService.bid(bidDTO, (err, success, info)=>{
                if(err) return done(err)
                
                expect(success).toEqual(true)
                console.log(info)
                done();
            })
        })
    })
})
