function onEditButtonClick() {
	document.getElementById("save-cancel").style.display = "flex";
	document.getElementById("edit-change1").style.display = "none";
	document.getElementById("edit-change1").classList.remove("d-flex");
    document.getElementById("edit-profile-button").style.display = "none";
    document.getElementById("save-profile-button").style.display = "inline-block";
    document.getElementById("cancel-edit-button").style.display = "inline-block";
    document.getElementById("edit-profile-form").style.display = "block";
    document.getElementById("change-info2").style.display = "none";
    document.getElementById("open-change-password-modal").style.display = "none";

    document.getElementById('profile-picture-input').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = function(e) {
                // Define o src da imagem de pré-visualização
                document.getElementById('profile-picture-preview').src = e.target.result;
            }

            // Lê o arquivo como uma URL de dados
            reader.readAsDataURL(file);
        } 
    });
}

function onCancelButtonClick() {
	document.getElementById("edit-change1").style.display = "flex";
	document.getElementById("save-cancel").style.display = "none";
	document.getElementById("save-cancel").classList.remove("d-flex");
    document.getElementById("edit-profile-button").style.display = "flex";
    document.getElementById("save-profile-button").style.display = "none";
    document.getElementById("cancel-edit-button").style.display = "none";
    document.getElementById("edit-profile-form").style.display = "none";
    document.getElementById("change-info1").style.display = "block";
    document.getElementById("change-info2").style.display = "block";
    document.getElementById("open-change-password-modal").style.display = "block";
}

async function onSaveButtonClick(event, userId) {
    event.preventDefault(); 
    const formData = new FormData(document.getElementById("edit-profile-form"));
    let token = localStorage.getItem("access_token");

    const response = await fetch(`/users/${userId}/update`, {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
        }
    });
	const data = await response.json();

	if (response.status != 201 && response.status != 401)
		alert(data.message);
    else if (response.status == 401) {
		alert("As your session has expired, you will be logged out.");
		history.pushState(null, '', `/`);
		htmx.ajax('GET', `/`, {
			target: '#main'
		});
	}
	else {
		history.pushState(null, '', `/users/${userId}`);
		htmx.ajax('GET', `/users/${userId}`, {
			target: '#main'  
		});
	}
}