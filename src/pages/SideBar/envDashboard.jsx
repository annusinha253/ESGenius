import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import {
  getModuleRecommendations,
} from "../../recommendation/recommendationEngine";
import { auth, db } from "../../context/firebase";
import { kpiLibrary } from "../../configure/kpiLibrary";

const environmentalKPIs = kpiLibrary.filter(
  (kpi) =>
    kpi.module?.toLowerCase() === "environmental" ||
    kpi.id?.startsWith("ENV_")
);

const industryAdvice = {
  manufacturing: [
    "Review energy-intensive machinery and production processes.",
    "Measure emissions from production and purchased electricity.",
    "Track waste generation and introduce material-reuse practices.",
    "Set measurable targets for energy, water and waste reduction.",
  ],
  energy: [
    "Measure operational emissions and track reductions over time.",
    "Evaluate opportunities to increase renewable energy usage.",
    "Monitor water consumption and environmental compliance.",
    "Create a documented environmental improvement plan.",
  ],
  technology: [
    "Review electricity consumption in offices and data centres.",
    "Explore renewable electricity procurement where practical.",
    "Track electronic waste and responsible recycling.",
    "Document environmental policies and measurable targets.",
  ],
  healthcare: [
    "Monitor energy and water use across facilities.",
    "Review waste segregation and safe disposal processes.",
    "Track environmental compliance and maintain supporting records.",
    "Set targets appropriate to clinical and facility operations.",
  ],
  finance: [
    "Measure energy consumption across offices and facilities.",
    "Document environmental responsibilities and internal targets.",
    "Review operational emissions and renewable electricity options.",
    "Track environmental compliance and publish progress internally.",
  ],
  retail: [
    "Review electricity use across stores, lighting and cooling.",
    "Measure packaging and operational waste.",
    "Increase recycling and assess lower-waste packaging options.",
    "Document environmental policies and assign responsibility for targets.",
  ],
  agriculture: [
    "Monitor water consumption and improve water-use efficiency.",
    "Measure waste and identify opportunities for reuse or composting.",
    "Review energy consumption and emissions from operations.",
    "Set targets suited to the company's crops and operating practices.",
  ],
  transportation: [
    "Measure fuel or energy consumption and operational emissions.",
    "Review route efficiency, vehicle maintenance and fleet utilisation.",
    "Track waste and environmental compliance.",
    "Set measurable targets for reducing emissions intensity.",
  ],
  construction: [
    "Track construction waste and material recovery.",
    "Monitor water and energy use at project sites.",
    "Review environmental compliance and site-management practices.",
    "Set targets for reducing waste and resource consumption.",
  ],
  education: [
    "Review electricity and water consumption across facilities.",
    "Improve recycling and waste-segregation practices.",
    "Document environmental policies and awareness activities.",
    "Set achievable targets for resource conservation.",
  ],
  telecommunications: [
    "Monitor electricity use in network equipment and facilities.",
    "Review energy efficiency and renewable electricity opportunities.",
    "Track electronic waste and responsible equipment disposal.",
    "Maintain environmental policies and compliance records.",
  ],
  pharmaceuticals: [
    "Monitor energy and water consumption in production facilities.",
    "Review waste-handling procedures and environmental compliance.",
    "Measure emissions and identify operational reduction opportunities.",
    "Document environmental controls and improvement targets.",
  ],
  mining: [
    "Measure water consumption and monitor water-management practices.",
    "Track operational emissions and energy consumption.",
    "Review environmental compliance and incident records.",
    "Set measurable resource-efficiency and rehabilitation objectives.",
  ],
  hospitality: [
    "Review electricity and water consumption across facilities.",
    "Reduce food, packaging and operational waste where applicable.",
    "Improve recycling and monitor environmental policies.",
    "Set practical resource-saving targets for day-to-day operations.",
  ],
};

