import { Input } from "./Input.js";
import { Player } from "../entities/Player.js";

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.input = new Input();

        // Create the player at the center of the canvas
        this.player = new Player(
            canvas.width / 2 - 16,
            canvas.height / 2 - 16
        );

        this.lastTime = null;
        this.gameLoop = this.gameLoop.bind(this);
    }

    start() {
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        this.player.update(this.input, deltaTime);

        // Keep the player inside the canvas
        this.player.x = Math.max(
            0,
            Math.min(
                this.player.x,
                this.canvas.width - this.player.width
            )
        );

        this.player.y = Math.max(
            0,
            Math.min(
                this.player.y,
                this.canvas.height - this.player.height
            )
        );
    }

    draw() {
        // Clear the canvas
        this.ctx.clearRect(
            0, 0,
            this.canvas.width,
            this.canvas.height
        );

        // Draw the background
        this.ctx.fillStyle = "#182b40";
        this.ctx.fillRect(
            0, 0,
            this.canvas.width,
            this.canvas.height
        );

        // Draw the player
        this.player.draw(this.ctx);
    }

    gameLoop(timestamp) {
        // Calculate time between frames
        const deltaTime = this.lastTime === null
            ? 0
            : Math.min((timestamp - this.lastTime) / 1000, 0.1);

        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }
}