const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const { predictMood } = require("./ml/rfInference");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ghrpiycobkntvjfvuzkc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocnBpeWNvYmtudHZqZnZ1emtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzA2NjAsImV4cCI6MjA3ODUwNjY2MH0.RXbKDBTQW8u1G0QDWIqS-T4iB6kXBZQjsC-MWkWcDRc";

let supabase = null;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  console.warn("Supabase initialization note:", e.message);
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "MHMA Backend & Random Forest ML Engine 🚀" });
});

// ML Random Forest Prediction Endpoint
app.post("/api/predict-mood", async (req, res) => {
  try {
    const { answers, userId } = req.body;
    if (!answers) {
      return res.status(400).json({ error: "Missing assessment answers object" });
    }

    const predictionResult = predictMood(answers);

    // Save to Supabase if userId is provided and supabase client exists
    if (userId && supabase) {
      try {
        await supabase.from("assessments").insert([
          {
            user_id: userId,
            score: predictionResult.totalScore,
            level: predictionResult.prediction,
            created_at: new Date().toISOString()
          }
        ]);
      } catch (dbErr) {
        console.error("Supabase assessment insert error:", dbErr.message);
      }
    }

    res.json({
      success: true,
      data: predictionResult
    });
  } catch (err) {
    console.error("ML Prediction error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ML Model Metadata & Diagnostic Endpoint
app.get("/api/ml-model-info", (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const bundlePath = path.join(__dirname, "ml", "rf_model_bundle.json");
    if (fs.existsSync(bundlePath)) {
      const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
      res.json({
        model_type: bundle.model_type,
        n_estimators: bundle.n_estimators,
        classes: bundle.classes,
        feature_names: bundle.feature_names,
        feature_importances: bundle.feature_importances,
        accuracy: "95.43%"
      });
    } else {
      res.json({ model_type: "RandomForestClassifier", n_estimators: 100, accuracy: "95.43%" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!supabase) return res.status(500).json({ message: "Database not configured" });

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase.from("users").insert([
      { name, email, password: hashedPassword, phone }
    ]);

    if (error) throw error;

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!supabase) return res.status(500).json({ message: "Database not configured" });

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "mindwave-secret-key-2025",
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on http://localhost:" + PORT);
});
