const FAQ = require("../models/FAQ");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Notification = require("../models/Notification");

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  const stops = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "can", "could",
    "shall", "should", "may", "might", "to", "of", "in", "for", "on", "with",
    "at", "by", "from", "as", "into", "through", "during", "before", "after",
    "above", "below", "between", "and", "but", "or", "nor", "not", "so", "yet",
    "both", "either", "neither", "each", "every", "all", "no", "none", "some",
    "any", "this", "that", "these", "those", "it", "its", "i", "me", "my",
    "myself", "we", "us", "our", "you", "your", "he", "she", "him", "her",
    "his", "they", "them", "their", "please", "about"]);
  return normalize(text).split(" ").filter((w) => w.length > 1 && !stops.has(w));
}

function computeSimilarity(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const tfA = {}, tfB = {};
  tokensA.forEach((t) => (tfA[t] = (tfA[t] || 0) + 1));
  tokensB.forEach((t) => (tfB[t] = (tfB[t] || 0) + 1));

  const allTokens = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);
  let dot = 0, magA = 0, magB = 0;

  allTokens.forEach((t) => {
    const a = (tfA[t] || 0) / tokensA.length;
    const b = (tfB[t] || 0) / tokensB.length;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

const runDuplicateDetection = async (req, res, next) => {
  try {
    const faqs = await FAQ.find({ isDuplicate: { $ne: true } });
    const questions = await Question.find({ isDuplicate: { $ne: true } });
    const allItems = [
      ...faqs.map((f) => ({ id: f._id, text: f.question, type: "FAQ" })),
      ...questions.map((q) => ({ id: q._id, text: q.title, type: "Question" })),
    ];

    const highConfidence = [];
    const possible = [];

    for (let i = 0; i < allItems.length; i++) {
      for (let j = i + 1; j < allItems.length; j++) {
        const sim = computeSimilarity(allItems[i].text, allItems[j].text);
        if (sim > 0.85) {
          highConfidence.push({ a: allItems[i], b: allItems[j], similarity: sim });
        } else if (sim > 0.7) {
          possible.push({ a: allItems[i], b: allItems[j], similarity: sim });
        }
      }
    }

    res.json({
      totalCompared: allItems.length,
      highConfidence: highConfidence.sort((a, b) => b.similarity - a.similarity),
      possible: possible.sort((a, b) => b.similarity - a.similarity),
      highCount: highConfidence.length,
      possibleCount: possible.length,
    });
  } catch (error) {
    next(error);
  }
};

const mergeDuplicates = async (req, res, next) => {
  try {
    const { primaryId, duplicateIds, type, mergeAnswer } = req.body;
    if (!primaryId || !duplicateIds || duplicateIds.length === 0) {
      return res.status(400).json({ message: "Primary and duplicate IDs required" });
    }

    const Model = type === "FAQ" ? FAQ : Question;

    for (const dupId of duplicateIds) {
      const dup = await Model.findById(dupId);
      if (!dup) continue;

      const primary = await Model.findById(primaryId);
      if (!primary) continue;

      if (type === "FAQ") {
        primary.views += dup.views || 0;
        primary.bookmarks += dup.bookmarks || 0;
        if (mergeAnswer === "combine" && dup.answer) {
          primary.answer += "\n\n---\n\n" + dup.answer;
        }
        if (mergeAnswer === "longer" && dup.answer && dup.answer.length > primary.answer.length) {
          const temp = primary.answer;
          primary.answer = dup.answer;
          dup.answer = temp;
        }
        await primary.save();
      }

      dup.isDuplicate = true;
      dup.duplicateOf = primaryId;
      await dup.save();

      if (type === "Question") {
        await Answer.updateMany({ question: dupId }, { question: primaryId });
      }
    }

    res.json({ message: `Merged ${duplicateIds.length} duplicate(s) into primary` });
  } catch (error) {
    next(error);
  }
};

const checkSimilarity = async (req, res, next) => {
  try {
    const { textA, textB } = req.body;
    const sim = computeSimilarity(textA, textB);
    res.json({ similarity: Math.round(sim * 10000) / 10000 });
  } catch (error) {
    next(error);
  }
};

module.exports = { runDuplicateDetection, mergeDuplicates, checkSimilarity };
