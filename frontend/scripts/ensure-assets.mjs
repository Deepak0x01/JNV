import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "assets");
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);
const JPG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  "base64"
);

const files = {
  "hostel-building.png": PNG,
  "auth-illustration.jpg": JPG,
  "welcome-room-banner.png": PNG,
  "students-group.png": PNG,
  "occupied-room.png": PNG,
  "vacant-room.png": PNG,
  "fee-payment.png": PNG,
};

mkdirSync(dir, { recursive: true });
const made = [];
for (const [name, data] of Object.entries(files)) {
  const p = join(dir, name);
  if (!existsSync(p)) {
    writeFileSync(p, data);
    made.push(name);
  }
}
if (made.length) console.log(`[assets] created placeholder(s) for missing image(s): ${made.join(", ")}`);
