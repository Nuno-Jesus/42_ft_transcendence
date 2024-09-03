
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const togglePasswordImage = document.getElementById('togglePasswordImage');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordImage.src = type === 'password' ? "/static/assets/icons/eyeopen.png" : "/static/assets/icons/eyeclosed(1).png";
    togglePasswordImage.alt = type === 'password' ? 'Show Password' : 'Hide Password';
}

function togglereconfirmButton() {
    const togglereconfirmImage = document.getElementById('togglereconfirmImage');
    const reconfirmInput = document.getElementById('reconfirm');
    const type = reconfirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
    reconfirmInput.setAttribute('type', type);
    togglereconfirmImage.src = type === 'password' ? "/static/assets/icons/eyeopen.png" : "/static/assets/icons/eyeclosed(1).png";
    togglereconfirmImage.alt = type === 'password' ? 'Show Password' : 'Hide Password';
}

document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        reconfirm: document.getElementById('reconfirm').value
    };

    fetch(`/users/create`, {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
    })
    .then(response => response.json()) 
    .then(data => {
        if (JSON.stringify(data.data) === '{}') {
            console.log('Login in failed');
            errorMessage.textContent = data.message;
            errorMessage.style.display = 'block';
        } else {
            console.log('Login in successful');
            htmx.ajax('GET', `/home/`, {
                target: '#main'  
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        errorMessage.textContent = 'An unexpected error occurred. Please try again later.';
        errorMessage.style.display = 'block';
    });
});
