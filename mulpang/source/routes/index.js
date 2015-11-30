var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('today.html');
});

router.get('/*.html', function(req, res, next) {
	var url = req.url.substring(1);
	var suburl = url.substring(0, url.indexOf(".html"));
	
	res.render(url, {"bodyId": suburl, "js": suburl+".js"});
//  res.render('index', { title: 'Express' });
});

module.exports = router;
