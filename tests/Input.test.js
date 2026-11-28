
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

import { Input } from "../src/core/Input.js";

describe("Input", () => {
    let input;
    let listeners;
    let mockWindow;

    beforeEach(() => {
        listeners = {};

        // Mock browser event registration
        mockWindow = {
            addEventListener: vi.fn((event, callback) => {
                listeners[event] = callback;
            })
        };

        // Provide a browser window in the Node.js environment
        vi.stubGlobal("window", mockWindow);

        input = new Input();
    });

    afterEach(() => {
        // Restore the original global environment
        vi.unstubAllGlobals();
    });

    // Simulate a keyboard event
    function pressKey(key) {
        listeners.keydown({ key });
    }

    // Simulate a keyboard release event
    function releaseKey(key) {
        listeners.keyup({ key });
    }

    // Simulate the window losing focus
    function loseFocus() {
        listeners.blur();
    }

    describe("Initialization", () => {
        it("should initialize an empty key collection", () => {
            expect(input.keys).toBeInstanceOf(Set);
            expect(input.keys.size).toBe(0);
        });

        it("should register a keydown event listener", () => {
            expect(mockWindow.addEventListener)
                .toHaveBeenCalledWith(
                    "keydown",
                    expect.any(Function)
                );
        });

        it("should register a keyup event listener", () => {
            expect(mockWindow.addEventListener)
                .toHaveBeenCalledWith(
                    "keyup",
                    expect.any(Function)
                );
        });

        it("should register a blur event listener", () => {
            expect(mockWindow.addEventListener)
                .toHaveBeenCalledWith(
                    "blur",
                    expect.any(Function)
                );
        });

        it("should register exactly three event listeners", () => {
            expect(mockWindow.addEventListener)
                .toHaveBeenCalledTimes(3);
        });

        it("should initialize without pressed keys", () => {
            expect(input.isPressed("w")).toBe(false);
        });

        it("should maintain independent input instances", () => {
            pressKey("w");

            const secondInput = new Input();

            expect(input.isPressed("w")).toBe(true);
            expect(secondInput.isPressed("w")).toBe(false);
            expect(secondInput.keys).not.toBe(input.keys);
        });
    });

    describe("Keyboard input", () => {
        it("should register a pressed key", () => {
            pressKey("w");

            expect(input.isPressed("w")).toBe(true);
        });

        it.each([
            "w",
            "a",
            "s",
            "d",
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight"
        ])(
            "should support movement key %s",
            (key) => {
                pressKey(key);

                expect(input.isPressed(key)).toBe(true);
            }
        );

        it("should support multiple simultaneous keys", () => {
            pressKey("w");
            pressKey("d");

            expect(input.isPressed("w")).toBe(true);
            expect(input.isPressed("d")).toBe(true);
            expect(input.keys.size).toBe(2);
        });

        it("should support diagonal movement input", () => {
            pressKey("ArrowUp");
            pressKey("ArrowRight");

            expect(input.isPressed("ArrowUp")).toBe(true);
            expect(input.isPressed("ArrowRight")).toBe(true);
        });

        it("should not duplicate repeated key presses", () => {
            pressKey("w");
            pressKey("w");
            pressKey("w");

            expect(input.keys.size).toBe(1);
        });

        it("should preserve previously pressed keys", () => {
            pressKey("w");
            pressKey("a");
            pressKey("s");

            expect(input.isPressed("w")).toBe(true);
            expect(input.isPressed("a")).toBe(true);
            expect(input.isPressed("s")).toBe(true);
        });

        it("should return false for an unpressed key", () => {
            pressKey("w");

            expect(input.isPressed("s")).toBe(false);
        });

        it.each([
            " ",
            "Enter",
            "Escape",
            "Shift",
            "Control",
            "Tab",
            "1"
        ])(
            "should support additional keyboard input %s",
            (key) => {
                pressKey(key);

                expect(input.isPressed(key)).toBe(true);
            }
        );
    });

    describe("Key release", () => {
        it("should remove a released key", () => {
            pressKey("w");
            releaseKey("w");

            expect(input.isPressed("w")).toBe(false);
            expect(input.keys.size).toBe(0);
        });

        it("should preserve other pressed keys", () => {
            pressKey("w");
            pressKey("d");

            releaseKey("w");

            expect(input.isPressed("w")).toBe(false);
            expect(input.isPressed("d")).toBe(true);
        });

        it("should support releasing an unpressed key", () => {
            expect(() => releaseKey("w")).not.toThrow();

            expect(input.keys.size).toBe(0);
        });

        it("should support repeated key releases", () => {
            pressKey("w");

            releaseKey("w");
            releaseKey("w");

            expect(input.isPressed("w")).toBe(false);
        });

        it("should allow a released key to be pressed again", () => {
            pressKey("w");
            releaseKey("w");
            pressKey("w");

            expect(input.isPressed("w")).toBe(true);
        });

        it("should clear the collection when all keys are released", () => {
            pressKey("w");
            pressKey("a");
            pressKey("d");

            releaseKey("w");
            releaseKey("a");
            releaseKey("d");

            expect(input.keys.size).toBe(0);
        });
    });

    describe("Case-insensitive keyboard input", () => {
        it("should normalize uppercase key presses", () => {
            pressKey("W");

            expect(input.keys.has("w")).toBe(true);
            expect(input.keys.has("W")).toBe(false);
        });

        it("should recognize uppercase input queries", () => {
            pressKey("w");

            expect(input.isPressed("W")).toBe(true);
        });

        it("should recognize lowercase input queries", () => {
            pressKey("W");

            expect(input.isPressed("w")).toBe(true);
        });

        it("should release uppercase keys using lowercase input", () => {
            pressKey("W");
            releaseKey("w");

            expect(input.isPressed("w")).toBe(false);
        });

        it("should release lowercase keys using uppercase input", () => {
            pressKey("w");
            releaseKey("W");

            expect(input.isPressed("w")).toBe(false);
        });

        it("should not duplicate uppercase and lowercase keys", () => {
            pressKey("w");
            pressKey("W");

            expect(input.keys.size).toBe(1);
        });

        it("should normalize mixed-case arrow keys", () => {
            pressKey("ArrowUp");

            expect(input.isPressed("arrowup")).toBe(true);
            expect(input.isPressed("ARROWUP")).toBe(true);
        });

        it("should release normalized arrow keys", () => {
            pressKey("ArrowRight");
            releaseKey("ARROWRIGHT");

            expect(input.isPressed("arrowright")).toBe(false);
        });
    });

    describe("Window focus handling", () => {
        it("should clear pressed keys when the window loses focus", () => {
            pressKey("w");
            pressKey("a");
            pressKey("d");

            loseFocus();

            expect(input.keys.size).toBe(0);
        });

        it("should reset all movement input when focus is lost", () => {
            pressKey("ArrowUp");
            pressKey("ArrowRight");

            loseFocus();

            expect(input.isPressed("ArrowUp")).toBe(false);
            expect(input.isPressed("ArrowRight")).toBe(false);
        });

        it("should support losing focus without pressed keys", () => {
            expect(() => loseFocus()).not.toThrow();

            expect(input.keys.size).toBe(0);
        });

        it("should support repeated focus loss", () => {
            pressKey("w");

            loseFocus();
            loseFocus();

            expect(input.keys.size).toBe(0);
        });

        it("should accept new input after losing focus", () => {
            pressKey("w");

            loseFocus();

            pressKey("d");

            expect(input.isPressed("w")).toBe(false);
            expect(input.isPressed("d")).toBe(true);
        });

        it("should prevent stale input after switching tabs", () => {
            pressKey("w");
            pressKey("d");

            loseFocus();

            releaseKey("w");

            expect(input.isPressed("w")).toBe(false);
            expect(input.isPressed("d")).toBe(false);
        });
    });

    describe("Input state queries", () => {
        it("should not modify pressed keys when checking input", () => {
            pressKey("w");

            const originalKeys = [...input.keys];

            input.isPressed("w");
            input.isPressed("a");

            expect([...input.keys]).toEqual(originalKeys);
        });

        it("should return a boolean for pressed keys", () => {
            pressKey("w");

            expect(typeof input.isPressed("w"))
                .toBe("boolean");
        });

        it("should return a boolean for unpressed keys", () => {
            expect(typeof input.isPressed("w"))
                .toBe("boolean");
        });

        it("should return consistent results across repeated queries", () => {
            pressKey("w");

            expect(input.isPressed("w")).toBe(true);
            expect(input.isPressed("w")).toBe(true);
            expect(input.isPressed("w")).toBe(true);
        });
    });
});
