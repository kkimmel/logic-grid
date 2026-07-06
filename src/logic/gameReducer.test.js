import {gameReducer} from "./gameReducer.js";

// Minimal game state factory — only the fields gameReducer actually touches
function makeGameState(overrides = {}) {
  const derivedMatrix = {
    NameVsNumber: {
      rowLabels: ["Alice", "Bob"],
      columnLabels: [1, 2],
      grid: [
        [null, null],
        [null, null],
      ],
    },
  };

  return {
    clues: [
      {clueType: "not", crossedOff: false},
      {clueType: "or", crossedOff: false},
      {clueType: "numeric", crossedOff: false},
    ],
    derivedMatrixHistory: [derivedMatrix],
    easyTrue: false,
    showViolations: false,
    numCategories: 2,
    numItemsPerCategory: 2,
    matrixRowLabels: [["Alice", "Bob"]],
    matrixColumnLabels: [[1, 2]],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------
describe("gameReducer — reset action", () => {
  test("resets all clues' crossedOff flags to false", () => {
    const stateWithCrossedOffClues = makeGameState({
      clues: [
        {clueType: "not", crossedOff: true},
        {clueType: "or", crossedOff: true},
        {clueType: "numeric", crossedOff: false},
      ],
    });

    const newState = gameReducer(stateWithCrossedOffClues, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("resets crossedOff to false even when only some clues were crossed off", () => {
    const stateWithSomeCrossedOff = makeGameState({
      clues: [
        {clueType: "not", crossedOff: true},
        {clueType: "or", crossedOff: false},
        {clueType: "numeric", crossedOff: true},
      ],
    });

    const newState = gameReducer(stateWithSomeCrossedOff, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("preserves all other clue fields when resetting crossedOff", () => {
    const stateWithCrossedOffClues = makeGameState({
      clues: [
        {clueType: "not", writtenClue: "Alice is not 1", crossedOff: true},
        {clueType: "or", writtenClue: "Bob is 1 or 2", crossedOff: true},
      ],
    });

    const newState = gameReducer(stateWithCrossedOffClues, {action: "reset"});

    expect(newState.clues[0]).toMatchObject({
      clueType: "not",
      writtenClue: "Alice is not 1",
      crossedOff: false,
    });
    expect(newState.clues[1]).toMatchObject({
      clueType: "or",
      writtenClue: "Bob is 1 or 2",
      crossedOff: false,
    });
  });

  test("trims derivedMatrixHistory back to only the first entry", () => {
    const extraMatrix = {
      NameVsNumber: {
        rowLabels: ["Alice", "Bob"],
        columnLabels: [1, 2],
        grid: [
          [true, false],
          [false, true],
        ],
      },
    };
    const stateWithHistory = makeGameState({
      derivedMatrixHistory: [
        makeGameState().derivedMatrixHistory[0],
        extraMatrix,
        extraMatrix,
      ],
    });

    const newState = gameReducer(stateWithHistory, {action: "reset"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
  });

  test("resets both crossedOff flags AND derivedMatrixHistory together", () => {
    const initialMatrix = makeGameState().derivedMatrixHistory[0];
    const extraMatrix = {
      NameVsNumber: {
        rowLabels: ["Alice", "Bob"],
        columnLabels: [1, 2],
        grid: [
          [true, false],
          [false, true],
        ],
      },
    };
    const fullState = makeGameState({
      clues: [
        {clueType: "not", crossedOff: true},
        {clueType: "or", crossedOff: true},
      ],
      derivedMatrixHistory: [initialMatrix, extraMatrix],
    });

    const newState = gameReducer(fullState, {action: "reset"});

    // Grid history is reset
    expect(newState.derivedMatrixHistory).toHaveLength(1);
    expect(newState.derivedMatrixHistory[0]).toEqual(initialMatrix);

    // Clue crossed-off flags are reset
    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("does not mutate the original state", () => {
    const originalClues = [
      {clueType: "not", crossedOff: true},
      {clueType: "or", crossedOff: true},
    ];
    const originalState = makeGameState({clues: originalClues});

    gameReducer(originalState, {action: "reset"});

    // Original clues should be untouched
    expect(originalState.clues[0].crossedOff).toBe(true);
    expect(originalState.clues[1].crossedOff).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setClueCrossedOff (sanity-check the action the reset undoes)
// ---------------------------------------------------------------------------
describe("gameReducer — setClueCrossedOff action", () => {
  test("toggles a clue from not-crossed-off to crossed-off", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {
      action: "setClueCrossedOff",
      index: 0,
    });

    expect(newState.clues[0].crossedOff).toBe(true);
    // Other clues unchanged
    expect(newState.clues[1].crossedOff).toBe(false);
  });

  test("toggles a clue from crossed-off back to not-crossed-off", () => {
    const state = makeGameState({
      clues: [
        {clueType: "not", crossedOff: true},
        {clueType: "or", crossedOff: false},
      ],
    });

    const newState = gameReducer(state, {
      action: "setClueCrossedOff",
      index: 0,
    });

    expect(newState.clues[0].crossedOff).toBe(false);
  });
});
