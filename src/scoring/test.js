
import { calculateOverallESGScore } from "./finalESGscoring";

const scores = {
  Environmental: 80,
  Social: 70,
  Governance: 90,
};

console.log(
  "Technology:",
  calculateOverallESGScore(scores, "technology")
);

console.log(
  "Manufacturing:",
  calculateOverallESGScore(scores, "manufacturing")
);

console.log(
  "Missing score:",
  calculateOverallESGScore(
    { Environmental: 80, Social: 70 },
    "technology"
  )
);

console.log(
  "Unknown industry:",
  calculateOverallESGScore(scores, "unknown")
);
