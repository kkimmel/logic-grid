import {gameReducer} from "./gameReducer.js";

// ---------------------------------------------------------------------------
// Minimal game-state factory
// ---------------------------------------------------------------------------
// Builds a lightweight game state with two clues and a two-entry
// derivedMatrixHistory, so each test starts from a well-defined baseline
// without having to call the real gameInit (which runs the puzzle generator).
function makeGameState(overrides = {}) {
  const baseMatrix = {
    NameVsNumber: {
      rowLabels: ["Alice", "Bob"],
      columnLabels: [1, 2],
      grid: [
        [null, null],
        [null, null],
      ],
    },
  };

  const modifiedMatrix = {
    NameVsNumber: {
      rowLabels: ["Alice", "Bob"],
      columnLabels: [1, 2],
      grid: [
        [true, false],
        [false, true],
      ],
    },
  };

  return {
    id: "test-id",
    numCategories: 2,
    numItemsPerCategory: 2,
    matrixRowLabels: [["Alice", "Bob"]],
    matrixColumnLabels: [[1, 2]],
    easyTrue: false,
    showViolations: false,
    lastBreakingChange: "20230702",
    clues: [
      {writtenClue: "Clue A", crossedOff: false},
      {writtenClue: "Clue B", crossedOff: false},
    ],
    // Two history entries so we can verify reset trims back to just the first.
    derivedMatrixHistory: [baseMatrix, modifiedMatrix],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------
describe("gameReducer – reset action", () => {
  test("trims derivedMatrixHistory back to the first entry", () => {
    const state = makeGameState();
    const next = gameReducer(state, {action: "reset"});

    expect(next.derivedMatrixHistory).toHaveLength(1);
    expect(next.derivedMatrixHistory[0]).toEqual(
      state.derivedMatrixHistory[0],
    );
  });

  test("resets crossedOff to false on every clue", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: true},
        {writtenClue: "Clue B", crossedOff: true},
      ],
    });

    const next = gameReducer(state, {action: "reset"});

    next.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("resets crossedOff even when only some clues were crossed off", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: true},
        {writtenClue: "Clue B", crossedOff: false},
      ],
    });

    const next = gameReducer(state, {action: "reset"});

    next.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("preserves all other clue properties (e.g. writtenClue) when resetting", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: true},
        {writtenClue: "Clue B", crossedOff: true},
      ],
    });

    const next = gameReducer(state, {action: "reset"});

    expect(next.clues[0].writtenClue).toBe("Clue A");
    expect(next.clues[1].writtenClue).toBe("Clue B");
  });

  test("preserves the rest of game state (easyTrue, showViolations, etc.)", () => {
    const state = makeGameState({easyTrue: true, showViolations: true});
    const next = gameReducer(state, {action: "reset"});

    expect(next.easyTrue).toBe(true);
    expect(next.showViolations).toBe(true);
    expect(next.id).toBe("test-id");
  });

  test("does not mutate the original state", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: true},
        {writtenClue: "Clue B", crossedOff: true},
      ],
    });
    const originalClues = JSON.parse(JSON.stringify(state.clues));
    const originalHistory = JSON.parse(
      JSON.stringify(state.derivedMatrixHistory),
    );

    gameReducer(state, {action: "reset"});

    expect(state.clues).toEqual(originalClues);
    expect(state.derivedMatrixHistory).toEqual(originalHistory);
  });
});

// ---------------------------------------------------------------------------
// setClueCrossedOff  (the action that reset now needs to undo)
// ---------------------------------------------------------------------------
describe("gameReducer – setClueCrossedOff action", () => {
  test("toggles crossedOff from false to true", () => {
    const state = makeGameState();
    const next = gameReducer(state, {action: "setClueCrossedOff", index: 0});

    expect(next.clues[0].crossedOff).toBe(true);
    expect(next.clues[1].crossedOff).toBe(false);
  });

  test("toggles crossedOff from true back to false", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: true},
        {writtenClue: "Clue B", crossedOff: false},
      ],
    });

    const next = gameReducer(state, {action: "setClueCrossedOff", index: 0});

    expect(next.clues[0].crossedOff).toBe(false);
  });

  test("crossing off a clue then resetting clears it", () => {
    const state = makeGameState();

    // Cross off both clues.
    let next = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    next = gameReducer(next, {action: "setClueCrossedOff", index: 1});

    expect(next.clues[0].crossedOff).toBe(true);
    expect(next.clues[1].crossedOff).toBe(true);

    // Now reset — both should go back to false.
    const reset = gameReducer(next, {action: "reset"});

    expect(reset.clues[0].crossedOff).toBe(false);
    expect(reset.clues[1].crossedOff).toBe(false);
  });
});
