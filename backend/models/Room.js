const mongoose = require("mongoose");
const applyJson = require("../utils/json");

const roomSchema = new mongoose.Schema(
  {
    roomNo: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    block: { type: String, required: true },
    occupied: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

roomSchema.virtual("status").get(function status() {
  if (this.occupied <= 0) return "Vacant";
  return this.occupied >= this.capacity ? "Occupied" : "Partial";
});

applyJson(roomSchema);
module.exports = mongoose.model("Room", roomSchema);
