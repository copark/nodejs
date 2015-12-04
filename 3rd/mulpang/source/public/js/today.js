var page = 2;
var MAX_ITEM_PER_PAGE = 5;

$(function(){
	// 오늘 날짜 세팅
	$("#time > time").attr("datetime", Util.dateToString("-")).text(Util.dateToString("."));
	
	// 이전/다음 페이지 클릭 이벤트	
	setSlideEvent();
	// 쿠폰 목록을 조회한다.
	getCouponList();	
});

// 쿠폰 상세정보를 보여준다.
function couponDetail(coupon, forBuy) {
	// 상세보기의 탭 이벤트를 추가한다.	
	// 상세 정보가 비어있는 경우 서버로 부터 받아온다. 	
	console.log("couponDetail " +  coupon);

	var params = {
		cmd:"couponDetail",
		_id:coupon.data("couponid") };
	
	$.ajax({
		url: "request",
		data: params,
		type: "get",
		dataType: "json",
		success: function(data) {
			console.log(data);			
			// 템플릿에 쿠폰 상세 정보 바인딩
			var detail = $("#tmpl_coupon_detail").tmpl(data);
			coupon.children(".content").after(detail);

			coupon.find(".coupon_tab > section").click(function() {
				tabView($(this));
			});

			var bigPhoto = coupon.find(".big_photo > img");
			// ".photo_list a" 
			coupon.find(".photo_list > li > a").click(function(e) {
				e.preventDefault();	// 브라우저의 기본 동작 취소
				bigPhoto.attr("src", $(this).attr("href"));
			});
			
			if (forBuy) {	// 구매
				showBuyForm(coupon);
			} else {			// 상세
				hideBuyForm(coupon);
			}
			
			// 구매하기 이벤트
			setBuyEvent(coupon);
		}
	});
	
	// 쿠폰 상세정보를 보여준다.
	coupon.removeClass("preview").addClass("detail");
}

// 쿠폰 상세보기를 닫는다.
function couponPreview(coupon){	
	// 쿠폰 상세보기를 닫는다.
	coupon.removeClass("detail").addClass("preview");
	// 갤러리 탭으로 초기화한다.	
	tabView(coupon.find(".gallery"));
}

// #: id, .: class, xx:tag
// 쿠폰 상세보기 이벤트와 상세보기 닫기 이벤트를 추가한다.
function setDetailEvent(){
	// 쿠폰 상세보기 이벤트(이미지 클릭)
	$(".list_img, .detail_img").click(function() {
		var coupon = $(this).parent();
		couponDetail(coupon, false);
	});
	
	// 상세보기 닫기 이벤트
	$(".btn_close_coupon_detail").click(function() {
		var coupon = $(this).parent();
		couponPreview(coupon);
	});
}

// 페이지를 이동한다.
function movePage(page){
	var firstAct = (page-1) * 5;	// 현재 페이지 첫 쿠폰 번호
	var lastAct = (page*5) - 1;		// 현재 페이지 마지막 쿠폰 번호
	
	$(".coupon_list > article").each(function(i) {
		if (i < firstAct) {
			$(this).removeClass("act next").addClass("pre");
		} else if (i > lastAct) {
			$(this).removeClass("act pre").addClass("next");			
		} else {
			$(this).removeClass("pre next").addClass("act");			
		}
		
		// 쿠폰의 위치 지정
		$(this).addClass("p" + (i%5 + 1));
	});	
}

// 이전/다음 버튼 이벤트 등록
function setSlideEvent(){
	// 이전 버튼을 클릭할 경우
	$(".btn_pre").click(function(){
		page--;
		if (page == 0) {
			var lastPage = Math.floor(($(".coupon_list > article").size() + MAX_ITEM_PER_PAGE -1) / MAX_ITEM_PER_PAGE );
			page = lastPage;
		}
		movePage(page);
		console.log("cur page = " + page);
		
//		if (page > 1) {
//			page--;
//			movePage(page);
//		}
	});
	// 다음 버튼을 클릭할 경우
	$(".btn_next").click(function() {
		page++;
		var lastPage = Math.floor(($(".coupon_list > article").size() + MAX_ITEM_PER_PAGE -1) / MAX_ITEM_PER_PAGE );
		
		if (page > lastPage) {
			page = 1;
		}
		movePage(page);
		console.log("cur page = " + page);
		
//		var lastPage = Math.floor(($(".coupon_list > article").size() + MAX_ITEM_PER_PAGE -1) / MAX_ITEM_PER_PAGE );
//		if (page < lastPage) {
//			page++;
//			movePage(page);
//		}
	});
};

// 상세보기의 지정한 탭을 보여준다.
function tabView(tab){
	tab.removeClass("tab_off").siblings().addClass("tab_off");
};

// 쿠폰 목록을 조회한다.
function getCouponList(){
	var params = "cmd=couponList";
	$.ajax({
		url: "request",
		data: params,
		type: "get",
		dataType: "json",
		success: function(data) {
			console.log(data);
			var couponList = $("#tmpl_coupon_list").tmpl(data);			
			$(".coupon_list").empty().append(couponList);
			
			var couponSizeOfLastPage = couponList.size() % MAX_ITEM_PER_PAGE;
			if (couponList.size() <= 0 || couponSizeOfLastPage > 0) {
				for (var i=couponSizeOfLastPage; i< MAX_ITEM_PER_PAGE; i++) {
					$('<article class="preview no_content">')
						.append("<h1>등록된  상품이 없습니다.</h1>")
						.appendTo(".coupon_list");
				}
			}

			// 쿠폰 상세보기 클릭 이벤트		
			setDetailEvent();

			page = 1;
			movePage(1);
			
			setBuyFormEvent();
		}
	});
}

// 구매하기 버튼 클릭 이벤트 등록
function setBuyFormEvent(){
	$(".buy").click(function(e) {
		e.preventDefault();	// 브라우저 기본 동작 취소
		var coupon = $(this).parents("article");
		couponDetail(coupon, true);
		
	});
}

// 구매화면을 보여준다.
function showBuyForm(coupon){	
	coupon.children(".coupon_tab").hide().next().show();
}

// 구매화면을 숨긴다.
function hideBuyForm(coupon){
	coupon.children(".coupon_tab").show().next().hide();
}

// 구매수량을 수정했을 때 결제가격을 다시 계산한다.
function setPrice(element, price){
	$(element).parents(".buy_section").find("output").text($(element).val() * price);
}

// 구매하기
function setBuyEvent(coupon){
	coupon.find("form").submit(function(e) {
		 // 폼에 이력한 모든 입력 요소를 query string으로 만들어 서버에 전송
		var form = this;
		var params = $(form).serialize();		
		$.ajax({
			url: "request",
			data: params,
			type: "post",
			dataType: "json",
			success: function(data) {
				console.log("buy event " + data);				
				if (data) {
					form.reset();
					alert("쿠폰 구매가 완료되었습니다. " + data.toString());
					// 잔여 수량 개수
					var remain = data.quantity - data.buyQuantity;					
					coupon.find(".remain > span").text(remain + "개");
					// 최대 수량 갱신
					coupon.find(".number_td > input").attr("max", remain);
					// 상세로 이동
					couponDetail(coupon, false);
				} else {
					alert("구폰 구매에 실패하였습니다.");
				}
			}
		});

		return false;	// submit 동작 취소 
	});
}








