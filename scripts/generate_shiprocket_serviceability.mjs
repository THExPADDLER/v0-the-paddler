import fs from "node:fs"
import path from "node:path"

const [, , sourceArg] = process.argv

if (!sourceArg) {
  console.error(
    "Usage: node scripts/generate_shiprocket_serviceability.mjs <shiprocket-csv-path>"
  )
  process.exit(1)
}

const source = path.resolve(sourceArg)
const output = path.resolve("lib/shiprocket-serviceable-pincodes.json")

if (!fs.existsSync(source)) {
  console.error(`CSV not found: ${source}`)
  process.exit(1)
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      cell += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(cell)
      cell = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1
      }
      row.push(cell)
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row)
      }
      row = []
      cell = ""
      continue
    }

    cell += char
  }

  row.push(cell)
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row)
  }

  return rows
}

function titleCity(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function estimateDays(zones) {
  const zoneDays = {
    z_a: 3,
    z_b: 4,
    z_c: 5,
    z_d: 6,
    z_e: 7,
  }

  return zones.reduce((max, zone) => Math.max(max, zoneDays[zone] || 7), 3)
}

const text = fs.readFileSync(source, "utf8").replace(/^\uFEFF/, "")
const rows = parseCsv(text)
const headers = rows.shift()?.map((header) => header.trim()) || []
const required = ["Delivery City", "Delivery Pincode", "Courier", "Zone"]
const missing = required.filter((column) => !headers.includes(column))

if (missing.length > 0) {
  console.error(`CSV is missing columns: ${missing.join(", ")}`)
  process.exit(1)
}

const indexByHeader = Object.fromEntries(
  headers.map((header, index) => [header, index])
)
const grouped = new Map()

for (const row of rows) {
  const pincode = String(row[indexByHeader["Delivery Pincode"]] || "")
    .replace(/\D/g, "")
    .slice(0, 6)
  const city = titleCity(row[indexByHeader["Delivery City"]])
  const courier = String(row[indexByHeader["Courier"]] || "").trim()
  const zone = String(row[indexByHeader["Zone"]] || "").trim()

  if (pincode.length !== 6 || !courier) {
    continue
  }

  if (!grouped.has(pincode)) {
    grouped.set(pincode, {
      cities: new Set(),
      couriers: new Set(),
      zones: new Set(),
    })
  }

  const group = grouped.get(pincode)
  if (city) group.cities.add(city)
  group.couriers.add(courier)
  if (zone) group.zones.add(zone)
}

const records = Object.fromEntries(
  [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pincode, group]) => {
      const cities = [...group.cities].sort()
      const couriers = [...group.couriers].sort()
      const zones = [...group.zones].sort()

      return [
        pincode,
        {
          city: cities[0] || "",
          cities,
          couriers,
          zones,
          estimatedDeliveryDays: estimateDays(zones),
        },
      ]
    })
)

fs.writeFileSync(output, JSON.stringify(records), "utf8")
console.log(
  `Wrote ${Object.keys(records).length} serviceable pincodes to ${output}`
)
