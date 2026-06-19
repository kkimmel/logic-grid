import cloneDeep from "lodash.clonedeep";
import {gameReducer} from "./gameReducer.js";

// ---------------------------------------------------------------------------
// Minimal game-state fixture shared across all tests
// ---------------------------------------------------------------------------
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

const baseState = {
  id: "test-id",
  clues: [
    {text: "Clue 1", crossedOff: false},
    {text: "Clue 2", crossedOff: false},
  ],
  derivedMatrixHistory: [baseMatrix],
  numCategories: 2,
  numItemsPerCategory: 2,
  matrixRowLabels: ["Alice", "Bob"],
  matrixColumnLabels: [1, 2],
  easyTrue: false,
  showViolations: false,
  lastBreakingChange: "20230702",
};

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------
describe("reset", () => {
  test("resets derivedMatrixHistory to only the initial entry", () => {
    let state = cloneDeep(baseState);
    // Build up some history
    state = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    state = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 1,
      columnIndex: 1,
    });
    expect(state.derivedMatrixHistory.length).toBe(3);

    const resetState = gameReducer(state, {action: "reset"});
    expect(resetState.derivedMatrixHistory.length).toBe(1);
    expect(resetState.derivedMatrixHistory[0]).toEqual(baseMatrix);
  });

  test("resets all crossed-off clues back to false", () => {
    let state = cloneDeep(baseState);
    // Cross off both clues
    state = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    state = gameReducer(state, {action: "setClueCrossedOff", index: 1});
    expect(state.clues[0].crossedOff).toBe(true);
    expect(state.clues[1].crossedOff).toBe(true);

    const resetState = gameReducer(state, {action: "reset"});
    expect(resetState.clues[0].crossedOff).toBe(false);
    expect(resetState.clues[1].crossedOff).toBe(false);
  });

  test("preserves clue text and other clue fields when resetting crossedOff", () => {
    let state = cloneDeep(baseState);
    state = gameReducer(state, {action: "setClueCrossedOff", index: 0});

    const resetState = gameReducer(state, {action: "reset"});
    expect(resetState.clues[0].text).toBe("Clue 1");
    expect(resetState.clues[1].text).toBe("Clue 2");
  });

  test("does not affect other state fields", () => {
    const state = cloneDeep(baseState);
    const resetState = gameReducer(state, {action: "reset"});
    expect(resetState.easyTrue).toBe(state.easyTrue);
    expect(resetState.showViolations).toBe(state.showViolations);
    expect(resetState.numCategories).toBe(state.numCategories);
    expect(resetState.numItemsPerCategory).toBe(state.numItemsPerCategory);
    expect(resetState.id).toBe(state.id);
  });
});

// ---------------------------------------------------------------------------
// setClueCrossedOff
// ---------------------------------------------------------------------------
describe("setClueCrossedOff", () => {
  test("toggles crossedOff from false to true", () => {
    const state = cloneDeep(baseState);
    const next = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    expect(next.clues[0].crossedOff).toBe(true);
  });

  test("toggles crossedOff from true to false", () => {
    const state = cloneDeep(baseState);
    state.clues[0].crossedOff = true;
    const next = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    expect(next.clues[0].crossedOff).toBe(false);
  });

  test("only toggles the targeted clue index", () => {
    const state = cloneDeep(baseState);
    const next = gameReducer(state, {action: "setClueCrossedOff", index: 0});
    expect(next.clues[1].crossedOff).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// undo
// ---------------------------------------------------------------------------
describe("undo", () => {
  test("removes the last entry from derivedMatrixHistory", () => {
    let state = cloneDeep(baseState);
    state = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    expect(state.derivedMatrixHistory.length).toBe(2);

    const undoneState = gameReducer(state, {action: "undo"});
    expect(undoneState.derivedMatrixHistory.length).toBe(1);
  });

  test("does not reduce derivedMatrixHistory below length 1", () => {
    const state = cloneDeep(baseState);
    expect(state.derivedMatrixHistory.length).toBe(1);

    const undoneState = gameReducer(state, {action: "undo"});
    expect(undoneState.derivedMatrixHistory.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// changeCellState
// ---------------------------------------------------------------------------
describe("changeCellState", () => {
  test("cycles null -> false", () => {
    const state = cloneDeep(baseState);
    const next = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    const latestMatrix =
      next.derivedMatrixHistory[next.derivedMatrixHistory.length - 1];
    expect(latestMatrix["NameVsNumber"].grid[0][0]).toBe(false);
  });

  test("cycles false -> true", () => {
    const state = cloneDeep(baseState);
    state.derivedMatrixHistory[0]["NameVsNumber"].grid[0][0] = false;
    const next = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    const latestMatrix =
      next.derivedMatrixHistory[next.derivedMatrixHistory.length - 1];
    expect(latestMatrix["NameVsNumber"].grid[0][0]).toBe(true);
  });

  test("cycles true -> null", () => {
    const state = cloneDeep(baseState);
    state.derivedMatrixHistory[0]["NameVsNumber"].grid[0][0] = true;
    const next = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    const latestMatrix =
      next.derivedMatrixHistory[next.derivedMatrixHistory.length - 1];
    expect(latestMatrix["NameVsNumber"].grid[0][0]).toBeNull();
  });

  test("appends a new entry to derivedMatrixHistory", () => {
    const state = cloneDeep(baseState);
    const next = gameReducer(state, {
      action: "changeCellState",
      gridID: "NameVsNumber",
      rowIndex: 0,
      columnIndex: 0,
    });
    expect(next.derivedMatrixHistory.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// changeEasyTrue
// ---------------------------------------------------------------------------
describe("changeEasyTrue", () => {
  test("toggles easyTrue from false to true", () => {
    const state = cloneDeep(baseState);
    const next = gameReducer(state, {action: "changeEasyTrue"});
    expect(next.easyTrue).toBe(true);
  });

  test("toggles easyTrue from true to false", () => {
    const state = cloneDeep(baseState);
    state.easyTrue = true;
    const next = gameReducer(state, {action: "changeEasyTrue"});
    expect(next.easyTrue).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// changeShowViolations
// ---------------------------------------------------------------------------
describe("changeShowViolations", () => {
  test("toggles showViolations from false to true", () => {
    const state = cloneDeep(baseState);
    const next = gameReducer(state, {action: "changeShowViolations"});
    expect(next.showViolations).toBe(true);
  });

  test("toggles showViolations from true to false", () => {
    const state = cloneDeep(baseState);
    state.showViolations = true;
    const next = gameReducer(state, {action: "changeShowViolations"});
    expect(next.showViolations).toBe(false);
  });
});
