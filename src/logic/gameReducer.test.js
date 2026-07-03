import {gameReducer} from "./gameReducer.js";

// Minimal game state factory to avoid depending on gameInit/generatePuzzle
function makeGameState(overrides = {}) {
  const derivedMatrix = {
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

  return {
    id: "test-id",
    clues: [
      {clue: "Alice is not 1", crossedOff: false},
      {clue: "Bob is 2", crossedOff: false},
      {clue: "Carol is 3", crossedOff: false},
    ],
    derivedMatrixHistory: [derivedMatrix],
    numCategories: 2,
    numItemsPerCategory: 3,
    matrixRowLabels: ["Alice", "Bob", "Carol"],
    matrixColumnLabels: [1, 2, 3],
    easyTrue: false,
    showViolations: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------
describe('gameReducer – "reset" action', () => {
  test("resets derivedMatrixHistory to only the first snapshot", () => {
    const secondMatrix = {
      NameVsNumber: {
        rowLabels: ["Alice", "Bob", "Carol"],
        columnLabels: [1, 2, 3],
        grid: [
          [true, false, false],
          [false, null, null],
          [false, null, null],
        ],
      },
    };
    const state = makeGameState({
      derivedMatrixHistory: [
        makeGameState().derivedMatrixHistory[0],
        secondMatrix,
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
    expect(newState.derivedMatrixHistory[0]).toEqual(
      state.derivedMatrixHistory[0],
    );
  });

  test("resets all clues' crossedOff to false", () => {
    const state = makeGameState({
      clues: [
        {clue: "Alice is not 1", crossedOff: true},
        {clue: "Bob is 2", crossedOff: true},
        {clue: "Carol is 3", crossedOff: false},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("preserves clue text when resetting crossedOff", () => {
    const state = makeGameState({
      clues: [
        {clue: "Alice is not 1", crossedOff: true},
        {clue: "Bob is 2", crossedOff: true},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.clues[0].clue).toBe("Alice is not 1");
    expect(newState.clues[1].clue).toBe("Bob is 2");
  });

  test("does not mutate the original state's clues", () => {
    const state = makeGameState({
      clues: [
        {clue: "Alice is not 1", crossedOff: true},
        {clue: "Bob is 2", crossedOff: true},
      ],
    });

    gameReducer(state, {action: "reset"});

    // Original state should be untouched
    expect(state.clues[0].crossedOff).toBe(true);
    expect(state.clues[1].crossedOff).toBe(true);
  });

  test("preserves other state fields (easyTrue, showViolations, etc.)", () => {
    const state = makeGameState({easyTrue: true, showViolations: true});

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.easyTrue).toBe(true);
    expect(newState.showViolations).toBe(true);
    expect(newState.numCategories).toBe(state.numCategories);
    expect(newState.numItemsPerCategory).toBe(state.numItemsPerCategory);
  });
});

// ---------------------------------------------------------------------------
// setClueCrossedOff
// ---------------------------------------------------------------------------
describe('gameReducer – "setClueCrossedOff" action', () => {
  test("toggles crossedOff from false to true", () => {
    const state = makeGameState();
    const newState = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    expect(newState.clues[0].crossedOff).toBe(true);
  });

  test("toggles crossedOff from true to false", () => {
    const state = makeGameState({
      clues: [
        {clue: "Alice is not 1", crossedOff: true},
        {clue: "Bob is 2", crossedOff: false},
      ],
    });
    const newState = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    expect(newState.clues[0].crossedOff).toBe(false);
  });

  test("only toggles the targeted clue index", () => {
    const state = makeGameState();
    const newState = gameReducer(state, {action: "setClueCrossedOff", index: 1});
    expect(newState.clues[0].crossedOff).toBe(false);
    expect(newState.clues[1].crossedOff).toBe(true);
    expect(newState.clues[2].crossedOff).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// changeCellState
// ---------------------------------------------------------------------------
describe('gameReducer – "changeCellState" action', () => {
  test("cycles cell: null -> false", () => {
    const state = makeGameState();
    const newState = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    const latestGrid =
      newState.derivedMatrixHistory[newState.derivedMatrixHistory.length - 1];
    expect(latestGrid["NameVsNumber"].grid[0][0]).toBe(false);
  });

  test("cycles cell: false -> true", () => {
    const initialMatrix = {
      NameVsNumber: {
        rowLabels: ["Alice", "Bob", "Carol"],
        columnLabels: [1, 2, 3],
        grid: [
          [false, null, null],
          [null, null, null],
          [null, null, null],
        ],
      },
    };
    const state = makeGameState({derivedMatrixHistory: [initialMatrix]});
    const newState = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    const latestGrid =
      newState.derivedMatrixHistory[newState.derivedMatrixHistory.length - 1];
    expect(latestGrid["NameVsNumber"].grid[0][0]).toBe(true);
  });

  test("cycles cell: true -> null", () => {
    const initialMatrix = {
      NameVsNumber: {
        rowLabels: ["Alice", "Bob", "Carol"],
        columnLabels: [1, 2, 3],
        grid: [
          [true, null, null],
          [null, null, null],
          [null, null, null],
        ],
      },
    };
    const state = makeGameState({derivedMatrixHistory: [initialMatrix]});
    const newState = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    const latestGrid =
      newState.derivedMatrixHistory[newState.derivedMatrixHistory.length - 1];
    expect(latestGrid["NameVsNumber"].grid[0][0]).toBe(null);
  });

  test("appends a new snapshot to derivedMatrixHistory", () => {
    const state = makeGameState();
    const newState = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    expect(newState.derivedMatrixHistory).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// undo
// ---------------------------------------------------------------------------
describe('gameReducer – "undo" action', () => {
  test("removes the last snapshot from history", () => {
    const secondMatrix = {
      NameVsNumber: {
        rowLabels: ["Alice", "Bob", "Carol"],
        columnLabels: [1, 2, 3],
        grid: [
          [false, null, null],
          [null, null, null],
          [null, null, null],
        ],
      },
    };
    const state = makeGameState({
      derivedMatrixHistory: [
        makeGameState().derivedMatrixHistory[0],
        secondMatrix,
      ],
    });

    const newState = gameReducer(state, {action: "undo"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
  });

  test("does not go below a history length of 1", () => {
    const state = makeGameState(); // already only 1 snapshot

    const newState = gameReducer(state, {action: "undo"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// changeEasyTrue
// ---------------------------------------------------------------------------
describe('gameReducer – "changeEasyTrue" action', () => {
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

// ---------------------------------------------------------------------------
// changeShowViolations
// ---------------------------------------------------------------------------
describe('gameReducer – "changeShowViolations" action', () => {
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
