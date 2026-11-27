
import { Input } from "./Input.js";
import { Player } from "../entities/Player.js";
import { TileMap } from "../world/TileMap.js";
import { SnowyForest } from "../world/maps/SnowyForest.js";

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.input = new Input();

        // Create the snowy forest world
        this.world = new TileMap(SnowyForest);

        // Set the canvas dimensions to match the world
        this.canvas.width = this.world.width;
        this.canvas.height = this.world.height;

        // Disable smoothing to preserve pixel art
        this.ctx.imageSmoothingEnabled = false;

        // Create the player at the world spawn point
        this.player = new Player(
            this.world.spawnPoint.x,
            this.world.spawnPoint.y
        );

        this.lastTime = null;
        this.gameLoop = this.gameLoop.bind(this);
    }

    start() {
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        this.player.update(this.input, deltaTime);

        // Keep the player inside the world boundaries
        this.player.x = Math.max(
            0,
            Math.min(
                this.player.x,
                this.world.width - this.player.width
            )
        );

        this.player.y = Math.max(
            0,
            Math.min(
                this.player.y,
                this.world.height - this.player.height
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

        // Draw the world
        this.world.render(this.ctx);

        // Draw the player above the world
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
