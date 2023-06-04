let sidebar = document.querySelector('.chat-navbar');
function handleSideBar() {
    sidebar.classList.toggle('active');
}

function leaveRoom(e) {
    const room = e;
    fetch('leaveRoom', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            room
        })
    }).then((resp) => {
        return resp.json();
    }).then((data) => {
        showAlert(data);
        window.location.href = '/';
    }).catch((err) => {
        console.log(err.message);
        const data = {
            status: 'error',
            description: 'Some error occured !'
        };
        showAlert(data);
    })
}