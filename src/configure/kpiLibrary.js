export const kpiLibrary = [
 // ==========================
// ENVIRONMENTAL
// ==========================

{
  id: "ENV_001",
  module: "Environmental",
  category: "Energy",
  name: "Total Energy Consumption",
  description:
    "Total energy consumed by the company during the assessment year.",
  inputType: "number",
  unit: "kWh",
  placeholder: "e.g. 25000",

  normalization: {
    type: "inverseLinear",
    min: 0,
    max: 100000,
  },
},

{
  id: "ENV_002",
  module: "Environmental",
  category: "Energy",
  name: "Renewable Energy Usage",
  description:
    "Percentage of total energy consumption from renewable sources.",
  inputType: "percentage",
  unit: "%",
  placeholder: "e.g. 35%",

  normalization: {
    type: "percentage",
  },
},

{
  id: "ENV_003",
  module: "Environmental",
  category: "Emissions",
  name: "Scope 1 GHG Emissions",
  description:
    "Direct greenhouse gas emissions from company-owned or controlled sources.",
  inputType: "number",
  unit: "tCO₂e",
  placeholder: "e.g. 1200",

  normalization: {
    type: "inverseLinear",
    min: 0,
    max: 10000,
  },
},

{
  id: "ENV_004",
  module: "Environmental",
  category: "Emissions",
  name: "Scope 2 GHG Emissions",
  description:
    "Indirect emissions from purchased electricity, heating or cooling.",
  inputType: "number",
  unit: "tCO₂e",
  placeholder: "e.g. 800",

  normalization: {
    type: "inverseLinear",
    min: 0,
    max: 10000,
  },
},

{
  id: "ENV_005",
  module: "Environmental",
  category: "Water",
  name: "Water Consumption",
  description:
    "Total water consumed during the assessment year.",
  inputType: "number",
  unit: "m³",
  placeholder: "e.g. 5000",

  normalization: {
    type: "inverseLinear",
    min: 0,
    max: 100000,
  },
},

{
  id: "ENV_006",
  module: "Environmental",
  category: "Waste",
  name: "Waste Generated",
  description:
    "Total waste generated during the assessment year.",
  inputType: "number",
  unit: "tonnes",
  placeholder: "e.g. 250",

  normalization: {
    type: "inverseLinear",
    min: 0,
    max: 5000,
  },
},

{
  id: "ENV_007",
  module: "Environmental",
  category: "Waste",
  name: "Waste Recycled",
  description:
    "Percentage of waste that was recycled.",
  inputType: "percentage",
  unit: "%",
  placeholder: "e.g. 75%",

  normalization: {
    type: "percentage",
  },
},

{
  id: "ENV_008",
  module: "Environmental",
  category: "Compliance",
  name: "Environmental Policy",
  description:
    "Does the company have an environmental policy?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},

{
  id: "ENV_009",
  module: "Environmental",
  category: "Compliance",
  name: "Environmental Compliance Violations",
  description:
    "Number of environmental regulation violations during the assessment year.",
  inputType: "number",
  unit: "count",
  placeholder: "e.g. 0",

  normalization: {
    type: "threshold",
    bands: [
      { max: 0, score: 100 },
      { max: 1, score: 80 },
      { max: 2, score: 60 },
      { max: 3, score: 40 },
      { max: 4, score: 20 },
      { max: Infinity, score: 0 },
    ],
  },
},

{
  id: "ENV_010",
  module: "Environmental",
  category: "Compliance",
  name: "ISO 14001 Certification",
  description:
    "Does the company have ISO 14001 certification?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},
// ==========================
// SOCIAL
// ==========================

{
  id: "SOC_001",
  module: "Social",
  category: "Workforce",
  name: "Total Employees",
  description: "Total number of employees.",
  inputType: "number",
  unit: "employees",
  placeholder: "e.g. 450",

  normalization: {
    type: "informational",
  },
},

{
  id: "SOC_002",
  module: "Social",
  category: "Diversity",
  name: "Female Workforce",
  description: "Percentage of female employees.",
  inputType: "percentage",
  unit: "%",
  placeholder: "e.g. 42",

  normalization: {
    type: "percentage",
  },
},

{
  id: "SOC_003",
  module: "Social",
  category: "Workforce",
  name: "Employee Turnover Rate",
  description:
    "Percentage of employees who left during the assessment year.",
  inputType: "percentage",
  unit: "%",
  placeholder: "e.g. 10",

  normalization: {
    type: "inversePercentage",
  },
},

{
  id: "SOC_004",
  module: "Social",
  category: "Training",
  name: "Average Training Hours per Employee",
  description: "Average annual training hours per employee.",
  inputType: "number",
  unit: "hours",
  placeholder: "e.g. 18",

  normalization: {
    type: "linear",
    min: 0,
    max: 100,
  },
},

{
  id: "SOC_005",
  module: "Social",
  category: "Health & Safety",
  name: "Workplace Injury Rate",
  description: "Number of workplace injuries during the assessment year.",
  inputType: "number",
  unit: "count",
  placeholder: "e.g. 2",

  normalization: {
    type: "threshold",
    bands: [
      { max: 0, score: 100 },
      { max: 1, score: 80 },
      { max: 2, score: 60 },
      { max: 3, score: 40 },
      { max: 4, score: 20 },
      { max: Infinity, score: 0 },
    ],
  },
},

{
  id: "SOC_006",
  module: "Social",
  category: "Employee Experience",
  name: "Employee Satisfaction Score",
  description: "Employee satisfaction score from internal survey.",
  inputType: "percentage",
  unit: "%",
  placeholder: "e.g. 85",

  normalization: {
    type: "percentage",
  },
},

{
  id: "SOC_007",
  module: "Social",
  category: "Community",
  name: "Community Investment",
  description: "Investment in CSR/community development.",
  inputType: "number",
  unit: "₹",
  placeholder: "e.g. 500000",

  normalization: {
    type: "linear",
    min: 0,
    max: 10000000,
  },
},

{
  id: "SOC_008",
  module: "Social",
  category: "Human Rights",
  name: "Human Rights Policy",
  description: "Does the company have a Human Rights Policy?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},

{
  id: "SOC_009",
  module: "Social",
  category: "Diversity",
  name: "Equal Opportunity Policy",
  description: "Does the company have an Equal Opportunity Policy?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},

{
  id: "SOC_010",
  module: "Social",
  category: "Supply Chain",
  name: "Supplier Social Assessment",
  description:
    "Are suppliers assessed for social and ethical practices?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},
// ==========================
// GOVERNANCE
// ==========================

{
  id: "GOV_001",
  module: "Governance",
  category: "Board",
  name: "Independent Directors",
  description: "Percentage of independent directors.",
  inputType: "percentage",
  unit: "%",
  placeholder: "e.g. 60",

  normalization: {
    type: "percentage",
  },
},

{
  id: "GOV_002",
  module: "Governance",
  category: "Board",
  name: "Women on Board",
  description: "Percentage of women on the board.",
  inputType: "percentage",
  unit: "%",
  placeholder: "e.g. 35",

  normalization: {
    type: "percentage",
  },
},

{
  id: "GOV_003",
  module: "Governance",
  category: "Board",
  name: "Board Meeting Attendance",
  description: "Average attendance rate of board meetings.",
  inputType: "percentage",
  unit: "%",
  placeholder: "e.g. 95",

  normalization: {
    type: "percentage",
  },
},

{
  id: "GOV_004",
  module: "Governance",
  category: "Ethics",
  name: "Anti-Corruption Policy",
  description: "Does the company have an Anti-Corruption Policy?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},

{
  id: "GOV_005",
  module: "Governance",
  category: "Ethics",
  name: "Whistleblower Mechanism",
  description: "Does the company have a Whistleblower mechanism?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},

{
  id: "GOV_006",
  module: "Governance",
  category: "Oversight",
  name: "ESG Committee",
  description: "Does the company have a dedicated ESG Committee?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},

{
  id: "GOV_007",
  module: "Governance",
  category: "Compliance",
  name: "Regulatory Violations",
  description: "Number of governance/regulatory violations.",
  inputType: "number",
  unit: "count",
  placeholder: "e.g. 0",

  normalization: {
    type: "threshold",
    bands: [
      { max: 0, score: 100 },
      { max: 1, score: 80 },
      { max: 2, score: 60 },
      { max: 3, score: 40 },
      { max: 4, score: 20 },
      { max: Infinity, score: 0 },
    ],
  },
},

{
  id: "GOV_008",
  module: "Governance",
  category: "Risk",
  name: "Risk Management Framework",
  description: "Does the company have a documented risk framework?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},

{
  id: "GOV_009",
  module: "Governance",
  category: "Transparency",
  name: "ESG Report Published",
  description: "Has the company published an ESG report?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},

{
  id: "GOV_010",
  module: "Governance",
  category: "Ethics",
  name: "Code of Ethics",
  description: "Does the company have a Code of Ethics?",
  inputType: "boolean",
  unit: "",

  normalization: {
    type: "boolean",
    trueScore: 100,
    falseScore: 0,
  },
},
];