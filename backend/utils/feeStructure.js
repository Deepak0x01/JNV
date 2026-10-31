const ANNUAL_FEE_BY_CAPACITY = { 4: 12000, 3: 18000, 2: 24000, 1: 60000 };

const NAME_TO_CAPACITY = {
  "four share": 4,
  "four sharing": 4,
  "4 share": 4,
  "4 sharing": 4,
  quad: 4,
  triple: 3,
  "three share": 3,
  double: 2,
  "two share": 2,
  single: 1,
};

function annualFeeFor(roomType, roomTypes = []) {
  const name = String(roomType || "").trim().toLowerCase();
  if (!name) return null;
  const configured = roomTypes.find((t) => String(t.name).trim().toLowerCase() === name);
  const capacity = NAME_TO_CAPACITY[name] || (configured && configured.capacity);
  return ANNUAL_FEE_BY_CAPACITY[capacity] || null;
}

function academicYear(now = new Date()) {
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return { start: `${startYear}-06-01`, end: `${startYear + 1}-05-31`, label: `${startYear}-${String(startYear + 1).slice(2)}` };
}

module.exports = { annualFeeFor, academicYear, ANNUAL_FEE_BY_CAPACITY };
