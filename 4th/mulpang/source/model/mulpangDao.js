var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var util = require("util");
var clog = require("clog");
var fs = require("fs");

// DB 접속
MongoClient.connect("mongodb://localhost:27017/mulpang", function(err, mulpang) {
	if(err) {
		clog.error(err);
	}else{
		clog.info("mulpang DB 접속.");		
		db = mulpang;
		
		db.collection("member", function(err, member){
			db.member = member;
		});
		db.collection("shop", function(err, shop){
			db.shop = shop;
		});
		db.collection("coupon", function(err, coupon){
			db.coupon = coupon;
		});
		db.collection("purchase", function(err, purchase){
			db.purchase = purchase;
		});
		db.collection("epilogue", function(err, epilogue){
			db.epilogue = epilogue;
		});
	}
});

// 쿠폰 목록조회
exports.couponList = function(options){
	// 출력할 속성 목록
	var resultArray = ["couponName", "image", "desc", "primeCost", "price"
	               , "useDate", "quantity", "buyQuantity", "saleDate", "position"];
	
	var resultAttr = {};
	for(var i=0; i<resultArray.length; i++){
		var attr = resultArray[i];
		resultAttr[attr] = 1;
	}
	
	// 검색 조건
	var query = {};
	var now = new Date();
	
	// 1. 판매 시작일이 지난 쿠폰 ( 구매 가능한 쿠폰 )
	query["saleDate.start"] = {"$lte" : now };
	// 2. 판매 종료일이 지나지 않은 쿠폰 
	// query["saleDate.finish"] = {"$gte" : now };
	
	// 3. 구매가능/지난쿠폰/전체	
	var search_date = options.params.search_date;
	if (search_date) {
		switch (options.params.search_date) {
			default:
			case "buyable":
				query["saleDate.finish"] = {"$gte" : now};
				break;
			case "past":
				query["saleDate.finish"] = {"$lt" : now};
				break;
			case "all":
				delete query["saleDate.finish"];
				break;
		}
	}
	
	// 4. 지역명
	var location = options.params.search_location;
	if (location) {
		query["region"] = location;
	}
	
	// 5. 검색어
	var keyword = options.params.keyword;
	if (keyword && keyword.trim() != "") {
		// 정규표현식
		var regExp = new RegExp(keyword, "i");
		query["$or"] = [{couponName: regExp}, {desc: regExp}];
	}

	clog.debug("query = " + query.toString());
	/*
	// 구매 가능, 강남, 냉면 
	query = {
		"saleDate.start": {"$lte": now},
		"saleDate.finish": {"$gte": now},
		"regopm": "강남",
		"$or" : [{couponName: /냉면/i}, {desc: /냉면/i}]
	};
	*/
		
	// 정렬 옵션
	var orderBy = {};
	
	// 1. 사용자 지정 정렬옵션
	var orderCondition = options.params.list_order;
	if (orderCondition) {
		orderBy[orderCondition] = -1;
	}
	
	// 2. 판매 시작일 내림차순 ( 최근 판매 쿠폰 )
	orderBy["saleDate.start"] = -1;
	// 3. 판매 종료일 오름차순 ( 종료 임박 쿠폰 )
	orderBy["saleDate.finish"] = 1;
	
	// TODO 전체 쿠폰 목록을 조회한다.
	db.coupon.find(query, resultAttr).sort(orderBy).toArray(
		function(err, result) {
			clog.debug("[dao]", util.inspect(result));
			options.callback(err, result);
		});
};

