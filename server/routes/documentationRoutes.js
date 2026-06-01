// server/routes/documentationRoutes.js
import { Router } from "express";
import { protectEmployee } from "../middleware/authEmployee.js";
import { authenticate }    from "../middleware/auth.js";
import uploadDoc           from "../middleware/upload.js";

import {
  searchCollaborators,
  createDocumentation,
  getMyDocumentation,
  getContributedDocumentation,
  updateMyContribution,
  updateDocumentation,
  deleteDocumentation,
  getAllDocumentation,
  getDocumentById,
  approveDocumentation,
  rejectDocumentation,
  addReviewNote,
  getDocumentationStats,
} from "../controllers/documentationController.js";

const router = Router();

/* ── EMPLOYEE ─────────────────────────────────────────── */
router.get ("/collaborators/search",  protectEmployee, searchCollaborators);
router.get ("/my",                    protectEmployee, getMyDocumentation);
router.get ("/contributed",           protectEmployee, getContributedDocumentation);
router.patch("/:id/my-contribution",  protectEmployee, updateMyContribution);
router.post ("/",    protectEmployee, uploadDoc.single("file"), createDocumentation);
router.put  ("/:id", protectEmployee, uploadDoc.single("file"), updateDocumentation);
router.delete("/:id",protectEmployee, deleteDocumentation);

/* ── ADMIN ───────────────────────────────────────────── */
// injectAdmin middleware bridges req.user → req.admin
// so controllers that use req.admin._id work correctly
router.get  ("/admin/stats",          authenticate, injectAdmin, getDocumentationStats);
router.get  ("/admin/all",            authenticate, injectAdmin, getAllDocumentation);
router.get  ("/admin/:id",            authenticate, injectAdmin, getDocumentById);
router.patch("/admin/:id/approve",    authenticate, injectAdmin, approveDocumentation);
router.patch("/admin/:id/reject",     authenticate, injectAdmin, rejectDocumentation);
router.post ("/admin/:id/note",       authenticate, injectAdmin, addReviewNote);

export default router;

/* ─── local helper — runs after authenticate ─────────────
   authenticate sets req.user (from Admin or User model)
   Controllers expect req.admin  → bridge them here
   Also provides a safe fallback name for review notes
──────────────────────────────────────────────────────── */
function injectAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  // Make req.admin an alias of req.user so controllers work
  req.admin = req.user;
  // Ensure .name always has a value for review notes
  req.admin.name = req.user.name || req.user.email || "Admin";
  next();
}