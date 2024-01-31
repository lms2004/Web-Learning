$(document).ready(function() {
    $('#uploadForm').submit(function(e) {
        e.preventDefault();
        var formData = new FormData(this);

        $.ajax({
            url: '/upload', //指定请求发送到的URL。
            type: 'POST',   //设置HTTP请求的方法。
            data: formData, //是与请求一起发送的数据。
            contentType: false,  // 告诉jQuery不要设置任何内容类型头。
            processData: false,  // 防止jQuery将数据转换为查询字符串。
            success: function(data) {
                $('#result').html(data.message);
            }
        });
    });
});