// 쿠폰 상세 조회
exports.couponDetail = function(options){
	// validation check
	// options.params
	
	// 아이디로 쿠폰을 조회한다.
	db.coupon.findOne({_id: ObjectId(options.params._id)}, function(err, coupon){		
		// 쿠폰을 조회한 후 업체를 조회한다.
		db.shop.findOne({_id: coupon.shopId}, function(err, shop){
			// 업체를 조회한 후 후기를 조회한다.
			db.epilogue.find({couponId: coupon._id}).toArray(function(err, epilogueList){
				// 업체 정보 추가				
				coupon.shop = shop;				
				// 후기 정보 추가
				coupon.epilogue = epilogueList;				
				// 뷰 카운트를 하나 증가시킨다.
				db.coupon.update({_id:coupon._id}, {"$inc": {viewCount: 1}}, function() {
					if (options.callback != null) {
						options.callback(err, coupon);
					}
					
					// 웹소켓으로 조회수 top5 전송
					topCoupon({
						params: { condition: "viewCount"},
						callback: function(err, result) {
							// 접속한 모든 클라이언트에 "new5" 이벤트를 발생시켜서
							// result 를 전달한다. 
							options.res.io.sockets.emit("new5", result);
						}
					});	// topCoupon				
					
				});
			});
		});
	});
};

// 쿠폰 구매
exports.buyCoupon = function(options){
	clog.info("buyCoupon called");		

	// 구매 컬렉션에 저장할 형태의 데이터를 만든다.
	options.params.regDate = new Date();	// 등록일
	options.params.couponId = new ObjectId(options.params.couponId);
	options.params.paymentInfo = {
		cardType: options.params.cardType,
		cardNumber: options.params.cardNumber,
		cardExpireDate: options.params.cardExpireYear + options.params.cardExpireMonth,
		csv: options.params.csv,
		price: parseInt(options.params.unitPrice) * parseInt(options.params.quantity)
	};

	delete options.params.cardType;
	delete options.params.cardNumber;
	delete options.params.cardExpireYear;
	delete options.params.cardExpireMonth;
	delete options.params.csv;
	delete options.params.unitPrice;

	// TODO 구매 정보를 등록한다.
	db.purchase.insert(options.params, function(err,  result) {
		// TODO 구매 정보를 등록한 후 쿠폰 구매 건수를 하나 증가시킨다.
		db.coupon.update({_id: options.params.couponId}, 
			 {"$inc": {buyQuantity: parseInt(options.params.quantity)}},
			 function(err, result) {
				// TODO 쿠폰의 수량을 조회한다.
				db.coupon.findOne({_id: options.params.couponId},
						{quantity:1, buyQuantity:1, _id:0},
						function(err, result){
					options.callback(err, result);
				});
		});
												 
	});
	
};	
	
// 추천 쿠폰 조회
var topCoupon = exports.topCoupon = function(options){	
	// 검색조건
	var condition = options.params.condition;
	// 정렬방식
	var orderBy = {};
	orderBy[condition] = -1; // -1: 내림차순, 1: 오름차순
	
	// 출력컬럼
	var resultAttr = {couponName :1};
	resultAttr[condition] = 1;
	
	db.coupon.find({}, resultAttr).sort(orderBy).limit(5).toArray(function(err, result) {
		if (options.callback != null) {
			options.callback(err, result);
		}
	});
};

// 지정한 쿠폰 아이디 목록을 받아서 남은 수량을 넘겨준다.
exports.couponQuantity = function(options){
	var strIdArray = options.params.couponIdList.split(",");
	var objIdArray = [];
	for (var i=0; i<strIdArray.length; i++) {
		objIdArray.push(ObjectId(strIdArray[i]));
	}
	
	// 쿠폰아이디 배열에 포함된 쿠폰을 조회한다. 
	db.coupon.find({_id: {"$in" : objIdArray}}, 
			{quantity:1, buyQuantity:1, couponName:1}).toArray(function(err, result) {
		// Server-Sent Events 형식의 응답 헤더 설정
		options.res.contentType("text/event-stream");
		options.res.write('data: ' + JSON.stringify(result));
		options.res.write("\n\n");
		options.res.write("retry: " + 1000*10);
		options.res.write("\n");
		options.res.end();
	});
};

// 회원 가입
exports.registMember = function(options){
	
};

// 로그인 처리
exports.login = function(options){
	
};

// 회원 정보 조회
exports.getMember = function(options){
	
};

// 회원 정보 수정
exports.updateMember = function(options){
	
};

// 쿠폰 후기 등록
exports.insertEpilogue = function(options){
	
};


















