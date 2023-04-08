const joi = require('joi')
const { userInputObjectValidateAsync } = require('../utils/validate')
const AuctionService = require('../services/auction')


exports.registerGood = async (req, res, next) => {
    const body = req.body;
    const schema = joi.object().keys({
      name : joi.string().alphanum().min(4).max(40).required(),
      price : joi.number().required(),
      endTime : joi.string().isoDate().required()
    })
    try {
      await userInputObjectValidateAsync(schema, body)
      const { name, price } = body;
  
      const goodDTO = {
        OwnerId : req.user.id,
        name,
        img : req.file.filename,
        price,
        endTime : req.body.endTime,
      }
  
      AuctionService.register(goodDTO, (err, success) => {
        if(err) return next(err)
        
        if(success)
          res.redirect('/')
      })
    } catch (error) {
      next(error);
    }
}

exports.showGood = async (req, res, next) => {
    const schema = joi.object().keys({
        id : joi.string().required()
    })
    try {
        await userInputObjectValidateAsync(schema, req.params)
        
        AuctionService.show(req.params.id, (err, success, info) => {
            if(err) return next(err)
            
            if(success && info && info.hasOwnProperty("good") && info.hasOwnProperty("auction")) {
                const { good, auction } = info;
                
                res.render('auction', {
                    title : `${good.name} - NodeAuction}`,
                    good,
                    auction,
                    auctionError : req.flash('auctionError')
                })
            }
        })
    } catch (error) {
        next(error);
    }
}

exports.bidGood = async (req, res, next) => {
    const bodySchema = joi.object().keys({
        bid : joi.number().required(),
        msg : joi.string().required()
    })
    
    const paramsSchema = joi.object().keys({
        id : joi.string().required()
    })
    try {
        const [ ret1, ret2 ] = await Promise.all([
            userInputObjectValidateAsync(bodySchema, req.body),
            userInputObjectValidateAsync(paramsSchema, req.params)
        ])
        if(!ret1 || !ret2) throw Error('wrong request')

        const bidDTO = {
            userId : req.user.id,
            goodId : req.params.id,
            bid : req.body.bid,
            msg : req.body.msg
        }

        AuctionService.bid(bidDTO, (err, success, info) => {
            if(err) return next(err)
            
            if(!success)
                return res.status(403).send(info.message)

            req.app.get('io').to(req.params.id).emit('bid', {
                bid: info.bid,
                msg: info.msg,
                nick: req.user.nick,
            });

            return res.status(200).send("ok")
        })
    } catch (error) {
        return next(error);
    }
}