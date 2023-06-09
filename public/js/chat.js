fetch('/getUserDetails', {
    headers: {
        method: 'GET',
        'Content-Type': 'application/json'
    }
}).then((resp) => {
    return resp.json();
}).then((data) => {
    if (data.status === 'success') {
        Object.keys(data.user).forEach((key) => {
            localStorage.setItem(key, data.user[key]);
        });
    }
}).catch((err) => {
    console.error(err.message);
});

const ws = new WebSocket('ws://127.0.0.1:9090');
// const ws = new WebSocket('wss://98d5-117-214-241-24.ngrok-free.app/');
const msgContainer = document.querySelector('.msgContainer');
msgContainer.scrollTop = msgContainer.scrollHeight;

showAlert(
    {
        status: 'left',
        message: 'Messages will be deleted after 12 hours / 24 hours'
    }
);

function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

function showAlert(data) {
    var alert = document.createElement("div");
    const alertType = data.status === 'left' ? 'warning' : 'success';
    alert.classList.add("alert", `alert-${alertType}`, "alert-dismissible", "fade", "show");
    alert.setAttribute("role", "alert");
    alert.innerHTML = `<strong>${data.message}</strong> `;
    document.querySelector("#alert-container").appendChild(alert);
    setTimeout(() => {
        alert.remove();
    }, 4000);
}

const maxHeight = 0.15;
const msgArea = document.querySelector("#message-area");
msgArea.addEventListener('input', function () {
    this.style.height = 'auto';
    if (this.scrollHeight > window.innerHeight * maxHeight) {
        this.style.height = window.innerHeight * maxHeight + 'px';
    } else {
        this.style.height = this.scrollHeight + 'px';
    }
});

function getCurrentTime() {
    const time = new Date();
    return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
};

ws.onmessage = function (msg) {
    const message = JSON.parse(msg.data);
    if (message.event === 'roomUsers') {
        const elem = document.querySelector('.room-user-list');
        elem.innerHTML = '';
        message.users.map((username) => {
            elem.innerHTML += `<div class="room-user-item">
                <li class="nav-item joined-room-item">
                <h1 class="nav-link text-white">
                    ${username}
                </h1>
            </li>
            <hr style="color: white;">
        </div>`
        });
        return 
    };
    if (message.status) {
        if (document.querySelector('#alert-container').innerHTML.length > 0) {
            document.querySelector('#alert-container').innerHTML = '';
        }
        if (message.status === 'join') {
            const elem = document.querySelector('.room-user-list');
            elem.innerHTML = '';
            message.users.map((username) => {
                elem.innerHTML += `<div class="room-user-item">
                <li class="nav-item joined-room-item">
                <h1 class="nav-link text-white">
                ${username}
                </h1>
                </li>
                <hr style="color: white;">
                </div>`
            })
        }
        else if (message.status === 'left') {
            if (message.users.length <= 0) {
                document.querySelector('.room-user-list').innerHTML = `<div class="room-user-item">
            <li class="nav-item joined-room-item">
                <h1 class="nav-link text-white">
                </h1>
            </li>
            <hr style="color: white;">
        </div>`
            }
            message.users.map((username) => {
                document.querySelector('.room-user-list').innerHTML = `<div class="room-user-item">
            <li class="nav-item joined-room-item">
                <h1 class="nav-link text-white">
                    ${username}
                </h1>
            </li>
            <hr style="color: white;">
        </div>`
            })
        }
        return showAlert(message);
    };

    const elem = document.createElement('div');
    if (message.username === localStorage.getItem('username')) {
        elem.classList.add('card', 'border-0', 'my-1', 'me-auto');
        elem.innerHTML = `<div class="card-body ms-auto d-flex flex-column">
        <div class="ms-auto">
        <p id="message-sender" class="card-title float-end">
        <span class='text-success'>You</span> <span id='message-time' class='small'
        style="color: grey">${message.sentAt}</span></p>
        </div>
        <div class="message-wrapper"><p id='message-text' class="card-text small text-white" style="text-align: right">${message.message}</p></div>
        </div>`
        msgContainer.appendChild(elem);

    }
    else {
        elem.classList.add('card', 'border-0', 'my-1');
        elem.innerHTML = `<div class="card-body">
        <div class="ms-auto">
        <p id="message-sender" class="card-title">
        <span class='text-danger'>${message.username}</span> <span id='message-time' class='small'
        style="color: grey">${message.sentAt}</span>
        </p>
        </div>
        <div class="message-wrapper"><p id='message-text' class="card-text small text-white">${message.message}</p></div>
        </div>`
        msgContainer.appendChild(elem);

    }
    msgContainer.scrollTop = msgContainer.scrollHeight;
};

function sendMessage(e) {
    const messageElem = document.querySelector("#message-area");
    e.preventDefault();
    const messageData = {
        username: localStorage.getItem("username"),
        room: localStorage.getItem("room"),
        message: messageElem.value,
        sentAt: getCurrentTime()
    };
    ws.send(JSON.stringify(messageData));
    // saveMessage(JSON.stringify(messageData))
    messageElem.value = '';
};