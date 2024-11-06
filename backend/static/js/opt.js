
async function submitOtp(event) {
    event.preventDefault(); 
    const formData = new FormData(document.getElementById('otpForm'));
    const response = await fetch('', {
        method: 'POST',
        body: formData,
    });

    if (response.ok) {
        const data = await response.json();
        if (data.redirect) {
            localStorage.setItem("access_token", JSON.stringify(data.access_token))
            localStorage.setItem("refresh_token", JSON.stringify(data.refresh_token))
            history.pushState(null, '', `/home/`);
            htmx.ajax('GET', `/home/`, {
                target: '#main'  
            });
        }
    } else {
        const errorData = await response.json();
        document.getElementById('errorMessage').textContent = errorData.error;  
        document.getElementById('errorMessage').style.display = 'block';
    }
}

async function resend_code(){
    let formData = {};
    formData.info = email;
    console.log(email);
    const response = await fetch(`/otpmethod/`, {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json',
            }
        }); 
}