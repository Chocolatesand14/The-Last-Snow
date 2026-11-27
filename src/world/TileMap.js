import { DecorationLayer } from "./DecorationLayer.js";

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

        // Create the environment decoration layer
        this.decorationLayer = new DecorationLayer(mapData);
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
        // Reject invalid coordinates
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return false;
        }

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

        // Only snow and paths are walkable
        return tile === 0 || tile === 2;
    }

    canMoveTo(x, y, width, height) {
        // Prevent the player from leaving the world
        if (
            x < 0 ||
            y < 0 ||
            x + width > this.width ||
            y + height > this.height
        ) {
            return false;
        }

        // Create a collision box around the player's feet
        const collisionWidth = width / 2;
        const collisionHeight = height / 3;

        const left = x + (width - collisionWidth) / 2;
        const right = left + collisionWidth - 1;

        const top = y + height - collisionHeight;
        const bottom = y + height - 1;

        // Check every tile covered by the collision box
        const startColumn = Math.floor(left / this.tileSize);
        const endColumn = Math.floor(right / this.tileSize);
        const startRow = Math.floor(top / this.tileSize);
        const endRow = Math.floor(bottom / this.tileSize);

        for (let row = startRow; row <= endRow; row++) {
            for (
                let column = startColumn;
                column <= endColumn;
                column++
            ) {
                if (!this.isWalkable(
                    column * this.tileSize,
                    row * this.tileSize
                )) {
                    return false;
                }
            }
        }

        return true;
    }

    isPath(column, row) {
        // Check whether a neighboring tile is a path
        return this.tiles[row]?.[column] === 2;
    }

    renderGround(ctx) {
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
    }

    getRenderables() {
        const renderables = [];

        // Collect environment objects for depth sorting
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const tile = this.tiles[row][column];
                const x = column * this.tileSize;
                const y = row * this.tileSize;
                const depth = y + this.tileSize;

                if (tile === 1) {
                    renderables.push({
                        depth,
                        draw: (ctx) => this.drawPineTree(ctx, x, y)
                    });
                }

                if (tile === 3) {
                    renderables.push({
                        depth,
                        draw: (ctx) => this.drawRock(ctx, x, y)
                    });
                }
            }
        }

        return [
            ...renderables,
            ...this.decorationLayer.getRenderables()
        ];
    }

    render(ctx) {
        // Render the complete world without the player
        this.renderGround(ctx);

        const renderables = this.getRenderables();
        renderables.sort((a, b) => a.depth - b.depth);

        for (const object of renderables) {
            object.draw(ctx);
        }
    }

    drawTile(ctx, tile, x, y) {
        // Draw textured snow-covered ground
        this.drawSnow(ctx, x, y);

        // Draw connected snowy paths
        if (tile === 2) {
            this.drawPath(ctx, x, y);
        }
    }

    drawSnow(ctx, x, y) {
        const size = this.tileSize;

        // Draw the base snow color
        ctx.fillStyle = "#e1eaf0";
        ctx.fillRect(x, y, size, size);

        // Add deterministic pixel-based snow details
        for (let py = 0; py < size; py += 2) {
            for (let px = 0; px < size; px += 2) {
                const noise = (
                    Math.imul(x + px + 1, 374761393) ^
                    Math.imul(y + py + 1, 668265263)
                ) >>> 0;

                if (noise % 29 === 0) {
                    ctx.fillStyle = "#f4f8fc";
                } else if (noise % 37 === 0) {
                    ctx.fillStyle = "#cbdbe6";
                } else if (noise % 43 === 0) {
                    ctx.fillStyle = "#d4e2eb";
                } else {
                    continue;
                }

                ctx.fillRect(x + px, y + py, 2, 2);
            }
        }

        // Add occasional small snowdrifts
        const column = Math.floor(x / size);
        const row = Math.floor(y / size);

        if ((column * 17 + row * 31) % 7 === 0) {
            // Draw snowdrift shadows
            ctx.fillStyle = "#c6d7e4";
            ctx.fillRect(x + 6, y + 22, 18, 3);
            ctx.fillRect(x + 10, y + 25, 10, 2);

            // Draw snowdrift highlights
            ctx.fillStyle = "#f3f8fc";
            ctx.fillRect(x + 10, y + 17, 10, 3);
            ctx.fillRect(x + 6, y + 20, 18, 2);
        }
    }

    drawPath(ctx, x, y) {
        const size = this.tileSize;
        const center = size / 2;

        const column = Math.floor(x / size);
        const row = Math.floor(y / size);

        // Check connected path tiles
        const top =
            row === 0 || this.isPath(column, row - 1);

        const bottom =
            this.isPath(column, row + 1);

        const left =
            this.isPath(column - 1, row);

        const right =
            this.isPath(column + 1, row);

        // Render the path using small pixel blocks
        for (let py = 0; py < size; py += 2) {
            for (let px = 0; px < size; px += 2) {
                const dx = Math.abs(px + 1 - center);
                const dy = Math.abs(py + 1 - center);

                let distance = Math.hypot(dx, dy);

                // Connect the path to neighboring tiles
                if (top && py < center) {
                    distance = Math.min(distance, dx);
                }

                if (bottom && py >= center) {
                    distance = Math.min(distance, dx);
                }

                if (left && px < center) {
                    distance = Math.min(distance, dy);
                }

                if (right && px >= center) {
                    distance = Math.min(distance, dy);
                }

                // Generate consistent pixel variation
                const noise =
                    ((x + px) * 13 + (y + py) * 7) % 17;

                // Draw compacted snow
                if (distance <= 9) {
                    ctx.fillStyle = noise < 3
                        ? "#bacbda"
                        : "#b0c2d2";
                }

                // Draw soft snowy edges
                else if (distance <= 11) {
                    ctx.fillStyle = "#c5d4e0";
                }

                // Draw irregular outer snow pixels
                else if (distance <= 13 + noise % 2) {
                    ctx.fillStyle = "#d4e0e9";
                }

                else {
                    continue;
                }

                ctx.fillRect(x + px, y + py, 2, 2);
            }
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
