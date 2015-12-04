/* 유틸리티 */

var Util = {
	// 지정한 URL의 스크립트를 읽어온다.
	require: function(url){
		if(url.indexOf("http://") != 0){	// 내부 URL
			url = "/js/" + url;
		}
		document.write('<script src="' + url + '"></script>');
	},
	
	// 지정한 날짜를 지정한 구분자를 기준으로 변환한 문자열을 반환한다.
	dateToString: function(delimiter, date){
		if(date){
			if(typeof date == "string"){
				date = new Date(date);
			}
		}else{
			date = new Date();
		}
		var result = date.getFullYear() + delimiter + (date.getMonth()+1) + delimiter + date.getDate();
		return result;
	},
	
	// 점수를 별로 환산한다.
	toStar: function(satisfaction){
		var star = "";
		for(var i=0; i<satisfaction; i++){
			star += "★";
		}
		for(var i=satisfaction; i<5; i++){
			star += "☆";
		}
		return star;
	}
};

// 지정한 요소를 포함한 html 코드를 반환한다.
jQuery.fn.outerHtml = function(){
	var result = "";
	this.each(function(){
		result += this.outerHTML;
	});
	return result;
};















