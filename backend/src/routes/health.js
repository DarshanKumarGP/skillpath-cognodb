import { Router } from "express";
import { getDriver, getConnectionError, initDriver } from "../db/driver.js";

const router = Router();

// GET /api/health — lets the frontend show a clear "database unreachable"
// state instead of a generic crash when CognoDB is unpaused/asleep or
// misconfigured.
router.get("/", async (req, res) => {
  let driver = getDriver();
  if (!driver) {
    driver = await initDriver(); // retry once, in case CognoDB was cold-starting
  }
  if (!driver) {
    return res.status(503).json({
      ok: false,
      error: getConnectionError() || "Database unavailable",
    });
  }
  try {
    await driver.verifyConnectivity();
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

export default router;
