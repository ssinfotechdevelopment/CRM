import { id } from "zod/v4/locales";
import Documentation from "../models/documentationModel.js";
import Employee from "../models/employeeModel.js";
import mongoose from "mongoose";
/* ─── shared helper: resolve & validate contributors ─── */
const resolveContributors = async (rawList) => {
  return Promise.all(
    rawList
      .filter((c) => c.employee)
      .map(async (c) => {
        const emp = await Employee.findById(c.employee).select("name email position department");
        return {
          employee: c.employee,
          name: emp?.name || "Unknown",
          email: emp?.email || "",
          position: emp?.position || "",
          department: emp?.department || "",
          contributionNote: c.contributionNote || "",
          contributionPercentage: Number(c.contributionPercentage || 0),
        };
      })
  );
};

const parseTags = (raw) => {
  if (!raw) return [];
  try { return JSON.parse(raw); }
  catch { return raw.split(",").map((t) => t.trim()).filter(Boolean); }
};

const parseContributors = (raw) => {
  if (!raw) return [];
  try { return JSON.parse(raw); }
  catch { return []; }
};

/* ═══════════════════════════════════════════════════════
   EMPLOYEE — COLLABORATOR SEARCH
   GET /api/documentation/collaborators/search?q=name
   Used by the "Add Collaborator" picker — like GitHub
═══════════════════════════════════════════════════════ */
export const searchCollaborators = async (req, res) => {
  try {
    const { q } = req.query;
    const currentId = req.employeeId;

    const filter = {
      _id: { $ne: currentId }, // exclude self
    };

    if (q?.trim()) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { position: { $regex: q, $options: "i" } },
      ];
    }

    const employees = await Employee.find(filter)
      .select("name email position department employeeType")
      .limit(10)
      .lean();

    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════
   EMPLOYEE ACTIONS
═══════════════════════════════════════════════════════ */

/**
 * POST /api/documentation
 * Create a new doc with GitHub-style collaborators
 */
