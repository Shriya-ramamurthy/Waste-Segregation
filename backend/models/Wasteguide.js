const mongoose = require("mongoose");

const recyclingCenterSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { _id: false }
);

const wasteGuideSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    aliases: [String],
    material: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    recyclable: {
      type: Boolean,
      default: false,
    },
    guidance: {
      type: [String],
      required: true,
    },
    disposalByPart: {
      type: Map,
      of: String,
      default: {},
    },
    commonMistake: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    recyclingCenters: {
      type: [recyclingCenterSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WasteGuide", wasteGuideSchema);