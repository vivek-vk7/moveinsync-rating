import "dotenv/config";

// Package ID = text after "id=" in the Play Store URL:
// https://play.google.com/store/apps/details?id=<PACKAGE_ID>
// VERIFY before running. Add the driver app too if you find it.
export const APPS = {
  employee: "com.moveinsync.ets", // <-- verify on the Play Store
  // driver: "PUT_DRIVER_APP_ID_HERE",
  driver: "com.moveinsync.driver.app",
};

export const LANG = "en";
export const COUNTRY = "in";
export const MAX_REVIEWS_PER_RUN = 100; // cap per app per run
export const SINCE = null; // e.g. "2024-01-01" to limit history

// owner: app = product/engineering can fix, ops = service delivery (app only gets blamed),
//        mixed = needs both, none = not a problem
export const TAXONOMY = {
  login_onboarding:    { owner: "app",   desc: "Cannot log in, OTP/login failure, account or employee ID not found, roster/shift not loaded after onboarding" },
  booking_failure:     { owner: "app",   desc: "Cannot book, cancel or modify a trip, booking errors, shift/roster not showing, self-booking friction" },
  eta_pickup_time:     { owner: "mixed", desc: "Pickup time wrong, changes late, ETA inaccurate or not shown" },
  late_or_no_cab:      { owner: "ops",   desc: "Cab late, no-show, not assigned, long waits, trip cancelled by operator" },
  live_tracking:       { owner: "app",   desc: "Live map not updating, wrong vehicle location, vehicle change not reflected in app" },
  safety_verification: { owner: "mixed", desc: "Boarding OTP, driver verification, SOS, women safety, unsafe driving" },
  route_driver:        { owner: "ops",   desc: "Wrong or long route, rude/unsafe driver, vehicle condition, AC, cleanliness" },
  crash_performance:   { owner: "app",   desc: "Crash, freeze, white screen, slowness, battery drain, broken after update" },
  notifications:       { owner: "app",   desc: "Missing, late or duplicate notifications, confirmation prompt disappearing" },
  support_escalation:  { owner: "mixed", desc: "Complaint ignored, no support response, feedback/complaint form not working" },
  ui_ux:               { owner: "app",   desc: "Confusing UI, missing features, feature requests" },
  positive_or_other:   { owner: "none",  desc: "Praise, vague, one-word, spam or unrelated reviews" },
  vague_negative: { owner: "none", desc: "Negative but no specific problem" }
};
export const OWNER_LABEL = { app: "App fixable", ops: "Operational", mixed: "Mixed", none: "No issue" };
