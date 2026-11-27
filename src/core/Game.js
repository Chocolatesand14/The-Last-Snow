import { Input } from "./Input.js";

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.input = new Input();
    }

    start() {
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update() {
        // Test keyboard input
        if (this.input.isPressed("w") || this.input.isPressed("ArrowUp")) {
            console.log("Moving up");
        }

        if (this.input.isPressed("s") || this.input.isPressed("ArrowDown")) {
            console.log("Moving down");
        }

        if (this.input.isPressed("a") || this.input.isPressed("ArrowLeft")) {
            console.log("Moving left");
        }

        if (this.input.isPressed("d") || this.input.isPressed("ArrowRight")) {
            console.log("Moving right");
        }
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
    }

    gameLoop() {
        this.update();
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }
}