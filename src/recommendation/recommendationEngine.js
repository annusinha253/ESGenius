
import { kpiLibrary } from "../configure/kpiLibrary";
import {
  recommendationRules,
  industryGuidance,
} from "./recommendationRules";

function normalizeIndustry(industry = "") {
  const value = industry.toLowerCase().trim();

  const aliases = [
    ["manufact", "manufacturing"],
    ["technology", "technology"],
    ["software", "technology"],
    ["energy", "energy"],
    ["health", "healthcare"],
    ["hospital", "healthcare"],
    ["finance", "finance"],
    ["bank", "finance"],
    ["retail", "retail"],
    ["agric", "agriculture"],
    ["transport", "transportation"],
    ["logistic", "transportation"],
    ["construct", "construction"],
    ["education", "education"],
    ["telecom", "telecommunications"],
    ["pharma", "pharmaceuticals"],
    ["mining", "mining"],
    ["hospitality", "hospitality"],
    ["hotel", "hospitality"],
  ];

  return aliases.find(([alias]) => value.includes(alias))?.[1] || "default";
}

function hasAnswer(value) {
  // Zero and false are valid answers.
  return value !== undefined && value !== null && value !== "";
}

function shouldRecommend(rule, rawValue, score) {
  switch (rule.trigger) {
    case "false":
      return rawValue === false;

    case "positiveNumber":
      return (
        hasAnswer(rawValue) &&
        Number.isFinite(Number(rawValue)) &&
        Number(rawValue) > 0
      );

    case "lowScore":
      return typeof score === "number" && score < 60;

    case "never":
      return false;

    default:
      return false;
  }
}

/**
 * Creates relevant recommendations for one ESG module.
 *
 * rawValues: saved raw answers for that module
 * normalizedScores: saved normalized KPI scores for that module
 * industry: the company's selected industry
 * module: "Environmental", "Social", or "Governance"
 */
export function getModuleRecommendations({
  module,
  rawValues = {},
  normalizedScores = {},
  industry = "",
}) {
  const industryKey = normalizeIndustry(industry);

  const moduleKPIs = kpiLibrary.filter(
    (kpi) => kpi.module === module
  );

  const recommendations = [];

  for (const kpi of moduleKPIs) {
    const rule = recommendationRules[kpi.id];

    // A KPI without a recommendation rule is safely skipped.
    if (!rule) continue;

    const rawValue = rawValues[kpi.id];
    const score = normalizedScores[kpi.id];

    // Missing answers are data-completion issues, not low scores.
    if (!hasAnswer(rawValue)) {
      recommendations.push({
        id: `${kpi.id}-missing`,
        kpiId: kpi.id,
        kpiName: kpi.name,
        type: "missing",
        title: `Complete: ${kpi.name}`,
        reason: "No answer has been saved for this KPI.",
        action:
          "Enter the correct value for the assessment period and save the assessment.",
        priority: "medium",
      });

      continue;
    }

    if (!shouldRecommend(rule, rawValue, score)) {
      continue;
    }

    const industryAction = rule.industries?.[industryKey];

    recommendations.push({
      id: kpi.id,
      kpiId: kpi.id,
      kpiName: kpi.name,
      type: "improvement",
      title: rule.issue,
      reason:
        typeof score === "number"
          ? `Your normalized KPI score is ${score.toFixed(1)} out of 100.`
          : `Your saved answer is ${String(rawValue)}.`,
      action: industryAction
        ? `${rule.action} ${industryAction}`
        : rule.action,
      score: typeof score === "number" ? score : null,
      priority:
        typeof score === "number" && score < 40
          ? "high"
          : "medium",
    });
  }

  // Show the most urgent issues first.
  const priorityRank = { high: 0, medium: 1, low: 2 };

  recommendations.sort(
    (a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority]
  );

  return {
    recommendations,
    industryGuidance:
      industryGuidance[industryKey] || industryGuidance.default,
  };
}
