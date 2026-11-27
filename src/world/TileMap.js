
export class TileMap {
    constructor(mapData) {
        this.tiles = mapData.tiles;
        this.tileSize = mapData.tileSize;
        this.spawnPoint = mapData.spawnPoint;

        this.rows = this.tiles.length;
        this.columns = this.tiles[0].length;

        this.width = this.columns * this.tileSize;
        this.height = this.rows * this.tileSize;

        // Load different pine tree sprites
        this.treeSprites = [
            {
                image: this.loadImage(
                    "assets/tilesets/forest/pine-small.png"
                ),
                width: 32,
                height: 48
            },
            {
                image: this.loadImage(
                    "assets/tilesets/forest/pine-medium.png"
                ),
                width: 48,
                height: 64
            },
            {
                image: this.loadImage(
                    "assets/tilesets/forest/pine-large.png"
                ),
                width: 64,
                height: 96
            }
        ];

        // Load rock sprite
        this.rockSprite = this.loadImage(
            "assets/tilesets/forest/rock.png"
        );
    }

    loadImage(src) {
        // Prevent image loading errors in Node.js tests
        if (typeof Image === "undefined") {
            return null;
        }

        const image = new Image();
        image.src = src;

        return image;
    }

    isImageLoaded(image) {
        return (
            image !== null &&
            image !== undefined &&
            image.complete &&
            image.naturalWidth > 0
        );
    }

    isWalkable(x, y) {
        // Convert pixel coordinates to tile coordinates
        const column = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        // Check map boundaries
        if (
            row < 0 ||
            column < 0 ||
            row >= this.rows ||
            column >= this.columns
        ) {
            return false;
        }

        const tile = this.tiles[row][column];

        return tile === 0 || tile === 2;
    }

    render(ctx) {
        // Disable smoothing to preserve pixel art
        ctx.imageSmoothingEnabled = false;

        // Render ground and paths first
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const tile = this.tiles[row][column];
                const x = column * this.tileSize;
                const y = row * this.tileSize;

                this.drawTile(ctx, tile, x, y);
            }
        }

        // Render environment objects above the ground
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const tile = this.tiles[row][column];
                const x = column * this.tileSize;
                const y = row * this.tileSize;

                if (tile === 1) {
                    this.drawPineTree(ctx, x, y);
                }

                if (tile === 3) {
                    this.drawRock(ctx, x, y);
                }
            }
        }
    }

    drawTile(ctx, tile, x, y) {
        const size = this.tileSize;

        // Draw snow-covered ground
        ctx.fillStyle = "#e1eaf0";
        ctx.fillRect(x, y, size, size);

        // Draw snowy path
        if (tile === 2) {
            ctx.fillStyle = "#b1bfcc";
            ctx.fillRect(x, y, size, size);
        }
    }

    drawPineTree(ctx, x, y) {
        // Convert pixel coordinates to tile coordinates
        const column = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        // Select a consistent tree variation
        const index =
            (column * 7 + row * 13) %
            this.treeSprites.length;

        const tree = this.treeSprites[index];

        // Check if the image is available and loaded
        if (!this.isImageLoaded(tree.image)) {
            this.drawFallbackTree(ctx, x, y);
            return;
        }

        // Center the tree horizontally
        const drawX = Math.round(
            x + (this.tileSize - tree.width) / 2
        );

        // Align the tree base with the tile
        const drawY = y + this.tileSize - tree.height;

        // Draw the tree sprite
        ctx.drawImage(
            tree.image,
            drawX,
            drawY,
            tree.width,
            tree.height
        );
    }

    drawRock(ctx, x, y) {
        const width = 32;
        const height = 32;

        // Draw fallback if the sprite is unavailable
        if (!this.isImageLoaded(this.rockSprite)) {
            ctx.fillStyle = "#778594";
            ctx.fillRect(x + 6, y + 12, 20, 14);
            return;
        }

        // Center the rock horizontally
        const drawX = Math.round(
            x + (this.tileSize - width) / 2
        );

        // Align the rock with the tile
        const drawY = y + this.tileSize - height;

        // Draw the rock sprite
        ctx.drawImage(
            this.rockSprite,
            drawX,
            drawY,
            width,
            height
        );
    }

    drawFallbackTree(ctx, x, y) {
        // Draw a temporary tree if the sprite is unavailable

        // Draw trunk
        ctx.fillStyle = "#59483d";
        ctx.fillRect(x + 13, y + 22, 6, 8);

        // Draw branches
        ctx.fillStyle = "#183830";
        ctx.fillRect(x + 14, y - 10, 4, 8);
        ctx.fillRect(x + 10, y - 2, 12, 8);
        ctx.fillRect(x + 6, y + 6, 20, 8);
        ctx.fillRect(x + 2, y + 14, 28, 12);

        // Draw snow
        ctx.fillStyle = "#f4f8fb";
        ctx.fillRect(x + 14, y - 10, 4, 3);
        ctx.fillRect(x + 10, y - 2, 10, 3);
        ctx.fillRect(x + 6, y + 6, 14, 3);
        ctx.fillRect(x + 2, y + 14, 20, 3);
    }
}
