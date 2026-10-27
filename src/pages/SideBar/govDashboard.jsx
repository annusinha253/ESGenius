import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../context/firebase";
import kpiLibrary from "../../configure/kpiLibrary";
import { getModuleRecommendations } from "../../recommendation/recommendationEngine";

export default function GovernanceInfo() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState("");

  // Get all Governance KPIs from the existing KPI library.
  const governanceKPIs = useMemo(
    () =>
      kpiLibrary.filter(
        (kpi) =>
          kpi.module?.toLowerCase() === "governance" ||
          kpi.id?.startsWith("GOV_")
      ),
    []
  );

  // Load the logged-in company's current assessment from Firebase.
  useEffect(() => {
    let unsubscribeAuth;

    unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCompany(null);
        setAssessment(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const companyRef = doc(db, "companies", user.uid);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
          setCompany(null);
          setAssessment(null);
          setError("Company profile not found.");
          return;
        }

        const companyData = companySnap.data();
        setCompany(companyData);

        const currentYear = companyData.currentAssessment;

        if (!currentYear) {
          setAssessment(null);
          return;
        }

        const assessmentRef = doc(
          db,
          "companies",
          user.uid,
          "assessments",
          String(currentYear)
        );

        const assessmentSnap = await getDoc(assessmentRef);

        if (assessmentSnap.exists()) {
          setAssessment(assessmentSnap.data());
        } else {
          setAssessment(null);
        }
      } catch (err) {
        console.error("Error loading Governance dashboard:", err);
        setError("Unable to load Governance data. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Extract Governance data from the active assessment.
  const governanceData = assessment?.governance || {};

  const rawValues = governanceData.rawValues || {};
  const normalizedScores = governanceData.normalizedScores || {};

  const moduleScore =
    governanceData.moduleScore ?? governanceData.score ?? null;

  // A KPI is answered when its raw value is not null or undefined.
  // This correctly treats false as a valid answer.
  const answeredKPIs = governanceKPIs.filter(
    (kpi) =>
      rawValues[kpi.id] !== null &&
      rawValues[kpi.id] !== undefined &&
      rawValues[kpi.id] !== ""
  );

  const totalKPIs = governanceKPIs.length;
  const answeredCount = answeredKPIs.length;

  const completion =
    totalKPIs > 0
      ? Math.round((answeredCount / totalKPIs) * 100)
      : 0;

  // Only numeric, non-null scores are used for KPI insights.
  const scoredKPIs = governanceKPIs
    .map((kpi) => ({
      ...kpi,
      score: normalizedScores[kpi.id],
    }))
    .filter(
      (kpi) =>
        typeof kpi.score === "number" &&
        Number.isFinite(kpi.score)
    );

  const strongestAreas = [...scoredKPIs]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const improvementAreas = [...scoredKPIs]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  // Generate recommendations using the existing recommendation engine.
  const {
    recommendations = [],
    industryGuidance: industryNote = "",
  } = useMemo(
    () =>
      getModuleRecommendations({
        module: "Governance",
        rawValues,
        normalizedScores,
        industry: company?.industry || "",
      }),
    [rawValues, normalizedScores, company?.industry]
  );

  // Display a readable KPI name even if the library uses different field names.
  const getKpiName = (kpi) =>
    kpi.name || kpi.title || kpi.question || kpi.label || kpi.id;

  const formatScore = (score) =>
    typeof score === "number" && Number.isFinite(score)
      ? `${score.toFixed(1)} / 100`
      : "Not available";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-gray-600">Loading Governance dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-indigo-600">
              ESGenius / Governance
            </p>

            <h1 className="text-3xl font-bold text-gray-900">
              Governance Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Monitor business ethics, transparency, accountability, and
              responsible management.
            </p>

            {company?.name && (
              <p className="mt-2 text-sm text-gray-500">
                Company: {company.name}
              </p>
            )}

            {assessment?.year && (
              <p className="mt-1 text-sm text-gray-500">
                Assessment year: {assessment.year}
              </p>
            )}
          </div>

          <Link
            to="/Governance"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700"
          >
            Continue Assessment
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!assessment && !error && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              No active assessment found
            </h2>
            <p className="mt-2 text-gray-600">
              Start or select an assessment from your main dashboard to view
              Governance performance.
            </p>
            <Link
              to="/Dashboard"
              className="mt-4 inline-block font-medium text-indigo-600 hover:underline"
            >
              Go to Main Dashboard
            </Link>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Governance Score"
            value={
              typeof moduleScore === "number"
                ? `${moduleScore.toFixed(1)} / 100`
                : "Incomplete"
            }
            description="Overall Governance performance"
          />

          <SummaryCard
            title="Assessment Completion"
            value={`${completion}%`}
            description={`${answeredCount} of ${totalKPIs} KPIs answered`}
          />

          <SummaryCard
            title="KPIs Requiring Attention"
            value={
              scoredKPIs.filter((kpi) => kpi.score < 60).length
            }
            description="Answered KPIs scoring below 60"
          />

          <SummaryCard
            title="KPIs Assessed"
            value={`${answeredCount} / ${totalKPIs}`}
            description="Governance indicators completed"
          />
        </div>

        {/* Completion progress */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Assessment Progress
            </h2>
            <span className="font-semibold text-indigo-600">
              {completion}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Complete the remaining indicators to build a more complete picture
            of your company's Governance performance.
          </p>
        </section>

        {/* Strengths and improvement areas */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Strongest Areas
            </h2>

            {strongestAreas.length === 0 ? (
              <p className="text-sm text-gray-500">
                KPI scores will appear here once assessment data is available.
              </p>
            ) : (
              <div className="space-y-4">
                {strongestAreas.map((kpi) => (
                  <ScoreRow
                    key={kpi.id}
                    name={getKpiName(kpi)}
                    score={kpi.score}
                    positive
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Areas for Improvement
            </h2>

            {improvementAreas.length === 0 ? (
              <p className="text-sm text-gray-500">
                KPI scores will appear here once assessment data is available.
              </p>
            ) : (
              <div className="space-y-4">
                {improvementAreas.map((kpi) => (
                  <ScoreRow
                    key={kpi.id}
                    name={getKpiName(kpi)}
                    score={kpi.score}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* KPI details table */}
        <section className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Governance KPI Performance
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review the answers and normalized scores for each indicator.
            </p>
          </div>

          {governanceKPIs.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No Governance KPIs were found in kpiLibrary. Check that your
              Governance KPI IDs start with GOV_ or that their module is
              set to Governance.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">KPI</th>
                    <th className="px-6 py-4 font-semibold">Response</th>
                    <th className="px-6 py-4 font-semibold">Score</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {governanceKPIs.map((kpi) => {
                    const value = rawValues[kpi.id];
                    const score = normalizedScores[kpi.id];

                    const isAnswered =
                      value !== null &&
                      value !== undefined &&
                      value !== "";

                    return (
                      <tr key={kpi.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {getKpiName(kpi)}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {kpi.id}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {isAnswered ? String(value) : "Not answered"}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {formatScore(score)}
                        </td>

                        <td className="px-6 py-4">
                          {!isAnswered ? (
                            <StatusLabel label="Pending" />
                          ) : typeof score !== "number" ? (
                            <StatusLabel label="Answered" />
                          ) : score >= 80 ? (
                            <StatusLabel label="Strong" />
                          ) : score >= 60 ? (
                            <StatusLabel label="Moderate" />
                          ) : (
                            <StatusLabel label="Needs improvement" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recommendations */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Recommendations
          </h2>

          <p className="mb-5 mt-1 text-sm text-gray-500">
            Suggested actions based on your Governance assessment.
          </p>

          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-500">
              No recommendations are available yet. Complete more Governance
              KPIs to receive more relevant guidance.
            </p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((item, index) => (
                <div
                  key={item.id || `${item.title || item.kpiId || "recommendation"}-${index}`}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {item.title ||
                        item.kpiName ||
                        item.kpiId ||
                        "Recommended action"}
                    </h3>

                    {item.priority && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        {item.priority}
                      </span>
                    )}
                  </div>

                  <p className="text-sm leading-6 text-gray-600">
                    {item.recommendation ||
                      item.description ||
                      item.message ||
                      item.action ||
                      "Review this indicator and identify an appropriate improvement action."}
                  </p>
                </div>
              ))}
            </div>
          )}

          {industryNote && (
            <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
              <h3 className="font-semibold text-indigo-900">
                Industry Guidance
              </h3>
              <p className="mt-2 text-sm leading-6 text-indigo-800">
                {industryNote}
              </p>
            </div>
          )}
        </section>

        {/* Future enhancement */}
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            AI-Powered Governance Insights
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Future enhancement: use historical assessments and industry
            benchmarks to identify Governance trends and suggest targeted
            improvements.
          </p>
        </section>
      </div>
    </div>
  );
}

/* Reusable summary card */
function SummaryCard({ title, value, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  );
}

/* Reusable KPI score row */
function ScoreRow({ name, score, positive = false }) {
  const barColor = positive ? "bg-emerald-500" : "bg-amber-500";

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-gray-700">{name}</p>
        <span className="whitespace-nowrap text-sm font-semibold text-gray-900">
          {score.toFixed(1)} / 100
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

/* Reusable status label */
function StatusLabel({ label }) {
  const styles = {
    Strong: "bg-emerald-50 text-emerald-700",
    Moderate: "bg-blue-50 text-blue-700",
    Pending: "bg-gray-100 text-gray-600",
    Answered: "bg-indigo-50 text-indigo-700",
    "Needs improvement": "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[label] || "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
    </span>
  );
}