const typeOf = (req) => (req.user && req.user.userType) || "admin";

function requireAdmin(req, res, next) {
  if (typeOf(req) !== "admin") {
    return res.status(403).json({ message: "Only an admin can do this." });
  }
  next();
}

function requireStudent(req, res, next) {
  if (typeOf(req) !== "student" || !req.user.studentId) {
    return res.status(403).json({ message: "This action is only for student accounts." });
  }
  next();
}

module.exports = { requireAdmin, requireStudent };
