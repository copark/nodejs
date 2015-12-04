$(function(){
	$("#login").submit(function(){
		$.ajax({
			url: "login",
			dataType: "json",
			data: $(this).serialize(),
			type: "post",
			success: function(result){
				if(result.error){
					alert(result.message);
				}else{
					window.location.reload();
				}
			}
		});
		return false;
	});
});