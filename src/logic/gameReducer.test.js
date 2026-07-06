import {gameReducer} from "./gameReducer.js";

// ---------------------------------------------------------------------------
// Shared test fixtures
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

const makeGameState = (overrides = {}) => ({
  clues: [
    {clueType: "not", clueParameters: {itemA: "Alice", itemB: 1}, crossedOff: false},
    {clueType: "not", clueParameters: {itemA: "Bob",   itemB: 2}, crossedOff: false},
    {clueType: "not", clueParameters: {itemA: "Carol", itemB: 3}, crossedOff: false},
  ],
  derivedMatrixHistory: [baseMatrix],
  easyTrue: false,
  showViolations: false,
  ...overrides,
});

// ---------------------------------------------------------------------------
// reset action
// ---------------------------------------------------------------------------

describe("gameReducer — reset action", () => {
  test("resets derivedMatrixHistory to only the first entry", () => {
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
      derivedMatrixHistory: [baseMatrix, secondMatrix],
    });

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
    expect(newState.derivedMatrixHistory[0]).toEqual(baseMatrix);
  });

  test("resets all crossedOff flags to false when some clues are crossed off", () => {
    const state = makeGameState({
      clues: [
        {clueType: "not", clueParameters: {itemA: "Alice", itemB: 1}, crossedOff: true},
        {clueType: "not", clueParameters: {itemA: "Bob",   itemB: 2}, crossedOff: true},
        {clueType: "not", clueParameters: {itemA: "Carol", itemB: 3}, crossedOff: false},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("crossedOff flags remain false after reset when none were crossed off", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {action: "reset"});

    newState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("preserves all other clue properties when resetting crossedOff", () => {
    const state = makeGameState({
      clues: [
        {clueType: "not", clueParameters: {itemA: "Alice", itemB: 1}, crossedOff: true},
      ],
    });

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.clues[0].clueType).toBe("not");
    expect(newState.clues[0].clueParameters).toEqual({itemA: "Alice", itemB: 1});
    expect(newState.clues[0].crossedOff).toBe(false);
  });

  test("does not mutate the original state's clues", () => {
    const state = makeGameState({
      clues: [
        {clueType: "not", clueParameters: {itemA: "Alice", itemB: 1}, crossedOff: true},
      ],
    });

    gameReducer(state, {action: "reset"});

    // Original clue should still be crossed off — state was not mutated
    expect(state.clues[0].crossedOff).toBe(true);
  });

  test("preserves other game state fields unchanged", () => {
    const state = makeGameState({easyTrue: true, showViolations: true});

    const newState = gameReducer(state, {action: "reset"});

    expect(newState.easyTrue).toBe(true);
    expect(newState.showViolations).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setClueCrossedOff action
// ---------------------------------------------------------------------------

describe("gameReducer — setClueCrossedOff action", () => {
  test("toggles crossedOff from false to true", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {action: "setClueCrossedOff", index: 0});

    expect(newState.clues[0].crossedOff).toBe(true);
    // Other clues should be unaffected
    expect(newState.clues[1].crossedOff).toBe(false);
    expect(newState.clues[2].crossedOff).toBe(false);
  });

  test("toggles crossedOff from true back to false", () => {
    const state = makeGameState({
      clues: [
        {clueType: "not", clueParameters: {itemA: "Alice", itemB: 1}, crossedOff: true},
        {clueType: "not", clueParameters: {itemA: "Bob",   itemB: 2}, crossedOff: false},
      ],
    });

    const newState = gameReducer(state, {action: "setClueCrossedOff", index: 0});

    expect(newState.clues[0].crossedOff).toBe(false);
  });

  test("setClueCrossedOff followed by reset leaves all clues uncrossed", () => {
    const state = makeGameState();

    const crossedState = gameReducer(state, {action: "setClueCrossedOff", index: 1});
    expect(crossedState.clues[1].crossedOff).toBe(true);

    const resetState = gameReducer(crossedState, {action: "reset"});
    resetState.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// undo action
// ---------------------------------------------------------------------------

describe("gameReducer — undo action", () => {
  test("removes the last entry from derivedMatrixHistory", () => {
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
      derivedMatrixHistory: [baseMatrix, secondMatrix],
    });

    const newState = gameReducer(state, {action: "undo"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
    expect(newState.derivedMatrixHistory[0]).toEqual(baseMatrix);
  });

  test("does not reduce derivedMatrixHistory below length 1", () => {
    const state = makeGameState();

    const newState = gameReducer(state, {action: "undo"});

    expect(newState.derivedMatrixHistory).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// changeEasyTrue action
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

// ---------------------------------------------------------------------------
// changeShowViolations action
// ---------------------------------------------------------------------------

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
