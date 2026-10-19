import { isAnalyticsEnabled } from "./analyticsConfig";

describe("analytics configuration", () => {
  test("stays disabled unless the build explicitly opts in", () => {
    expect(isAnalyticsEnabled({
      REACT_APP_FIREBASE_MEASUREMENT_ID: "G-EXAMPLE"
    })).toBe(false);
  });

  test("requires both explicit enablement and a measurement id", () => {
    expect(isAnalyticsEnabled({
      REACT_APP_ANALYTICS_ENABLED: "true",
      REACT_APP_FIREBASE_MEASUREMENT_ID: "G-EXAMPLE"
    })).toBe(true);
    expect(isAnalyticsEnabled({ REACT_APP_ANALYTICS_ENABLED: "true" })).toBe(false);
  });
});
