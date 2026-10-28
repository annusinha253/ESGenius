
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { auth, db } from "../../context/firebase";

const MODULES = [
  {
    key: "environment",
    name: "Environmental",
    color: "#16a34a",
  },
  {
    key: "social",
    name: "Social",
    color: "#2563eb",
  },
  {
    key: "governance",
    name: "Governance",
    color: "#7c3aed",
  },
];

function getModuleScore(data) {
  const score = data?.moduleScore ?? data?.score ?? null;

  return typeof score === "number" && Number.isFinite(score)
    ? score
    : null;
}


const getOverallScore = (assessment) => {
  // First, read the field saved by finalESGscoring.js
  const finalScore = assessment?.finalESGScore;

  if (
    typeof finalScore === "number" &&
    Number.isFinite(finalScore)
  ) {
    return finalScore;
  }

  // Fallback for assessments using the older structure
  const overall = assessment?.overall;

  if (typeof overall === "number") {
    return overall;
  }

  if (
    typeof overall?.score === "number" &&
    Number.isFinite(overall.score)
  ) {
    return overall.score;
  }

  return null;
};


function formatScore(score) {
  return score === null ? "—" : score.toFixed(1);
}

function formatChange(change) {
  if (change === null) return "First available score";
  if (change > 0) return `↑ ${change.toFixed(1)} points`;
  if (change < 0) return `↓ ${Math.abs(change).toFixed(1)} points`;
  return "No change";
}

function getDate(assessment) {
  const timestamp = assessment.updatedAt || assessment.createdAt;
  if (!timestamp) return "—";

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString();
}

function getStatus(assessment) {
  return assessment.status || "In progress";
}

