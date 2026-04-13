import Project from "../models/Project.js";
import Client from "../models/Client.js";
import Employee from "../models/employeeModel.js";

// Helper: Priority order for sorting
const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

export const getProjects = async (req, res) => {
  try {
    const { search, status, priority, sortBy } = req.query;

    // Build search query (project name, desc + client name/company)
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "all") query.status = status;
    if (priority && priority !== "all") query.priority = priority;

    // Dynamic sorting
    let sort = {};
    switch (sortBy) {
      case "priority":
        sort = { priority: -1 }; // Urgent first
        break;
      case "progress":
        sort = { progress: -1 };
        break;
      case "budget":
        sort = { budget: -1 };
        break;
      case "name":
        sort = { name: 1 };
        break;
      case "endDate":
        sort = { endDate: 1 };
        break;
      default:
        sort = { createdAt: -1 }; // newest first by default
    }

    const projects = await Project.find(query)
      .populate("client", "name email company")
      .populate("teamMembers", "name email position") // position hai tere model mein
      .sort(sort)
      .lean(); // faster

    // Efficient stats
    const stats = projects.reduce(
      (acc, p) => {
        acc.total++;
        if (p.status === "In Progress") acc.inProgress++;
        if (p.status === "Completed") acc.completed++;
        acc.totalBudget += p.budget;
        return acc;
      },
      { total: 0, inProgress: 0, completed: 0, totalBudget: 0 }
    );

    res.json({ success: true, projects, stats });
  } catch (err) {
    console.error("Get Projects Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client", "name email company")
      .populate("teamMembers", "name email position");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.json({ success: true, project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createProject = async (req, res) => {
  try {
    const { client, teamMembers = [], ...projectData } = req.body;

    // Validate Client
    const clientDoc = await Client.findById(client);
    if (!clientDoc) {
      return res.status(400).json({ success: false, message: "Invalid client selected" });
    }

    // Validate Team Members
    if (teamMembers.length > 0) {
      const validMembers = await Employee.find({ _id: { $in: teamMembers } });
      if (validMembers.length !== teamMembers.length) {
        return res.status(400).json({ success: false, message: "One or more team members are invalid" });
      }
    }

    // Create Project
    const project = await Project.create({
      ...projectData,
      client,
      teamMembers,
      budget: Number(projectData.budget),
      progress: Number(projectData.progress) || 0,
    });

    // Increment project count on Client (Safe increment)
    await Client.findByIdAndUpdate(client, { $inc: { projects: 1 } });

    // Populate response
    const populatedProject = await Project.findById(project._id)
      .populate("client", "name email company")
      .populate("teamMembers", "name email position");

    res.status(201).json({ success: true, project: populatedProject });
  } catch (err) {
    console.error("Create Project Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to create project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { client, teamMembers, ...updateData } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    let oldClientId = project.client.toString();

    // If client changed
    if (client && client !== oldClientId) {
      const newClient = await Client.findById(client);
      if (!newClient) {
        return res.status(400).json({ success: false, message: "Invalid client" });
      }

      // Decrement old, increment new (only if old client exists and not being reused)
      await Client.findByIdAndUpdate(oldClientId, { $inc: { projects: -1 } });
      await Client.findByIdAndUpdate(client, { $inc: { projects: 1 } });
      project.client = client;
    }

    // Validate team members if provided
    if (teamMembers) {
      if (teamMembers.length > 0) {
        const validMembers = await Employee.find({ _id: { $in: teamMembers } });
        if (validMembers.length !== teamMembers.length) {
          return res.status(400).json({ success: false, message: "Invalid team member(s)" });
        }
      }
      project.teamMembers = teamMembers;
    }

    // Update other fields
    Object.keys(updateData).forEach((key) => {
      if (key === "budget" || key === "progress") {
        project[key] = Number(updateData[key]);
      } else {
        project[key] = updateData[key];
      }
    });

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("client", "name email company")
      .populate("teamMembers", "name email position");

    res.json({ success: true, project: populated });
  } catch (err) {
    console.error("Update Project Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Decrement project count on client
    await Client.findByIdAndUpdate(project.client, { $inc: { projects: -1 } });

    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete Project Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// GET /api/employee/projects → My Assigned Projects (Employee Only)
export const getMyAssignedProjects = async (req, res) => {
  try {
    const employeeId = req.user?._id || req.user?.id;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // Find projects where this employee is in teamMembers
    const projects = await Project.find({ teamMembers: employeeId })
      .populate("client", "name company email")
      .populate("teamMembers", "name email position photo")
      .sort({ createdAt: -1 })
      .lean();

    // Stats for employee dashboard
    const stats = {
      total: projects.length,
      inProgress: projects.filter(p => p.status === "In Progress").length,
      completed: projects.filter(p => p.status === "Completed").length,
      pending: projects.filter(p => p.status === "Pending").length,
      totalBudget: projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
    };

    res.json({
      success: true,
      message: "Your assigned projects",
      projects,
      stats,
    });

  } catch (err) {
    console.error("Employee Get Projects Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Optional: Get single project detail (if employee is in team)
export const getMyProjectById = async (req, res) => {
  try {
    const employeeId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const project = await Project.findOne({
      _id: id,
      teamMembers: employeeId,
    })
      .populate("client", "name company email")
      .populate("teamMembers", "name email position photo");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    res.json({
      success: true,
      project,
    });

  } catch (err) {
    console.error("Employee Get Project By ID Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};