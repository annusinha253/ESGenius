
import { industryConfig } from "../configure/industryConfig";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../context/firebase";

/**
 * Calculate the final ESG score using industry-specific weights.
 *
 * @param {Object} moduleScores
 * @param {string} industry
 * @returns {number|null}
 */
export function calculateOverallESGScore(moduleScores, industry) {
  // Step 1: Get the three module scores.
  const scores = {
    Environmental: moduleScores?.Environmental,
    Social: moduleScores?.Social,
    Governance: moduleScores?.Governance,
  };

  // Step 2: Ensure all module scores are valid numbers.
  const scoreValues = Object.values(scores);

  if (
    scoreValues.some(
      (score) =>
        typeof score !== "number" ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > 100
    )
  ) {
    return null;
  }

  // Step 3: Find the industry configuration.
  const industryKey = industry?.trim().toLowerCase();
  const config =
    industryConfig[industryKey] ?? industryConfig.default;

  const weights = config.weights;

  // Step 4: Calculate the weighted total.
  const totalWeight =
    weights.Environmental +
    weights.Social +
    weights.Governance;

  if (totalWeight <= 0) {
    return null;
  }

  const weightedTotal =
    scores.Environmental * weights.Environmental +
    scores.Social * weights.Social +
    scores.Governance * weights.Governance;

  // Step 5: Normalize and return the final score.
  return Number((weightedTotal / totalWeight).toFixed(2));
  
}



/**
 * Calculate and save the final ESG score to Firestore.
 *
 * @param {string} uid - Firebase user ID.
 * @param {string} assessmentId - Assessment document ID.
 * @returns {Promise<number|null>}
 */
export async function calculateAndSaveFinalESGScore(
  uid,
  assessmentId,
) {
  if (!uid || !assessmentId) {
    throw new Error("User ID and assessment ID are required.");
  }

  const companyRef = doc(db, "companies", uid);

  const assessmentRef = doc(
    db,
    "companies",
    uid,
    "assessments",
    assessmentId,
  );

  // Read company and assessment data
  const [companySnap, assessmentSnap] = await Promise.all([
    getDoc(companyRef),
    getDoc(assessmentRef),
  ]);

  if (!companySnap.exists() || !assessmentSnap.exists()) {
    throw new Error("Company or assessment document not found.");
  }

  const company = companySnap.data();
  const assessment = assessmentSnap.data();

  // Prefer moduleScore, falling back to score if necessary
  const getScore = (module) =>
    module?.moduleScore ?? module?.score ?? null;

  const moduleScores = {
    Environmental: getScore(assessment.environment),
    Social: getScore(assessment.social),
    Governance: getScore(assessment.governance),
  };

  const industry =
    company.industry || company.industryType || "default";

  // Call the existing calculation function
  const finalESGScore = calculateOverallESGScore(
    moduleScores,
    industry,
  );

  // Save the result to the assessment document
  await updateDoc(assessmentRef, {
    finalESGScore,
    updatedAt: serverTimestamp(),
  });

  return finalESGScore;
}



