
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
        // Store the previous player position
        const previousX = this.player.x;
        const previousY = this.player.y;

        // Update player movement and animations
        this.player.update(this.input, deltaTime);

        // Store the requested player position
        const nextX = this.player.x;
        const nextY = this.player.y;

        // Restore the previous player position
        this.player.x = previousX;
        this.player.y = previousY;

        // Check horizontal collision
        if (
            this.world.canMoveTo(
                nextX,
                this.player.y,
                this.player.width,
                this.player.height
            )
        ) {
            this.player.x = nextX;
        }

        // Check vertical collision
        if (
            this.world.canMoveTo(
                this.player.x,
                nextY,
                this.player.width,
                this.player.height
            )
        ) {
            this.player.y = nextY;
        }
    }

    draw() {
        // Clear the canvas
        this.ctx.clearRect(
            0, 0,
            this.canvas.width,
            this.canvas.height
        );

        // Draw the ground and paths first
        this.world.renderGround(this.ctx);

        // Collect all environment objects
        const renderables = this.world.getRenderables();

        // Add the player to the rendering queue
        renderables.push({
            depth: this.player.y + this.player.height,
            draw: (ctx) => this.player.draw(ctx)
        });

        // Sort objects by their bottom Y position
        renderables.sort((a, b) => a.depth - b.depth);

        // Draw objects from back to front
        for (const object of renderables) {
            object.draw(this.ctx);
        }
    }

    gameLoop(timestamp) {
        // Calculate time between frames
        const deltaTime = this.lastTime === null
            ? 0
            : Math.min(
                (timestamp - this.lastTime) / 1000,
                0.1
            );

        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }
}
