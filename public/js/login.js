
function submitLogin(e) {
    e.preventDefault();
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    fetch('/login', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            password
        })
    }).then((response) => {
        if (response.status === 302) {
            setTimeout(() => {
                return window.location.href = '/';
            }, 1000)
        }
        return response.json();
    })
        .then(data => {
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