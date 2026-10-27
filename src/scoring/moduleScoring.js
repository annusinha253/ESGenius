
import { kpiWeightConfig } from "../configure/kpiWeight";

/**
 * Checks whether a KPI has a valid answer.
 * Boolean false is a valid answer, not an unanswered question.
 */
export function isKPIAnswered(rawValue, inputType) {
  if (inputType === "boolean") {
    return typeof rawValue === "boolean";
  }

  if (
    rawValue === "" ||
    rawValue === null ||
    rawValue === undefined
  ) {
    return false;
  }

  if (inputType === "number" || inputType === "percentage") {
    return (
      Number.isFinite(Number(rawValue)) &&
      Number(rawValue) >= 0
    );
  }

  return String(rawValue).trim() !== "";
}

/**
 * A module is complete only when every required KPI is answered.
 * KPIs are required by default unless required: false is specified.
 */
export function isModuleComplete(kpis, rawValues) {
  return kpis
    .filter((kpi) => kpi.required !== false)
    .every((kpi) =>
      isKPIAnswered(rawValues?.[kpi.id], kpi.inputType)
    );
}

/**
 * Calculates the weighted average of normalized KPI scores.
 * Informational KPIs (score === null) are excluded.
 */
export function calculateModuleScore(
  moduleName,
  kpis,
  rawValues,
  normalizedScores
) {
  // Never calculate a final score for an incomplete module.
  if (!isModuleComplete(kpis, rawValues)) {
    return null;
  }

  const moduleWeights = kpiWeightConfig[moduleName];

  if (!moduleWeights) {
    throw new Error(`No weight configuration for ${moduleName}`);
  }

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const kpi of kpis) {
    const score = normalizedScores?.[kpi.id];

    // Informational KPI: answered, but not included in scoring.
    if (score === null || score === undefined) {
      continue;
    }

    if (
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100
    ) {
      throw new Error(`Invalid normalized score for ${kpi.id}`);
    }

    const weight = moduleWeights[kpi.id];

    if (
      typeof weight !== "number" ||
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      throw new Error(`Missing or invalid weight for ${kpi.id}`);
    }

    weightedTotal += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return null;
  }

  return Math.round((weightedTotal / totalWeight) * 100) / 100;
}
