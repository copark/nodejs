$(function(){
	showMember();
	
	// 프로필 이미지 선택 시(common_member.js의 uploadProfileImage 함수를 호출한다.)
	$("#profile").change(uploadProfileImage);	
	
	// 회원 수정 버튼 클릭 이벤트
	$("#join_section > form").submit(updateMember);
});

// 회원 정보를 보여준다.
function showMember(){
	$.ajax({
		url: "request",
		data: {cmd: "getMember"},
		dataType: "json",
		type: "get",
		success: function(result){
			if(result.error){
				alert(result.message);
				location.href = "/";
			}else{
				$("#tmpl_mycoupon").tmpl(result).appendTo("#my_coupon_section");
				
				// 후기 등록 이벤트
				$(".coupon_preview > form").submit(registEpilogue);
			}
		}
	});
}

// 회원 정보를 수정한다.
function updateMember(){
	if($("#password").val() != $("#password2").val()){
		alert("비밀번호와 비밀번호 확인이 맞지 않습니다.");
	}else{
		// 회원 수정을 요청한다.
		$.ajax({
			url: "request",
			data: $(this).serialize(),
			type: "post",
			dataType: "json",
			success: function(data){
				if(data.error){
					alert(data.message);
				}else{
					alert("회원 수정이 완료되었습니다.");
					window.location.reload();
				}
			}
		});
	}
	return false;
}

// 상품후기 입력
function registEpilogue(){
	$.ajax({
		url: "request",
		data: $(this).serialize(),
		type: "post",
		dataType: "json",
		success: function(data){
			if(data.error){
				alert(data.message);
			}else{
				alert("쿠폰 사용 후기가 등록되었습니다.");
				window.location.reload();
			}
		}
	});
	return false;
}




















