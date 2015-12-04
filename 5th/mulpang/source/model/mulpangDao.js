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
	var keyword = options.params.search_keyword;
	clog.debug("keyword =" + keyword);
	if (keyword && keyword.trim() != "") {
		// 정규표현식
		var regExp = new RegExp(keyword, "i");
		query["$or"] = [{couponName: regExp}, {desc: regExp}];
	}

	clog.debug("query = " + util.inspect(query));
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

	var loginId = options.req.session.loginId;
	if (!loginId) {
		options.callback(null, {
			error: 103, 
			message: "로그인이 필요한 서비스 입니다."
		});
		return;
	}

	// 인증 후 구현
	options.params.email = loginId;
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

// 임시로 저장한 프로필 이미지를 회원 이미지로 변경한다.
function saveImage(tmpFileName, profileImage){
	var tmpDir = __dirname + "/../public/tmp/";
	var profileDir = __dirname + "/../public/image/";
	// TODO 임시 이미지를 member 폴더로 이동시킨다.
	clog.debug("origin = " + tmpDir + tmpFileName);
	clog.debug("dst  = " + profileDir + profileImage);
	fs.rename(tmpDir + tmpFileName, profileDir + profileImage);
	  
}

// 회원 가입
exports.registMember = function(options){
	// 업로드한 임시 이미지 파일 경로
	var tmpFileName = options.params.tmpFileName;
	delete options.params.tmpFileName;
	var userId = options.params._id;
	// 프로필 이미지 파일명을 회원아이디로 지정한다.
	options.params.profileImage = "member/" + userId + "." + tmpFileName.split(".")[1];
	
	options.params.regDate = new Date();
	db.member.insert(options.params, function(err, member){
		// 아이디 중복 여부 체크
		if(err && err.code == 11000){
			// TODO 아이디 중복 메세지 전송
			options.callback(null, {
				error: 101,
				message: options.params._id + "는 이미 등록된 이메일입니다."
			});
		}else{
			// TODO 프로필 이미지 저장
			saveImage(tmpFileName, options.params.profileImage);			
			options.callback(err, member);
		}
	});
};

// 로그인 처리
exports.login = function(options){
	// TODO 지정한 아이디와 비밀번호로 회원 정보를 조회한다.
	db.member.findOne(options.params, {_id: 1, profileImage: 1},function(err, result){
		if (!result) {
			result = {
				error : 102,
				message: "아이디와 비밀번호를 확인하세요."
			}
		}
		options.callback(err, result);
	});
};

// 회원 정보 조회
exports.getMember = function(options){
	// TODO 세션에 아이디가 있는지 확인(로그인 상태)
	var loginId = options.req.session.loginId;
	if (!loginId) {
		options.callback(null, {
			error: 103, 
			message: "로그인이 필요한 서비스 입니다."
		});
		return;
	}
	
	// 회원의 구매 정보를 가져온다.
	db.purchase.find({email: loginId}, {_id: 0, couponId: 1, regDate: 1}).sort({regDate: -1}).toArray(function(err, purchaseList){
		if(purchaseList.length == 0){
			options.callback(err, []);
		}else{
			var couponIdArray = [];
			for(var i=0; i<purchaseList.length; i++){
				couponIdArray.push(purchaseList[i].couponId);
			}
			// 구매한 쿠폰 정보를 가져온다.
			db.coupon.find({_id: {"$in": couponIdArray}}, {couponName: 1, image: 1}).toArray(function(err, couponList){
				// 쿠폰 정보에 구매 날짜를 추가한다.
				for(var i=0; i<purchaseList.length; i++){
					for(var k=0; k<couponList.length; k++){
						if(purchaseList[i].couponId.toString() == couponList[k]._id.toString()){
							couponList[k].regDate = purchaseList[i].regDate;
							break;
						}
					}
				}
				// 해당 회원이 구매한 쿠폰의 후기 정보를 가져온다.
				db.epilogue.find({couponId: {"$in": couponIdArray}, writer: loginId}).toArray(function(err, epilogueList){
					clog.info(epilogueList);
					// 쿠폰 정보에 후기 정보를 추가한다.
					for(var i=0; i<epilogueList.length; i++){	
						for(var k=0; k<couponList.length; k++){
							if(epilogueList[i].couponId.toString() == couponList[k]._id.toString()){
								couponList[k].epilogue = epilogueList[i];
								break;
							}
						}
					}
					options.callback(err, couponList);
				});
			});
		}
	});

};

// 회원 정보 수정
exports.updateMember = function(options){
	var userId = options.req.session.loginId;
	if(!userId){
		options.callback(null, {error: 103, message: "로그인이 필요한 서비스입니다."});
	}else{
		var oldPassword = options.params.oldPassword;
		delete options.params.oldPassword;
		// 이전 비밀번호로 회원 정보를 조회한다.
		db.member.findOne({_id: userId, password: oldPassword}, function(err, member){
			if(!member){
				options.callback(null, {error: 104, message: "이전 비밀번호가 맞지 않습니다."	});
			}else{
				// 비밀번호 수정일 경우
				if(options.params.password.trim() != ""){
					member.password = options.params.password;
				}
				// 프로필 이미지를 수정할 경우
				if(options.params.tmpFileName){
					saveImage(options.params.tmpFileName, member.profileImage);	
				}
				// 회원 정보를 수정한다.
				db.member.update({_id: userId}, member, function(err, result){
					options.callback(err, result);
				});
			}
		});
	}
};

// 쿠폰 후기 등록
exports.insertEpilogue = function(options){
	var loginId = options.req.session.loginId;
	if(!loginId){	// 세션에 아이디가 없을 경우
		options.callback(null, {error: 103, message: "로그인이 필요한 서비스입니다."});
	}else{
		var epilogue = options.params;
		epilogue.regDate = new Date();	// 등록일
		epilogue.couponId = ObjectId(options.params.couponId);
		epilogue.writer = loginId;
		db.epilogue.insert(epilogue, function(err, result){
			// 후기 등록에 성공했을 경우
			// 쿠폰 컬렉션의 후기 수와 만족도 합계를 업데이트 한다.
			db.coupon.findOne({_id: epilogue.couponId}, {epilogueCount: 1, satisfactionAvg: 1}, function(err, coupon){
				var query = {
					"$inc": {epilogueCount: 1},
					"$set": {satisfactionAvg: (coupon.satisfactionAvg*coupon.epilogueCount+parseInt(epilogue.satisfaction))/(coupon.epilogueCount+1)}
				};
				db.coupon.update({_id: epilogue.couponId}, query, function(){
					options.callback(err, epilogue);
				});
			});
		});
	}
};


















