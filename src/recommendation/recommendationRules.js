
export const recommendationRules = {
  // =========================
  // ENVIRONMENTAL
  // =========================
  ENV_001: {
    issue: "High energy consumption",
    action:
      "Review electricity and fuel use by facility or process. Identify energy-intensive equipment, improve efficiency, and set a measurable reduction target.",
    trigger: "lowScore",
    industries: {
      manufacturing:
        "Prioritise production machinery, compressed air systems, and equipment operating outside production hours.",
      hospitality:
        "Review air conditioning, heating, lighting, laundry, and kitchen equipment.",
      retail:
        "Review store lighting, refrigeration, air conditioning, and opening-hour energy use.",
      technology:
        "Review office energy use, cooling systems, and data-centre electricity consumption where applicable.",
    },
  },
  ENV_002: {
    issue: "Low renewable energy usage",
    action:
      "Assess the feasibility of renewable electricity procurement or on-site renewable generation, and set a realistic renewable-energy target.",
    trigger: "lowScore",
  },
  ENV_003: {
    issue: "High direct greenhouse gas emissions",
    action:
      "Identify the main sources of direct emissions, such as company-owned vehicles, fuel combustion, or generators. Prioritise measurable reduction actions.",
    trigger: "lowScore",
    industries: {
      manufacturing:
        "Review boilers, furnaces, process fuels, and on-site generators.",
      transportation:
        "Review fleet fuel consumption, vehicle utilisation, maintenance, and route efficiency.",
      agriculture:
        "Review fuel use in machinery and other direct operational emission sources.",
    },
  },
  ENV_004: {
    issue: "High purchased-energy emissions",
    action:
      "Review emissions associated with purchased electricity, heating, or cooling. Assess energy efficiency and lower-emission energy options.",
    trigger: "lowScore",
    industries: {
      technology:
        "Pay particular attention to server rooms, cooling systems, and data-centre electricity.",
      hospitality:
        "Review electricity demand from cooling, heating, laundry, and guest facilities.",
    },
  },
  ENV_005: {
    issue: "High water consumption",
    action:
      "Review water use by activity or facility, check for leaks, and identify opportunities to reduce consumption without compromising essential operations.",
    trigger: "lowScore",
    industries: {
      hospitality:
        "Review guest bathrooms, laundry, kitchens, pools, and landscaping where applicable.",
      manufacturing:
        "Review process water, cleaning operations, cooling systems, and water reuse opportunities.",
      agriculture:
        "Assess irrigation efficiency, soil moisture monitoring, and water-loss prevention.",
      healthcare:
        "Review water-intensive equipment, cleaning processes, and facility plumbing.",
    },
  },
  ENV_006: {
    issue: "High waste generation",
    action:
      "Identify the main waste streams and their sources. Prioritise waste prevention, reuse, and responsible recycling before disposal.",
    trigger: "lowScore",
    industries: {
      manufacturing:
        "Measure scrap and production material losses; investigate opportunities to reuse offcuts and improve material yield.",
      hospitality:
        "Review food waste, packaging, and disposable supplies.",
      retail:
        "Review packaging, damaged goods, returns, and unsold inventory.",
      construction:
        "Track construction debris and identify opportunities for material recovery.",
    },
  },
  ENV_007: {
    issue: "Low waste recycling rate",
    action:
      "Identify recyclable waste streams, improve segregation, and review whether suitable recycling services are available.",
    trigger: "lowScore",
    industries: {
      hospitality:
        "Consider separate collection for food waste, cardboard, glass, and other locally recyclable materials.",
      manufacturing:
        "Review recycling and recovery options for production scrap, packaging, and process materials.",
      retail:
        "Improve collection and separation of cardboard, packaging, and other recyclable store waste.",
    },
  },
  ENV_008: {
    issue: "Environmental policy missing",
    action:
      "Develop and communicate an environmental policy covering responsibilities, compliance, resource use, waste, and measurable improvement objectives.",
    trigger: "false",
  },
  ENV_009: {
    issue: "Environmental compliance violations recorded",
    action:
      "Investigate each recorded violation, document its root cause, assign corrective actions, and establish checks to prevent recurrence.",
    trigger: "positiveNumber",
  },
  ENV_010: {
    issue: "ISO 14001 certification not in place",
    action:
      "Assess whether an environmental management system would benefit the organisation. If appropriate, review ISO 14001 requirements and identify gaps before planning certification.",
    trigger: "false",
  },

  // =========================
  // SOCIAL
  // =========================
  SOC_001: {
    issue: "Workforce size is informational",
    action:
      "Use employee count as context for other workforce indicators. Do not treat a smaller workforce as poor performance by itself.",
    trigger: "never",
  },
  SOC_002: {
    issue: "Female workforce representation may need improvement",
    action:
      "Review recruitment, retention, career progression, and representation data. Set fair, measurable inclusion objectives appropriate to the organisation.",
    trigger: "lowScore",
  },
  SOC_003: {
    issue: "High employee turnover",
    action:
      "Analyse exit feedback, retention by team, workload, career development, and compensation practices. Use the findings to develop a targeted retention plan.",
    trigger: "lowScore",
    industries: {
      hospitality:
        "Pay particular attention to shift patterns, seasonal employment, workload, and frontline employee retention.",
      retail:
        "Review scheduling, manager support, workload, and retention across store teams.",
      technology:
        "Review career progression, workload, management practices, and opportunities for professional growth.",
    },
  },
  SOC_004: {
    issue: "Training hours may be low",
    action:
      "Review training needs by role and identify gaps in job skills, safety, management, and professional development. Establish an appropriate annual training plan.",
    trigger: "lowScore",
  },
  SOC_005: {
    issue: "Workplace injuries recorded",
    action:
      "Review incident reports, identify hazards and root causes, implement corrective controls, and monitor whether preventive measures are effective.",
    trigger: "positiveNumber",
    industries: {
      manufacturing:
        "Prioritise machinery safety, lockout procedures, protective equipment, and task-specific training.",
      construction:
        "Review work at height, equipment use, site hazards, and contractor safety procedures.",
      hospitality:
        "Review slips, burns, lifting tasks, kitchen safety, and staff training.",
    },
  },
  SOC_006: {
    issue: "Employee satisfaction may need improvement",
    action:
      "Review employee survey feedback, identify recurring concerns, and agree on practical actions with employees and managers. Repeat the survey to track progress.",
    trigger: "lowScore",
  },
  SOC_007: {
    issue: "Community investment may be limited",
    action:
      "Review the organisation's community priorities and resources. Consider setting appropriate objectives for community engagement and tracking outcomes, not only spending.",
    trigger: "lowScore",
  },
  SOC_008: {
    issue: "Human rights policy missing",
    action:
      "Create a human rights policy covering fair treatment, non-discrimination, forced and child labour risks, grievance channels, and relevant supplier expectations.",
    trigger: "false",
  },
  SOC_009: {
    issue: "Equal opportunity policy missing",
    action:
      "Establish a clear equal opportunity policy covering recruitment, promotion, pay, workplace conduct, complaints, and fair treatment.",
    trigger: "false",
  },
  SOC_010: {
    issue: "Supplier social assessment not in place",
    action:
      "Create a proportionate supplier review process covering labour practices, workplace safety, human rights, and ethical conduct. Prioritise higher-risk suppliers.",
    trigger: "false",
  },

  // =========================
  // GOVERNANCE
  // =========================
  GOV_001: {
    issue: "Independent board representation may need review",
    action:
      "Review board independence against the organisation's size, ownership, applicable requirements, and governance needs. Document conflicts of interest and oversight responsibilities.",
    trigger: "lowScore",
  },
  GOV_002: {
    issue: "Women’s board representation may need review",
    action:
      "Review board composition, nomination practices, and succession planning to support a qualified and diverse range of candidates.",
    trigger: "lowScore",
  },
  GOV_003: {
    issue: "Board meeting attendance may need improvement",
    action:
      "Review attendance patterns, meeting scheduling, board engagement, and follow-up processes. Identify recurring barriers to participation.",
    trigger: "lowScore",
  },
  GOV_004: {
    issue: "Anti-corruption policy missing",
    action:
      "Establish an anti-corruption policy covering bribery, conflicts of interest, gifts, reporting channels, and employee responsibilities. Provide relevant training.",
    trigger: "false",
  },
  GOV_005: {
    issue: "Whistleblower mechanism missing",
    action:
      "Create a confidential reporting channel, explain how concerns are investigated, prohibit retaliation, and communicate the process to employees.",
    trigger: "false",
  },
  GOV_006: {
    issue: "Dedicated ESG oversight may be absent",
    action:
      "Assign clear responsibility for ESG oversight, define reporting responsibilities, and schedule regular reviews of ESG risks and performance. A separate committee may not be necessary for every company.",
    trigger: "false",
  },
  GOV_007: {
    issue: "Governance or regulatory violations recorded",
    action:
      "Investigate recorded violations, assess control failures, assign corrective actions, and introduce follow-up checks to reduce recurrence.",
    trigger: "positiveNumber",
  },
  GOV_008: {
    issue: "Documented risk management framework missing",
    action:
      "Document a risk management process covering risk identification, assessment, ownership, mitigation, escalation, and periodic review.",
    trigger: "false",
  },
  GOV_009: {
    issue: "ESG report not published",
    action:
      "Consider publishing an ESG report proportionate to the organisation's size and reporting obligations, using documented data, clear methods, and transparent limitations.",
    trigger: "false",
  },
  GOV_010: {
    issue: "Code of ethics missing",
    action:
      "Create and communicate a code of ethics covering conflicts of interest, fair dealing, confidentiality, misconduct reporting, and expected employee behaviour.",
    trigger: "false",
  },
};