export default function AssessmentDetails() {
  const [company, setCompany] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setError("");

      if (!user) {
        setCompany(null);
        setHistory([]);
        setError("Please log in to view your assessment history.");
        setLoading(false);
        return;
      }

      try {
        const companyRef = doc(db, "companies", user.uid);
        const companySnapshot = await getDoc(companyRef);

        if (!companySnapshot.exists()) {
          setCompany(null);
          setHistory([]);
          setError("Company profile not found.");
          setLoading(false);
          return;
        }

        const companyData = companySnapshot.data();
        setCompany(companyData);

        const assessmentRef = collection(
          db,
          "companies",
          user.uid,
          "assessments"
        );

        const assessmentSnapshot = await getDocs(assessmentRef);

        const records = assessmentSnapshot.docs.map((item) => {
          const data = item.data();

          return {
            ...data,
            year: String(data.year ?? item.id),
            documentId: item.id,
          };
        });

        records.sort((a, b) => Number(a.year) - Number(b.year));

        setHistory(records);
      } catch (err) {
        console.error("Failed to load assessment history:", err);
        setError("Could not load your assessment history.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Prepare chart data and score changes in chronological order.
  const historyData = useMemo(() => {
    return history.map((assessment, index) => {
      const previous = index > 0 ? history[index - 1] : null;

      const row = {
        year: assessment.year,
        documentId: assessment.documentId,
        status: getStatus(assessment),
        updatedAt: getDate(assessment),
        overall: getOverallScore(assessment),
      };

      MODULES.forEach((module) => {
        const score = getModuleScore(assessment[module.key]);
        const previousScore = previous
          ? getModuleScore(previous[module.key])
          : null;

        row[module.key] = score;
        row[`${module.key}Change`] =
          score !== null && previousScore !== null
            ? Number((score - previousScore).toFixed(1))
            : null;
      });

      const previousOverall = previous
        ? getOverallScore(previous)
        : null;

      row.overallChange =
        row.overall !== null && previousOverall !== null
          ? Number((row.overall - previousOverall).toFixed(1))
          : null;

      return row;
    });
  }, [history]);

  const latest = historyData[historyData.length - 1] || null;
  const previous = historyData.length > 1
    ? historyData[historyData.length - 2]
    : null;

  const insights = useMemo(() => {
    if (!latest) return [];

    const available = MODULES.filter(
      (module) => latest[module.key] !== null
    );

    if (available.length === 0) {
      return ["Complete and save module assessments to see score insights."];
    }

    const results = [];

    available.forEach((module) => {
      const score = latest[module.key];
      const change = latest[`${module.key}Change`];

      if (change === null) {
        results.push(
          `${module.name}: current score is ${score.toFixed(1)}. More historical data is needed to compare changes.`
        );
      } else if (change > 0) {
        results.push(
          `${module.name} improved by ${change.toFixed(1)} points compared with the previous available assessment.`
        );
      } else if (change < 0) {
        results.push(
          `${module.name} declined by ${Math.abs(change).toFixed(1)} points compared with the previous available assessment.`
        );
      } else {
        results.push(
          `${module.name} remained unchanged compared with the previous available assessment.`
        );
      }
    });

    const ranked = [...available].sort(
      (a, b) => latest[b.key] - latest[a.key]
    );

    results.push(
      `${ranked[0].name} has the highest available module score in the latest assessment.`
    );

    if (available.length > 1) {
      results.push(
        `${ranked[ranked.length - 1].name} has the lowest available module score and may deserve further review.`
      );
    }

    if (latest.overall === null) {
      results.push(
        "Overall ESG score has not been calculated or saved yet."
      );
    }

    return results;
  }, [latest]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <p className="text-gray-600">Loading ESG score history...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <Link to="/Dashboard" className="text-indigo-600 hover:underline">
          ← Back to Dashboard
        </Link>
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/Dashboard"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900">
            ESG Score History
          </h1>
          <p className="mt-2 text-gray-600">
            Track your company's Environmental, Social, and Governance
            performance over time.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {company?.name || company?.companyName || "Your company"}
            {company?.industry ? ` · ${company.industry}` : ""}
          </p>
        </div>

        {history.length === 0 ? (
          <section className="rounded-xl border bg-white p-8">
            <h2 className="text-lg font-semibold text-gray-900">
              No assessment history yet
            </h2>
            <p className="mt-2 text-gray-600">
              Once you save an assessment, its scores will appear here.
            </p>
            <Link
              to="/Dashboard"
              className="mt-4 inline-block font-medium text-indigo-600 hover:underline"
            >
              Go to Dashboard →
            </Link>
          </section>
        ) : (
          <>
            {/* Latest scores */}
            <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {MODULES.map((module) => {
                const score = latest?.[module.key] ?? null;
                const change = latest?.[`${module.key}Change`] ?? null;

                return (
                  <div
                    key={module.key}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: module.color }}
                      />
                      <p className="text-sm font-medium text-gray-500">
                        {module.name}
                      </p>
                    </div>

                    <p className="mt-4 text-3xl font-bold text-gray-900">
                      {formatScore(score)}
                      <span className="ml-1 text-sm font-normal text-gray-400">
                        / 100
                      </span>
                    </p>

                    <p
                      className={`mt-3 text-sm ${
                        change === null
                          ? "text-gray-500"
                          : change > 0
                            ? "text-emerald-600"
                            : change < 0
                              ? "text-red-600"
                              : "text-gray-500"
                      }`}
                    >
                      {formatChange(change)}
                    </p>
                  </div>
                );
              })}

              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                  Overall ESG Score
                </p>
                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {latest.overall === null
                    ? "Not calculated"
                    : formatScore(latest.overall)}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  {latest.overall === null
                    ? "Overall scoring will be added later."
                    : `Change: ${formatChange(latest.overallChange)}`}
                </p>
              </div>
            </section>

            {/* Trend chart */}
            <section className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                ESG Module Score Trends
              </h2>
              <p className="mb-6 mt-1 text-sm text-gray-500">
                Compare Environmental, Social, and Governance scores across
                saved assessment years.
              </p>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historyData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    {MODULES.map((module) => (
                      <Line
                        key={module.key}
                        type="monotone"
                        dataKey={module.key}
                        name={module.name}
                        stroke={module.color}
                        strokeWidth={3}
                        connectNulls={false}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Latest comparison chart */}
            <section className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Latest Module Comparison
              </h2>
              <p className="mb-6 mt-1 text-sm text-gray-500">
                Compare the three module scores in the latest available
                assessment.
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={MODULES.map((module) => ({
                      module: module.name,
                      score: latest[module.key],
                      fill: module.color,
                    }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="module" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar
                      dataKey="score"
                      name="Score"
                      fill="#4f46e5"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Historical score table */}
            <section className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Assessment Score History
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Scores and changes for every saved assessment.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Year</th>
                      <th className="px-5 py-4 font-semibold">Environmental</th>
                      <th className="px-5 py-4 font-semibold">Social</th>
                      <th className="px-5 py-4 font-semibold">Governance</th>
                      <th className="px-5 py-4 font-semibold">Overall ESG</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...historyData].reverse().map((row) => (
                      <tr key={row.documentId} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {row.year}
                        </td>
                        <td className="px-5 py-4">
                          <ScoreCell
                            score={row.environment}
                            change={row.environmentChange}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <ScoreCell
                            score={row.social}
                            change={row.socialChange}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <ScoreCell
                            score={row.governance}
                            change={row.governanceChange}
                          />
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {formatScore(row.overall)}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {row.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Automatically generated insights */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Performance Insights
              </h2>
              <p className="mb-5 mt-1 text-sm text-gray-500">
                Observations based on your saved assessment scores.
              </p>

              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg bg-gray-50 p-4"
                  >
                    <span className="mt-0.5 text-indigo-600">•</span>
                    <p className="text-sm leading-6 text-gray-700">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ScoreCell({ score, change }) {
  return (
    <div>
      <p className="font-medium text-gray-900">{formatScore(score)}</p>
      {change !== null && change !== undefined && (
        <p
          className={`mt-1 text-xs ${
            change > 0
              ? "text-emerald-600"
              : change < 0
                ? "text-red-600"
                : "text-gray-500"
          }`}
        >
          {formatChange(change)}
        </p>
      )}
    </div>
  );
}
