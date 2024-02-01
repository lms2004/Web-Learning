$(document).ready(function() {
    $('#uploadForm').submit(function(e) {
        e.preventDefault();
        var formData = new FormData(this);

        // Add selected options to formData
        for (let i = 1; i <= 1; i++) {
            let selectedOption = $(`#optionSelect${i}`).val();
            formData.append(`userOption${i}`, selectedOption);
        }

        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function(response, status, xhr) {
                // Check if a download response is present
                var disposition = xhr.getResponseHeader('Content-Disposition');
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    var filename = disposition.split(';')[1].split('filename=')[1].trim();
                    var blob = new Blob([response], {type: 'audio/mpeg'});
                    var downloadUrl = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(downloadUrl);
                } else {
                    // Handle other responses
                    $('#result').html('No downloadable file found.');
                }
            },
            error: function(xhr, status, error) {
                $('#result').html("Error: " + error);
            },
            xhrFields: {
                responseType: 'blob' // to handle binary data
            }
        });
    });
});
