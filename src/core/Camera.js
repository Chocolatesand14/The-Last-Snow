
export class Camera {
    constructor(width, height, worldWidth, worldHeight) {
        this.x = 0;
        this.y = 0;

        this.width = width;
        this.height = height;

        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }

    follow(target) {
        // Calculate the target center
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;

        // Center the camera on the target
        this.x = targetCenterX - this.width / 2;
        this.y = targetCenterY - this.height / 2;

        // Keep the camera inside the world
        this.clampToWorld();
    }

    clampToWorld() {
        // Calculate the maximum camera position
        const maxX = Math.max(
            0,
            this.worldWidth - this.width
        );

        const maxY = Math.max(
            0,
            this.worldHeight - this.height
        );

        // Clamp the camera position
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = Math.max(0, Math.min(this.y, maxY));
    }
}
