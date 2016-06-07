var Cart=require('../models/cart');

module.exports=function (req,res,next) {
  if(req.user){
    var total=0;
    var t=0;
    Cart.findOne({owner:req.user._id},function(err,cart,count,totalPrice){
      if(cart){
        for(var i=0;i<cart.items.length;i++){
          total+=cart.items[i].quantity;
          t+=cart.items[i].price;
        }

        res.locals.cart=total;
        res.locals.count=cart.items.length;
        res.locals.totalPrice=t;
      }else{
        res.locals.cart=0;
        res.locals.count=0;
        res.locals.totalPrice=0;
      }
      next();
    })
  }else{
    res.locals.cart=0;
    res.locals.count=0;
    res.locals.totalPrice=0;
    next();
  }
}
