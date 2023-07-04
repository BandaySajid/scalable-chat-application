function showAlert(data) {
    var alert = document.createElement("div");
    const alertType = data.status === 'error' ? 'danger' : 'success';
    alert.classList.add("alert", `alert-${alertType}`, "alert-dismissible", "fade", "show");
    alert.setAttribute("role", "alert");
    alert.innerHTML = `<strong>${data.description}</strong> `;
    document.querySelector("#alert-container").appendChild(alert);
    setTimeout(() => {
        alert.remove();
    }, 2000);
}