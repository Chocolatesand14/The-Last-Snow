
export class TileMap {
    constructor(mapData) {
        this.tiles = mapData.tiles;
        this.tileSize = mapData.tileSize;
        this.spawnPoint = mapData.spawnPoint;

        this.rows = this.tiles.length;
        this.columns = this.tiles[0].length;

        this.width = this.columns * this.tileSize;
        this.height = this.rows * this.tileSize;

        this.treeScale = 1.5;
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
        // Render ground, paths and rocks first
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const tile = this.tiles[row][column];
                const x = column * this.tileSize;
                const y = row * this.tileSize;

                this.drawTile(
                    ctx,
                    tile === 1 ? 0 : tile,
                    x,
                    y
                );
            }
        }

        // Render trees above the ground
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                if (this.tiles[row][column] === 1) {
                    const x = column * this.tileSize;
                    const y = row * this.tileSize;

                    this.drawPineTree(ctx, x, y);
                }
            }
        }
    }

    drawTile(ctx, tile, x, y) {
        const size = this.tileSize;

        // Draw snow-covered ground
        ctx.fillStyle = "#e1eaf0";
        ctx.fillRect(x, y, size, size);

        switch (tile) {
            case 2:
                // Draw snowy path
                ctx.fillStyle = "#b1bfcc";
                ctx.fillRect(x, y, size, size);
                break;

            case 3:
                // Draw rock
                ctx.fillStyle = "#778594";
                ctx.fillRect(x + 6, y + 12, 20, 14);
                break;
        }
    }

    drawPineTree(ctx, x, y) {
        // Draw shadow on the snow
        ctx.fillStyle = "#b6c8d6";
        ctx.fillRect(x + 6, y + 28, 20, 2);

        // Save the current canvas state
        ctx.save();

        // Scale the tree while keeping its base in place
        const offsetY = 30 * (this.treeScale - 1);

        ctx.translate(x, y - offsetY);
        ctx.scale(1, this.treeScale);

        x = 0;
        y = 0;

        // Draw tree trunk
        ctx.fillStyle = "#59483d";
        ctx.fillRect(x + 13, y + 22, 6, 8);

        // Draw trunk highlight
        ctx.fillStyle = "#886b50";
        ctx.fillRect(x + 13, y + 24, 2, 6);

        // Draw upper branches
        ctx.fillStyle = "#183830";
        ctx.fillRect(x + 14, y + 2, 4, 4);
        ctx.fillRect(x + 12, y + 6, 8, 4);
        ctx.fillRect(x + 10, y + 10, 12, 4);
        ctx.fillRect(x + 8, y + 14, 16, 2);

        // Draw middle branches
        ctx.fillStyle = "#284c46";
        ctx.fillRect(x + 10, y + 12, 12, 4);
        ctx.fillRect(x + 8, y + 16, 16, 4);

        // Draw lower branches
        ctx.fillStyle = "#183830";
        ctx.fillRect(x + 6, y + 20, 20, 4);
        ctx.fillRect(x + 4, y + 24, 24, 2);
        ctx.fillRect(x + 8, y + 26, 16, 2);

        // Draw branch highlights
        ctx.fillStyle = "#42675a";
        ctx.fillRect(x + 10, y + 18, 4, 2);
        ctx.fillRect(x + 18, y + 12, 4, 2);

        // Draw snow on the branches
        ctx.fillStyle = "#f4f8fb";
        ctx.fillRect(x + 14, y + 2, 4, 2);
        ctx.fillRect(x + 12, y + 6, 8, 2);
        ctx.fillRect(x + 10, y + 14, 12, 2);
        ctx.fillRect(x + 6, y + 22, 10, 2);

        // Draw snow shadows
        ctx.fillStyle = "#dbe8ef";
        ctx.fillRect(x + 10, y + 10, 10, 2);
        ctx.fillRect(x + 8, y + 16, 8, 2);
        ctx.fillRect(x + 16, y + 24, 10, 2);

        // Restore the original canvas state
        ctx.restore();
    }
}
