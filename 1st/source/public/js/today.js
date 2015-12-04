var page = 2;
var MAX_ITEM_PER_PAGE = 5;

$(function(){
	// 오늘 날짜 세팅
	$("#time > time").attr("datetime", Util.dateToString("-")).text(Util.dateToString("."));
	
	// 쿠폰 상세보기 클릭 이벤트		
	setDetailEvent();
	
	// 이전/다음 페이지 클릭 이벤트	
	setSlideEvent();
	// 쿠폰 목록을 조회한다.
	
});

// 쿠폰 상세정보를 보여준다.
function couponDetail(coupon){
	// 상세보기의 탭 이벤트를 추가한다.
	
	// 쿠폰 상세정보를 보여준다.
	coupon.removeClass("preview").addClass("detail");
	
	coupon.find(".coupon_tab > section").click(function() {
		tabView($(this));
	})
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
		couponDetail(coupon);
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
		page --;
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
		var lastPage = Math.floor(($(".coupon_list > article").size() + MAX_ITEM_PER_PAGE -1) / MAX_ITEM_PER_PAGE );
		if (page < lastPage) {
			page++;
			movePage(page);
		}
	});
};

// 상세보기의 지정한 탭을 보여준다.
function tabView(tab){
	tab.removeClass("tab_off").siblings().addClass("tab_off");
};

// 쿠폰 목록을 조회한다.
function getCouponList(){
	
}








































// 구매하기 버튼 클릭 이벤트 등록
function setBuyFormEvent(){
	
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
	
}









