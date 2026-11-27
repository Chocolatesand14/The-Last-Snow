export class TileMap {
    constructor(mapData) {
        this.tiles = mapData.tiles;
        this.tileSize = mapData.tileSize;

        this.rows = this.tiles.length;
        this.columns = this.tiles[0].length;

        this.width = this.columns * this.tileSize;
        this.height = this.rows * this.tileSize;
    }

    isWalkable(x, y) {
        const column = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        // Prevent movement outside the map
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
        const colors = {
            0: "#e1eaf0",
            1: "#284c46",
            2: "#aab7bf",
            3: "#677581"
        };

        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const tile = this.tiles[row][column];

                ctx.fillStyle = colors[tile];

                ctx.fillRect(
                    column * this.tileSize,
                    row * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }
    }
}