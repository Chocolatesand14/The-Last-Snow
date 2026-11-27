
export class Camera {
    constructor(width, height, worldWidth, worldHeight) {
        this.x = 0;
        this.y = 0;

        this.width = width;
        this.height = height;

        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // Control the camera follow speed
        this.followSpeed = 5;
    }

    follow(target, deltaTime = null) {
        // Calculate the target center
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;

        // Calculate the desired camera position
        const targetX = targetCenterX - this.width / 2;
        const targetY = targetCenterY - this.height / 2;

        // Calculate world boundaries
        const maxX = Math.max(
            0,
            this.worldWidth - this.width
        );

        const maxY = Math.max(
            0,
            this.worldHeight - this.height
        );

        // Keep the target position inside the world
        const clampedX = Math.max(0, Math.min(targetX, maxX));
        const clampedY = Math.max(0, Math.min(targetY, maxY));

        // Instantly position the camera when no delta time is provided
        if (deltaTime === null) {
            this.x = clampedX;
            this.y = clampedY;
            return;
        }

        // Reject invalid or negative delta time
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        // Calculate frame-rate-independent interpolation
        const smoothing = 1 - Math.exp(
            -this.followSpeed * deltaTime
        );

        // Smoothly approach the target position
        this.x += (clampedX - this.x) * smoothing;
        this.y += (clampedY - this.y) * smoothing;

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