// General industry guidance is supplementary. It does not replace
// the KPI-specific action above.
export const industryGuidance = {
  manufacturing:
    "Consider production processes, equipment efficiency, worker safety, material use, and supplier controls.",
  technology:
    "Consider electricity use, employee retention, data-related governance responsibilities, and supplier practices where applicable.",
  energy:
    "Consider operational emissions, resource use, worker safety, regulatory compliance, and operational risk controls.",
  healthcare:
    "Consider patient and worker safety, facility resources, privacy-related governance, and applicable compliance requirements.",
  finance:
    "Consider governance, risk management, ethical conduct, workforce practices, and relevant regulatory obligations.",
  retail:
    "Consider store operations, packaging, workforce retention, supplier practices, and customer-facing responsibilities.",
  agriculture:
    "Consider water use, operational resources, worker welfare, supply chains, and environmental impacts.",
  transportation:
    "Consider fleet efficiency, operational emissions, driver safety, workforce conditions, and regulatory compliance.",
  construction:
    "Consider site safety, material waste, contractor oversight, workforce conditions, and compliance.",
  education:
    "Consider staff development, inclusion, campus resources, and clear governance responsibilities.",
  telecommunications:
    "Consider network energy use, electronic waste, workforce development, supplier practices, and risk controls.",
  pharmaceuticals:
    "Consider resource use, waste controls, worker safety, supplier practices, and relevant regulatory obligations.",
  mining:
    "Consider water use, operational emissions, worker safety, site rehabilitation, and compliance.",
  hospitality:
    "Consider facility energy and water use, waste prevention, staff retention, and safe working practices.",
  default:
    "Choose improvement actions proportionate to the organisation's operations, risks, available resources, and applicable requirements.",
};
