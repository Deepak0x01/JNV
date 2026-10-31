
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createAccount, mailCredentials } = require("../services/accounts");

async function main() {
  const [name, rawEmail, password] = process.argv.slice(2);
  if (!name || !rawEmail) {
    console.log('Usage: node scripts/createAdmin.js "Full Name" email@example.com ["Password"]');
    process.exit(1);
  }
  const email = rawEmail.trim().toLowerCase();
  if (password && password.length < 6) {
    console.log("Password must be at least 6 characters.");
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set in your .env file.");
  await mongoose.connect(process.env.MONGODB_URI);
  if (await User.exists({ email })) {
    console.log(`An account with ${email} already exists.`);
    return;
  }

  if (password) {
    await User.create({
      name: name.trim(),
      email,
      userType: "admin",
      role: "System Administrator",
      passwordHash: await bcrypt.hash(password, 10),
    });
    console.log(`Admin created: ${email}`);
  } else {
    const account = await createAccount({ name: name.trim(), email, userType: "admin" });
    const emailed = await mailCredentials(account);
    console.log(`Admin created: ${email}`);
    console.log(`Generated password: ${account.password}`);
    console.log(emailed ? "Login details were emailed." : "Email was not sent (SMTP not configured or failed).");
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
