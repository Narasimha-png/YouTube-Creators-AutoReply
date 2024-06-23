document.getElementById('replyForm').addEventListener('submit', function (event) {
    event.preventDefault();
    
    const apiKey = "AIzaSyCT5ORj2QSmOdkzVgdeBFip8B4Gu2Ml8S0";
    const videoUrl = document.getElementById('videoUrl').value;
    
    if (apiKey && videoUrl) {
        fetch('/run-bot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey, videoUrl })
        })
        .then(response => response.json())
        .then(data => {
            const resultsList = document.getElementById('resultsList');
            resultsList.innerHTML = '';
            if (data.results) {
                data.results.forEach(result => {
                    const li = document.createElement('li');
                    li.textContent = `${result.message} (Sentiment: ${result.sentiment})`;
                    resultsList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = data.error;
                resultsList.appendChild(li);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const resultsList = document.getElementById('resultsList');
            const li = document.createElement('li');
            li.textContent = 'An error occurred while processing the request.';
            resultsList.appendChild(li);
        });
    }
});
