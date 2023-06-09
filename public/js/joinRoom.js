function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

function joinRoom(e) {
    e.preventDefault();
    const roomId = document.querySelector('#room-id').value;
    fetch('/joinRoom', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roomId
        })
    }).then((response) => {
        if (response.redirected) {
            window.location.href = response.url; // Redirect to the provided URL
        }
        else if (response.status === 200) {
            setTimeout(() => {
                return window.location.href = '/chat';
            }, 500);
        }
        return response.json();
    })
        .then(data => {
            showAlert(data);
        })
        .catch(error => {
            console.error(error.message)
            const data = {
                status: 'error',
                description: 'Some error occured !'
            };
            showAlert(data);
        });
}