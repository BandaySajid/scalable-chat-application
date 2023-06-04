const ws = new WebSocket('ws://127.0.0.1:9090');
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

function saveMessage(message) {
    fetch('/chat/saveMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: message
    }).then((resp) => {
        return resp.json();
    }).then((data) => {
        return data;
    }).catch((err) => {
        return err.message;
    })
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
    const message = JSON.parse(msg.data)
    if (message.status) {
        if (document.querySelector('#alert-container').innerHTML.length > 0) {
            document.querySelector('#alert-container').innerHTML = '';
        }
        return showAlert(message);
    }
    const elem = document.createElement('div');
    if (message.username === getCookie('username')) {
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
        username: getCookie("username"),
        room: getCookie("currentRoom"),
        message: messageElem.value,
        sentAt: getCurrentTime()
    };
    ws.send(JSON.stringify(messageData));
    saveMessage(JSON.stringify(messageData))
    messageElem.value = '';
};