
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

import { DialogueBubble } from "../src/ui/DialogueBubble.js";

describe("DialogueBubble", () => {
    let dialogue;
    let ctx;
    let target;

    beforeEach(() => {
        dialogue = new DialogueBubble();

        // Create a controlled player target
        target = {
            x: 100,
            y: 200,
            width: 64,
            height: 64
        };

        // Mock the canvas rendering context
        ctx = {
            save: vi.fn(),
            restore: vi.fn(),
            setTransform: vi.fn(),
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            fillText: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),

            measureText: vi.fn(text => ({
                width: text.length * 8
            })),

            font: "",
            fillStyle: "",
            strokeStyle: "",
            textAlign: "left",
            textBaseline: "top",
            globalAlpha: 1,
            globalCompositeOperation: "source-over",
            imageSmoothingEnabled: true
        };
    });

    describe("Initialization", () => {
        it("should initialize without dialogue text", () => {
            expect(dialogue.text).toBe("");
        });

        it("should initialize as hidden", () => {
            expect(dialogue.isVisible).toBe(false);
        });

        it("should initialize with zero visible characters", () => {
            expect(dialogue.visibleCharacters).toBe(0);
        });

        it("should initialize with the default typing speed", () => {
            expect(dialogue.typingSpeed).toBe(20);
        });

        it("should initialize with the default hold duration", () => {
            expect(dialogue.holdDuration).toBe(2);
        });

        it("should initialize without a target", () => {
            expect(dialogue.target).toBeNull();
        });

        it("should initialize without an active typing animation", () => {
            expect(dialogue.isTyping).toBe(false);
        });

        it("should initialize with the correct background color", () => {
            expect(dialogue.backgroundColor)
                .toBe("#243345");
        });

        it("should initialize with the correct text color", () => {
            expect(dialogue.textColor)
                .toBe("#f2f7fc");
        });

        it("should initialize with the correct border color", () => {
            expect(dialogue.borderColor)
                .toBe("#d7e5ef");
        });

        it("should initialize with the pixel font", () => {
            expect(dialogue.font)
                .toBe('8px "Press Start 2P", monospace');
        });

        it("should initialize with the default padding", () => {
            expect(dialogue.padding).toBe(8);
        });

        it("should initialize with the default vertical offset", () => {
            expect(dialogue.offsetY).toBe(12);
        });

        it("should maintain independent dialogue instances", () => {
            const second = new DialogueBubble();

            dialogue.show("Where am I?");

            expect(second.text).toBe("");
            expect(second.isVisible).toBe(false);
        });
    });

    describe("Showing dialogue", () => {
        it("should display the first awakening dialogue", () => {
            dialogue.show("Where am I?");

            expect(dialogue.text).toBe("Where am I?");
            expect(dialogue.isVisible).toBe(true);
        });

        it("should display the second awakening dialogue", () => {
            dialogue.show("Who am I?");

            expect(dialogue.text).toBe("Who am I?");
        });

        it("should start the typewriter animation", () => {
            dialogue.show("Where am I?");

            expect(dialogue.isTyping).toBe(true);
        });

        it("should initially hide all characters", () => {
            dialogue.show("Where am I?");

            expect(dialogue.getVisibleText()).toBe("");
        });

        it("should replace existing dialogue", () => {
            dialogue.show("Where am I?");
            dialogue.show("Who am I?");

            expect(dialogue.text).toBe("Who am I?");
        });

        it("should reset typing progress for new dialogue", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.25);

            dialogue.show("Who am I?");

            expect(dialogue.visibleCharacters).toBe(0);
            expect(dialogue.getVisibleText()).toBe("");
        });

        it("should preserve the assigned target", () => {
            dialogue.setTarget(target);

            dialogue.show("Where am I?");
            dialogue.show("Who am I?");

            expect(dialogue.target).toBe(target);
        });

        it.each([
            "",
            "   ",
            null,
            undefined,
            123,
            {},
            []
        ])(
            "should ignore invalid dialogue text %s",
            text => {
                dialogue.show(text);

                expect(dialogue.isVisible).toBe(false);
                expect(dialogue.text).toBe("");
            }
        );
    });

    describe("Typewriter animation", () => {
        it("should reveal one character after 0.05 seconds", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.05);

            expect(dialogue.getVisibleText()).toBe("W");
        });

        it("should reveal five characters after 0.25 seconds", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.25);

            expect(dialogue.getVisibleText()).toBe("Where");
        });

        it("should reveal characters across multiple updates", () => {
            dialogue.show("Where am I?");

            dialogue.update(0.1);
            dialogue.update(0.15);

            expect(dialogue.getVisibleText()).toBe("Where");
        });

        it("should preserve spaces in the dialogue", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.3);

            expect(dialogue.getVisibleText()).toBe("Where ");
        });

        it("should reveal the complete dialogue", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.55);

            expect(dialogue.getVisibleText())
                .toBe("Where am I?");
        });

        it("should stop typing when all characters are visible", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.55);

            expect(dialogue.isTyping).toBe(false);
        });

        it("should never exceed the text length", () => {
            dialogue.show("Who am I?");
            dialogue.update(1);

            expect(dialogue.visibleCharacters)
                .toBe(dialogue.text.length);
        });

        it("should reveal the second dialogue correctly", () => {
            dialogue.show("Who am I?");
            dialogue.update(0.15);

            expect(dialogue.getVisibleText()).toBe("Who");
        });

        it("should support an instant typing animation skip", () => {
            dialogue.show("Where am I?");
            dialogue.skipTyping();

            expect(dialogue.getVisibleText())
                .toBe("Where am I?");

            expect(dialogue.isTyping).toBe(false);
            expect(dialogue.isVisible).toBe(true);
        });

        it("should ignore typing skips when hidden", () => {
            dialogue.skipTyping();

            expect(dialogue.isVisible).toBe(false);
            expect(dialogue.visibleCharacters).toBe(0);
        });
    });

    describe("Typing speed configuration", () => {
        it("should support a custom typing speed", () => {
            dialogue.setTypingSpeed(10);

            expect(dialogue.typingSpeed).toBe(10);
        });

        it("should use the configured typing speed", () => {
            dialogue.setTypingSpeed(10);
            dialogue.show("Where am I?");
            dialogue.update(0.5);

            expect(dialogue.getVisibleText()).toBe("Where");
        });

        it.each([
            0,
            -1,
            NaN,
            Infinity,
            -Infinity,
            undefined,
            null,
            "20"
        ])(
            "should reject invalid typing speed %s",
            speed => {
                dialogue.setTypingSpeed(speed);

                expect(dialogue.typingSpeed).toBe(20);
            }
        );
    });

    describe("Dialogue duration", () => {
        it("should remain visible while typing", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.25);

            expect(dialogue.isVisible).toBe(true);
        });

        it("should remain visible after typing finishes", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.55);

            expect(dialogue.isVisible).toBe(true);
        });

        it("should remain visible during the hold duration", () => {
            dialogue.show("Where am I?");
            dialogue.skipTyping();
            dialogue.update(1);

            expect(dialogue.isVisible).toBe(true);
        });

        it("should hide when the hold duration expires", () => {
            dialogue.show("Where am I?");
            dialogue.skipTyping();
            dialogue.update(2);

            expect(dialogue.isVisible).toBe(false);
        });

        it("should support a custom hold duration", () => {
            dialogue.setHoldDuration(3);

            dialogue.show("Who am I?");
            dialogue.skipTyping();
            dialogue.update(2);

            expect(dialogue.isVisible).toBe(true);

            dialogue.update(1);

            expect(dialogue.isVisible).toBe(false);
        });

        it("should account for remaining time after typing completes", () => {
            dialogue.show("Where am I?");

            // Typing takes 0.55 seconds followed by a 2 second hold
            dialogue.update(3);

            expect(dialogue.isVisible).toBe(false);
        });

        it("should reset the hold timer for new dialogue", () => {
            dialogue.show("Where am I?");
            dialogue.skipTyping();
            dialogue.update(1.5);

            dialogue.show("Who am I?");
            dialogue.skipTyping();
            dialogue.update(1);

            expect(dialogue.isVisible).toBe(true);
        });

        it.each([
            -1,
            NaN,
            Infinity,
            -Infinity,
            undefined,
            null,
            "2"
        ])(
            "should reject invalid hold duration %s",
            duration => {
                dialogue.setHoldDuration(duration);

                expect(dialogue.holdDuration).toBe(2);
            }
        );
    });

    describe("Target positioning", () => {
        it("should attach dialogue to a player", () => {
            dialogue.setTarget(target);

            expect(dialogue.target).toBe(target);
        });

        it("should center dialogue above the player", () => {
            dialogue.setTarget(target);

            expect(dialogue.getPosition()).toEqual({
                x: 132,
                y: 188
            });
        });

        it("should follow horizontal player movement", () => {
            dialogue.setTarget(target);
            target.x = 150;

            expect(dialogue.getPosition().x).toBe(182);
        });

        it("should follow vertical player movement", () => {
            dialogue.setTarget(target);
            target.y = 250;

            expect(dialogue.getPosition().y).toBe(238);
        });

        it("should respect custom player dimensions", () => {
            dialogue.setTarget({
                x: 100,
                y: 200,
                width: 32,
                height: 48
            });

            expect(dialogue.getPosition()).toEqual({
                x: 116,
                y: 188
            });
        });

        it("should return null without a target", () => {
            expect(dialogue.getPosition()).toBeNull();
        });

        it("should support detaching the target", () => {
            dialogue.setTarget(target);
            dialogue.setTarget(null);

            expect(dialogue.target).toBeNull();
        });

        it.each([
            {},
            { x: NaN, y: 200, width: 64, height: 64 },
            { x: 100, y: Infinity, width: 64, height: 64 },
            { x: 100, y: 200, width: 0, height: 64 },
            { x: 100, y: 200, width: 64, height: -1 }
        ])(
            "should reject invalid dialogue targets",
            invalidTarget => {
                dialogue.setTarget(invalidTarget);

                expect(dialogue.target).toBeNull();
            }
        );
    });

    describe("Camera integration", () => {
        it("should convert world coordinates to screen coordinates", () => {
            dialogue.setTarget(target);

            const camera = {
                x: 50,
                y: 100
            };

            expect(dialogue.getPosition(camera)).toEqual({
                x: 82,
                y: 88
            });
        });

        it("should respect camera movement", () => {
            dialogue.setTarget(target);

            const camera = {
                x: 80,
                y: 150
            };

            expect(dialogue.getPosition(camera)).toEqual({
                x: 52,
                y: 38
            });
        });

        it("should use rounded camera coordinates", () => {
            dialogue.setTarget(target);

            expect(
                dialogue.getPosition({
                    x: 50.6,
                    y: 100.4
                })
            ).toEqual({
                x: 81,
                y: 88
            });
        });

        it("should not modify world coordinates", () => {
            dialogue.setTarget(target);

            dialogue.getPosition({
                x: 50,
                y: 100
            });

            expect(target.x).toBe(100);
            expect(target.y).toBe(200);
        });
    });

    describe("Delta time handling", () => {
        it.each([
            0,
            -1,
            NaN,
            Infinity,
            -Infinity,
            undefined,
            null,
            "1"
        ])(
            "should ignore invalid delta time %s",
            deltaTime => {
                dialogue.show("Where am I?");
                dialogue.update(deltaTime);

                expect(dialogue.visibleCharacters).toBe(0);
            }
        );

        it("should ignore updates while hidden", () => {
            dialogue.update(10);

            expect(dialogue.visibleCharacters).toBe(0);
            expect(dialogue.isVisible).toBe(false);
        });
    });

    describe("Hiding dialogue", () => {
        it("should hide visible dialogue", () => {
            dialogue.show("Where am I?");
            dialogue.hide();

            expect(dialogue.isVisible).toBe(false);
        });

        it("should stop the typing animation", () => {
            dialogue.show("Where am I?");
            dialogue.hide();

            expect(dialogue.isTyping).toBe(false);
        });

        it("should support repeated hide calls", () => {
            dialogue.hide();
            dialogue.hide();

            expect(dialogue.isVisible).toBe(false);
        });

        it("should support showing new dialogue after hiding", () => {
            dialogue.show("Where am I?");
            dialogue.hide();

            dialogue.show("Who am I?");

            expect(dialogue.isVisible).toBe(true);
            expect(dialogue.text).toBe("Who am I?");
        });
    });

    describe("Reset", () => {
        it("should clear the dialogue text", () => {
            dialogue.show("Where am I?");
            dialogue.reset();

            expect(dialogue.text).toBe("");
        });

        it("should reset visible characters", () => {
            dialogue.show("Where am I?");
            dialogue.skipTyping();
            dialogue.reset();

            expect(dialogue.visibleCharacters).toBe(0);
        });

        it("should hide the dialogue", () => {
            dialogue.show("Where am I?");
            dialogue.reset();

            expect(dialogue.isVisible).toBe(false);
        });

        it("should preserve the assigned target", () => {
            dialogue.setTarget(target);
            dialogue.reset();

            expect(dialogue.target).toBe(target);
        });

        it("should preserve custom dialogue settings", () => {
            dialogue.setTypingSpeed(10);
            dialogue.setHoldDuration(3);

            dialogue.reset();

            expect(dialogue.typingSpeed).toBe(10);
            expect(dialogue.holdDuration).toBe(3);
        });
    });

    describe("Rendering", () => {
        beforeEach(() => {
            dialogue.setTarget(target);
        });

        it("should not render hidden dialogue", () => {
            dialogue.draw(ctx);

            expect(ctx.fillRect)
                .not.toHaveBeenCalled();

            expect(ctx.fillText)
                .not.toHaveBeenCalled();
        });

        it("should not render dialogue without a target", () => {
            dialogue.setTarget(null);
            dialogue.show("Where am I?");
            dialogue.draw(ctx);

            expect(ctx.fillRect)
                .not.toHaveBeenCalled();
        });

        it("should render the dialogue background", () => {
            dialogue.show("Where am I?");
            dialogue.draw(ctx);

            expect(ctx.fillRect).toHaveBeenCalled();
        });

        it("should render the dialogue border", () => {
            dialogue.show("Where am I?");
            dialogue.draw(ctx);

            expect(ctx.strokeRect).toHaveBeenCalled();
        });

        it("should render only currently visible characters", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.25);

            dialogue.draw(ctx);

            expect(ctx.fillText).toHaveBeenCalledWith(
                "Where",
                expect.any(Number),
                expect.any(Number)
            );
        });

        it("should render the complete first dialogue", () => {
            dialogue.show("Where am I?");
            dialogue.skipTyping();
            dialogue.draw(ctx);

            expect(ctx.fillText).toHaveBeenCalledWith(
                "Where am I?",
                expect.any(Number),
                expect.any(Number)
            );
        });

        it("should render the complete second dialogue", () => {
            dialogue.show("Who am I?");
            dialogue.skipTyping();
            dialogue.draw(ctx);

            expect(ctx.fillText).toHaveBeenCalledWith(
                "Who am I?",
                expect.any(Number),
                expect.any(Number)
            );
        });

        it("should measure the full text to prevent resizing", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.1);

            dialogue.draw(ctx);

            expect(ctx.measureText)
                .toHaveBeenCalledWith("Where am I?");
        });

        it("should preserve the background dimensions while typing", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.1);
            dialogue.draw(ctx);

            const initialBounds = ctx.fillRect.mock.calls[0];

            ctx.fillRect.mockClear();

            dialogue.update(0.25);
            dialogue.draw(ctx);

            expect(ctx.fillRect.mock.calls[0])
                .toEqual(initialBounds);
        });

        it("should use the configured pixel font", () => {
            dialogue.show("Where am I?");
            dialogue.draw(ctx);

            expect(ctx.font).toBe(dialogue.font);
        });

        it("should disable image smoothing", () => {
            dialogue.show("Where am I?");
            dialogue.draw(ctx);

            expect(ctx.imageSmoothingEnabled).toBe(false);
        });

        it("should render the bubble pointer", () => {
            dialogue.show("Where am I?");
            dialogue.draw(ctx);

            expect(ctx.beginPath).toHaveBeenCalled();
            expect(ctx.moveTo).toHaveBeenCalled();
            expect(ctx.lineTo).toHaveBeenCalled();
            expect(ctx.closePath).toHaveBeenCalled();
            expect(ctx.fill).toHaveBeenCalled();
        });

        it("should render in screen coordinates", () => {
            dialogue.show("Where am I?");
            dialogue.draw(ctx, { x: 50, y: 100 });

            expect(ctx.setTransform)
                .toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
        });

        it("should preserve the canvas rendering state", () => {
            dialogue.show("Where am I?");
            dialogue.draw(ctx);

            expect(ctx.save).toHaveBeenCalledTimes(1);
            expect(ctx.restore).toHaveBeenCalledTimes(1);
        });

        it("should not advance typing progress during rendering", () => {
            dialogue.show("Where am I?");
            dialogue.update(0.25);

            dialogue.draw(ctx);
            dialogue.draw(ctx);

            expect(dialogue.getVisibleText()).toBe("Where");
        });
    });
});
