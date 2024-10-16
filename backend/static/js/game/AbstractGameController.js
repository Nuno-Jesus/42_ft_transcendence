import * as THREE from 'three';
import { Ball } from './Ball.js';
import { Arena } from './Arena.js';

export class AbstractGameController extends THREE.Group {
	constructor ({ gameType }) {
		super();

		this.keybinds = null;
		this.arena = null;
		this.ball = null;
		this.player1 = null;
		this.player2 = null;
		this.stats = null;
		this.gameType = gameType;
	}

	registerKeybinds() {
		this.keybinds = {
			'w': false, 's': false,
			'ArrowUp': false, 'ArrowDown': false
		};

		document.addEventListener('keydown', (event) => {
			if (event.key in this.keybinds) 
				this.keybinds[event.key] = true;
		});
		document.addEventListener('keyup', (event) => {
			if (event.key in this.keybinds) 
				this.keybinds[event.key] = false;
		});
	}

	build({ ballDirection, onPaddleHit=null }) {
		this.arena = new Arena({});
		this.ball = new Ball({ 
			direction: ballDirection, 
			onPaddleHit: onPaddleHit 
		});

		this.add(this.arena);
		this.add(this.player1.paddle);
		this.add(this.player2.paddle);
		this.add(this.ball);
	}

	update() {
		this.player1.update(this.keybinds);
		this.player2.update(this.keybinds);
		if (this.ball == null)
			return ;

		const scorer = this.ball.move(this);
		if (scorer != null) {
			this.stats.registerGoal(scorer, this.ball);
			this.ball.reset({});
		}
		if (this.stats.winner != null){				
			this.remove(this.ball);
			this.ball.dispose();
			this.ball = null;
		}
	}

	createPlayers() {}
}