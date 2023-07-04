let sidebar = document.querySelector('.chat-navbar');
function handleSideBar() {
    sidebar.classList.toggle('active');
}

function leaveRoom(e) {
    const room = e.target.parentElement.id;
    console.log(room)
    fetch('/leaveRoom', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            roomId: room,
        })
    }).then((resp) => {
        return resp.json();
    }).then((data) => {
        showAlert(data);
        if (data.status === 'success') {
            localStorage.removeItem("room");
        }
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

function joinRoom(e) {
    const room = e.target.parentElement.id;
    fetch('/joinRoom', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            roomId: room,
        }),
        redirect: 'follow'
    }).then((resp) => {
        if (resp.redirected) {
            window.location.href = resp.url; // Redirect to the provided URL
        }
    }).catch((err) => {
        console.log(err.message);
        const data = {
            status: 'error',
            description: 'Some error occured !'
        };
        showAlert(data);
    });
};