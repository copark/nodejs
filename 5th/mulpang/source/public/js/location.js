Util.require("http://maps.google.com/maps/api/js?sensor=false&libraries=geometry");
// google maps api 참조 -> https://developers.google.com/maps/documentation/javascript/reference?hl=ko

/*
	1. 지도를 보여준다.
	2. 현재 위치를 찾는다.
		2.1. 지도를 현재 위치로 이동한다.		
		2.2. 현재 위치에 마커를 표시한다.
		2.3. 현재 위치의 오차를 표시한다.
	3. 서버로부터 쿠폰 목록을 받아온다.
		3.1. 지도에 쿠폰 정보를 추가한다.	
		3.2. 지도안에 쿠폰이 들어오면 슬라이더를 갱신하도록 이벤트를 추가한다.
	4. 슬라이더를 초기화 한다.
*/

var couponCollection = [];
var map;
var openWindow;

// 1. 지도를 보여준다.
$(function(){
	map = new google.maps.Map($("#location_map")[0], {
		zoom: 14,
		center: new google.maps.LatLng(37.527066, 127.028449)
	});
	
	showCurrentPosition();
});

// 2. 현재 위치를 찾는다.
function showCurrentPosition(){
	// 지도에 현재 위치의 오차를 원형으로 표시하기 위한 Circle 객체
	circle = new google.maps.Circle({
		strokeColor: "blue",
		strokeOpacity: 0.2,
		fillColor: "blue",
		fillOpacity: 0.1,
		map: map
	});
	
	// 2. 현재 위치를 찾는다.
	navigator.geolocation.getCurrentPosition(success, error);	
}

function success(position){
	// 2.1. 지도를 현재 위치로 이동한다.
	var here = new google.maps.LatLng(
		position.coords.latitude,
		position.coords.longitude);
	map.setCenter(here);
	
	console.info(here.toString());
	// 2.2. 현재 위치에 마커를 표시한다.
	new google.maps.Marker({
		map: map,
		position: here
	});
	
	// 2.3. 현재 위치의 오차를 표시한다.	
	circle.setCenter(here);
	circle.setRadius(position.coords.accuracy);

	getCouponList();		
}

function error(error){
	//alert("위치정보를 찾을수 없습니다.");
	console.error(error.code);
	console.error(error.message);
	/*
	var position = {
		coords: {
			latitude: 37.5017754,
			longitude: 127.0400846,
			accuracy: 200
		}
	};
	success(position);
	*/
}

// 3. 서버로부터 쿠폰 목록을 받아온다.
function getCouponList(){
	var params = {cmd: "couponList"};
	$.ajax({
		url: "request",
		data: params,
		dataType: "json",
		success: function(data){
			console.log(data);
			// 쿠폰 목록을 저장한다.			
			couponCollection = data;
			// 화면에 쿠폰을 출력한다.			
			$("#tmpl_coupon_list").tmpl(data).appendTo(".coupon_list");
			// 3.1. 지도에 쿠폰 정보를 추가한다.							
			addCouponToMap();
			google.maps.event.addListener(map, "tilesloaded", function(){
			// 3.2. 지도안에 쿠폰이 들어오면 슬라이더를 갱신하도록 이벤트를 추가한다.
				addBoundsEvent();
			// 최초로 "bounds_changed" 이벤트를 발생시켜서 슬라이더를 초기화한다.
				google.maps.event.trigger(map, "bounds_changed");
			});
			
			// 4. 슬라이더를 초기화한다.
			initSlider();
		}
	});
}

// 3.1. 지도에 쿠폰 정보를 추가한다.(마커 클릭시 인포윈도우 이벤트)
function addCouponToMap(){
	// 쿠폰 목록만큼 반복한다.
	$.each(couponCollection, function(i){
		// 쿠폰의 위치정보		
		var position = new google.maps.LatLng(
			this.position.lat,
			this.position.lng);
		
		// 쿠폰 마커 생성
		var marker = new google.maps.Marker({
			map: map,
			position: position,
			title: this.couponName,
			icon: {
				url: "css/svg/icon_map_coupon.svg"
			}
		});
		
		// 지도 클릭 시 보여줄 정보창 생성		
	
		var infoWindow = new google.maps.InfoWindow({
			position: position,
			content: $("article:eq("+i+")").children(".list_img, .content").outerHtml()
		});
		
		// 쿠폰 정보에 position을 설정			
		this.position = position;
		// 쿠폰 정보에 marker를 설정		
		this.marker = marker;		
		// 쿠폰 정보에 infowindow를 설정		
		this.infoWindow = infoWindow;
		// 마커 클릭 이벤트를 추가한다.
		google.maps.event.addListener(marker, "click", function(){
			if (openWindow) {
				openWindow.close();
			}
			this.infoWindow.open();
			this.infoWindow = this.infWindow;
		});
	});
}

// 3.2. 지도안에 쿠폰이 들어오면 슬라이드를 갱신한다.
function addBoundsEvent(){
	// 지도 영역이 변경될 경우에 발생하는 "bounds_changed" 이벤트 처리
	google.maps.event.addListener(map, "bounds_changed", function(){
		// 모든 쿠폰을 숨긴다.					
		$(".coupon_list > article").hide();
		// 지도 안에 포함된 쿠폰이면 화면에 보여준다.
		var bounds = map.getBounds();
		$.each(couponCollection, function(i) {
				if (bounds.contains(this.position)) {
					$(".article:eq("+i+")").show();
				}
		});
		
		// 첫번째 쿠폰으로 슬라이더를 이동한다.
		slide(0);
	});
}

// 지정한 순번의 쿠폰으로 슬라이더 이동
function slide(actNo){
	actNo = parseInt(actNo);
	
	var couponArticle = $("#coupon.location article:visible");
	var range = $("#location_coupon_control input[type=range]");
	range.val(actNo);
	
	couponArticle.each(function(i){
		var article = $(this);
		switch(i){
		case actNo-2:
			article.attr("class", "location_slide_pre_02");
			break;
		case actNo-1:
			article.attr("class", "location_slide_pre_01");
			break;
		case actNo:
			article.attr("class", "location_slide_act");
			break;
		case actNo+1:
			article.attr("class", "location_slide_next_01");
			break;
		case actNo+2:
			article.attr("class", "location_slide_next_02");
			break;
		default:
			if(i < actNo){
				article.attr("class", "location_slide_pre_hide");	
			}else{
				article.attr("class", "location_slide_next_hide");
			}
			break;
		}
	});
	
	range.attr("max", (couponArticle.size()==0) ? 0 : couponArticle.size()-1);
	$("#counter_now").text((couponArticle.size()==0) ? 0 : actNo+1);
	$("#counter_all").text(couponArticle.size());
}

// 4. 슬라이더 초기화
function initSlider(){
	var range = $("#location_coupon_control input[type=range]");
	var preBtn = $("#btn_pre_location_coupon");
	var nextBtn = $("#btn_next_location_coupon");
	
	// 슬라이더 값이 변경될 경우의 이벤트 추가(막대기를 드래그 해서 이동 시)
	range.change(function(){
		slide(range.val());
	});
	
	// 이전/이후 버튼의 클릭 이벤트 추가
	preBtn.click(function(){
		if(range.val() > 0){
			//range.val(parseInt(range.val())-1);
			slide(parseInt(range.val())-1);
		}
	});
	nextBtn.click(function(){
		var couponArticle = $("#coupon.location article:visible");
		if(range.val() < couponArticle.size()-1){
			slide(parseInt(range.val())+1);
		}
	});
}








