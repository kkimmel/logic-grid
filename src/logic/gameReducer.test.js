import {gameReducer} from "./gameReducer.js";

// ---------------------------------------------------------------------------
// Minimal shared fixtures
// ---------------------------------------------------------------------------

const baseMatrix = {
  NameVsNumber: {
    rowLabels: ["Alice", "Bob", "Carol"],
    columnLabels: [1, 2, 3],
    grid: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
  },
};

const baseClues = [
  {clue: "Alice is not 1", crossedOff: false},
  {clue: "Bob is not 2", crossedOff: false},
  {clue: "Carol is not 3", crossedOff: false},
];

function makeGameState(overrides = {}) {
  return {
    clues: baseClues.map((c) => ({...c})),
    derivedMatrixHistory: [baseMatrix],
    numCategories: 2,
    numItemsPerCategory: 3,
    easyTrue: false,
    showViolations: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe("gameReducer — reset action", () => {
  test("resets derivedMatrixHistory to only its first entry", () => {
    const secondMatrix = {
      NameVsNumber: {
        ...baseMatrix.NameVsNumber,
        grid: [
          [false, null, null],
          [null, null, null],
          [null, null, null],
        ],
      },
    };
    const state = makeGameState({
      derivedMatrixHistory: [baseMatrix, secondMatrix],
    });

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
    expect(newState.derivedMatrixHistory[0]).toEqual(baseMatrix);
  });

  test("clears crossedOff on all clues when they were all crossed off", () => {
    const state = makeGameState({
      clues: baseClues.map((c) => ({...c, crossedOff: true})),
    });

    const newState = gameReducer(state, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("clears crossedOff on all clues when only some were crossed off", () => {
    const state = makeGameState({
      clues: [
        {clue: "Alice is not 1", crossedOff: true},
        {clue: "Bob is not 2", crossedOff: false},
        {clue: "Carol is not 3", crossedOff: true},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("leaves crossedOff false when no clues were crossed off", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("preserves all other clue fields when resetting crossedOff", () => {
    const state = makeGameState({
      clues: [
        {clue: "Alice is not 1", crossedOff: true, extraField: "keep me"},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.clues[0].clue).toBe("Alice is not 1");
    expect(newState.clues[0].extraField).toBe("keep me");
    expect(newState.clues[0].crossedOff).toBe(false);
  });

  test("preserves the rest of the game state (easyTrue, showViolations, etc.)", () => {
    const state = makeGameState({easyTrue: true, showViolations: true});

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.easyTrue).toBe(true);
    expect(newState.showViolations).toBe(true);
    expect(newState.numCategories).toBe(state.numCategories);
    expect(newState.numItemsPerCategory).toBe(state.numItemsPerCategory);
  });

  test("does not mutate the original state's clues array", () => {
    const state = makeGameState({
      clues: [{clue: "Alice is not 1", crossedOff: true}],
    });
    const originalCrossedOff = state.clues[0].crossedOff;

    gameReducer(state, {action: "reset"});

    expect(state.clues[0].crossedOff).toBe(originalCrossedOff);
  });

  test("handles reset with no history beyond the initial snapshot", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
    expect(newState.derivedMatrixHistory[0]).toEqual(baseMatrix);
  });
});

// ---------------------------------------------------------------------------
// setClueCrossedOff  (the action that reset must undo)
// ---------------------------------------------------------------------------

describe("gameReducer — setClueCrossedOff action", () => {
  test("toggles crossedOff from false to true", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {
      action: "setClueCrossedOff",
      index: 0,
    });

    expect(newState.clues[0].crossedOff).toBe(true);
    expect(newState.clues[1].crossedOff).toBe(false);
    expect(newState.clues[2].crossedOff).toBe(false);
  });

  test("toggles crossedOff from true back to false", () => {
    const state = makeGameState({
      clues: [{clue: "Alice is not 1", crossedOff: true}],
    });

    const newState = gameReducer(state, {
      action: "setClueCrossedOff",
      index: 0,
    });

    expect(newState.clues[0].crossedOff).toBe(false);
  });

  test("only affects the clue at the given index", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {
      action: "setClueCrossedOff",
      index: 1,
    });

    expect(newState.clues[0].crossedOff).toBe(false);
    expect(newState.clues[1].crossedOff).toBe(true);
    expect(newState.clues[2].crossedOff).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setClueCrossedOff followed by reset (integration)
// ---------------------------------------------------------------------------

describe("gameReducer — setClueCrossedOff then reset (integration)", () => {
  test("crossing off clues then resetting leaves all clues uncrossed", () => {
    let state = makeGameState();

    // Cross off every clue
    state = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    state = gameReducer(state, {action: "setClueCrossedOff", index: 1});
    state = gameReducer(state, {action: "setClueCrossedOff", index: 2});

    expect(state.clues.every((c) => c.crossedOff)).toBe(true);

    // Now reset
    const resetState = gameReducer(state, {action: "reset"});

    expect(resetState.clues.every((c) => c.crossedOff)).toBe(false);
  });

  test("grid changes made before reset are also cleared", () => {
    let state = makeGameState();

    // Mutate the grid
    state = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    expect(state.derivedMatrixHistory).toHaveLength(2);

    // Cross off a clue
    state = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    expect(state.clues[0].crossedOff).toBe(true);

    // Reset clears both
    const resetState = gameReducer(state, {action: "reset"});
    expect(resetState.derivedMatrixHistory).toHaveLength(1);
    expect(resetState.clues[0].crossedOff).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// undo
// ---------------------------------------------------------------------------

describe("gameReducer — undo action", () => {
  test("removes the last entry from derivedMatrixHistory", () => {
    const secondMatrix = {
      NameVsNumber: {
        ...baseMatrix.NameVsNumber,
        grid: [
          [false, null, null],
          [null, null, null],
          [null, null, null],
        ],
      },
    };
    const state = makeGameState({
      derivedMatrixHistory: [baseMatrix, secondMatrix],
    });

    const newState = gameReducer(state, {action: "undo"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
    expect(newState.derivedMatrixHistory[0]).toEqual(baseMatrix);
  });

  test("does not reduce history below length 1", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {action: "undo"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// changeEasyTrue / changeShowViolations
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// changeCellState
// ---------------------------------------------------------------------------

describe("gameReducer — changeCellState action", () => {
  test("cycles null -> false", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });

    expect(
      newState.derivedMatrixHistory[newState.derivedMatrixHistory.length - 1][
        "NameVsNumber"
      ].grid[0][0],
    ).toBe(false);
  });

  test("cycles false -> true", () => {
    const matrixWithFalse = {
      NameVsNumber: {
        ...baseMatrix.NameVsNumber,
        grid: [
          [false, null, null],
          [null, null, null],
          [null, null, null],
        ],
      },
    };
    const state = makeGameState({
      derivedMatrixHistory: [matrixWithFalse],
    });

    const newState = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });

    expect(
      newState.derivedMatrixHistory[newState.derivedMatrixHistory.length - 1][
        "NameVsNumber"
      ].grid[0][0],
    ).toBe(true);
  });

  test("cycles true -> null", () => {
    const matrixWithTrue = {
      NameVsNumber: {
        ...baseMatrix.NameVsNumber,
        grid: [
          [true, null, null],
          [null, null, null],
          [null, null, null],
        ],
      },
    };
    const state = makeGameState({
      derivedMatrixHistory: [matrixWithTrue],
    });

    const newState = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });

    expect(
      newState.derivedMatrixHistory[newState.derivedMatrixHistory.length - 1][
        "NameVsNumber"
      ].grid[0][0],
    ).toBeNull();
  });

  test("appends a new entry to derivedMatrixHistory", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 1,
      columnIndex: 1,
    });

    expect(newState.derivedMatrixHistory).toHaveLength(2);
  });
});
