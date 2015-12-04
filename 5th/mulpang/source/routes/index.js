var express = require('express');
var router = express.Router();
var dao = require('../model/mulpangDao');
var util = require('util');
var clog = require('clog');
clog.configure({"log level":5});

module.exports = router;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('today.html');
});

/* GET home page. */
router.get('/all.html', function(req, res, next) {
  res.render('today', {
		bodyId: 'all',
		js: 'today.js',
		loginId: req.session.loginId,
		profileImage: req.session.profileImage
	});
});

router.get('/*.html', function(req, res, next) {
	var url = req.url.substring(1);
	var suburl = url.substring(0, url.indexOf(".html"));
	
	res.render(url, {
		bodyId: suburl,
		js: suburl+".js",
		loginId: req.session.loginId,
		profileImage: req.session.profileImage
	});
//  res.render('index', { title: 'Express' });
});

// 프로필 이미지 임시 업데이트
router.post('/upload', function(req, res, next) {
	// multiparty 모듈 로딩
	var multiparty = require('multiparty');
	var form = new multiparty.Form({
		maxFileSize: 1024*1024*10, // 10MB
		uploadDir: __dirname + "/../public/tmp"
	});	
	// 요청바디에 파일이 전달될 때 발생
	form.on('file', function(name, file) {
		// full filename에서 tmp 경로 뒤의 파일명만 추출
		var tmpName = file.path.split("\\tmp\\")[1];
		res.end(tmpName);	// 임시 파일명 응답
	});
	// 요청정보 파싱
	form.parse(req);
});

// 로그인 처리
router.post('/login', function(req, res, next) {
	dao.login({
		params: req.body,
		callback: function(err, result){
			if(err){
				clog.error(err);
			}else{
				// TODO 세션에 아이디와 프로필 이미지 저장
				req.session.loginId = result._id;
				req.session.profileImage = result.profileImage;				
			}
			res.json(result);
		}
	});
});

// 로그아웃 처리
router.get('/logout', function(req, res, next) {
	// TODO 세션 삭제
	req.session.destroy();
	
	res.redirect("/");	// 홈으로 리다이렉트 시킨다.
});

// couponDetail
// couponList
router.all("/request", function (req, res, next) {
	var params = {};
	if (req.method === "GET") {
		// GET 방식의 경우 쿼리스트링은 req.query 에 저장된다.
		params = req.query;
	} else if (req.method === "POST") {
		// POST 방식의 경우 쿼리스티링이 req.body 에 저장된다.
		params = req.body;
	}
	
	var cmd = params.cmd;
	delete params.cmd;

	// validate	
	if (typeof dao[cmd] === 'undefined') {
		clog.error("no~");
		return;
	}
	
	var options = {
		params: params,
		req: req,
		res: res,
		callback: function(err, result){
			if (err) {
				clog.error(err);
			}
			
			res.json(result);
		}
	};
	
	// dao 객체내에 cmd 이름의 함수를 호출
	dao[cmd](options);
});