import {gameReducer} from "./gameReducer.js";

// Minimal game state factory for testing
function makeGameState(overrides = {}) {
  return {
    clues: [
      {writtenClue: "Clue A", crossedOff: false},
      {writtenClue: "Clue B", crossedOff: false},
      {writtenClue: "Clue C", crossedOff: false},
    ],
    derivedMatrixHistory: [
      {
        grid1: {
          grid: [
            [null, null],
            [null, null],
          ],
        },
      },
    ],
    easyTrue: false,
    showViolations: false,
    ...overrides,
  };
}

describe("gameReducer — reset action", () => {
  test("resets derivedMatrixHistory back to only the initial snapshot", () => {
    const state = makeGameState({
      derivedMatrixHistory: [
        {grid1: {grid: [[null, null], [null, null]]}},
        {grid1: {grid: [[true, false], [false, null]]}},
        {grid1: {grid: [[true, false], [false, true]]}},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
    expect(newState.derivedMatrixHistory[0]).toEqual(
      state.derivedMatrixHistory[0],
    );
  });

  test("resets all clue crossedOff flags to false", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: true},
        {writtenClue: "Clue B", crossedOff: true},
        {writtenClue: "Clue C", crossedOff: false},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("preserves all other clue fields (e.g. writtenClue) when resetting", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: true},
        {writtenClue: "Clue B", crossedOff: true},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.clues[0].writtenClue).toBe("Clue A");
    expect(newState.clues[1].writtenClue).toBe("Clue B");
  });

  test("does not mutate the original state's clues", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: true},
        {writtenClue: "Clue B", crossedOff: true},
      ],
    });

    gameReducer(state, {action: "reset"});

    // Original clues should be untouched
    expect(state.clues[0].crossedOff).toBe(true);
    expect(state.clues[1].crossedOff).toBe(true);
  });

  test("preserves other game state fields (easyTrue, showViolations) on reset", () => {
    const state = makeGameState({easyTrue: true, showViolations: true});

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.easyTrue).toBe(true);
    expect(newState.showViolations).toBe(true);
  });

  test("reset is a no-op on clues when none are crossed off", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: false},
        {writtenClue: "Clue B", crossedOff: false},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });
});

describe("gameReducer — setClueCrossedOff action", () => {
  test("toggles crossedOff from false to true", () => {
    const state = makeGameState();
    const newState = gameReducer(state, {action: "setClueCrossedOff", index: 1});
    expect(newState.clues[1].crossedOff).toBe(true);
    // Other clues unchanged
    expect(newState.clues[0].crossedOff).toBe(false);
    expect(newState.clues[2].crossedOff).toBe(false);
  });

  test("toggles crossedOff from true to false", () => {
    const state = makeGameState({
      clues: [
        {writtenClue: "Clue A", crossedOff: true},
        {writtenClue: "Clue B", crossedOff: false},
      ],
    });
    const newState = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    expect(newState.clues[0].crossedOff).toBe(false);
  });
});

describe("gameReducer — undo action", () => {
  test("removes the last entry from derivedMatrixHistory", () => {
    const state = makeGameState({
      derivedMatrixHistory: [
        {grid1: {grid: [[null, null], [null, null]]}},
        {grid1: {grid: [[true, false], [false, null]]}},
      ],
    });

    const newState = gameReducer(state, {action: "undo"});
    expect(newState.derivedMatrixHistory).toHaveLength(1);
  });

  test("does not reduce derivedMatrixHistory below length 1", () => {
    const state = makeGameState();
    const newState = gameReducer(state, {action: "undo"});
    expect(newState.derivedMatrixHistory).toHaveLength(1);
  });
});

describe("gameReducer — changeEasyTrue action", () => {
  test("toggles easyTrue from false to true", () => {
    const state = makeGameState({easyTrue: false});
    const newState = gameReducer(state, {action: "changeEasyTrue"});
    expect(newState.easyTrue).toBe(true);
  });

  test("toggles easyTrue from true to false", () => {
    const state = makeGameState({easyTrue: true});
    const newState = gameReducer(state, {action: "changeEasyTrue"});
    expect(newState.easyTrue).toBe(false);
  });
});

describe("gameReducer — changeShowViolations action", () => {
  test("toggles showViolations from false to true", () => {
    const state = makeGameState({showViolations: false});
    const newState = gameReducer(state, {action: "changeShowViolations"});
    expect(newState.showViolations).toBe(true);
  });

  test("toggles showViolations from true to false", () => {
    const state = makeGameState({showViolations: true});
    const newState = gameReducer(state, {action: "changeShowViolations"});
    expect(newState.showViolations).toBe(false);
  });
});
