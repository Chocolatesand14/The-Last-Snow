import { Input } from "./Input.js";
import { Camera } from "./Camera.js";
import { Player } from "../entities/Player.js";
import { TileMap } from "../world/TileMap.js";
import { SnowyForest } from "../world/maps/SnowyForest.js";
import { SnowParticleSystem } from "../effects/SnowParticleSystem.js";
import { SnowFootprintSystem } from "../effects/SnowFootprintSystem.js";
import { WeatherOverlay } from "../effects/WeatherOverlay.js";
import { WeatherType } from "../weather/WeatherType.js";
import { WeatherSystem } from "../weather/WeatherSystem.js";
import { WeatherController } from "../weather/WeatherController.js";
import { WindSystem } from "../weather/WindSystem.js";
import { ShadowSystem } from "../lighting/ShadowSystem.js";
import { LightingSystem } from "../lighting/LightingSystem.js";
import { ScreenFade } from "../effects/ScreenFade.js";
import { DialogueBubble } from "../ui/DialogueBubble.js";
import { EmotionIndicator } from "../ui/EmotionIndicator.js";
import { AwakeningSequence } from "../cutscenes/AwakeningSequence.js";

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.input = new Input();

        // Create the snowy forest world
        this.world = new TileMap(SnowyForest);

        // Set the viewport dimensions
        this.canvas.width = 480;
        this.canvas.height = 384;

        // Disable smoothing to preserve pixel art
        this.ctx.imageSmoothingEnabled = false;

        // Create the unequipped player at the world spawn point
        this.player = new Player(
            this.world.spawnPoint.x,
            this.world.spawnPoint.y,
            { useBaseAppearance: true }
        );

        // Create the camera
        this.camera = new Camera(
            this.canvas.width,
            this.canvas.height,
            this.world.width,
            this.world.height
        );

        // Instantly center the camera on the player
        this.camera.follow(this.player);

        // Initialize the dynamic weather system
        this.weatherSystem = new WeatherSystem(
            WeatherType.SNOWFALL
        );

        // Initialize automatic weather changes
        this.weatherController = new WeatherController(
            this.weatherSystem
        );

        // Initialize dynamic wind and gust variations
        this.windSystem = new WindSystem(
            this.weatherSystem.wind,
            this.weatherSystem.wind * 0.5,
            0.3
        );

        // Create the snow particle system
        this.snowSystem = new SnowParticleSystem(
            this.canvas.width,
            this.canvas.height,
            this.weatherSystem.intensity
        );

        // Apply the initial wind speed
        this.snowSystem.setWind(
            this.windSystem.currentWind
        );

        // Initialize the dynamic snow footprint system
        this.footprintSystem = new SnowFootprintSystem(
            12,
            4,
            60
        );

        // Initialize the dynamic shadow system
        this.shadowSystem = new ShadowSystem();

        // Register static environment shadows
        this.world.registerStaticShadows(
            this.shadowSystem
        );

        // Create a soft oval shadow beneath the player
        this.shadowSystem.createPlayerShadow(
            this.player,
            24,
            10,
            0.3
        );

        // Apply the initial weather conditions to shadows
        this.shadowSystem.setWeatherVisibility(
            this.weatherSystem.visibility
        );

        // Initialize the dynamic lighting system
        this.lightingSystem = new LightingSystem();

        // Register environmental light sources
        this.world.registerLights(
            this.lightingSystem
        );

        // Synchronize ambient lighting with the initial weather
        this.lightingSystem.setWeather(
            this.weatherSystem.currentWeather,
            0
        );

        // Initialize the weather visibility overlay
        this.weatherOverlay = new WeatherOverlay(
            this.canvas.width,
            this.canvas.height
        );

        // Apply the initial weather visibility
        this.weatherOverlay.setVisibility(
            this.weatherSystem.visibility
        );

        // Initialize reusable cutscene effects
        this.screenFade = new ScreenFade();
        this.dialogueBubble = new DialogueBubble();
        this.emotionIndicator = new EmotionIndicator();

        // Connect the awakening sequence to the player
        this.awakeningSequence = new AwakeningSequence({
            player: this.player,
            screenFade: this.screenFade,
            dialogueBubble: this.dialogueBubble,
            emotionIndicator: this.emotionIndicator
        });

        this.lastTime = null;
        this.gameLoop = this.gameLoop.bind(this);
    }

    start() {
        // Begin the introduction before scheduling the first frame
        this.awakeningSequence.start();
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        // Store the previous player position
        const previousX = this.player.x;
        const previousY = this.player.y;

        // Lock player movement while the introduction is active
        if (this.awakeningSequence?.isInputLocked) {
            this.awakeningSequence.update(deltaTime);
            this.player.updateAwakening(deltaTime);
        } else {
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

        // Smoothly update the camera after resolving collisions
        this.camera.follow(this.player, deltaTime);

        // Update dynamic weather and snowfall
        this.updateWeather(deltaTime);

        // Update existing footprints and track actual movement
        this.updateFootprints(
            previousX,
            previousY,
            deltaTime
        );

        // Update shadows after resolving movement and weather
        this.updateShadows();

        // Update ambient transitions and dynamic light sources
        this.updateLighting(deltaTime);
    }

    updateFootprints(previousX, previousY, deltaTime) {
        // Reject invalid or non-positive delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Update existing footprints using current snowfall intensity
        this.footprintSystem.update(
            deltaTime,
            this.weatherSystem.intensity
        );

        // Calculate actual player movement after collision handling
        const deltaX = this.player.x - previousX;
        const deltaY = this.player.y - previousY;

        // Skip footprint creation when the player is stationary
        if (deltaX === 0 && deltaY === 0) {
            return;
        }

        // Determine the actual movement direction
        let direction;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0
                ? "right"
                : "left";
        } else {
            direction = deltaY > 0
                ? "down"
                : "up";
        }

        // Calculate the player's ground contact position
        const offsetX = this.player.width / 2;
        const offsetY = this.player.height - 2;

        // Create footprints along the actual movement path
        this.footprintSystem.trackMovement(
            previousX + offsetX,
            previousY + offsetY,
            this.player.x + offsetX,
            this.player.y + offsetY,
            direction
        );
    }

    updateShadows() {
        // Synchronize the player shadow with the actual position
        this.shadowSystem.updatePlayerShadow(
            this.player
        );

        // Synchronize shadow strength with current weather visibility
        this.shadowSystem.setWeatherVisibility(
            this.weatherSystem.visibility
        );
    }

    updateLighting(deltaTime) {
        // Reject invalid or non-positive delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Synchronize ambient lighting with the target weather
        const weather =
            this.weatherSystem.targetWeather ??
            this.weatherSystem.currentWeather;

        // Apply a smooth weather-dependent lighting transition
        this.lightingSystem.setWeather(
            weather,
            5
        );

        // Update ambient transitions and individual light sources
        this.lightingSystem.update(deltaTime);
    }

    updateWeather(deltaTime) {
        // Reject invalid or non-positive delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Advance active transitions or stable weather timing
        if (this.weatherSystem.isTransitioning) {
            this.weatherSystem.update(deltaTime);
        } else {
            this.weatherController.update(deltaTime);
        }

        // Synchronize the base wind with the current weather
        this.windSystem.setBaseWind(
            this.weatherSystem.wind
        );

        // Scale gust strength according to weather severity
        this.windSystem.setGustStrength(
            Math.abs(this.weatherSystem.wind) * 0.5
        );

        // Update dynamic wind variations
        this.windSystem.update(deltaTime);

        // Synchronize snowfall intensity with the weather
        this.snowSystem.setIntensity(
            this.weatherSystem.intensity
        );

        // Apply dynamic wind to the snow particles
        this.snowSystem.setWind(
            this.windSystem.currentWind
        );

        // Update individual snow particle movement
        this.snowSystem.update(deltaTime);

        // Synchronize the weather visibility overlay
        this.weatherOverlay.setVisibility(
            this.weatherSystem.visibility
        );
    }

    draw() {
        // Clear the canvas
        this.ctx.clearRect(
            0, 0,
            this.canvas.width,
            this.canvas.height
        );

        // Save the current canvas state
        this.ctx.save();

        // Apply the camera offset using whole pixels
        this.ctx.translate(
            -Math.round(this.camera.x),
            -Math.round(this.camera.y)
        );

        // Render only visible ground tiles and paths
        this.world.renderGround(
            this.ctx,
            this.camera
        );

        // Render visible footprints above the ground
        this.footprintSystem.draw(
            this.ctx,
            this.camera
        );

        // Render visible shadows beneath world objects
        this.shadowSystem.draw(
            this.ctx,
            this.camera
        );

        // Collect visible environment objects
        const renderables = this.world.getRenderables(
            this.camera
        );

        // Add the player to the rendering queue
        renderables.push({
            depth: this.player.y + this.player.height,
            draw: (ctx) => this.player.draw(ctx)
        });

        // Sort objects by their bottom Y position
        renderables.sort(
            (a, b) => a.depth - b.depth
        );

        // Draw visible objects from back to front
        for (const object of renderables) {
            object.draw(this.ctx);
        }

        // Restore the original canvas state
        this.ctx.restore();

        // Render ambient lighting and dynamic world lights
        this.lightingSystem.draw(
            this.ctx,
            this.canvas.width,
            this.canvas.height,
            this.camera
        );

        // Render the weather overlay in screen coordinates
        this.weatherOverlay.draw(this.ctx);

        // Render snowfall above the weather overlay
        this.ctx.save();

        this.snowSystem.draw(this.ctx);

        this.ctx.restore();

        // Draw character indicators and dialogue above the weather
        this.emotionIndicator?.draw(this.ctx, this.camera);
        this.dialogueBubble?.draw(this.ctx, this.camera);

        // Draw the screen fade last to cover the entire scene
        this.screenFade?.draw(
            this.ctx,
            this.canvas.width,
            this.canvas.height
        );
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
