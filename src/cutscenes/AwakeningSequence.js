
const AwakeningTimeline = Object.freeze([
    { state: "fadingIn", endTime: 2 },
    { state: "sleeping", endTime: 5 },
    { state: "surprised", endTime: 6 },
    { state: "lookingLeft", endTime: 7 },
    { state: "lookingRight", endTime: 8 },
    { state: "firstDialogue", endTime: 11 },
    { state: "examiningSelf", endTime: 13 },
    { state: "secondDialogue", endTime: 16 }
]);

const TIME_EPSILON = 0.000000001;

export class AwakeningSequence {
    constructor({
        player,
        screenFade,
        dialogueBubble,
        emotionIndicator
    }) {
        // Store cutscene dependencies
        this.player = player;
        this.screenFade = screenFade;
        this.dialogueBubble = dialogueBubble;
        this.emotionIndicator = emotionIndicator;

        // Initialize sequence state
        this.state = "idle";
        this.isActive = false;
        this.isComplete = false;

        this.elapsedTime = 0;
        this.duration =
            AwakeningTimeline.at(-1).endTime;

        this.currentStep = 0;

        // Attach visual indicators to the player
        this.dialogueBubble.setTarget(this.player);
        this.emotionIndicator.setTarget(this.player);
    }

    get isInputLocked() {
        // Lock player input while the cutscene is active
        return this.isActive;
    }

    start() {
        // Prevent accidental sequence restarts
        if (this.isActive || this.isComplete) {
            return;
        }

        // Initialize the sequence
        this.isActive = true;
        this.isComplete = false;
        this.elapsedTime = 0;
        this.currentStep = 0;

        // Clear previous visual effects
        this.screenFade.reset();
        this.dialogueBubble.reset();
        this.emotionIndicator.reset();

        // Prepare the player for the awakening
        this.player.direction = "down";
        this.player.isMoving = false;

        // Enter the first state
        this.enterState("fadingIn");
    }

    enterState(state) {
        this.state = state;

        switch (state) {
            case "fadingIn":
                // Reveal the snowy forest
                this.screenFade.fadeIn(2);
                break;

            case "sleeping":
                // Show sleeping symbols above the player
                this.emotionIndicator.show("sleeping");
                break;

            case "surprised":
                // The player suddenly awakens
                this.emotionIndicator.show("surprised");
                break;

            case "lookingLeft":
                // Look around the unfamiliar surroundings
                this.player.direction = "left";
                this.emotionIndicator.show("confused");
                break;

            case "lookingRight":
                // Continue looking around
                this.player.direction = "right";
                break;

            case "firstDialogue":
                // Return to the front-facing position
                this.player.direction = "down";

                this.emotionIndicator.hide();
                this.dialogueBubble.show("Where am I?");
                break;

            case "examiningSelf":
                // The player questions their own appearance
                this.dialogueBubble.hide();
                this.emotionIndicator.show("confused");

                this.player.direction = "down";
                break;

            case "secondDialogue":
                // The player questions their identity
                this.emotionIndicator.hide();
                this.dialogueBubble.show("Who am I?");
                break;
        }
    }

    update(deltaTime) {
        // Reject invalid or non-positive delta time
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {
            return;
        }

        // Skip inactive sequences
        if (!this.isActive) {
            return;
        }

        // Calculate the target time for this update
        const targetTime = Math.min(
            this.elapsedTime + deltaTime,
            this.duration
        );

        // Process every state transition in chronological order
        while (this.isActive) {
            const step =
                AwakeningTimeline[this.currentStep];

            const reachedBoundary =
                targetTime >= step.endTime - TIME_EPSILON;

            const nextTime = reachedBoundary
                ? step.endTime
                : targetTime;

            const stepDeltaTime = Math.max(
                0,
                nextTime - this.elapsedTime
            );

            // Update the components within the current state
            this.updateComponents(stepDeltaTime);

            this.elapsedTime = nextTime;

            // Remain in the current state until its end time
            if (!reachedBoundary) {
                break;
            }

            // Advance to the next timeline state
            this.currentStep++;

            // Complete the sequence after the final state
            if (
                this.currentStep >=
                AwakeningTimeline.length
            ) {
                this.complete();
                break;
            }

            this.enterState(
                AwakeningTimeline[this.currentStep].state
            );

            // Stop when the current frame has been processed
            if (this.elapsedTime >= targetTime) {
                break;
            }
        }
    }

    updateComponents(deltaTime) {
        // Synchronize all cutscene effects
        this.screenFade.update(deltaTime);
        this.dialogueBubble.update(deltaTime);
        this.emotionIndicator.update(deltaTime);
    }

    complete() {
        // Clear remaining cutscene effects
        this.screenFade.reset();
        this.dialogueBubble.hide();
        this.emotionIndicator.hide();

        // Restore the player's default direction
        this.player.direction = "down";
        this.player.isMoving = false;

        // Mark the sequence as completed
        this.elapsedTime = this.duration;
        this.state = "completed";

        this.isActive = false;
        this.isComplete = true;
    }

    reset() {
        // Reset sequence timing and state
        this.state = "idle";
        this.elapsedTime = 0;
        this.currentStep = 0;

        this.isActive = false;
        this.isComplete = false;

        // Clear all cutscene effects
        this.screenFade.reset();
        this.dialogueBubble.reset();
        this.emotionIndicator.reset();
    }
}
