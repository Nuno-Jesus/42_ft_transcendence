import * as THREE from 'three';
import { ARENA_SEMI_HEIGHT, ARENA_SEMI_LENGTH, ARENA_SEMI_DEPTH } from './macros.js';

export class Arena extends THREE.Group {
	constructor({ height, length, depth }) {
		super();
		this.semiHeight = height || ARENA_SEMI_HEIGHT;
		this.semiLength = length || ARENA_SEMI_LENGTH;
		this.semiDepth = depth || ARENA_SEMI_DEPTH;

		this.upperBoundary = null;
		this.lowerBoundary = null;
		this.leftBoundary = null;
		this.rightBoundary = null;

		this.build();
	}

	build() {
		const height = 2 * this.semiHeight;
		const length = 2 * this.semiLength;
		const depth = 2 * this.semiDepth;

		this.upperBoundary = new THREE.Mesh(
			new THREE.BoxGeometry(length, depth, depth),
			new THREE.MeshPhongMaterial()
		);
		this.leftBoundary = new THREE.Mesh(
			new THREE.BoxGeometry(depth, height, depth),
			new THREE.MeshPhongMaterial()
		);
		this.lowerBoundary = this.upperBoundary.clone();
		this.rightBoundary = this.leftBoundary.clone();

		this.upperBoundary.position.set(0, this.semiHeight - this.semiDepth, 0);
		this.lowerBoundary.position.set(0, -this.semiHeight + this.semiDepth, 0);
		this.leftBoundary.position.set(-this.semiLength, 0, 0);
		this.rightBoundary.position.set(this.semiLength, 0, 0);

		this.add(this.lowerBoundary, this.upperBoundary, this.leftBoundary, this.rightBoundary);
	}
}