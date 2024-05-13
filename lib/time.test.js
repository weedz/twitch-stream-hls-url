import { test } from "node:test";
import assert from "node:assert";

import { calculateTimeDifference } from "./time.js";

test("time", t => {
    assert.deepStrictEqual(
        calculateTimeDifference(new Date("2024-01-01T13:37:00.000Z"), new Date("2024-01-01T13:39:00.000Z")),
        { hours: 0, minutes: 2, seconds: 0 }
    );
    assert.deepStrictEqual(
        calculateTimeDifference(new Date("2024-01-01T13:37:00.000Z"), new Date("2024-01-01T13:39:22.000Z")),
        { hours: 0, minutes: 2, seconds: 22 }
    );
    assert.deepStrictEqual(
        calculateTimeDifference(new Date("2024-01-01T13:37:00.000Z"), new Date("2024-01-01T14:39:00.000Z")),
        { hours: 1, minutes: 2, seconds: 0 }
    );
    assert.deepStrictEqual(
        calculateTimeDifference(new Date("2024-01-01T13:37:00.000Z"), new Date("2024-01-03T14:39:42.000Z")),
        { hours: 49, minutes: 2, seconds: 42 }
    );
});
