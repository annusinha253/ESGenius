//this will just read the raw values and convert them into scores after reading the normalization configuration, there is not interaction with the firestore in this file

export function normalize(rawValue, normalization) {
  if (!normalization) return null;

  switch (normalization.type) {
    // =========================
    // BOOLEAN
    // =========================
    case "boolean":
      return rawValue
        ? normalization.trueScore
        : normalization.falseScore;

    // =========================
    // PERCENTAGE (Higher Better)
    // =========================
    case "percentage":
      return clamp(rawValue);

    // =========================
    // PERCENTAGE (Lower Better)
    // =========================
    case "inversePercentage":
      return clamp(100 - rawValue);

    // =========================
    // LINEAR
    // =========================
    case "linear": {
      const { min, max } = normalization;

      const score =
        ((rawValue - min) / (max - min)) * 100;

      return clamp(score);
    }

    // =========================
    // INVERSE LINEAR
    // =========================
    case "inverseLinear": {
      const { min, max } = normalization;

      const score =
        ((max - rawValue) / (max - min)) * 100;

      return clamp(score);
    }

    // =========================
    // THRESHOLD
    // =========================
    case "threshold": {
      for (const band of normalization.bands) {
        if (rawValue <= band.max) {
          return band.score;
        }
      }

      return 0;
    }

    // =========================
    // INFORMATIONAL
    // =========================
    case "informational":
      return null;

    default:
      return null;
  }
}

function clamp(score) {
  return Math.max(0, Math.min(100, Number(score)));
}