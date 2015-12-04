/* 회원가입 화면 */

$(function(){	
	// 프로필 이미지 선택 시(common_member.js의 uploadProfileImage 함수를 호출한다.)
	
	$("#profile").change(uploadProfileImage);
	$("#join_section > form").submit(registMember);
	
	// 회원 가입 버튼 클릭 이벤트
	
});

// 회원 가입
function registMember(){
	if($("#password").val() != $("#password2").val()){
		alert("비밀번호와 비밀번호 확인이 맞지 않습니다.");
	}else{
		// 회원 가입을 요청한다.
		$.ajax({
			url: "request",
			data: $(this).serialize(),
			type: "post",
			dataType: "json",
			success: function(data){
				if (data.error) {
					alert(data.message);
				} else {
					//alert($("#email").val() + "님 회원 가입이 완료되었습니다.");
					window.location.href = "/";
				}
			}
		});
	}
	return false;
}
