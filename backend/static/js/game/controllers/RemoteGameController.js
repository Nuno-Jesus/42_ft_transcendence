import { GameStats } from '../GameStats.js';
import { RemotePlayer } from '../players/RemotePlayer.js';
import { ALTERNATE_KEYBINDS, PADDLE_OFFSET, STANDARD_KEYBINDS } from '../macros.js';
import { AbstractGameController } from './AbstractGameController.js';

export class RemoteGameController extends AbstractGameController {
	constructor({ player1Data, player2Data, gameID, gameType, app }) {
		super({ type: gameType, app: app });

		this.player1 = null;
		this.player2 = null;
		this.players = {};
		
		this.registerKeybinds();
		this.registerSocketEvents();
		this.createPlayers(player1Data, player2Data, gameID);
		this.build();
	}

	createPlayers(player1Data, player2Data, gameID) {
		const { id: p1ID, username: p1Username, picture: p1Picture } = player1Data;
		const { id: p2ID, username: p2Username, picture: p2Picture } = player2Data;
		const currPlayerID = document.getElementById('metadata').getAttribute('data-user-id');
		const onUpdate = (id, username, targetY) => {
			if (!myUser.gameSocket)
				return ;
			myUser.gameSocket.send(JSON.stringify({
				'event': 'UPDATE',
				'data': {
					'id': id,
					'username': username,
					'y': targetY,
				}
			}));
		}

		this.player1 = new RemotePlayer({ 
			id: p1ID, 
			username: p1Username,
			onUpdate: p1ID == currPlayerID ? onUpdate : null,
			isEnemy: p1ID != currPlayerID,
			keybinds: p1ID == currPlayerID ? STANDARD_KEYBINDS : null,
			x: -(PADDLE_OFFSET),
			picture: p1Picture
		});
		this.player2 = new RemotePlayer({ 
			id: p2ID, 
			username: p2Username,
			onUpdate: p2ID == currPlayerID ? onUpdate : null,
			isEnemy: p2ID != currPlayerID,
			keybinds: p2ID == currPlayerID ? ALTERNATE_KEYBINDS : null,
			x: PADDLE_OFFSET,
			picture: p2Picture
		});
		this.players[this.player1.id] = this.player1;
		this.players[this.player2.id] = this.player2;
		console.log(this);
		this.stats = new GameStats(this.player1, this.player2);
		this.stats.gameID = gameID;
	}

	registerSocketEvents(){
		myUser.gameSocket.onmessage = (ev) => {
			const { event, data } = JSON.parse(ev.data);
			
			if (event == 'UPDATE') {
				this.players[data.id].move(data.y);
			}
			else if (event == 'SYNC')
				this.ball.sync(data.ball);
			else if (event == 'DISCONNECT' && this.type == 'Tournament' && !this.stats.isGameOver()) {
				myTournament.onTimeout(this.stats.gameID, this.player1, this.player2);
			}
		};
	}

	build() {
		const onPaddleHit = () => {
			if (!myUser.gameSocket)
				return ;
			myUser.gameSocket.send(JSON.stringify({
				'event': 'SYNC',
				'data': {
					'ball': {
						'position': [...this.ball.position],
						'direction': this.ball.direction,
						'speed': this.ball.speed
					}
				}
			}));
		};
		const ballData = {
			onPaddleHit: onPaddleHit
		};

		super.build(ballData);
	}

	sendGameResults() {
		const results = this.stats.assembleGameResults();

		myUser.gameSocket.send(JSON.stringify({
			'event': 'GAME_END',
			'data': results
		}));
		myUser.gameSocket.close(3000);
		
		if (!myUser.tournamentSocket)
			return ;

		myUser.tournamentSocket.send(JSON.stringify({
			'event': 'GAME_END',
			'data': results
		}));

		myTournament.onGameEnd( this.stats.gameID, this.player1.username,
			this.player2.username, this.stats.score );
		setTimeout(() => {
			history.replaceState(null, '', `/tournaments/ongoing/${myUser.tournamentID}`);
			htmx.ajax('GET', `/tournaments/ongoing/${myUser.tournamentID}`, {
				target: '#main'  
			});
		}, 1000);
	}
}