const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

const RECYCLER_LOCATIONS = [
  { name: "@scrapuncle", cities: ["Delhi"] },
  { name: "@saahas_zero_waste", cities: ["Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Goa"] },
  { name: "@skrap.zerowaste", cities: ["Mumbai", "Bangalore"] },
  { name: "@indiawasted", cities: ["Chennai", "Bangalore"] },
  { name: "@recycle_bintix", cities: ["Chennai", "Navi Mumbai", "Lucknow", "Kolkata"] },
  { name: "@thekabadiwala", cities: ["Indore", "Bhopal", "Nagpur", "Raipur", "Lucknow", "Ahmedabad", "Jaipur", "Goa"] },
  { name: "@scrapq.recycle", cities: ["Hyderabad", "Visakhapatnam"] },
  { name: "Trash N Cash", cities: ["Trichy"], phone: "9043253707" },
];

const WASTE_MAP = {
  Ewaste: {
    wasteType: "E-Waste",
    material: "Electronic / hazardous",
    category: "E-waste",
    guidance: [
      "Do not throw in household waste.",
      "Store safely away from heat or water.",
      "Take to an approved e-waste collection center.",
    ],
  },
  Glass: {
    wasteType: "Non-biodegradable",
    material: "Glass",
    category: "Dry waste / recyclable",
    guidance: [
      "Empty and rinse the glass item.",
      "Do not mix broken glass with regular waste.",
      "Place in glass recycling if available locally.",
    ],
  },
  Metal: {
    wasteType: "Non-biodegradable",
    material: "Metal / Aluminum",
    category: "Dry waste / recyclable",
    guidance: [
      "Empty and rinse the metal item.",
      "Keep with other dry recyclable waste.",
      "Send to metal recycling or scrap collection.",
      "If aluminum foil — remove food residue, wash and dry before recycling.",
    ],
  },
  Mixed_Contaminated: {
    wasteType: "Non-biodegradable",
    material: "Mixed / contaminated waste",
    category: "General waste",
    guidance: [
      "Contaminated waste cannot be recycled.",
      "Try to separate components if possible.",
      "Dispose in general waste bin.",
    ],
  },
  Organic_Waste: {
    wasteType: "Biodegradable",
    material: "Organic waste",
    category: "Wet waste / compostable",
    guidance: [
      "Separate from any wrapper or packaging.",
      "Put in wet waste bin.",
      "Compost if composting is available.",
    ],
  },
  Paper_Cardboard: {
    wasteType: "Non-biodegradable",
    material: "Paper / Cardboard",
    category: "Dry waste / recyclable",
    guidance: [
      "Keep dry — wet paper is not recyclable.",
      "Remove staples and tape before recycling.",
      "Flatten cardboard boxes before recycling.",
      "Greasy or food-stained parts go in wet waste.",
    ],
  },
  Plastic: {
    wasteType: "Non-biodegradable",
    material: "Plastic",
    category: "Dry waste / recyclable",
    guidance: [
      "Empty the item completely.",
      "Remove leftover food or liquid.",
      "Keep clean plastic in dry waste or plastic recycling.",
    ],
  },
  Textile: {
    wasteType: "Non-biodegradable",
    material: "Clothes / textiles",
    category: "Reuse / donation / textile recycling",
    guidance: [
      "If usable, donate or pass on for reuse.",
      "If damaged, send for textile recycling.",
      "Keep clean and dry before giving to recycler.",
    ],
  },
};

function getLocationsByCity(city) {
  if (!city || !city.trim()) return [];
  const normalizedCity = city.trim().toLowerCase();
  return RECYCLER_LOCATIONS.filter((item) =>
    item.cities.some((c) => c.toLowerCase() === normalizedCity)
  );
}

function runPythonPredict(imagePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../predict.py");
    const python = spawn("python", [scriptPath, imagePath]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => { output += data.toString(); });
    python.stderr.on("data", (data) => { errorOutput += data.toString(); });

    python.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python error: ${errorOutput}`));
      } else {
        try {
          resolve(JSON.parse(output.trim()));
        } catch (e) {
          reject(new Error(`Failed to parse prediction: ${output}`));
        }
      }
    });
  });
}

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const userCity = req.body.city || "";

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const mlResult = await runPythonPredict(req.file.path);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const wasteInfo = WASTE_MAP[mlResult.class] || {
      wasteType: "Unknown",
      material: "Unknown material",
      category: "Check manually",
      guidance: ["Inspect the item manually.", "Follow local recycling rules."],
    };

    return res.json({
      success: true,
      detectedLabel: mlResult.class,
      confidence: mlResult.confidence,
      top3: mlResult.top3,
      ...wasteInfo,
      city: userCity,
      locations: getLocationsByCity(userCity),
    });

  } catch (error) {
    console.log("CLASSIFY ERROR:", error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "Image classification failed",
      error: error.message,
    });
  }
});

module.exports = router;