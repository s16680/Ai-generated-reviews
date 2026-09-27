import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(express.json({ limit: "20kb" }));
app.use(express.static("public"));

app.get("/{*splat}", (req, res) => {
  const googleReviewUrl = process.env.GOOGLE_REVIEW_URL || "";
  res.type("application/javascript").send(
    `window.AL_TANDOOR_CONFIG = ${JSON.stringify({ googleReviewUrl })};`
  );
});

app.post("/api/generate-review", async (req, res) => {
  try {
    const { selections = [], note = "" } = req.body || {};
    const cleanSelections = Array.isArray(selections)
      ? selections.filter(x => typeof x === "string").slice(0, 8)
      : [];
    const cleanNote = typeof note === "string" ? note.trim().slice(0, 600) : "";

    if (!cleanSelections.length && !cleanNote) {
      return res.status(400).json({ error: "Please select at least one part of your experience." });
    }

    if (!client) {
      return res.status(503).json({ error: "AI is not configured yet. Add OPENAI_API_KEY on the server." });
    }

    const input = [
      `Customer-selected experience: ${cleanSelections.join(", ") || "none"}`,
      `Customer's optional words: ${cleanNote || "none"}`
    ].join("\n");

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: [
        "You help a restaurant customer express their genuine experience as a Google review.",
        "Use only the information supplied by the customer.",
        "Do not invent dishes, service details, prices, staff names, events, ratings, or claims.",
        "Do not turn mixed or negative feedback into positive feedback.",
        "Write naturally in first person, 35 to 70 words.",
        "Do not mention AI.",
        "Return only the review text."
      ].join(" "),
      input
    });

    const review = response.output_text?.trim();
    if (!review) return res.status(502).json({ error: "The AI returned no review text." });

    res.json({ review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not generate the review right now." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(port, () => {
  console.log(`Al Tandoor review app running on http://localhost:${port}`);
});
