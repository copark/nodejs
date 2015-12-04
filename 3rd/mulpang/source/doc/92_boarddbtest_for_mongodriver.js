var MongoClient = require('mongodb').MongoClient;
var clog = require("clog");
var util = require("util");

clog.configure({"log level": 5});
//{'log': true, 'info': true, 'warn': true, 'error': true, 'debug': true}

/* clog 로그 레벨별 출력 메세지
switch(logLevel){
	default:
	case 5:
	"debug";
	case 4:
	"error";
	case 3:
	"warn";
	case 2:
	"info";
	case 1:
	"log";
	break;
}
*/

var dbUrl = "mongodb://localhost:27017/test";
// DB 접속
MongoClient.connect(dbUrl,
	function(err, testdb){
		if (err) {
			clog.error(err);
		} else {
			clog.info("test db access success");
			db = testdb;
			
			// DB 초기화
			db.command({dropDatabase: 1}, function(err) {
				clog.info("test DB init success");
				db.collection("board", function(err, boardCollection) {
					clog.info("test DB select collection success");
					db.board = boardCollection;
					todo1();
				});
			});			
		}
});

// 로그 메세지 출력
function myLog(str, result){
	clog.info(str);
	clog.debug(util.inspect(result) + "\n");
}


// 등록할 게시물
var b1 = {no: 1, name: "admin", title: "[공지]게시판 사용규칙 안내입니다.", content: "잘 쓰세요."};
var b2 = [
	{no: 2, name: "kim", title: "아싸 1빠 ㅋㅋ", content: "그냥 1빠로 작성했다고.."},
	{no: 3, name: "lee", title: "2등이라도...", content: "2등이 어디냐 ㅋㅋ"}
];


// TODO 1. board 컬렉션에 데이터 등록
// insert({등록할 문서})
function todo1(){
	clog.info("TODO 1. board 컬렉션에 데이터 등록");	
	db.board.insert(b1, function() {
		db.board.insert(b2, function() {
			todo2();
		});
	});
}

// TODO 2. 모든 board 데이터의 모든 속성 조회
// find()
function todo2(){
	db.board.find().toArray(function(err, result) {
		myLog("TODO 2. 모든 board 데이터의 모든 속성 조회", result);
		todo3();
	});
}

// TODO 3. 데이터 조회(kim이 작성한 게시물 조회)
// find({검색조건})
function todo3(){
	db.board.find({name:"kim"}).toArray(function(err, result) {
		myLog("TODO 3. 데이터 조회(kim이 작성한 게시물 조회)", result);
		todo4();
	});
}

// TODO 4. 모든 board 데이터의 작성자(_id 포함) 속성만 조회
// find({검색조건}, {출력컬럼})
function todo4(){
	db.board.find({}, {name: 1}).toArray(function(err, result) {
		myLog("TODO 4. 모든 board 데이터의 작성자(_id 포함) 속성만 조회", result);
		todo5();
	});
}

// TODO 5. kim이 작성한 게시물의 제목(_id 미포함) 조회
// find({검색조건}, {출력컬럼})
function todo5(){
	db.board.find({name: "kim"}, {_id :0, title: 1}).toArray(function(err, result) {
		myLog("TODO 5. kim이 작성한 게시물의 제목(_id 미포함) 조회", result);
		todo6();
	});	
}

// TODO 6. 첫번째 게시물 조회(1건)
// findOne()
function todo6(){
	db.board.findOne(function(err, result) {
		myLog("TODO 6. 첫번째 게시물 조회(1건)", result);
		todo7();
	});	
}

// TODO 7. 게시물 조회(lee가 작성한 데이터 1건 조회)
// findOne({검색조건})
function todo7(){
	db.board.findOne({name: "lee"}, function(err, result) {
		myLog("TODO 7. 게시물 조회(lee가 작성한 데이터 1건 조회)", result);
		todo8();
		
	});
}

// TODO 8. 게시물 수정(3번 게시물의 내용 수정)
// update({검색조건}, {수정할 문서})
function todo8(){
	db.board.update({no : 3}, {"$set": {content: "수정된 내용"}}, 
		function(err, result) {
			list("TODO 8. 게시물 수정(3번 게시물의 내용 수정)", todo9);
	});	
}

// 전체 게시물을 조회하여 지정한 문자열을 출력하고
// next 함수를 호출한다.
function list(str, next){
	db.board.find().toArray(function(err, result){
		myLog(str, result);
		if(next){
			next();
		}
	});
}

// TODO 9. 1번 게시물 조회 후 comment 추가
function todo9(){
	db.board.findOne({no : 1}, function(err, result) {
		var comment = {
			id:1,
			name:"이영희",
			content:"퍼가요"
		};
		
		db.board.update({no:1},{"$set": {comment: comment}}, function() {
			list("TODO 9. 1번 게시물 조회 후 comment 추가", todo10);
		});
		/*
		result.comment = comment;
		db.board.update({no: 1}, result, function(err) {
			list("TODO 9. 1번 게시물 조회 후 comment 추가", todo10);
		});
		*/
	});
}

// TODO 10. 2번 게시물 삭제
// remove({검색 조건})
function todo10(){
	db.board.remove({no:2}, function(err) {
		list("TODO 10. 2번 게시물 삭제");
	});
}






































