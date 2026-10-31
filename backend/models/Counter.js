const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter = mongoose.model("Counter", counterSchema);

async function nextSeq(name) {
  const c = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
  return c.seq;
}

async function setSeq(name, seq) {
  await Counter.findOneAndUpdate({ _id: name }, { $set: { seq } }, { upsert: true });
}

module.exports = { Counter, nextSeq, setSeq };
