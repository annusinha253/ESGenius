export const kpiWeightConfig = {
  Environmental: {
    ENV_001: 15, // Total Energy Consumption
    ENV_002: 10, // Renewable Energy Usage
    ENV_003: 20, // Scope 1 Emissions
    ENV_004: 15, // Scope 2 Emissions
    ENV_005: 10, // Water Consumption
    ENV_006: 10, // Waste Generated
    ENV_007: 10, // Waste Recycled
    ENV_008: 5,  // Environmental Policy
    ENV_009: 10, // Environmental Compliance Violations
    ENV_010: 5,  // ISO 14001
  },

  Social: {
    SOC_001: 5,   // Total Employees
    SOC_002: 15,  // Female Workforce
    SOC_003: 10,  // Employee Turnover
    SOC_004: 10,  // Training Hours
    SOC_005: 15,  // Workplace Injury Rate
    SOC_006: 15,  // Employee Satisfaction
    SOC_007: 10,  // Community Investment
    SOC_008: 5,   // Human Rights Policy
    SOC_009: 5,   // Equal Opportunity Policy
    SOC_010: 10,  // Supplier Social Assessment
  },

  Governance: {
    GOV_001: 15, // Independent Directors
    GOV_002: 10, // Women on Board
    GOV_003: 10, // Board Attendance
    GOV_004: 10, // Anti-Corruption Policy
    GOV_005: 10, // Whistleblower Mechanism
    GOV_006: 10, // ESG Committee
    GOV_007: 15, // Regulatory Violations
    GOV_008: 10, // Risk Management
    GOV_009: 5,  // ESG Report Published
    GOV_010: 5,  // Code of Ethics
  },
};




// Why these weights?

// They're inspired by common ESG frameworks like GRI, SASB, BRSR, and MSCI:

// Environmental
// Emissions have the greatest impact.
// Policies matter, but less than measurable outcomes.
// Social
// Employee safety and satisfaction are more important than company size.
// Diversity carries significant weight.
// Governance
// Board independence and regulatory compliance are among the strongest indicators.
// Governance policies support the score but don't outweigh actual governance performance.