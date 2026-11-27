export class Sprite {
    constructor(src, frameWidth = 64, frameHeight = 64) {
        this.image = new Image();
        this.image.src = src;

        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }

    draw(ctx, frame, x, y, width, height) {
        // Skip rendering until the image is loaded
        if (!this.image.complete || this.image.naturalWidth === 0) {
            return;
        }

        // Calculate the source frame position
        const sourceX = frame * this.frameWidth;

        // Preserve the pixel art appearance
        ctx.imageSmoothingEnabled = false;

        // Draw the selected sprite frame
        ctx.drawImage(
            this.image,
            sourceX,
            0,
            this.frameWidth,
            this.frameHeight,
            Math.round(x),
            Math.round(y),
            width,
            height
        );
    }
}