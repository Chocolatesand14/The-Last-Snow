export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }

    start() {
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update() {
        // Update game logic
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