export const createDocumentation = async (req, res) => {
  try {
    const employeeId = req.employeeId;
    const contributors = parseContributors(req.body.contributors);
    const tags = parseTags(req.body.tags);

    // Validate total %
    const totalPct = contributors.reduce((s, c) => s + Number(c.contributionPercentage || 0), 0);
    if (contributors.length > 0 && totalPct > 100) {
      return res.status(400).json({
        success: false,
        message: `Total contribution % (${totalPct}%) exceeds 100.`,
      });
    }

    // Prevent duplicate collaborators
    const uniqueIds = new Set(contributors.map((c) => String(c.employee)));
    if (uniqueIds.has(String(employeeId))) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a contributor.",
      });
    }
    if (uniqueIds.size !== contributors.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate contributors found. Each employee can only be added once.",
      });
    }

    const [resolvedContributors, uploader] = await Promise.all([
      resolveContributors(contributors),
      Employee.findById(employeeId).select("name"),
    ]);

    const doc = await Documentation.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || "Research",
      tags,
      fileUrl: req.file?.path || null,
      fileName: req.file?.originalname || null,
      fileType: req.file?.mimetype || null,
      uploadedBy: employeeId,
      uploaderName: uploader?.name || "Unknown",
      contributors: resolvedContributors,
      totalContributors: resolvedContributors.length,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Documentation submitted successfully. Awaiting admin review.",
      data: doc,
    });
  } catch (err) {
    console.error("createDocumentation:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/documentation/my
 * Employee views their own submissions
 */
export const getMyDocumentation = async (req, res) => {
  try {
    const docs = await Documentation.find({ uploadedBy: req.employeeId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/documentation/contributed
 * Employee sees all docs they are listed as contributor in
 */
export const getContributedDocumentation = async (req, res) => {
  try {
    const docs = await Documentation.find({
      "contributors.employee": req.employeeId,
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/documentation/:id
 * Employee edits their own PENDING doc
 */
export const updateDocumentation = async (req, res) => {
  try {
    const doc = await Documentation.findOne({
      _id: req.params.id,
      uploadedBy: req.employeeId,
    });

    if (!doc) return res.status(404).json({ success: false, message: "Document not found." });
    if (doc.status !== "Pending")
      return res.status(400).json({ success: false, message: "Only pending documents can be edited." });

    const { title, description, category, tags } = req.body;
    if (title) doc.title = title;
    if (description) doc.description = description;
    if (category) doc.category = category;
    if (tags) doc.tags = parseTags(tags);

    if (req.body.contributors) {
      const contributors = parseContributors(req.body.contributors);

      // Duplicate check
      const uniqueIds = new Set(contributors.map((c) => String(c.employee)));
      if (uniqueIds.has(String(req.employeeId))) {
        return res.status(400).json({ success: false, message: "You cannot add yourself as a contributor." });
      }
      if (uniqueIds.size !== contributors.length) {
        return res.status(400).json({ success: false, message: "Duplicate contributors found." });
      }

      const totalPct = contributors.reduce((s, c) => s + Number(c.contributionPercentage || 0), 0);
      if (totalPct > 100) {
        return res.status(400).json({ success: false, message: `Total contribution % (${totalPct}%) exceeds 100.` });
      }

      doc.contributors = await resolveContributors(contributors);
      doc.totalContributors = doc.contributors.length;
    }

    if (req.file) {
      doc.fileUrl = req.file.path;
      doc.fileName = req.file.originalname;
      doc.fileType = req.file.mimetype;
    }

    await doc.save();
    res.json({ success: true, message: "Document updated.", data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/documentation/:id
 */
export const deleteDocumentation = async (req, res) => {
  try {
    const doc = await Documentation.findOne({
      _id: req.params.id,
      uploadedBy: req.employeeId,
    });

    if (!doc) return res.status(404).json({ success: false, message: "Document not found." });
    if (doc.status !== "Pending")
      return res.status(400).json({ success: false, message: "Only pending documents can be deleted." });

    await doc.deleteOne();
    res.json({ success: true, message: "Document deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════
   ADMIN ACTIONS
═══════════════════════════════════════════════════════ */

/**
 * GET /api/documentation/admin/all
 * List all docs — admin sees contributor count prominently
 */
export const getAllDocumentation = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (category && category !== "all") filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { uploaderName: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { "contributors.name": { $regex: search, $options: "i" } },
      ];
    }

    const docs = await Documentation.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Attach a computed summary for admin table display
    const enriched = docs.map((d) => ({
      ...d,
      contributorSummary: {
        count: d.contributors?.length || 0,
        names: (d.contributors || []).map((c) => c.name),
        totalPct: (d.contributors || []).reduce((s, c) => s + (c.contributionPercentage || 0), 0),
      },
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/documentation/admin/:id
 * Full detail — populated contributors with name, email, dept, %
 */
export const getDocumentById = async (req, res) => {
  try {
    const doc = await Documentation.findById(req.params.id)
      .populate("uploadedBy", "name email department position")
      .populate("contributors.employee", "name email department position employeeType")
      .lean();

    if (!doc) return res.status(404).json({ success: false, message: "Document not found." });

    // Build contributor breakdown for admin
    const contributorBreakdown = (doc.contributors || []).map((c) => ({
      _id: c.employee?._id || c.employee,
      name: c.name || c.employee?.name,
      email: c.email || c.employee?.email,
      position: c.position || c.employee?.position,
      department: c.department || c.employee?.department,
      employeeType: c.employee?.employeeType,
      contributionNote: c.contributionNote,
      contributionPercentage: c.contributionPercentage,
    }));

    res.json({
      success: true,
      data: {
        ...doc,
        contributorBreakdown,
        contributorCount: contributorBreakdown.length,
        totalContributionPct: contributorBreakdown.reduce((s, c) => s + (c.contributionPercentage || 0), 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/documentation/admin/:id/approve
 */


export const approveDocumentation = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Approve Request");
    console.log("Document ID:", id);

    // Check ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    // Check Admin
    if (!req.admin) {
      console.log("Admin not found in request");

      return res.status(401).json({
        success: false,
        message: "Admin authentication failed",
      });
    }

    const doc = await Documentation.findById(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    doc.status = "Approved";
    doc.reviewedBy = req.admin._id;
    doc.reviewedAt = new Date();
    doc.rejectionReason = null;

    // Optional note
    if (req.body.note?.trim()) {
      doc.reviewNotes.push({
        addedBy: req.admin._id,
        adminName: req.admin.name || "Admin",
        note: req.body.note,
      });
    }

    await doc.save();

    console.log("Document Approved:", doc._id);

    return res.status(200).json({
      success: true,
      message: "Document approved successfully",
      data: doc,
    });

  } catch (error) {
    console.error("Approve Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * PATCH /api/documentation/admin/:id/reject
 */
export const rejectDocumentation = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim())
      return res.status(400).json({ success: false, message: "Rejection reason is required." });

    const doc = await Documentation.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found." });

    doc.status = "Rejected";
    doc.reviewedBy = req.admin._id;
    doc.reviewedAt = new Date();
    doc.rejectionReason = reason.trim();

    await doc.save();
    res.json({ success: true, message: "Document rejected.", data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/documentation/admin/:id/note
 */
export const addReviewNote = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note?.trim())
      return res.status(400).json({ success: false, message: "Note cannot be empty." });

    const doc = await Documentation.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found." });

    doc.reviewNotes.push({
      addedBy: req.admin._id,
      adminName: req.admin.name || "Admin",
      note: note.trim(),
    });

    await doc.save();
    res.json({ success: true, message: "Review note added.", data: doc.reviewNotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/documentation/admin/stats
 * Includes contributor breakdown across all docs
 */
export const getDocumentationStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, allDocs] = await Promise.all([
      Documentation.countDocuments(),
      Documentation.countDocuments({ status: "Pending" }),
      Documentation.countDocuments({ status: "Approved" }),
      Documentation.countDocuments({ status: "Rejected" }),
      Documentation.find().select("contributors").lean(),
    ]);

    // Total unique contributors across all docs
    const allContributorIds = new Set();
    let totalContributions = 0;
    allDocs.forEach((d) => {
      (d.contributors || []).forEach((c) => {
        allContributorIds.add(String(c.employee));
        totalContributions++;
      });
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        totalContributions,           // total contribution entries across all docs
        uniqueContributors: allContributorIds.size, // unique employees who contributed
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
/**
 * PUT /api/documentation/contribution/:id
 * Contributor updates their own contribution
 */
export const updateMyContribution = async (req, res) => {
  try {
    const employeeId = req.employeeId;
    const { contributionNote, contributionPercentage } = req.body;

    const doc = await Documentation.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    const contributorIndex = doc.contributors.findIndex(
      (c) => String(c.employee) === String(employeeId)
    );

    if (contributorIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not a contributor for this document.",
      });
    }

    // Update current contributor
    if (contributionNote !== undefined) {
      doc.contributors[contributorIndex].contributionNote =
        contributionNote.trim();
    }

    if (contributionPercentage !== undefined) {
      doc.contributors[contributorIndex].contributionPercentage =
        Number(contributionPercentage);
    }

    // Validate total contribution %
    const totalPct = doc.contributors.reduce(
      (sum, contributor) =>
        sum + Number(contributor.contributionPercentage || 0),
      0
    );

    if (totalPct > 100) {
      return res.status(400).json({
        success: false,
        message: `Total contribution percentage (${totalPct}%) cannot exceed 100%.`,
      });
    }

    await doc.save();

    res.json({
      success: true,
      message: "Contribution updated successfully.",
      data: doc.contributors[contributorIndex],
    });
  } catch (err) {
    console.error("updateMyContribution:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

