import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import Counter from "./models/counter.js";

// Routes
import adminRoutes from "./routes/adminRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import salaryRoutes from "./routes/salaryRoute.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import studentRoutes from "./routes/student.routes.js";
import courseRoutes from "./routes/courses.js";
import clientRoutes from "./routes/clientRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import guestRoutes from "./routes/guestsController.js";
import documentationRoutes from "./routes/documentationRoutes.js";

dotenv.config();

// ================= DATABASE =================
connectDB();

const app = express();

// ================= COUNTER INITIALIZATION =================
const initCounter = async () => {
  try {
    const counter = await Counter.findById("client_project_number");

    if (!counter) {
      await Counter.create({
        _id: "client_project_number",
        seq: 1000,
      });

      console.log("✅ Counter initialized → Next Project: PROJ-001001");
    } else {
      console.log(
        `✅ Counter exists → Next Project: PROJ-${String(
          counter.seq + 1
        ).padStart(6, "0")}`
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize counter:", error);
  }
};

initCounter();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= CORS =================

const allowedOrigins = [
  "https://crm.ssinfotech.co.in",
  "https://crm-backned-v1.onrender.com",
  "https://ssinfotech-crm.netlify.app",
  "http://localhost:5173",
];

const corsOptions = {
  origin(origin, callback) {
    // Allow Postman, Mobile Apps & Server-to-Server requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked Origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],
};

app.use(cors(corsOptions));

// Express 5 Compatible
app.options(/.*/, cors(corsOptions));

// ================= REQUEST LOGGER =================

app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.originalUrl} | Origin: ${
      req.headers.origin || "No Origin"
    }`
  );
  next();
});

// ================= ROUTES =================

app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/lead", leadRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/documentation", documentationRoutes);

// ================= ROOT =================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CRM Backend Running 🚀",
  });
});

// ================= 404 =================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
  });
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});