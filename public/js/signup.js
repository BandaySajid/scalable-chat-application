function submitSignup(e) {
    e.preventDefault();
    const username = document.querySelector('#username').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    fetch('/signup', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            email,
            password
        })
    }).then((response) => {
        if (response.status === 201) {
            return window.location.href = '/';
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