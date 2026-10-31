const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendCredentialsEmail } = require("../utils/mailer");

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generatePassword(length = 10) {
  let out = "";
  for (let i = 0; i < length; i += 1) out += CHARS[crypto.randomInt(CHARS.length)];
  return out;
}

async function createAccount({ name, email, phone = "", userType, studentId = "" }) {
  const password = generatePassword();
  const user = await User.create({
    name,
    email,
    phone,
    userType,
    studentId,
    role: userType === "student" ? "Student" : "System Administrator",
    passwordHash: await bcrypt.hash(password, 10),
  });
  return { user, password };
}

async function mailCredentials({ user, password }) {
  try {
    return await sendCredentialsEmail({ to: user.email, name: user.name, password, role: user.role });
  } catch (err) {
    console.error("Could not send login details email:", err.message);
    return false;
  }
}

module.exports = { generatePassword, createAccount, mailCredentials };
