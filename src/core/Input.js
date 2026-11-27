export class Input {
    constructor() {
        this.keys = new Set();

        // Register pressed keys
        window.addEventListener("keydown", (event) => {
            this.keys.add(event.key.toLowerCase());
        });

        // Remove released keys
        window.addEventListener("keyup", (event) => {
            this.keys.delete(event.key.toLowerCase());
        });

        // Reset input when the window loses focus
        window.addEventListener("blur", () => {
            this.keys.clear();
        });
    }

    isPressed(key) {
        return this.keys.has(key.toLowerCase());
    }
}