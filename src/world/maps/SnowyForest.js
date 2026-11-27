
const TILE_SIZE = 32;
const COLUMNS = 50;
const ROWS = 40;

const SNOW = 0;
const TREE = 1;
const PATH = 2;
const ROCK = 3;

const spawnColumn = 25;
const spawnRow = 20;

function generateForest() {
    // Create a snow-covered world
    const tiles = Array.from(
        { length: ROWS },
        () => Array(COLUMNS).fill(SNOW)
    );

    for (let row = 0; row < ROWS; row++) {
        for (let column = 0; column < COLUMNS; column++) {
            // Create a dense forest around the world boundaries
            const isBoundary =
                row === 0 ||
                column === 0 ||
                row === ROWS - 1 ||
                column === COLUMNS - 1;

            if (isBoundary) {
                tiles[row][column] = TREE;
                continue;
            }

            // Create a clearing around the player spawn point
            const distanceFromSpawn = Math.hypot(
                column - spawnColumn,
                row - spawnRow
            );

            if (distanceFromSpawn <= 5) {
                continue;
            }

            // Generate deterministic terrain variation
            const seed = (
                Math.imul(column + 1, 374761393) ^
                Math.imul(row + 1, 668265263)
            ) >>> 0;

            const variation = seed % 100;

            // Place trees and rocks throughout the forest
            if (variation < 28) {
                tiles[row][column] = TREE;
            } else if (variation < 33) {
                tiles[row][column] = ROCK;
            }
        }
    }

    // Create a connected path through the forest
    const pathPoints = [
        [25, 20],
        [29, 20],
        [29, 14],
        [24, 14],
        [24, 8],
        [33, 8],
        [33, 0]
    ];

    for (let i = 0; i < pathPoints.length - 1; i++) {
        let [column, row] = pathPoints[i];
        const [targetColumn, targetRow] = pathPoints[i + 1];

        // Connect horizontal path sections
        while (column !== targetColumn) {
            tiles[row][column] = PATH;
            column += Math.sign(targetColumn - column);
        }

        // Connect vertical path sections
        while (row !== targetRow) {
            tiles[row][column] = PATH;
            row += Math.sign(targetRow - row);
        }

        tiles[row][column] = PATH;
    }

    // Keep the player spawn point clear
    tiles[spawnRow][spawnColumn] = SNOW;

    return tiles;
}

export const SnowyForest = {
    name: "Snowy Forest",
    tileSize: TILE_SIZE,

    spawnPoint: {
        x: spawnColumn * TILE_SIZE,
        y: spawnRow * TILE_SIZE
    },

    tiles: generateForest()
};
