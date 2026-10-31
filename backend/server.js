const path = require("path");
const fs = require("fs");
// Always read the .env that sits next to this file, no matter which folder you start node from.
const envPath = path.join(__dirname, ".env");
require("dotenv").config({ path: envPath });
const bcrypt = require("bcryptjs");
const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/User");

const PORT = process.env.PORT || 5000;

// There is no public sign-up. If the database has no users yet, the first admin is
// created from SEED_ADMIN_* in .env (so you can log in and add everyone else).
async function seedFirstAdmin() {
  if (await User.estimatedDocumentCount()) return;
  const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    console.log(
      "No users exist yet. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env (or run `npm run create-admin`) to create the first admin."
    );
    return;
  }
  await User.create({
    name: SEED_ADMIN_NAME || "Administrator",
    email: SEED_ADMIN_EMAIL.trim().toLowerCase(),
    userType: "admin",
    role: "System Administrator",
    passwordHash: await bcrypt.hash(SEED_ADMIN_PASSWORD, 10),
  });
  console.log(`First admin created: ${SEED_ADMIN_EMAIL}`);
}

async function start() {
  if (!process.env.JWT_SECRET) {
    const hint = fs.existsSync(envPath)
      ? `Found ${envPath}, but it has no JWT_SECRET line. Add:  JWT_SECRET=any-long-random-text`
      : fs.existsSync(envPath + ".txt")
      ? `Your file is named ".env.txt". Rename it to ".env" (no .txt) inside ${__dirname}`
      : `No .env file found. Copy ".env.example" to ".env" inside ${__dirname} and fill it in.`;
    throw new Error(`JWT_SECRET is not set. ${hint}`);
  }
  await connectDB();
  await seedFirstAdmin();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
