export class DecorationLayer {
    constructor(mapData) {
        this.tileSize = mapData.tileSize;
        this.tiles = mapData.tiles;

        this.sprites = [
            this.loadImage(
                "assets/tilesets/forest/decorations/snowy-bush.png"
            ),
            this.loadImage(
                "assets/tilesets/forest/decorations/dry-branches.png"
            ),
            this.loadImage(
                "assets/tilesets/forest/decorations/small-stones.png"
            )
        ];

        this.decorations = this.generateDecorations();
    }

    loadImage(src) {
        if (typeof Image === "undefined") {
            return null;
        }

        const image = new Image();
        image.src = src;

        return image;
    }

    generateDecorations() {
        const decorations = [];

        for (let row = 0; row < this.tiles.length; row++) {
            for (
                let column = 0;
                column < this.tiles[row].length;
                column++
            ) {
                // Only place decorations on snow
                if (this.tiles[row][column] !== 0) {
                    continue;
                }

                // Generate consistent decoration placement
                const seed = (
                    Math.imul(column + 1, 374761393) ^
                    Math.imul(row + 1, 668265263)
                ) >>> 0;

                if (seed % 7 !== 0) {
                    continue;
                }

                decorations.push({
                    x: column * this.tileSize + 4,
                    y: row * this.tileSize + 8,
                    type: (seed >>> 8) % this.sprites.length,
                    width: 24,
                    height: 24
                });
            }
        }

        return decorations;
    }

    getRenderables() {
        return this.decorations.map(decoration => ({
            depth: decoration.y + decoration.height,
            draw: (ctx) => this.drawDecoration(ctx, decoration)
        }));
    }

    drawDecoration(ctx, decoration) {
        const image = this.sprites[decoration.type];

        // Skip unavailable sprites
        if (
            !image ||
            !image.complete ||
            image.naturalWidth === 0
        ) {
            return;
        }

        ctx.drawImage(
            image,
            decoration.x,
            decoration.y,
            decoration.width,
            decoration.height
        );
    }
}