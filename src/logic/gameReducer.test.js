import {gameReducer} from "./gameReducer.js";

// ---------------------------------------------------------------------------
// Minimal fake game state used across tests
// ---------------------------------------------------------------------------

const initialMatrix = {
  1: {grid: [[null, null], [null, null]]},
};

const makeState = (overrides = {}) => ({
  clues: [
    {text: "Clue A", crossedOff: false},
    {text: "Clue B", crossedOff: false},
    {text: "Clue C", crossedOff: false},
  ],
  derivedMatrixHistory: [initialMatrix],
  easyTrue: false,
  showViolations: false,
  ...overrides,
});

// ---------------------------------------------------------------------------
// reset action
// ---------------------------------------------------------------------------

describe("gameReducer — reset action", () => {
  test("trims derivedMatrixHistory back to just the first entry", () => {
    const secondMatrix = {1: {grid: [[true, false], [false, true]]}};
    const state = makeState({
      derivedMatrixHistory: [initialMatrix, secondMatrix],
    });

    const next = gameReducer(state, {action: "reset"});

    expect(next.derivedMatrixHistory).toHaveLength(1);
    expect(next.derivedMatrixHistory[0]).toBe(initialMatrix);
  });

  test("resets all crossed-off clues back to false", () => {
    const state = makeState({
      clues: [
        {text: "Clue A", crossedOff: true},
        {text: "Clue B", crossedOff: true},
        {text: "Clue C", crossedOff: false},
      ],
    });

    const next = gameReducer(state, {action: "reset"});

    next.clues.forEach((clue) => {
      expect(clue.crossedOff).toBe(false);
    });
  });

  test("preserves clue text when resetting crossedOff", () => {
    const state = makeState({
      clues: [
        {text: "Clue A", crossedOff: true},
        {text: "Clue B", crossedOff: false},
      ],
    });

    const next = gameReducer(state, {action: "reset"});

    expect(next.clues[0].text).toBe("Clue A");
    expect(next.clues[1].text).toBe("Clue B");
  });

  test("does not mutate the original state's clues array", () => {
    const state = makeState({
      clues: [
        {text: "Clue A", crossedOff: true},
        {text: "Clue B", crossedOff: true},
      ],
    });

    gameReducer(state, {action: "reset"});

    // Original clues must remain untouched
    expect(state.clues[0].crossedOff).toBe(true);
    expect(state.clues[1].crossedOff).toBe(true);
  });

  test("preserves other state properties (easyTrue, showViolations, etc.)", () => {
    const state = makeState({easyTrue: true, showViolations: true});

    const next = gameReducer(state, {action: "reset"});

    expect(next.easyTrue).toBe(true);
    expect(next.showViolations).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setClueCrossedOff action
// ---------------------------------------------------------------------------

describe("gameReducer — setClueCrossedOff action", () => {
  test("toggles a clue from false to true", () => {
    const state = makeState();

    const next = gameReducer(state, {action: "setClueCrossedOff", index: 1});

    expect(next.clues[1].crossedOff).toBe(true);
    // Sibling clues must be untouched
    expect(next.clues[0].crossedOff).toBe(false);
    expect(next.clues[2].crossedOff).toBe(false);
  });

  test("toggles a clue from true back to false", () => {
    const state = makeState({
      clues: [
        {text: "Clue A", crossedOff: false},
        {text: "Clue B", crossedOff: true},
        {text: "Clue C", crossedOff: false},
      ],
    });

    const next = gameReducer(state, {action: "setClueCrossedOff", index: 1});

    expect(next.clues[1].crossedOff).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// undo action
// ---------------------------------------------------------------------------

describe("gameReducer — undo action", () => {
  test("removes the last entry from derivedMatrixHistory", () => {
    const secondMatrix = {1: {grid: [[true, false], [false, true]]}};
    const state = makeState({
      derivedMatrixHistory: [initialMatrix, secondMatrix],
    });

    const next = gameReducer(state, {action: "undo"});

    expect(next.derivedMatrixHistory).toHaveLength(1);
    expect(next.derivedMatrixHistory[0]).toBe(initialMatrix);
  });

  test("will not reduce derivedMatrixHistory below length 1", () => {
    const state = makeState(); // already only 1 entry

    const next = gameReducer(state, {action: "undo"});

    expect(next.derivedMatrixHistory).toHaveLength(1);
  });
});
