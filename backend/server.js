require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const classifyRoutes = require("./routes/classify");
const vision = require("@google-cloud/vision");
const client = new vision.ImageAnnotatorClient();


const app = express();

connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});
app.use("/api/classify", classifyRoutes);

const wasteGuideRoutes = require("./routes/wasteGuideRoutes");
app.use("/api/waste-guide", wasteGuideRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
console.log("GOOGLE_APPLICATION_CREDENTIALS:", process.env.GOOGLE_APPLICATION_CREDENTIALS);