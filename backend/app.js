const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const message =
      field === "email"
        ? "An account with this email already exists."
        : field === "roomNo"
        ? "A room with this number already exists."
        : "This record already exists.";
    return res.status(409).json({ message });
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({ message: errors[0]?.message || "Validation failed", errors });
  }

  if (err.name === "CastError") {
    return res.status(404).json({ message: "Record not found." });
  }

  if (!err.status || err.status >= 500) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : "Something went wrong." });
});

module.exports = app;
