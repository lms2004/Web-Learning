// 当文档加载完毕时执行
var pollingInterval; // Global variable to store the interval ID
$(document).ready(function() {
    // 当表单提交时执行
    $('#uploadForm').submit(function(e) {
        e.preventDefault();  // 阻止表单默认提交行为
        $('#progressBarContainer').show();  // 显示进度条容器

        var formData = new FormData(this);  // 创建 FormData 对象，用于存储表单数据

            // Clear any existing interval before setting a new one
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }

        // Set a new polling interval
        pollingInterval = setInterval(pollUploadStatus, 2000);

        // 遍历选项并添加到 formData
        for(let i=1; i<=3; i++) {
            formData.append('userOption' + i, $('#optionSelect' + i).val());
        }

        

        // 添加用户输入的文本到 formData
        formData.append('usrtxt', $('#usrtxt').val());
        formData.append('userText1', $('#textInput1').val());
        
        // 添加音色选择到 formData
        formData.append('userOption100', $('#optionSelect100').val());
        
        // 添加使用密钥
        formData.append('registration_key', $('#registration_key').val());

        // 使用 AJAX 发送表单数据
        $.ajax({
            url: '/upload',  // 文件上传的 URL
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function(data) {
                clearInterval(pollingInterval); 
                handleResponse(data);  // 使用修改后的响应处理逻辑
            },
            error: function() {
                console.log("Error in file upload");
            },
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                // 监听上传进度事件
                xhr.upload.addEventListener("progress", function(evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        percentComplete = parseInt(percentComplete * 100);
                        $('#fileUploadProgress').val(percentComplete);
                    }
                }, false);
                return xhr;
            }
        });
    });
});


// 定时轮询上传状态
function pollUploadStatus() {
    $.get('/upload_status', function(data) {
        $('#uploadStatus').text(data.message);
    });
}


// 处理文件上传响应的函数
function handleResponse(data) {
    if (data.download_url) {
        // 创建下载链接元素
        var downloadLink = document.createElement('a');
        downloadLink.href = data.download_url; // 设置下载链接的 URL
        downloadLink.innerText = '下载 MP3 文件'; // 设置链接文本
        downloadLink.target = '_blank'; // 在新标签页中打开链接

        var resultDiv = document.getElementById('result'); // 获取显示结果的 div 元素
        resultDiv.appendChild(downloadLink); // 将链接添加到结果 div 中
    } else {
        console.log('没有可下载的文件。'); // 如果没有下载链接，则打印错误消息
    }
}




// 处理文件上传响应
function handleResponse(xhr, response) {
    var disposition = xhr.getResponseHeader('Content-Disposition');
    if (disposition && disposition.indexOf('attachment') !== -1) {
        var filename = disposition.split(';')[1].split('filename=')[1].trim();
        downloadFile(response, filename);
    } else {
        $('#result').html('No downloadable file found.');
    }
}

// 下载文件
function downloadFile(blob, filename) {
    var downloadUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
}

// 当下拉菜单选择改变时执行
function handleOnChange(selectElement) {
    updateOptionTitle();
    toggleTextInput(1, selectElement);
}

// 更新下拉菜单选择的标题
function updateOptionTitle(selectElement) {
    var title = $(selectElement).find('option:selected').attr('title');
    $('#optionTitle').text(title);
}

// 根据下拉菜单的选择显示或隐藏文本输入框
function toggleTextInput(id, selectElement) {
    var textInput = document.getElementById('textInput' + id);
    if (selectElement.value) {
        textInput.style.display = 'inline';
    } else {
        textInput.style.display = 'none';
    }
}



// 为播放音频按钮添加事件监听器
document.getElementById('playAudioButton').addEventListener('click', function() {
    var audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer.src) {
        audioPlayer.play()
            .then(() => {
                // 音频播放成功时的操作
            })
            .catch(e => {
                // 音频播放失败时的操作
                console.error('Error playing audio:', e);
            });
    }
});


document.addEventListener('DOMContentLoaded', function() {
    // 页面加载完成后执行

    var playAudioButton = document.getElementById('playAudioButton');
    var audioPlayer = document.getElementById('audioPlayer');

    if (playAudioButton && audioPlayer) {
        // 为播放音频按钮添加点击事件监听器
        playAudioButton.addEventListener('click', function() {
            if (audioPlayer.src) {
                // 尝试播放音频
                audioPlayer.play()
                    .then(() => {
                        // 音频播放成功时执行的代码
                    })
                    .catch(e => {
                        // 音频播放失败时执行的代码
                        console.error('Error playing audio:', e);
                    });
            }
        });
    } else {
        console.error('播放音频按钮或音频播放器不存在');
    }
});


document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    // Send AJAX request to register user
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;
    // Send AJAX request to login user
});

function sendRequest(url, method, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
        callback(JSON.parse(xhr.responseText));
    };
    xhr.send(data);
}

// After successful login
document.getElementById('uploadButton').disabled = false;

function pollUploadStatus() {
    $.get('/upload_status', function(data) {
        // Ensure this ID matches the element in your HTML
        $('#uploadMessage').text(data.message); 
    }).fail(function() {
        console.log("Error fetching upload status");
    });
}
