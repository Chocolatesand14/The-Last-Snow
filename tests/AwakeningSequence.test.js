
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

import { AwakeningSequence } from "../src/cutscenes/AwakeningSequence.js";
import { ScreenFade } from "../src/effects/ScreenFade.js";
import { DialogueBubble } from "../src/ui/DialogueBubble.js";
import { EmotionIndicator } from "../src/ui/EmotionIndicator.js";

describe("AwakeningSequence", () => {
    let sequence;
    let player;
    let screenFade;
    let dialogueBubble;
    let emotionIndicator;

    beforeEach(() => {
        // Create a controlled player target
        player = {
            x: 800,
            y: 640,
            width: 64,
            height: 64,
            direction: "down",
            isMoving: false
        };

        // Initialize the actual cutscene components
        screenFade = new ScreenFade();
        dialogueBubble = new DialogueBubble();
        emotionIndicator = new EmotionIndicator();

        sequence = new AwakeningSequence({
            player,
            screenFade,
            dialogueBubble,
            emotionIndicator
        });
    });

    describe("Initialization", () => {
        it("should initialize in the idle state", () => {
            expect(sequence.state).toBe("idle");
        });

        it("should initialize as inactive", () => {
            expect(sequence.isActive).toBe(false);
        });

        it("should initialize as incomplete", () => {
            expect(sequence.isComplete).toBe(false);
        });

        it("should initialize with zero elapsed time", () => {
            expect(sequence.elapsedTime).toBe(0);
        });

        it("should configure a sixteen-second sequence", () => {
            expect(sequence.duration).toBe(16);
        });

        it("should attach dialogue to the player", () => {
            expect(dialogueBubble.target).toBe(player);
        });

        it("should attach emotion indicators to the player", () => {
            expect(emotionIndicator.target).toBe(player);
        });

        it("should not lock input before the sequence starts", () => {
            expect(sequence.isInputLocked).toBe(false);
        });
    });

    describe("Starting the awakening", () => {
        it("should activate the sequence", () => {
            sequence.start();

            expect(sequence.isActive).toBe(true);
        });

        it("should enter the fading-in state", () => {
            sequence.start();

            expect(sequence.state).toBe("fadingIn");
        });

        it("should begin with a completely black screen", () => {
            sequence.start();

            expect(screenFade.opacity).toBe(1);
        });

        it("should configure a two-second screen fade", () => {
            sequence.start();

            expect(screenFade.duration).toBe(2);
            expect(screenFade.targetOpacity).toBe(0);
        });

        it("should lock player input", () => {
            sequence.start();

            expect(sequence.isInputLocked).toBe(true);
        });

        it("should hide previous dialogue", () => {
            dialogueBubble.show("Previous dialogue");

            sequence.start();

            expect(dialogueBubble.isVisible).toBe(false);
        });

        it("should hide previous emotion indicators", () => {
            emotionIndicator.show("confused");

            sequence.start();

            expect(emotionIndicator.isVisible).toBe(false);
        });

        it("should not restart an already active sequence", () => {
            sequence.start();
            sequence.update(3);

            sequence.start();

            expect(sequence.elapsedTime).toBe(3);
            expect(sequence.state).toBe("sleeping");
        });
    });

    describe("Screen fade integration", () => {
        it("should gradually reveal the game world", () => {
            sequence.start();
            sequence.update(1);

            expect(screenFade.opacity).toBeCloseTo(0.5);
        });

        it("should complete the fade after two seconds", () => {
            sequence.start();
            sequence.update(2);

            expect(screenFade.opacity).toBe(0);
            expect(screenFade.isTransitioning).toBe(false);
        });
    });

    describe("Sleeping state", () => {
        it("should enter the sleeping state after fading in", () => {
            sequence.start();
            sequence.update(2);

            expect(sequence.state).toBe("sleeping");
        });

        it("should display the sleeping indicator", () => {
            sequence.start();
            sequence.update(2);

            expect(emotionIndicator.emotion).toBe("sleeping");
            expect(emotionIndicator.getSymbol()).toBe("Zzz");
            expect(emotionIndicator.isVisible).toBe(true);
        });

        it("should animate the sleeping indicator", () => {
            sequence.start();
            sequence.update(2);

            const initialOffset =
                emotionIndicator.getAnimationOffset();

            sequence.update(0.5);

            expect(emotionIndicator.getAnimationOffset().y)
                .toBeLessThan(initialOffset.y);
        });

        it("should keep the player stationary while sleeping", () => {
            sequence.start();
            sequence.update(4);

            expect(player.x).toBe(800);
            expect(player.y).toBe(640);
            expect(sequence.isInputLocked).toBe(true);
        });
    });

    describe("Surprised state", () => {
        it("should wake the player after five seconds", () => {
            sequence.start();
            sequence.update(5);

            expect(sequence.state).toBe("surprised");
        });

        it("should replace Zzz with an exclamation mark", () => {
            sequence.start();
            sequence.update(5);

            expect(emotionIndicator.emotion)
                .toBe("surprised");

            expect(emotionIndicator.getSymbol()).toBe("!");
        });

        it("should animate the surprised indicator", () => {
            sequence.start();
            sequence.update(5);
            sequence.update(0.25);

            expect(emotionIndicator.getAnimationOffset().y)
                .toBeLessThan(0);
        });
    });

    describe("Looking around", () => {
        it("should look left after six seconds", () => {
            sequence.start();
            sequence.update(6);

            expect(sequence.state).toBe("lookingLeft");
            expect(player.direction).toBe("left");
        });

        it("should look right after seven seconds", () => {
            sequence.start();
            sequence.update(7);

            expect(sequence.state).toBe("lookingRight");
            expect(player.direction).toBe("right");
        });

        it("should display confusion while looking around", () => {
            sequence.start();
            sequence.update(6);

            expect(emotionIndicator.getSymbol()).toBe("?");
        });

        it("should not change the player's world position", () => {
            sequence.start();
            sequence.update(7.5);

            expect(player.x).toBe(800);
            expect(player.y).toBe(640);
        });
    });

    describe("First dialogue", () => {
        it("should enter the first dialogue after eight seconds", () => {
            sequence.start();
            sequence.update(8);

            expect(sequence.state).toBe("firstDialogue");
        });

        it("should display Where am I?", () => {
            sequence.start();
            sequence.update(8);

            expect(dialogueBubble.text).toBe("Where am I?");
            expect(dialogueBubble.isVisible).toBe(true);
        });

        it("should hide emotion indicators during dialogue", () => {
            sequence.start();
            sequence.update(8);

            expect(emotionIndicator.isVisible).toBe(false);
        });

        it("should use the typewriter animation", () => {
            sequence.start();
            sequence.update(8);
            sequence.update(0.25);

            expect(dialogueBubble.getVisibleText())
                .toBe("Where");
        });

        it("should eventually reveal the complete dialogue", () => {
            sequence.start();
            sequence.update(9);

            expect(dialogueBubble.getVisibleText())
                .toBe("Where am I?");
        });

        it("should return the player to the front-facing direction", () => {
            sequence.start();
            sequence.update(8);

            expect(player.direction).toBe("down");
        });
    });

    describe("Examining self", () => {
        it("should examine the player after eleven seconds", () => {
            sequence.start();
            sequence.update(11);

            expect(sequence.state).toBe("examiningSelf");
        });

        it("should hide the previous dialogue", () => {
            sequence.start();
            sequence.update(11);

            expect(dialogueBubble.isVisible).toBe(false);
        });

        it("should display a question mark", () => {
            sequence.start();
            sequence.update(11);

            expect(emotionIndicator.getSymbol()).toBe("?");
        });

        it("should continue locking player input", () => {
            sequence.start();
            sequence.update(12);

            expect(sequence.isInputLocked).toBe(true);
        });
    });

    describe("Second dialogue", () => {
        it("should enter the second dialogue after thirteen seconds", () => {
            sequence.start();
            sequence.update(13);

            expect(sequence.state).toBe("secondDialogue");
        });

        it("should display Who am I?", () => {
            sequence.start();
            sequence.update(13);

            expect(dialogueBubble.text).toBe("Who am I?");
            expect(dialogueBubble.isVisible).toBe(true);
        });

        it("should reset the typewriter animation", () => {
            sequence.start();
            sequence.update(13);

            expect(dialogueBubble.visibleCharacters).toBe(0);
        });

        it("should gradually reveal the second dialogue", () => {
            sequence.start();
            sequence.update(13);
            sequence.update(0.25);

            expect(dialogueBubble.getVisibleText())
                .toBe("Who a");
        });

        it("should hide emotion indicators during dialogue", () => {
            sequence.start();
            sequence.update(13);

            expect(emotionIndicator.isVisible).toBe(false);
        });
    });

    describe("Sequence completion", () => {
        it("should complete after sixteen seconds", () => {
            sequence.start();
            sequence.update(16);

            expect(sequence.state).toBe("completed");
            expect(sequence.isComplete).toBe(true);
        });

        it("should deactivate the sequence", () => {
            sequence.start();
            sequence.update(16);

            expect(sequence.isActive).toBe(false);
        });

        it("should unlock player input", () => {
            sequence.start();
            sequence.update(16);

            expect(sequence.isInputLocked).toBe(false);
        });

        it("should hide remaining dialogue", () => {
            sequence.start();
            sequence.update(16);

            expect(dialogueBubble.isVisible).toBe(false);
        });

        it("should hide remaining emotion indicators", () => {
            sequence.start();
            sequence.update(16);

            expect(emotionIndicator.isVisible).toBe(false);
        });

        it("should leave the game world fully visible", () => {
            sequence.start();
            sequence.update(16);

            expect(screenFade.opacity).toBe(0);
        });

        it("should preserve the original spawn position", () => {
            sequence.start();
            sequence.update(16);

            expect(player.x).toBe(800);
            expect(player.y).toBe(640);
        });

        it("should not advance beyond the sequence duration", () => {
            sequence.start();
            sequence.update(30);

            expect(sequence.elapsedTime).toBe(16);
        });

        it("should ignore updates after completion", () => {
            sequence.start();
            sequence.update(16);
            sequence.update(10);

            expect(sequence.elapsedTime).toBe(16);
            expect(sequence.state).toBe("completed");
        });
    });

    describe("Frame timing", () => {
        it.each([
            [0, "fadingIn"],
            [1.9, "fadingIn"],
            [2, "sleeping"],
            [4.9, "sleeping"],
            [5, "surprised"],
            [6, "lookingLeft"],
            [7, "lookingRight"],
            [8, "firstDialogue"],
            [11, "examiningSelf"],
            [13, "secondDialogue"],
            [15.9, "secondDialogue"],
            [16, "completed"]
        ])(
            "should enter the correct state at %s seconds",
            (elapsedTime, expectedState) => {
                sequence.start();
                sequence.update(elapsedTime);

                expect(sequence.state).toBe(expectedState);
            }
        );

        it("should support incremental frame updates", () => {
            sequence.start();

            for (let frame = 0; frame < 960; frame++) {
                sequence.update(1 / 60);
            }

            expect(sequence.elapsedTime).toBeCloseTo(16);
            expect(sequence.isComplete).toBe(true);
        });

        it("should preserve remaining time across state transitions", () => {
            sequence.start();
            sequence.update(8.25);

            expect(sequence.state).toBe("firstDialogue");

            expect(dialogueBubble.getVisibleText())
                .toBe("Where");
        });

        it("should trigger both dialogues in the correct order", () => {
            const showSpy =
                vi.spyOn(dialogueBubble, "show");

            sequence.start();
            sequence.update(16);

            expect(showSpy).toHaveBeenCalledTimes(2);

            expect(showSpy)
                .toHaveBeenNthCalledWith(1, "Where am I?");

            expect(showSpy)
                .toHaveBeenNthCalledWith(2, "Who am I?");
        });
    });

    describe("Delta time validation", () => {
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
            "should reject invalid delta time %s",
            deltaTime => {
                sequence.start();
                sequence.update(deltaTime);

                expect(sequence.elapsedTime).toBe(0);
                expect(sequence.state).toBe("fadingIn");
            }
        );

        it("should ignore updates before starting", () => {
            sequence.update(10);

            expect(sequence.elapsedTime).toBe(0);
            expect(sequence.state).toBe("idle");
        });
    });

    describe("Reset and replay", () => {
        it("should reset to the idle state", () => {
            sequence.start();
            sequence.update(8);

            sequence.reset();

            expect(sequence.state).toBe("idle");
            expect(sequence.isActive).toBe(false);
            expect(sequence.isComplete).toBe(false);
        });

        it("should reset elapsed time", () => {
            sequence.start();
            sequence.update(10);

            sequence.reset();

            expect(sequence.elapsedTime).toBe(0);
        });

        it("should unlock player input after resetting", () => {
            sequence.start();
            sequence.reset();

            expect(sequence.isInputLocked).toBe(false);
        });

        it("should clear the cutscene components", () => {
            sequence.start();
            sequence.update(5);

            sequence.reset();

            expect(screenFade.opacity).toBe(0);
            expect(dialogueBubble.isVisible).toBe(false);
            expect(emotionIndicator.isVisible).toBe(false);
        });

        it("should support replaying the awakening sequence", () => {
            sequence.start();
            sequence.update(16);

            sequence.reset();
            sequence.start();

            expect(sequence.state).toBe("fadingIn");
            expect(sequence.isActive).toBe(true);
            expect(sequence.isComplete).toBe(false);
            expect(screenFade.opacity).toBe(1);
        });
    });
});
