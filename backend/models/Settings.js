const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    hostelName: { type: String, default: "Sunrise Boys & Girls Hostel" },
    address: { type: String, default: "221 College Road, Panipat, Haryana" },
    paymentModes: { type: [String], default: ["Cash", "UPI", "Card", "Bank Transfer"] },
    roomTypes: {
      type: [{ _id: false, name: String, capacity: Number }],
      default: () => [
        { name: "Single", capacity: 1 },
        { name: "Double", capacity: 2 },
        { name: "Triple", capacity: 3 },
        { name: "Four Share", capacity: 4 },
      ],
    },
    notifications: {
      type: { _id: false, email: Boolean, sms: Boolean, push: Boolean },
      default: () => ({ email: true, sms: false, push: true }),
    },
  },
  { timestamps: true }
);

settingsSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.key;
    return ret;
  },
});

const Settings = mongoose.model("Settings", settingsSchema);

async function getSettings() {
  let s = await Settings.findOne({ key: "main" });
  if (!s) s = await Settings.create({ key: "main" });
  return s;
}

module.exports = Settings;
module.exports.getSettings = getSettings;
