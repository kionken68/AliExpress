$(function(){

Stripe.setPublishableKey('pk_test_xY5ZPRsgSOl2KrFag0TiQQCG');

var opts = {
  lines: 13 // The number of lines to draw
  , length: 28 // The length of each line
  , width: 33 // The line thickness
  , radius: 6 // The radius of the inner circle
  , scale: 1.5 // Scales overall size of the spinner
  , corners: 0.9 // Corner roundness (0..1)
  , color: '#000' // #rgb or #rrggbb or array of colors
  , opacity: 0.2 // Opacity of the lines
  , rotate: 0 // The rotation offset
  , direction: 1 // 1: clockwise, -1: counterclockwise
  , speed: 1 // Rounds per second
  , trail: 70 // Afterglow percentage
  , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
  , zIndex: 2e9 // The z-index (defaults to 2000000000)
  , className: 'spinner' // The CSS class to assign to the spinner
  , top: '50%' // Top position relative to parent
  , left: '50%' // Left position relative to parent
  , shadow: false // Whether to render a shadow
  , hwaccel: false // Whether to use hardware acceleration
  , position: 'absolute' // Element positioning
}

  $('#search').keyup(function(){
    var search_term=$(this).val();
    if(search_term.length!=0){
    $.ajax({
      method:'POST',
      url:'/api/search',
      data:{
        search_term
      },
      dataType:'json',
      success: function(json){
        var data=json.hits.hits.map(function(hit){
          return hit;
        });
        $('#searchResults').empty();
        for(var i=0;i<data.length;i++){
          var html="";
          html+='<li class="col-sx-12 col-sm-4">';
          html+='<div class="product-container">';
          html+='<div class="left-block">';
          html+='<a href="/product/'+data[i]._id  +'">';
          html+='<img class="img-responsive" alt="product" src="'+data[i]._source.image +'" />';
          html+='</a>';
          html+='<div class="quick-view">';
          html+='<a title="Add to my wishlist" class="heart" href="#">';
          html+='</a>';
          html+='<a title="Add to compare" class="compare" href="#">';
          html+='</a>';
          html+='<a title="Quick view" class="search" href="#">';
          html+='</a>';
          html+='</div>';
          html+='<div class="add-to-cart">';
          html+='<a title="Add to Cart" href="#add">Add to Cart</a>';
          html+='</div>';
          html+='</div>';

          html+='<div class="right-block">';
          html+='<h5 class="product-name"><a href="/product/'+data[i]._id  +'">"'+data[i]._source.name+'"</a></h5>';
          html+='<div class="product-star">';
          html+='<i class="fa fa-star">';
          html+='</i>';
          html+='<i class="fa fa-star">';
          html+='</i>';
          html+='<i class="fa fa-star">';
          html+='</i>';
          html+='<i class="fa fa-star">';
          html+='</i>';
          html+='<i class="fa fa-star-half-o">';
          html+='</i>';
          html+='</div>';
          html+='<div class="content_price">';
          if(data[i].price!=0){
            html+='<span class="price product-price">'+data[i]._source.price+' VND';
            html+='</span>';
            html+='<span class="price old-price">'+data[i]._source.price *1.5+' VND';
            html+='</span>';
          }else {
            html+='<span class="price product-price">Giá Liên Hệ';
            html+='</span>';
          }
          html+='</div>';
          html+='<div class="info-orther">';
          html+='<p>Item Code: #453217907';
          html+='</p>';
          html+='<p class="availability">Availability: <span>In stock';
          html+='</span></p>';
          html+='<div class="product-desc">Vestibulum eu odio. Suspendisse potenti. Morbi mollis tellus ac sapien. Praesent egestas tristique nibh. Nullam dictum felis eu pede mollis pretium. Fusce egestas elit eget lorem. In auctor lobortis lacus. Suspendisse faucibus, nunc et pellentesque egestas, lacus ante convallis tellus, vitae iaculis lacus elit id tortor.';
          html+='</div></div></div></div></li>';

          $('#searchResults').append(html);
        }
      },
      error: function(error){
        console.log(err);
      }
    });
  }
});


$(document).on('click','#plus',function(e){
  e.preventDefault();
  var priceValue=parseFloat($('#priceValue').val());
  var quantity=parseInt($('#quantity').val());

  priceValue+=parseFloat($('#priceHidden').val());
  quantity += 1;
  $('#quantity').val(quantity);
  $('#priceValue').val(priceValue.toFixed(2));
  $('#total').html(quantity);
});

$(document).on('click','#minus',function(e){
  e.preventDefault();
  var priceValue=parseFloat($('#priceValue').val());
  var quantity=parseInt($('#quantity').val());
  if(quantity>1)
  {
    priceValue-=parseFloat($('#priceHidden').val());
    quantity -= 1;
  }

  $('#quantity').val(quantity);
  $('#priceValue').val(priceValue.toFixed(2));
  $('#total').html(quantity);
});



function stripeResponseHandler(status, response) {
  // Grab the form:
  var $form = $('#payment-form');

  if (response.error) { // Problem!

    // Show the errors on the form:
    $form.find('.payment-errors').text(response.error.message);
    $form.find('.submit').prop('disabled', false); // Re-enable submission

  } else { // Token was created!

    // Get the token ID:
    var token = response.id;

    // Insert the token ID into the form so it gets submitted to the server:
    $form.append($('<input type="hidden" name="stripeToken">').val(token));

    var spinner = new Spinner(opts).spin();
    $('#loading').append(spinner.el);

    // Submit the form:
    $form.get(0).submit();
  }
};

var $form = $('#payment-form');
  $form.submit(function(event) {
    // Disable the submit button to prevent repeated clicks:
    $form.find('.submit').prop('disabled', true);

    // Request a token from Stripe:
    Stripe.card.createToken($form, stripeResponseHandler);

    // Prevent the form from being submitted:
    return false;
  });
});
