require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Student = require("../models/Student");
const User = require("../models/User");
const { createAccount, mailCredentials } = require("../services/accounts");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set in your .env file.");
  await mongoose.connect(process.env.MONGODB_URI);
  const students = await Student.find();
  let created = 0;
  for (const student of students) {
    if (await User.exists({ studentId: student.studentId })) continue;
    if (await User.exists({ email: student.email })) {
      console.log(`Skipped ${student.studentId} (${student.name}): ${student.email} already belongs to another account.`);
      continue;
    }
    const account = await createAccount({
      name: student.name,
      email: student.email,
      phone: student.phone,
      userType: "student",
      studentId: student.studentId,
    });
    const emailed = await mailCredentials(account);
    created += 1;
    console.log(`${student.studentId} ${student.email}: account created, ${emailed ? "email sent" : "email NOT sent"}`);
  }
  console.log(`Done. ${created} account(s) created.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
