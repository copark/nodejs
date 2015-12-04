var express = require('express');
var router = express.Router();
var dao = require('../model/mulpangDao');
var util = require('util');
var clog = require('clog');
clog.configure({"log level":5});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('today.html');
});

/* GET home page. */
router.get('/all.html', function(req, res, next) {
  res.render('today', {bodyId: 'all', js: 'today.js'});
});

router.get('/*.html', function(req, res, next) {
	var url = req.url.substring(1);
	var suburl = url.substring(0, url.indexOf(".html"));
	
	res.render(url, {"bodyId": suburl, "js": suburl+".js"});
//  res.render('index', { title: 'Express' });
});

module.exports = router;

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