
export class TileMap {
    constructor(mapData) {
        this.tiles = mapData.tiles;
        this.tileSize = mapData.tileSize;
        this.spawnPoint = mapData.spawnPoint;

        this.rows = this.tiles.length;
        this.columns = this.tiles[0].length;

        this.width = this.columns * this.tileSize;
        this.height = this.rows * this.tileSize;
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
        // Render every tile in the map
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const tile = this.tiles[row][column];
                const x = column * this.tileSize;
                const y = row * this.tileSize;

                this.drawTile(ctx, tile, x, y);
            }
        }
    }

    drawTile(ctx, tile, x, y) {
        const size = this.tileSize;

        // Draw snow-covered ground
        ctx.fillStyle = "#e1eaf0";
        ctx.fillRect(x, y, size, size);

        switch (tile) {
            case 1:
                // Draw pine tree
                ctx.fillStyle = "#59483d";
                ctx.fillRect(x + 13, y + 20, 6, 12);

                ctx.fillStyle = "#284c46";
                ctx.beginPath();
                ctx.moveTo(x + 16, y + 2);
                ctx.lineTo(x + 2, y + 26);
                ctx.lineTo(x + 30, y + 26);
                ctx.closePath();
                ctx.fill();
                break;

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
}
