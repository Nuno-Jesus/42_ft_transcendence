async function removeNotification(notificationId, listItem){
    let token = localStorage.getItem("access_token");
    const userId = document.querySelector('button[onclick="getNotifications()"]').getAttribute('data-user-id');
    const response = await fetch(`/notifications/${userId}/${notificationId}`, {
        method: 'DELETE',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
        }
    });
	const data = await response.json();
	if (!response.ok && response.status != 401){
        localStorage.setItem('access_token', data.access_token);
    }
    else if(response.status == 401){
        alert("As your session has expired, you will be logged out.");
        history.pushState(null, '', `/`);
        htmx.ajax('GET', `/`, {
            target: '#main'
        });
    }
	else{
        localStorage.setItem('access_token', data.access_token);
		listItem.remove();
    }
}


async function getNotifications() {
    const userId = document.querySelector('button[onclick="getNotifications()"]').getAttribute('data-user-id');
    let token = localStorage.getItem("access_token");
    const response = await fetch(`/notifications/${userId}`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
        }
    });
	const data = await response.json();

    if (!response.ok && response.status != 401) {
        localStorage.setItem('access_token', data.access_token);
		return ;
	}
	else if (!response.ok && response.status == 401) {
		alert("As your session has expired, you will be logged out.");
		history.pushState(null, '', `/`);
		htmx.ajax('GET', `/`, {
			target: '#main'
		});
	}
    localStorage.setItem('access_token', data.access_token);
	const notificationList = document.getElementById('notificationList');
    notificationList.replaceChildren(); 

	data.notifications.forEach(notification => {
		const listItem = document.createElement('li');
		listItem.classList.add('notif-li');

		const right_div = document.createElement('div');
		right_div.classList.add('time-text-button');
		
		const profilePic = document.createElement('img');
		profilePic.classList.add('profile-pic-notif');
		profilePic.alt = `${notification.other_user_id.username}'s profile picture`;
		
		const uri = notification.other_user_id.picture;
		if (notification.other_user_id.picture.includes('http')) 
			profilePic.src = `https://${decodeURIComponent(uri).slice(14)}`
		else 
			profilePic.src = notification.other_user_id.picture;
		
		const textContent = document.createElement('h4');
		textContent.classList.add('description-notif');

		const usernameLink = document.createElement('a');
        usernameLink.classList.add('name-notif');
        usernameLink.textContent = notification.other_user_id.username;

        const description = document.createTextNode(` ${notification.description}`);

        textContent.appendChild(usernameLink);
        textContent.appendChild(description);

        textContent.onclick = function() {
			history.pushState(null, '', `/users/${notification.other_user_id.id}`);
			htmx.ajax('GET', `/users/${notification.other_user_id.id}`, {
				target: '#main',
                swap: 'innerHTML'
			});
		};

		const timestamp = document.createElement('span');
		timestamp.classList.add('timestamp');
		const date = new Date(notification.created_at);

		const formattedDate = date.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit'});
		const formattedTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false});
		timestamp.textContent = `${formattedDate}, ${formattedTime}`;
		
		listItem.appendChild(profilePic);
		listItem.appendChild(right_div);
		
		right_div.appendChild(timestamp);
		right_div.appendChild(textContent);

		if (notification.status === 'Pending' && notification.type === 'Friend Request') {
			const acceptButton = document.createElement('button');
			acceptButton.textContent = 'Accept';
			acceptButton.classList.add('button-notif');
			acceptButton.id = "accept";
			acceptButton.onclick = () => handleNotificationAction(notification.id, 'accept', userId, notification.other_user_id.id);

			const declineButton = document.createElement('button');
			declineButton.textContent = 'Decline';
			declineButton.classList.add('button-notif');
			declineButton.id = "decline";
			declineButton.onclick = () => handleNotificationAction(notification.id, 'decline', userId, notification.other_user_id.id);

			const buttons = document.createElement('div');
			buttons.classList.add('d-flex');
			buttons.classList.add('align-items-center');
			right_div.classList.add('accept-decline');

			buttons.appendChild(acceptButton);
			buttons.appendChild(declineButton);

			right_div.appendChild(buttons);
		}

		const closeSpan = document.createElement('span');
		closeSpan.classList.add('close');
		closeSpan.textContent = 'x';
		closeSpan.style.cursor = 'pointer';
		closeSpan.onclick = () => removeNotification(notification.id, listItem);
		listItem.appendChild(closeSpan);

		notificationList.appendChild(listItem);
	});

	const modal = document.getElementById('modal-notif');
	modal.style.display = 'block';
}



