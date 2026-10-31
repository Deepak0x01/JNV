const User = require("../models/User");
const { createAccount, mailCredentials } = require("../services/accounts");
const httpError = require("../utils/httpError");

const list = async (req, res) => {
  const admins = await User.find({ $or: [{ userType: "admin" }, { userType: { $exists: false } }] }).sort({
    createdAt: -1,
  });
  res.json({ admins });
};
const create = async (req, res) => {
  const { name, email } = req.body;
  if (await User.exists({ email })) throw httpError(409, "An account with this email already exists.");

  const account = await createAccount({ name, email, userType: "admin" });
  const emailed = await mailCredentials(account);
  res.status(201).json({
    message: emailed
      ? `Admin added. Login details were emailed to ${email}.`
      : `Admin added, but the login email could not be sent to ${email}. They can use "Forgot Password" to set a password.`,
    admin: account.user,
    emailed,
  });
};
module.exports = { list, create };
