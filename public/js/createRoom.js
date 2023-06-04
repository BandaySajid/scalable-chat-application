function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}
function createRoom(e) {
    e.preventDefault();
    const roomId = document.querySelector('#room-id').value;
    fetch('/createRoom', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roomId,
            username : getCookie('username')
        })
    }).then((response) => {
        if (response.status === 201) {
            setTimeout(() => {
                return window.location.href = '/chat';
            }, 1000);
        }
        return response.json();
    }).then(data => {
        showAlert(data);
    })
        .catch(error => {
            const data = {
                status: 'error',
                description: 'Some error occured !'
            };
            showAlert(data);
        });
}