async function handleNotificationAction(notificationId, status, userId, otherUserId, event) {
    if (event) {
        event.preventDefault(); // Previne o comportamento padrão do botão/formulário
        event.stopPropagation(); // Previne que o evento dispare outros listeners
    }

    try {

        if (status === 'accept') {

            let token = localStorage.getItem("access_token");
            const friendAcceptResponse = await fetch(`/friends/accept/${userId}/${otherUserId}`, {
                method: 'PATCH',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
                }
            });
            const data_friend = await friendAcceptResponse.json();
            if (!friendAcceptResponse.ok && friendAcceptResponse.status != 401) {
                localStorage.setItem('access_token', data_friend.access_token);
                throw new Error(`Error accepting friend request: ${friendAcceptResponse.statusText}`);
            }
            else if(friendAcceptResponse.status == 401){
                alert("As your session has expired, you will be logged out.");
                history.pushState(null, '', `/`);
                htmx.ajax('GET', `/`, {
                    target: '#main'
                });
            }
            else{
                localStorage.setItem('access_token', data_friend.access_token);
                token = localStorage.getItem("access_token");
                const notificationUpdateResponse = await fetch(`/notifications/update/${notificationId}`, {
                    method: 'PATCH',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
                    }
                });
                const data_notification = await notificationUpdateResponse.json();
                if (!notificationUpdateResponse.ok && notificationUpdateResponse.status != 401) {
                    localStorage.setItem('access_token', data_notification.access_token);
                    throw new Error(`Error updating notification: ${notificationUpdateResponse.statusText}`);
                }
                else if(notificationUpdateResponse.status == 401){
                    alert("As your session has expired, you will be logged out.");
                    history.pushState(null, '', `/`);
                    htmx.ajax('GET', `/`, {
                        target: '#main'
                    });
                }
                else{
                    localStorage.setItem('access_token', data_notification.access_token);
                }
            }
        } else if (status === 'decline') {
            let token = localStorage.getItem("access_token");
            const friendDeclineResponse = await fetch(`/friends/decline/${userId}/${otherUserId}`, {
                method: 'PATCH',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
                }
            });
            const data_friend_decline = await friendDeclineResponse.json();
            if (!friendDeclineResponse.ok && friendDeclineResponse.status != 401) {
                localStorage.setItem('access_token', data_friend_decline.access_token);
                throw new Error(`Error updating notification: ${friendDeclineResponse.statusText}`);
            }
            else if(friendDeclineResponse.status == 401){
                alert("As your session has expired, you will be logged out.");
                history.pushState(null, '', `/`);
                htmx.ajax('GET', `/`, {
                    target: '#main'
                });
            }
            else {
                let token = localStorage.getItem("access_token");

                const notificationUpdateResponse = await fetch(`/notifications/update/${notificationId}`, {
                    method: 'PATCH',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                        "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
                    },
                    body: JSON.stringify({ status: 'Declined' })
                });
                const data_reponse = await notificationUpdateResponse.json();
                if (!notificationUpdateResponse.ok && notificationUpdateResponse.status != 401) {
                    localStorage.setItem('access_token', data_reponse.access_token);
                    throw new Error(`Error updating notification: ${notificationUpdateResponse.statusText}`);
                }
                else if(notificationUpdateResponse.status == 401){
                    alert("As your session has expired, you will be logged out.");
                    history.pushState(null, '', `/`);
                    htmx.ajax('GET', `/`, {
                        target: '#main'
                    });
                }
                else{
                    localStorage.setItem('access_token', data_reponse.access_token);
                }
            }
        }
        getNotifications();
    } catch (error) {
    }
}




function closeModal() {
    const modal = document.getElementById('modal-notif');
    modal.style.display = 'none';
}