function getIndustryKey(industry = "") {
  const value = industry.toLowerCase();

  const aliases = [
    ["manufact", "manufacturing"],
    ["energy", "energy"],
    ["technology", "technology"],
    ["software", "technology"],
    ["it ", "technology"],
    ["health", "healthcare"],
    ["hospital", "healthcare"],
    ["finance", "finance"],
    ["bank", "finance"],
    ["retail", "retail"],
    ["agric", "agriculture"],
    ["farm", "agriculture"],
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

  return aliases.find(([match]) => value.includes(match))?.[1] || "";
}

function displayValue(value, unit = "") {
  if (value === null || value === undefined || value === "") {
    return "Not answered";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return `${value}${unit ? ` ${unit}` : ""}`;
}

function formatScore(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(1)
    : "—";
}

function scoreTone(score) {
  if (score === null || score === undefined) {
    return "bg-slate-300";
  }
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-rose-500";
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, suffix = "", note, icon }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-xl">
          {icon}
        </span>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
        {suffix}
      </div>
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
    </article>
  );
}

export default function EnvironmentInfo() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState("");
  const [userSignedIn, setUserSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      setUserSignedIn(Boolean(user));
      setLoading(true);
      setError("");

      if (!user) {
        setCompany(null);
        setAssessment(null);
        setLoading(false);
        return;
      }

      try {
        const companyRef = doc(db, "companies", user.uid);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
          if (!cancelled) {
            setCompany(null);
            setAssessment(null);
          }
          return;
        }

        const companyData = companySnap.data();
        const activeYear = companyData.currentAssessment;

        let assessmentData = null;

        if (activeYear) {
          const assessmentRef = doc(
            db,
            "companies",
            user.uid,
            "assessments",
            String(activeYear)
          );

          const assessmentSnap = await getDoc(assessmentRef);

          if (assessmentSnap.exists()) {
            assessmentData = assessmentSnap.data();
          }
        }

        if (!cancelled) {
          setCompany(companyData);
          setAssessment(assessmentData);
        }
      } catch (err) {
        console.error("Environment dashboard error:", err);

        if (!cancelled) {
          setError("We couldn't load your assessment data. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const companyName =
    company?.companyName ||
    company?.name ||
    company?.legalName ||
    "Your Company";

  const industry =
    company?.industry ||
    company?.industryType ||
    "Industry not specified";

  const environment = assessment?.environment || {};
  const rawValues = environment.rawValues || {};
  const normalizedScores = environment.normalizedScores || {};

  const rows = useMemo(
    () =>
      environmentalKPIs.map((kpi) => {
        const rawValue = rawValues[kpi.id];
        const normalized = normalizedScores[kpi.id];

        const answered =
          rawValue !== undefined &&
          rawValue !== null &&
          rawValue !== "";

        return {
          ...kpi,
          rawValue,
          answered,
          normalized:
            typeof normalized === "number" && Number.isFinite(normalized)
              ? Math.max(0, Math.min(100, normalized))
              : null,
        };
      }),
    [rawValues, normalizedScores]
  );

  const answeredRows = rows.filter((row) => row.answered);
  const unansweredRows = rows.filter((row) => !row.answered);

  const scoredRows = rows.filter(
    (row) => row.answered && row.normalized !== null
  );

  const weakRows = [...scoredRows]
    .filter((row) => row.normalized < 60)
    .sort((a, b) => a.normalized - b.normalized);

  const strongRows = [...scoredRows]
    .sort((a, b) => b.normalized - a.normalized)
    .slice(0, 3);

  const moduleScore =
    typeof environment.moduleScore === "number"
      ? environment.moduleScore
      : typeof environment.score === "number" && environment.score > 0
        ? environment.score
        : null;

  const completion = rows.length
    ? Math.round((answeredRows.length / rows.length) * 100)
    : 0;

  
const { recommendations, industryGuidance: industryNote } = useMemo(
  () =>
    getModuleRecommendations({
      module: "Environmental",
      rawValues,
      normalizedScores,
      industry,
    }),
  [rawValues, normalizedScores, industry]
);


  const topScored = scoredRows
    .slice()
    .sort((a, b) => a.normalized - b.normalized)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-3 text-4xl">🌿</div>
          <p className="text-sm text-slate-600">
            Loading environmental assessment...
          </p>
        </div>
      </div>
    );
  }

  if (!userSignedIn) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Please sign in
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to view your company’s environmental assessment.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      </main>
    );
  }

  if (!company || !assessment) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 text-slate-800 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/Dashboard"
            className="text-sm font-semibold text-teal-700 hover:text-teal-900"
          >
            ← Back to Dashboard
          </Link>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-8">
            <div className="text-4xl">🌱</div>
            <h1 className="mt-4 text-2xl font-bold">
              No current assessment found
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start or select an assessment year from your main dashboard.
              Your environmental results will appear here after answers are saved.
            </p>
            <Link
              to="/Dashboard"
              className="mt-5 inline-flex rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Go to Dashboard
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              to="/Dashboard"
              className="text-sm font-medium text-teal-700 hover:text-teal-900"
            >
              ← Back to Dashboard
            </Link>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-teal-700">
              ESGenius / Environmental
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Environmental Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {companyName} · {industry}
            </p>
          </div>

          <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Current assessment
            </p>
            <p className="mt-1 text-xl font-bold text-teal-900">
              {assessment.year || company.currentAssessment}
            </p>
            <p className="mt-1 text-xs text-teal-800">
              {assessment.status || "In progress"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 p-5 md:p-8">
        {/* Score summary */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Environmental score"
            value={formatScore(moduleScore)}
            suffix={moduleScore === null ? "" : " / 100"}
            note="Saved module score"
            icon="🌿"
          />
          <MetricCard
            label="Assessment completion"
            value={completion}
            suffix="%"
            note={`${answeredRows.length} of ${rows.length} KPIs answered`}
            icon="◴"
          />
          <MetricCard
            label="Answered KPIs"
            value={answeredRows.length}
            note="Based on saved raw values"
            icon="✓"
          />
          <MetricCard
            label="Needs attention"
            value={unansweredRows.length + weakRows.length}
            note="Missing answers plus low normalized scores"
            icon="◎"
          />
        </section>

        {/* Score and completion */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel
            title="Environmental performance"
            subtitle="Your saved module score, measured on a 0–100 scale."
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-bold text-teal-800">
                  {formatScore(moduleScore)}
                  <span className="text-base font-medium text-slate-400">
                    {" "} / 100
                  </span>
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {moduleScore === null
                    ? "A score will appear after the assessment scoring logic calculates it."
                    : moduleScore >= 75
                      ? "Your saved score is in the higher range."
                      : moduleScore >= 50
                        ? "There is room to strengthen environmental performance."
                        : "Prioritise reviewing low-scoring areas and missing information."}
                </p>
              </div>
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-teal-100">
                <span className="text-xl font-bold text-teal-800">
                  {moduleScore === null
                    ? "—"
                    : `${Math.round(moduleScore)}%`}
                </span>
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, moduleScore ?? 0))}%`,
                }}
              />
            </div>
          </Panel>

          <Panel
            title="Assessment completeness"
            subtitle="Completion is calculated from saved KPI answers, including valid false or zero answers."
          >
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-slate-900">
                {completion}%
              </p>
              <p className="text-sm text-slate-500">
                {unansweredRows.length} remaining
              </p>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
                {answeredRows.length} answered
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                {unansweredRows.length} unanswered
              </span>
            </div>
            {unansweredRows.length > 0 && (
              <Link
                to="/Environment"
                className="mt-5 inline-flex rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Complete assessment →
              </Link>
            )}
          </Panel>
        </section>

        {/* Visual KPI insights */}
        <Panel
          title="KPI score insights"
          subtitle="Each bar shows the normalized score saved for that KPI. These are individual KPI scores, not estimates of their weighted contribution to the module score."
        >
          {topScored.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              No normalized KPI scores are available yet. Complete and save the assessment to see scored areas here.
            </div>
          ) : (
            <div className="space-y-5">
              {topScored.map((row) => (
                <div key={row.id}>
                  <div className="mb-2 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {row.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.category} · {row.id}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-700">
                      {row.normalized.toFixed(1)} / 100
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${scoreTone(row.normalized)}`}
                      style={{ width: `${row.normalized}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>● <span className="text-emerald-600">Higher: 75–100</span></span>
            <span>● <span className="text-amber-600">Moderate: 50–74</span></span>
            <span>● <span className="text-rose-600">Lower: below 50</span></span>
          </div>
        </Panel>

        {/* Findings */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel
            title="Strongest scored areas"
            subtitle="Based on the normalized KPI scores currently saved."
          >
            {strongRows.length === 0 ? (
              <p className="text-sm text-slate-500">
                Strong areas will appear when scored answers are available.
              </p>
            ) : (
              <div className="space-y-3">
                {strongRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {row.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {displayValue(row.rawValue, row.unit)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-700">
                      {row.normalized.toFixed(1)}/100
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Areas to review"
            subtitle="Low normalized scores and missing answers are shown separately."
          >
            {weakRows.length === 0 && unansweredRows.length === 0 ? (
              <p className="text-sm text-slate-500">
                No low-scoring or unanswered KPIs were detected by these rules.
              </p>
            ) : (
              <div className="space-y-3">
                {weakRows.slice(0, 4).map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-rose-100 bg-rose-50 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-semibold">{row.name}</p>
                      <span className="shrink-0 text-sm font-bold text-rose-700">
                        {row.normalized.toFixed(1)}/100
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Recorded value: {displayValue(row.rawValue, row.unit)}
                    </p>
                  </div>
                ))}

                {unansweredRows.slice(0, 4).map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-amber-100 bg-amber-50 p-4"
                  >
                    <p className="text-sm font-semibold">{row.name}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Missing answer · {row.category}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </section>

        {/* Raw answers */}
        <Panel
          title="Environmental KPI data"
          subtitle="Saved answers from the current assessment, with KPI names, units and normalized scores."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">KPI</th>
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-3 py-3 font-semibold">Raw value</th>
                  <th className="px-3 py-3 font-semibold">Normalized score</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-800">
                        {row.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {row.id}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-slate-600">
                      {row.category}
                    </td>
                    <td className="px-3 py-4 font-medium text-slate-700">
                      {displayValue(row.rawValue, row.unit)}
                    </td>
                    <td className="px-3 py-4">
                      {row.normalized === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className="font-semibold text-slate-700">
                          {row.normalized.toFixed(1)} / 100
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.answered
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.answered ? "Answered" : "Missing"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Recommendations */}
        <Panel
          title="Recommendations for your company"
          subtitle={`Rule-based suggestions for the ${industry} industry, using available assessment answers and KPI scores. These are starting points, not a substitute for a formal environmental audit.`}
        >
          {recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">
              Recommendations will appear when assessment data is available.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recommendations.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-slate-200 p-5 transition hover:border-teal-200 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 font-bold text-teal-800">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-5 text-slate-600">
                        {item.reason}
                      </p>
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-teal-800">
                          Suggested action
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-700">
                          {item.action}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        {/* Future ML placeholder */}
        <section className="rounded-2xl border border-dashed border-teal-300 bg-teal-50/60 p-6 md:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl">
              ✨
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
                Future enhancement
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                AI / ML-powered environmental insights
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Reserved for a future model that could identify patterns across
                multiple assessment years, estimate likely improvement
                opportunities and personalise recommendations. No ML model is
                connected in this version.
              </p>
              <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">
                Planned · Not implemented
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}