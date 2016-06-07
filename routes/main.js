var router=require('express').Router();
var User=require('../models/user');
var Product=require('../models/product');
var Cart=require('../models/cart');
var async=require('async');

var stripe=require('stripe')('sk_test_aboS0DfwxtdBDGXzXGENhgXr');

function paginate(req,res,next){
  Product
  .find()
  .populate('category')
  .exec(function(err,products) {
    if(err) return next(err);
    res.render('main/product-main',{
      products:products
      });
    });
}


Product.createMapping(function(err,mapping){
  if(err){
    console.log("error creating mapping");
    console.log(err);
  }else{
    console.log("mapping created");
    console.log(mapping);
  }
});

var stream=Product.synchronize();
var count=0;

stream.on('data',function(){
  count++;
});

stream.on('close',function(){
  console.log("Indexed "+count+" document");
});

stream.on('error',function(err){
  console.log(err);
});

router.get('/cart',function(req,res,next){
  Cart.findOne({owner:req.user._id})
    .populate('items.item')
    .exec(function(err,foundCart){
      if(err) return next(err);
      res.render('main/cart',{
        foundCart:foundCart,
        message:req.flash('remove')
      });
    });
});

router.post('/product/:product_id',function(req,res,next){
  Cart.findOne({owner:req.user._id},function(err,cart){
    // var datetime = Date.now();
    // var dateFormat = datetime.toString('dd-MMM-yyyy');

    var today = new Date().toLocaleDateString('vi-GB', {
    day : 'numeric',
    month : 'numeric',
    year : 'numeric'
      }).split(' ').join('-');

    // var d = new Date();
    // var date = d.toString().replace(/\S+\s(\S+)\s(\d+)\s(\d+)\s.*/,'$2-$1-$3');

    if (cart.items!=null) {
      cart.items.push({
        item:req.body.product_id,
        price:parseFloat(req.body.priceValue),
        quantity:parseInt(req.body.quantity),
        date:today
      });
      cart.total=(cart.total + parseFloat(req.body.priceValue)).toFixed(2);

      cart.save(function(err){
        if(err) return next(err);
        return res.redirect('/cart');
        });
    }else {
      console.log(cart);
    }


  });
});

router.post('/remove',function(req,res,next){
  Cart.findOne({owner:req.user._id},function(err,foundCart){
    foundCart.items.pull(String(req.body.item));

    foundCart.total=(foundCart.total - parseFloat(req.body.price)).toFixed(2);
    foundCart.save(function(err,found){
      if(err) return next(err);
      req.flash('remove','Successfully removed');
      res.redirect('/cart');
    });
  });
});

router.post('/products/:id/search',function(req,res,next){
  res.redirect('/search?q='+req.body.q);
});

router.get('/products/:id/search',function(req,res,next){
  if(req.query.q){
    Product.search({
      query_string:{query:req.query.q}
    }, function(err,results){
      if(err) return next(err);
      var data=results.hits.hits.map(function(hit){
        return hit;
      });
      res.render('main/search-result',{
        query:req.query.q,
        data:data
      });

    });
  }
});

router.get('/',function(req,res,next){
  paginate(req,res,next);
  //res.render('main/product-main');
});



router.get('/page/:page',function(req,res,next){
  paginate(req,res,next);
});

router.get('/about',function(req,res){
  res.render('main/about');
});

router.get('/products/:id',function(req,res,next){
  Product.find({category:req.params.id})
  .populate('category')
  .exec(function(err,products){
    if(err) return next(err);
    res.render('main/category',{
      products:products
    });
  });
});

router.get('/product/:id',function(req,res,next){
  Product.findById({_id:req.params.id},function(err,product){
    if(err) return next(err);
    res.render('main/product',{
      product:product
    });
  });
});

router.post('/payment',function(req,res,next){
  var stripeToken=req.body.stripeToken;
  var currentCharges=Math.round(req.body.stripeMoney *100);
  stripe.customers.create({
    source:stripeToken
  }).then(function(customer){
    return stripe.charges.create({
      amount:currentCharges,
      currency:'usd',
      customer:customer.id
    });
  }).then(function(charge){
    async.waterfall([
      function(callback){
        Cart.findOne({owner:req.user._id},function(err,cart){
          callback(err,cart);
        });
      },
      function(cart,callback){
        User.findOne({_id:req.user._id},function(err,user){
          if(user){
            var datetime = new Date();
            for(var i=0; i<cart.items.length;i++){
              user.history.push({
                item: cart.items[i].item,
                count:cart.items[i].quantity,
                paid: cart.items[i].price,
                date: cart.items[i].date,

              });
            }
            user.save(function(err,user){
              if(err) return next(err);
              callback(err,user);
            });
          }
        });
      },
      function(user){
        Cart.update({owner:user._id},{$set:{items:[],total:0}},function(err,updated){
          if(updated){
            res.redirect('/profile');
          }
        });
      },
    ]);
  });
});

module.exports=router;