document.addEventListener('click', function (event) {
    const modal = document.getElementById('modal-notif');
    
    if (!modal) return;

    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

async function handleNotificationProfile(notificationId, status, userId, otherUserId, event) {
    if (event) {
        event.preventDefault(); // Previne o comportamento padrão do botão/formulário
        event.stopPropagation(); // Previne que o evento dispare outros listeners
    }

    try {

        if (status === 'accept') {
            
            let token = localStorage.getItem("access_token");
            const friendAcceptResponse = await fetch(`/friends/accept/${userId}/${otherUserId}`, {
                method: 'PATCH',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
                }
            });
            const data_friend = await friendAcceptResponse.json();
            if (!friendAcceptResponse.ok && friendAcceptResponse.status != 401) {
                localStorage.setItem('access_token', data_friend.access_token);
                throw new Error(`Error accepting friend request: ${friendAcceptResponse.statusText}`);
            }
            else if(friendAcceptResponse.status == 401){
                alert("As your session has expired, you will be logged out.");
                history.pushState(null, '', `/`);
                htmx.ajax('GET', `/`, {
                    target: '#main'
                });
            }
            else{
                localStorage.setItem('access_token', data_friend.access_token);
                token = localStorage.getItem("access_token");
                const notificationUpdateResponse = await fetch(`/notifications/update/${notificationId}`, {
                    method: 'PATCH',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
                    }
                });
                const data_notification = await notificationUpdateResponse.json();
                if (!notificationUpdateResponse.ok && notificationUpdateResponse.status != 401) {
                    localStorage.setItem('access_token', data_notification.access_token);
                    throw new Error(`Error updating notification: ${notificationUpdateResponse.statusText}`);
                }
                else if(notificationUpdateResponse.status == 401){
                    alert("As your session has expired, you will be logged out.");
                    history.pushState(null, '', `/notifications/${userId}`);
                    htmx.ajax('GET', `/notifications/${userId}`, {
                        target: '#main'
                    });
                }
                else{
                    localStorage.setItem('access_token', data_notification.access_token);
                    const declineButton = document.getElementById("decline-friend-button");
                    const acceptButton = document.getElementById("accept-friend-button");
                    const removeFriendButton = document.getElementById("remove-friend-button");

                    if (declineButton) declineButton.style.display = "none";
                    if (acceptButton) acceptButton.style.display = "none";
                    if (removeFriendButton) removeFriendButton.style.display = "block";

                    history.pushState(null, '', `/`);
                    htmx.ajax('GET', `/`, {
                        target: '#main'
                    });
                }
            }
        } else if (status === 'decline') {
            let token = localStorage.getItem("access_token");
            const friendDeclineResponse = await fetch(`/friends/decline/${userId}/${otherUserId}`, {
                method: 'PATCH',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
                }
            });
            const data_friend_decline = await friendDeclineResponse.json();
            if (!friendDeclineResponse.ok && friendDeclineResponse.status != 401) {
                localStorage.setItem('access_token', data_friend_decline.access_token);
                throw new Error(`Error updating notification: ${friendDeclineResponse.statusText}`);
            }
            else if(friendDeclineResponse.status == 401){
                alert("As your session has expired, you will be logged out.");
                history.pushState(null, '', `/`);
                htmx.ajax('GET', `/`, {
                    target: '#main'
                });
            }
            else {
                token = localStorage.getItem("access_token");
                const notificationUpdateResponse = await fetch(`/notifications/update/${notificationId}`, {
                    method: 'PATCH',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                        "Authorization": localStorage.getItem("access_token") ? `Bearer ${token}` : null,
                    },
                    body: JSON.stringify({ status: 'Declined' })
                });
                const data_reponse = await notificationUpdateResponse.json();
                if (!notificationUpdateResponse.ok && notificationUpdateResponse.status != 401) {
                    localStorage.setItem('access_token', data_reponse.access_token);
                    throw new Error(`Error updating notification: ${notificationUpdateResponse.statusText}`);
                }
                else if(notificationUpdateResponse.status == 401){
                    alert("As your session has expired, you will be logged out.");
                    history.pushState(null, '', `/`);
                    htmx.ajax('GET', `/`, {
                        target: '#main'
                    });
                }
                else{
                    localStorage.setItem('access_token', data_reponse.access_token);
                    const declineButton = document.getElementById("decline-friend-button");
                    const acceptButton = document.getElementById("accept-friend-button");
                    const addFriendButton = document.getElementById("add-friend-button");

                    if (declineButton) declineButton.style.display = "none";
                    if (acceptButton) acceptButton.style.display = "none";
                    if (addFriendButton) addFriendButton.style.display = "block";

                }
            }
        }

        history.pushState(null, '', `/notifications/${userId}`);
        htmx.ajax('GET', `/notifications/${userId}`, {
            target: '#main'
        });

    } catch (error) {
    }
}