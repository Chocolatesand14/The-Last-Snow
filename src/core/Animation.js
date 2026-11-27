export class Animation {
    constructor(frameCount = 4, frameDuration = 0.15) {
        this.frameCount = frameCount;
        this.frameDuration = frameDuration;

        this.currentFrame = 0;
        this.elapsedTime = 0;
    }

    update(deltaTime) {
        // Accumulate time between frames
        this.elapsedTime += deltaTime;

        // Advance the animation frame
        while (this.elapsedTime >= this.frameDuration) {
            this.elapsedTime -= this.frameDuration;

            this.currentFrame =
                (this.currentFrame + 1) % this.frameCount;
        }
    }

    reset() {
        // Reset the animation to its initial state
        this.currentFrame = 0;
        this.elapsedTime = 0;
    }

    getFrame() {
        return this.currentFrame;
    }
}