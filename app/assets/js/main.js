
var currScrTch = false;
jQuery(document).ready(function($){
	setTimeout(function(){
		$('.loader').fadeOut( "slow" );
	}, 2000);

	$('#paypal-cowbone').hide();
	$('#paypal-baton').hide();
	$('#paypal-pennies').hide();

	// $('.overlay').bind('click touchend', closeNav);
	$('.closebtn').bind('click touchend', closeNav);
	// $('#hiddenshowcase').bind('click touchend', openNav);
	$('.showcase').bind('touchstart', function(){currScrTch=false;});
	$('.showcase').on('touchmove', function(){currScrTch=true;});
	$('.showcase').bind('click touchend', openNav);
	$('.showcase#null, #hiddenshowcase').unbind('click touchend');

	var slides = $('.swiper-container-banner .swiper-slide');
	console.log(slides);
	for(var i = 0; i < slides.length; i++){
		$('#slide-' + i + ' img').attr('data-src', config.bannerImages[i]);
		// $('#slide-' + i).attr('src', 'assets/images/load-icon.png');
		// slides.eq(i).css('background-size', 'cover');
		// slides.eq(i).css('background-position', 'center center');
	}

	bannerSwiper = new Swiper ('.swiper-container-banner', {
    	autoplay: 5000,
    	slidesPerView: 'auto',
    	loop: true
  	});

	productSwiper = new Swiper ('.swiper-container-product', {
    	autoplay: 5000,
    	slidesPerView: 1,
    	// loop: true
  	});

	colourSwiper = new Swiper ('.swiper-container-colour', {
    	// autoplay: 5000,
    	centeredSlides: true,
    	slidesPerView: 'auto',
    	prevButton: $('.prev-colour'),
    	nextButton: $('.next-colour'),
    	pagination: $('.swiper-pagination-colour'),
    	paginationClickable: true,
    	paginationBulletRender: function (swiper, index, className) {
    		var a = ['dfbcbc', 'b9dfb9', 'b9b9df'];
      		return '<span class="' + className + '" data-col="' + a[index] + '" id="' + a[index] + '"></span>';
  		},
    	onSlideChangeEnd: function(swiper){
    		swiper.onResize();
    		// $('#select-colour').val($('.swiper-container-colour .swiper-slide[data-id="' + swiper.activeIndex + '"]').data("colour"));
    		console.log("" + $('#hiddenshowcase').attr('data-product'));
    		$('#select-colour-' + $('#hiddenshowcase').attr('data-product')).val($('.swiper-container-colour .swiper-slide[data-id="' + swiper.realIndex + '"]').data("colour"));
    		$('.swiper-pagination-bullet-active').css('background', '#' + $('.swiper-pagination-bullet-active').data('col'));
    		$('#hiddenshowcase').attr('data-product', $('#hiddenshowcase h3').html() + $('.swiper-container-colour .swiper-slide[data-id="' + swiper.realIndex + '"]').data("colour"));
    		$('#hiddenshowcase .cd-add-to-cart').attr('data-id', $('#hiddenshowcase h3').html() + $('.swiper-container-colour .swiper-slide[data-id="' + swiper.realIndex + '"]').data("colour"));
    	}
  	});
	colourSwiper.slideTo(0);
   	// $('.swiper-pagination-bullet').each(function(bullet){
   	// 	bullet.css('background', '#' + bullet.data('col'));
   	// 	console.log(bullet.data('col'));
   	// });
  	
  	// $('.prev-colour').bind('mousedown touchstart', colourSwiper.slidePrev);
  	// $('.next-colour').bind('mousedown touchstart', colourSwiper.slideNext);
    	$('.swiper-pagination-bullet').css('background', '#' + $('.swiper-pagination-bullet-active').data('col'));

	$("#myNav").hide();

	var cartWrapper = $('.cd-cart-container');
	var productId = 0;
	if( cartWrapper.length > 0 ) {
		//store jQuery objects
		var cartBody = cartWrapper.find('.body');
		var cartList = cartBody.find('ul').eq(0);
		var cartTotal = cartWrapper.find('.checkout').find('span');
		var cartTrigger = cartWrapper.children('.cd-cart-trigger');
		var cartCount = cartTrigger.children('.count');
		var addToCartBtn = $('.cd-add-to-cart');
		var undo = cartWrapper.find('.undo');
		var undoTimeoutId;

		//add product to cart
		addToCartBtn.on('click touchstart', function(event){
			event.preventDefault();
			addToCart($(this));
			closeNav(event);
			window.onscroll = null;
		});

		//open/close cart
		cartTrigger.on('click touchend', function(event){
			event.preventDefault();
			toggleCart();
		});

		//close cart when clicking on the .cd-cart-container::before (bg layer)
		cartWrapper.on('click touchend', function(event){
			if( $(event.target).is($(this)) ) toggleCart(true);
		});

		//delete an item from the cart
		cartList.on('click touchend', '.delete-item', function(event){
			event.preventDefault();
			removeProduct($(event.target).parents('.product'));
		});

		//update item quantity
		cartList.on('change', 'select', function(event){
			quickUpdateCart();
		});

		//reinsert item deleted from the cart
		undo.on('click touchend', 'a', function(event){
			clearInterval(undoTimeoutId);
			event.preventDefault();
			cartList.find('.deleted').addClass('undo-deleted').one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(){
				$(this).off('webkitAnimationEnd oanimationend msAnimationEnd animationend').removeClass('deleted undo-deleted').removeAttr('style');
				quickUpdateCart();
			});
			undo.removeClass('visible');
		});
	}

	function toggleCart(bool) {
		var cartIsOpen = ( typeof bool === 'undefined' ) ? cartWrapper.hasClass('cart-open') : bool;
		
		if( cartIsOpen ) {
			cartWrapper.removeClass('cart-open');
			//reset undo
			clearInterval(undoTimeoutId);
			undo.removeClass('visible');
			cartList.find('.deleted').remove();

			setTimeout(function(){
				cartBody.scrollTop(0);
				//check if cart empty to hide it
				if( Number(cartCount.find('li').eq(0).text()) == 0) cartWrapper.addClass('empty');
			}, 500);
		} else {
			cartWrapper.addClass('cart-open');
		}
	}

	function addToCart(trigger) {
		// console.log(trigger[0]);
		var cartIsEmpty = cartWrapper.hasClass('empty');
		//update cart product list
		addProduct(trigger);
		//update number of items 
		updateCartCount(cartIsEmpty);
		//update total price
		updateCartTotal(parseFloat(trigger.data('price')), true);
		//show cart
		cartWrapper.removeClass('empty');
	}

	function addProduct(trigger) {
		var idParam = "";
		var numParam = 0;
		for (var i = 0; i < config.fidgeters.length; i++){
		  // look for the entry with a matching `code` value
		  if (config.fidgeters[i].id == trigger.data('id')){
		    idParam = trigger.data('id');
		    numParam = i;
		  }
		}
		console.log(idParam);
		var productSrc = config.fidgeters[numParam].images[0];
		// console.log(productSrc);
		productName = idParam;
		// console.log(productName);
		//this is just a product placeholder
		//you should insert an item with the selected product info
		//replace productId, productName, price and url with your real product info
		if(orderParams == 'null'){
			orderParams = productName;
		} else{
			orderParams += ', ' + productName;
		}
		productId = productId + 1;
		var productsAdded = $('.product');
		// console.log(productsAdded);
		for(var index = 0; index < productsAdded.length; index ++){
			var inc = index + 1;
			if(productsAdded[productsAdded.length - index - 1].id == 'product_' + inc){
				// console.log($('#cd-product-' + inc).val());
				$('#cd-product-' + index + 1).val(parseInt($('#cd-product-' + inc + ' option:selected').text()) + 1).prop('selected', true);
			}
		}
		var productAdded = $('<li class="product" id="product_' + productId + '"><div class="product-image"><a href="#0"><img src="' + productSrc +'"></a></div><div class="product-details"><h3><a href="#0">' + productName +'</a></h3><span class="price">$' + trigger.data('price') + '</span><div class="actions"><a href="#0" class="delete-item">Delete</a><div class="quantity"><label for="cd-product-'+ productId +'">Qty</label><span class="select"><select id="cd-product-'+ productId +'" name="quantity"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option></select></span></div></div></div></li>');
		cartList.prepend(productAdded);
	}

	function removeProduct(product) {
		clearInterval(undoTimeoutId);
		cartList.find('.deleted').remove();
		
		var topPosition = product.offset().top - cartBody.children('ul').offset().top ,
			productQuantity = Number(product.find('.quantity').find('select').val()),
			productTotPrice = Number(product.find('.price').text().replace('$', '')) * productQuantity;
		
		product.css('top', topPosition+'px').addClass('deleted');

		//update items count + total price
		updateCartTotal(productTotPrice, false);
		updateCartCount(true, -productQuantity);
		undo.addClass('visible');

		//wait 8sec before completely remove the item
		undoTimeoutId = setTimeout(function(){
			undo.removeClass('visible');
			cartList.find('.deleted').remove();
		}, 8000);
	}

	function quickUpdateCart() {
		var quantity = 0;
		var price = 0;
		
		cartList.children('li:not(.deleted)').each(function(){
			var singleQuantity = Number($(this).find('select').val());
			quantity = quantity + singleQuantity;
			price = price + singleQuantity*Number($(this).find('.price').text().replace('$', ''));
		});

		cartTotal.text(price.toFixed(2));
		cartCount.find('li').eq(0).text(quantity);
		cartCount.find('li').eq(1).text(quantity+1);
	}

	function updateCartCount(emptyCart, quantity) {
		if( typeof quantity === 'undefined' ) {
			var actual = Number(cartCount.find('li').eq(0).text()) + 1;
			var next = actual + 1;
			
			if( emptyCart ) {
				cartCount.find('li').eq(0).text(actual);
				cartCount.find('li').eq(1).text(next);
			} else {
				cartCount.addClass('update-count');

				setTimeout(function() {
					cartCount.find('li').eq(0).text(actual);
				}, 150);

				setTimeout(function() {
					cartCount.removeClass('update-count');
				}, 200);

				setTimeout(function() {
					cartCount.find('li').eq(1).text(next);
				}, 230);
			}
		} else {
			var actual = Number(cartCount.find('li').eq(0).text()) + quantity;
			var next = actual + 1;
			
			cartCount.find('li').eq(0).text(actual);
			cartCount.find('li').eq(1).text(next);
		}
	}

	function updateCartTotal(price, bool) {
		bool ? cartTotal.text( (Number(cartTotal.text()) + price).toFixed(2) )  : cartTotal.text( (Number(cartTotal.text()) - price).toFixed(2) );
	}
});

	var orderParams = 'null';

	function draftOrder(){
		$('.loader').fadeIn( "slow" );
		// $('.loader').fadeIn( "slow" ).done(function(){
		// });
		setTimeout(function(){
			var htmlStr = 	'<div id="page">' +
				'<div class="row">' +
					'<textarea rows="1" cols="80" name="form-name" id="form-name" class="email-drafter" placeholder="Please provide your name so we know what to call you"></textarea>' +
					'<textarea rows="1" cols="80" name="form-email" id="form-email" class="email-drafter" placeholder="Please provide your email so we know how to contact you"></textarea>' +
					'<textarea rows="15" cols="80" name="comment" id="comment" class="email-drafter" placeholder="This order will go through as an email. You can add any customisations or special requests here."></textarea>' +
					'<textarea rows="20" cols="10" name="order-details" id="order-details"  hidden>' + orderParams + '</textarea>' +
				'</div>' +
				'<div class="row">' +
					'<button id="mail-order-button" type="button" class="order-btn">Send Order</button>' +
				'</div>' +
					// '<form target="paypal" action="https://www.paypal.com/cgi-bin/webscr" method="post">' + 
					// 	'<input type="hidden" name="cmd" value="_s-xclick">' + 
					// 	'<input type="hidden" name="hosted_button_id" value="TRMNQLXFSKHEN">' + 
					// 	'<input type="image" src="https://www.paypalobjects.com/en_GB/i/btn/btn_cart_LG.gif" border="0" name="submit" alt="PayPal – The safer, easier way to pay online!">' + 
					// 	'<img alt="" border="0" src="https://www.paypalobjects.com/en_GB/i/scr/pixel.gif" width="1" height="1">' + 
					// '</form>' + 
				'</div>';
			$('#page').replaceWith(htmlStr);
			$('#select-product').hide();
			$('#select-product select').val("Baton Blue");
			$('.loader').fadeOut( "slow" );
		}, 2000);
		$('#mail-order-button').click(function() {
			if($("#form-name").val() == ""){
				alert( "You have to enter your name or we won't know what to call you");
			}  else if($("#form-email").val() == ""){
				alert( "You have to enter your email or we won't know how to contact you");
			}  else {
			// console.log($("#form-name").val());
			// console.log($("#form-email").val());
			// console.log($("#comment").val());
			// console.log($("#order-details").val());
			var data = {
    				name: $("#form-name").val(),
    				email: $("#form-email").val(),
    				message: $("#comment").val(),
    				order: $("#order-details").val()
			};
 			$.ajax({
  				type: "POST",
  				url: "order.php", 
  				data: data
			}).done(function( msg ) {
  				var htmlStr = '<p>THANK YOU<p>' +
				'<div class="row">' +
					'<button id="return-btn" type="button" class="order-btn">Return to main site</button>' +
				'</div>';
  				$('#page').replaceWith(htmlStr);
  				$('#return-btn').click(function() {
  					window.location = 'http://www.ericinbrackets.co/fidgeters';
  				});
			});   
			} 
    		});
		
		var cartWrapper = $('.cd-cart-container');
		var cartIsOpen = ( typeof bool === 'undefined' ) ? cartWrapper.hasClass('cart-open') : bool;
		cartWrapper.removeClass('cart-open');
		//reset undo
		//clearInterval(undoTimeoutId);
		// undo.removeClass('visible');
		// cartList.find('.deleted').remove();

		setTimeout(function(){
			cartBody.scrollTop(0);
			//check if cart empty to hide it
			cartWrapper.addClass('empty');
		}, 500);
	}

	function sendOrder(){
		
	}

	
	function openNav(e) {
	  if(currScrTch){
	  currScrTch=false;
	  return;
	  }
		// console.log('test');
		disableScroll();
		e.preventDefault();
		colourSwiper.slideTo(0);
		if(this.id != "hiddenshowcase" && this.id != "null"){
			// console.log(this);
			var fidg = config.fidgeters[parseInt(this.id)];

			var slides = $('.swiper-container-product .swiper-slide');

			for(var i = 0; i < slides.length; i++){
				slides.eq(i).css('background', 'url(' + fidg.bannerimages[i] + ')');
				slides.eq(i).css('background-size', 'cover');
				slides.eq(i).css('background-position', 'center center');
			}


			$('.swiper-container-colour .swiper-slide').each( function(){
				$(this).children('img').attr("data-src", fidg.images[parseInt($(this).data('id'))]);
			});

			// console.log(fidg);
			$('#hiddenshowcase').children('p.desc').html(fidg.copy);
			$('#hiddenshowcase').children('p.info').html(" The " + fidg.id + " is available in 3 colours. Select your colour and shipping region to proceed.<br><br> Shipping estimates:<br> 3-6 working days inside the UK<br> Up to 15 working days outside UK<br> Up to 30 days for AUS/NZ");
			$('#hiddenshowcase').children('h3').html(fidg.id);
			$('#hiddenshowcase').children('button').val(this.id);
			$('#hiddenshowcase').children('button').data('price', fidg.price);
			$('#hiddenshowcase').children('button').data('prod', fidg.id);
			$('#hiddenshowcase .cd-add-to-cart').attr('data-id', fidg.id);
			var addToCartBtn = $('.cd-add-to-cart');
			addToCartBtn.off('click touchstart');
			switch (fidg.status) {
				case 0:
					addToCartBtn.on('click touchstart', function(event){
						event.preventDefault();
						addToCart($(this));
						closeNav(event);
						window.onscroll = null;
					});
					addToCartBtn.html('add to cart');
					$('.paypal-btn').removeAttr('disabled');
					$('.paypal-btn').attr('src', 'assets/images/PAY%20NOW.png');
				break;

				case 1:
					addToCartBtn.on('click touchstart', function(event){
						console.log('disabled - coming soon');
					});
					addToCartBtn.html('disabled - coming soon');
					$('.paypal-btn').attr('disabled', 'disabled');
					$('.paypal-btn').attr('src', 'assets/images/DISABLED.png');
				break;

				case 2:
					addToCartBtn.on('click touchstart', function(event){
						console.log('disabled - out of stock');
					});
					addToCartBtn.html('disabled - out of stock');
					$('.paypal-btn').attr('disabled', 'disabled');
					$('.paypal-btn').attr('src', 'assets/images/DISABLED.png');
				break;

				default:
				break;
			}
		
			$('#paypal-' + fidg.id).show();
			$("#myNav").show();
		}
                colourSwiper.onResize();
                productSwiper.onResize();
		$('#hiddenshowcase').attr('data-product', fidg.id + "Red");
		console.log(fidg.id);
		
		var allimages= document.getElementsByTagName('img');
    for (var i=0; i<allimages.length; i++) {
        if (allimages[i].getAttribute('data-src')) {
            allimages[i].setAttribute('src', allimages[i].getAttribute('data-src'));
        }
    }
	
	}

	function closeNav(e) {
		e.preventDefault();
		$('#paypal-cowbone').hide();
		$('#paypal-baton').hide();
		$('#paypal-pennies').hide();
		document.getElementById("myNav").style.display = "none";
		enableScroll();
	}

	function onShowcaseClicked(e){
		e.preventDefault();
	}

	function disableScroll() {
		var y = $(window).scrollTop();
		// window.addEventListener('DOMMouseScroll', preventDefault, false);
		window.onscroll = function () { window.scrollTo(0, y); };
	}

	function enableScroll() {
	    window.onscroll = null; 
	}