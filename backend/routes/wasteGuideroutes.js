const express = require("express");
const router = express.Router();
const WasteGuide = require("../models/WasteGuide");

router.get("/:itemName", async (req, res) => {
  try {
    const itemName = req.params.itemName;

    const guide = await WasteGuide.findOne({
      itemName: { $regex: new RegExp(`^${itemName}$`, "i") }
    });

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "Waste guide not found"
      });
    }

    res.json({
  success: true,
  itemName: guide.itemName,
  material: guide.material,
  guidance: guide.guidance,
  commonMistake: guide.commonMistake,
  videoUrl: guide.videoUrl,
  disposalByPart: guide.disposalByPart,
  recyclingCenters: guide.recyclingCenters
});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;