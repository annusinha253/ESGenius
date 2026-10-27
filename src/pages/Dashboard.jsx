import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../context/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  calculateAndSaveFinalESGScore,
} from "../scoring/finalESGscoring";
import { kpiLibrary } from "../configure/kpiLibrary";

const modules = [
  {
    name: "Environmental",
    key: "environment",
    route: "/EnvironmentInfo",
    assessmentRoute: "/Environment",
    icon: "🌿",
    description: "Emissions, energy, waste and natural resources",
    color: "green",
  },
  {
    name: "Social",
    key: "social",
    route: "/SocialInfo",
    assessmentRoute: "/Social",
    icon: "👥",
    description: "Employees, workplace safety and social responsibility",
    color: "blue",
  },
  {
    name: "Governance",
    key: "governance",
    route: "/GovernanceInfo",
    assessmentRoute: "/Governance",
    icon: "🛡️",
    description: "Ethics, compliance and corporate accountability",
    color: "purple",
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i.toString());
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    currentYear.toString()
  );
  const [activeAssessment, setActiveAssessment] = useState("");
  const [company, setCompany] = useState({});
  const [assessmentData, setAssessmentData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load the logged-in user's company and active assessment.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCompany({});
        setAssessmentData(null);
        setActiveAssessment("");
        setLoading(false);
        navigate("/", { replace: true });
        return;
      }

      setLoading(true);

      try {
        const companyRef = doc(db, "companies", user.uid);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
          setCompany({});
          setActiveAssessment("");
          setAssessmentData(null);
          setShowModal(true);
          return;
        }

        const companyData = companySnap.data();

        setCompany(companyData);

        if (companyData.currentAssessment) {
          setActiveAssessment(
            String(companyData.currentAssessment)
          );
          setSelectedYear(
            String(companyData.currentAssessment)
          );
          setShowModal(false);
        } else {
          setActiveAssessment("");
          setAssessmentData(null);
          setShowModal(true);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setErrorMessage(
          "Unable to load your dashboard. Please try again."
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load the selected assessment and calculate its overall ESG score.
  useEffect(() => {
    let cancelled = false;

    async function loadAssessment() {
      const user = auth.currentUser;

      if (!user || !activeAssessment) {
        setAssessmentData(null);
        return;
      }

      try {
        const assessmentRef = doc(
          db,
          "companies",
          user.uid,
          "assessments",
          activeAssessment
        );

        const assessmentSnap = await getDoc(assessmentRef);

        if (!assessmentSnap.exists()) {
          if (!cancelled) {
            setAssessmentData(null);
          }
          return;
        }

        let latestAssessmentData = assessmentSnap.data();

        try {
          const finalESGScore =
            await calculateAndSaveFinalESGScore(
              user.uid,
              activeAssessment
            );

          latestAssessmentData = {
            ...latestAssessmentData,
            finalESGScore,
          };
        } catch (scoreError) {
          console.error(
            "Error calculating or saving final ESG score:",
            scoreError
          );
        }

        if (!cancelled) {
          setAssessmentData(latestAssessmentData);
        }
      } catch (error) {
        console.error("Error loading assessment:", error);

        if (!cancelled) {
          setAssessmentData(null);
        }
      }
    }

    loadAssessment();

    return () => {
      cancelled = true;
    };
  }, [activeAssessment]);

  // Create or switch to an assessment year.
  const startAssessment = async () => {
    if (saving) return;

    const year = Number(selectedYear);

    if (
      !Number.isInteger(year) ||
      year < 1900 ||
      year > currentYear
    ) {
      setErrorMessage(
        `Please enter a valid year between 1900 and ${currentYear}.`
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const user = auth.currentUser;

      if (!user) {
        setErrorMessage("Please log in again.");
        return;
      }

      const yearString = String(year);
      const companyRef = doc(db, "companies", user.uid);

      const assessmentRef = doc(
        db,
        "companies",
        user.uid,
        "assessments",
        yearString
      );

      const assessmentSnap = await getDoc(assessmentRef);

      if (!assessmentSnap.exists()) {
        await setDoc(assessmentRef, {
          year: yearString,
          status: "In Progress",

          environment: {
            rawValues: {},
            normalizedScores: {},
            moduleScore: null,
            score: 0,
            benchmarkScore: 0,
          },

          social: {
            rawValues: {},
            normalizedScores: {},
            moduleScore: null,
            score: 0,
            benchmarkScore: 0,
          },

          governance: {
            rawValues: {},
            normalizedScores: {},
            moduleScore: null,
            score: 0,
            benchmarkScore: 0,
          },

          overall: {
            score: null,
            grade: "N/A",
          },

          progress: {
            environment: 0,
            social: 0,
            governance: 0,
            overall: 0,
          },

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await setDoc(
        companyRef,
        {
          currentAssessment: yearString,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setActiveAssessment(yearString);

      setCompany((previous) => ({
        ...previous,
        currentAssessment: yearString,
      }));

      setSelectedYear(yearString);
      setShowModal(false);
    } catch (error) {
      console.error("Error starting assessment:", error);
      setErrorMessage(
        error.message || "Unable to start the assessment."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setErrorMessage("Unable to log out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-3 text-4xl">🌿</div>
          <p className="text-slate-600">Loading ESGenius...</p>
        </div>
      </div>
    );
  }

  const companyName =
    company.companyName ||
    company.name ||
    company.legalName ||
    "Your Company";

  const industry =
    company.industry ||
    company.industryType ||
    "Industry not specified";

  const moduleScores = {
    environment:
      assessmentData?.environment?.moduleScore ??
      (typeof assessmentData?.environment?.score === "number" &&
      assessmentData.environment.score > 0
        ? assessmentData.environment.score
        : null),

    social:
      assessmentData?.social?.moduleScore ??
      (typeof assessmentData?.social?.score === "number" &&
      assessmentData.social.score > 0
        ? assessmentData.social.score
        : null),

    governance:
      assessmentData?.governance?.moduleScore ??
      (typeof assessmentData?.governance?.score === "number" &&
      assessmentData.governance.score > 0
        ? assessmentData.governance.score
        : null),
  };

  const allModulesScored = Object.values(moduleScores).every(
    (score) =>
      typeof score === "number" && Number.isFinite(score)
  );

  const savedOverallScore = assessmentData?.finalESGScore;

  const overallScore =
    allModulesScored &&
    typeof savedOverallScore === "number" &&
    Number.isFinite(savedOverallScore) &&
    savedOverallScore >= 0 &&
    savedOverallScore <= 100
      ? savedOverallScore
      : null;

  const formatScore = (score) =>
    typeof score === "number" && Number.isFinite(score)
      ? score.toFixed(1)
      : "—";

  const boundedScore = (score) =>
    typeof score === "number" && Number.isFinite(score)
      ? Math.min(100, Math.max(0, score))
      : 0;

  const performanceLabel =
    overallScore === null
      ? "Awaiting scores"
      : overallScore >= 80
        ? "Excellent Performance"
        : overallScore >= 65
          ? "Good Performance"
          : overallScore >= 50
            ? "Fair Performance"
            : "Needs Improvement";

  const pillarColors = {
    environment: {
      main: "#10b981",
      light: "rgba(16,185,129,0.15)",
      text: "text-emerald-600",
      bar: "bg-emerald-500",
    },
    social: {
      main: "#3b82f6",
      light: "rgba(59,130,246,0.15)",
      text: "text-blue-600",
      bar: "bg-blue-500",
    },
    governance: {
      main: "#8b5cf6",
      light: "rgba(139,92,246,0.15)",
      text: "text-violet-600",
      bar: "bg-violet-500",
    },
  };

  const pillarIcons = {
    environment: "🌿",
    social: "👥",
    governance: "🛡️",
  };

  const progressValues = [
    assessmentData?.progress?.environment,
    assessmentData?.progress?.social,
    assessmentData?.progress?.governance,
  ];

  const overallProgress =
    typeof assessmentData?.progress?.overall === "number"
      ? assessmentData.progress.overall
      : progressValues.every(
            (value) => typeof value === "number"
          )
        ? Math.round(
            progressValues.reduce(
              (total, value) => total + value,
              0
            ) / 3
          )
        : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "md:w-20" : "md:w-64"
        } flex w-full shrink-0 flex-col bg-teal-900 px-3 py-5 text-white transition-all duration-300 md:sticky md:top-0 md:h-screen`}
      >
        <div
          className={`mb-8 flex items-center ${
            sidebarCollapsed
              ? "justify-center"
              : "justify-between"
          }`}
        >
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl transition hover:bg-teal-50"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              🌿
            </button>
          ) : (
            <>
              <Link
                to="/Dashboard"
                className="flex items-center gap-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl">
                  🌿
                </div>

                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    ESGenius
                  </h2>
                  <p className="text-xs text-teal-100">
                    Sustainability Intelligence
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="rounded-lg p-2 text-teal-100 transition hover:bg-teal-800 hover:text-white"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <span className="text-xl">⇤</span>
              </button>
            </>
          )}
        </div>

        {!sidebarCollapsed && (
          <>
            <p className="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-widest text-teal-200">
              Assessment Modules
            </p>

            <nav className="space-y-2">
              {modules.map((module) => (
                <Link
                  key={module.key}
                  to={module.route}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-teal-50 transition hover:bg-teal-800 hover:text-white"
                >
                  <span className="text-lg">{module.icon}</span>
                  <span className="flex-1">{module.name}</span>
                  <span className="text-teal-300">›</span>
                </Link>
              ))}
            </nav>

            <p className="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-widest text-teal-200">
              Management
            </p>

            <nav className="space-y-2">
              <Link
                to="/CompanyProfile"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-teal-50 transition hover:bg-teal-800"
              >
                <span className="text-lg">▣</span>
                Company Profile
              </Link>

              <button
                type="button"
                onClick={() => navigate("/AssessmentDetails")}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-teal-50 transition hover:bg-teal-800"
              >
                <span className="text-lg">▤</span>
                Assessments
              </button>
            </nav>

            <div className="mt-8 border-t border-teal-700 pt-5 md:mt-auto">
              <div className="flex items-center gap-3 px-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-900">
                  {companyName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {companyName}
                  </p>
                  <p className="truncate text-xs text-teal-200">
                    {industry}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-teal-100 transition hover:bg-teal-800 hover:text-white"
              >
                <span className="text-lg">⇥</span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Main dashboard */}
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <div>
            <p className="text-xs text-slate-500">Overview</p>
            <h1 className="mt-1 text-lg font-bold text-slate-800">
              Dashboard
            </h1>
          </div>

          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            ESG Dashboard
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] space-y-7 p-5 md:p-8">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          )}

          {/* Welcome */}
          <section className="flex items-center justify-between gap-4 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white p-6 md:p-8">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Welcome, {companyName}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Measure your sustainability performance,
                understand your ESG results, and identify
                opportunities for improvement.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-teal-800 ring-1 ring-teal-100">
                  {industry}
                </span>
              </div>
            </div>

            <div className="hidden w-44 shrink-0 flex-col items-start sm:flex">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600">
                A Better Way Forward
              </p>
              <p className="text-2xl font-bold tracking-tight text-slate-800">
                Measure.
              </p>
              <p className="text-2xl font-extrabold italic tracking-tight text-teal-600">
                Improve.
              </p>
              <p className="text-2xl font-bold tracking-tight text-slate-800">
                Sustain.
              </p>
              <div className="mt-3 h-1 w-12 rounded-full bg-teal-600" />
            </div>
          </section>

          {/* Active assessment */}
          <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl text-teal-700">
                ▤
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Current Assessment
                </p>

                <p className="mt-1 text-xl font-bold text-teal-700">
                  {activeAssessment || "No Active Assessment"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {assessmentData?.status ||
                    "Start or select an assessment year"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedYear(
                  activeAssessment || currentYear.toString()
                );
                setErrorMessage("");
                setShowModal(true);
              }}
              className="rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              + Switch / New Assessment
            </button>
          </section>

          {/* Overall score and pillar contribution */}
          <section className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
            {/* Overall ESG Score */}
            <article className="min-w-0 overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/50 p-5 shadow-sm sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                    Overall ESG Score
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your sustainability performance
                  </p>
                </div>

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-700">
                  ◎
                </span>
              </div>

              {/* Circular three-pillar diagram */}
              
{/* Animated ESG Pillar Orbit */}
<div className="relative mx-auto mt-6 h-[460px] w-full max-w-[500px]">

  {/* Outer orbit */}
  <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-200/80" />

  {/* Orbiting pillars */}
  <div className="esg-orbit absolute left-1/2 top-1/2 h-[330px] w-[330px]">
    {/* Environmental */}
    <div className="esg-orbit-item esg-environment absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-emerald-100/80 shadow-[0_0_0_8px_rgba(16,185,129,0.10)]">
        <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-emerald-500 text-3xl shadow-md">
          🌿
        </div>
      </div>
      <div className="mt-2 whitespace-nowrap text-center">
        <p className="text-sm font-bold text-slate-700">Environmental</p>
        <p className="mt-1 text-sm font-semibold text-emerald-600">
          {formatScore(moduleScores.environment)}
          <span className="font-normal text-slate-400"> / 100</span>
        </p>
      </div>
    </div>

    {/* Social */}
    <div className="esg-orbit-item esg-social absolute bottom-0 left-[82%] flex -translate-x-1/2 translate-y-1/2 flex-col items-center">
      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-blue-100/80 shadow-[0_0_0_8px_rgba(59,130,246,0.10)]">
        <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-blue-500 text-3xl shadow-md">
          👥
        </div>
      </div>
      <div className="mt-2 whitespace-nowrap text-center">
        <p className="text-sm font-bold text-slate-700">Social</p>
        <p className="mt-1 text-sm font-semibold text-blue-600">
          {formatScore(moduleScores.social)}
          <span className="font-normal text-slate-400"> / 100</span>
        </p>
      </div>
    </div>

    {/* Governance */}
    <div className="esg-orbit-item esg-governance absolute bottom-0 left-[18%] flex -translate-x-1/2 translate-y-1/2 flex-col items-center">
      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-violet-100/80 shadow-[0_0_0_8px_rgba(139,92,246,0.10)]">
        <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-violet-500 text-3xl shadow-md">
          🛡️
        </div>
      </div>
      <div className="mt-2 whitespace-nowrap text-center">
        <p className="text-sm font-bold text-slate-700">Governance</p>
        <p className="mt-1 text-sm font-semibold text-violet-600">
          {formatScore(moduleScores.governance)}
          <span className="font-normal text-slate-400"> / 100</span>
        </p>
      </div>
    </div>
  </div>

  {/* Fixed centre score */}
  <div className="absolute left-1/2 top-1/2 z-10 flex h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_0_35px_rgba(20,184,166,0.12)]">
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background: `conic-gradient(#10b981 ${
          overallScore === null
            ? 0
            : Math.min(100, Math.max(0, overallScore)) * 3.6
        }deg, #dff5ef 0deg)`,
        mask: "radial-gradient(farthest-side, transparent calc(100% - 9px), black calc(100% - 8px))",
        WebkitMask:
          "radial-gradient(farthest-side, transparent calc(100% - 9px), black calc(100% - 8px))",
      }}
    />

    <div className="flex flex-col items-center">
      <p className="text-[11px] font-bold tracking-[0.18em] text-slate-500">
        OVERALL ESG
      </p>
      <p className="mt-2 text-5xl font-extrabold tracking-tight text-teal-800">
        {overallScore === null ? "—" : formatScore(overallScore)}
      </p>
      <p className="mt-1 text-sm text-slate-500">/ 100</p>
      <span className="mt-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
        {overallScore === null
          ? "Awaiting scores"
          : overallScore >= 80
            ? "Excellent Performance"
            : overallScore >= 65
              ? "Good Performance"
              : overallScore >= 45
                ? "Fair Performance"
                : "Needs Improvement"}
      </span>
    </div>
  </div>

  {/* Orbit dots */}
  <span className="absolute left-[calc(50%-169px)] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-cyan-400" />
  <span className="absolute left-[calc(50%+157px)] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-teal-500" />
  <span className="absolute left-1/2 top-[calc(50%+159px)] h-3 w-3 -translate-x-1/2 rounded-full bg-teal-400" />
</div>


              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {overallScore === null
                  ? "Complete all three modules to calculate your overall ESG score."
                  : "Your overall ESG score is calculated using industry-specific weights for each pillar."}
              </p>
            </article>

            {/* Pillar Contribution */}
            <article className="flex min-w-0 flex-col rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/30 p-5 shadow-sm sm:p-7">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                  Pillar Contribution
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Explore the performance of each ESG pillar.
                </p>
              </div>

              <div className="mt-7 space-y-7">
                {modules.map((module) => {
                  const score = moduleScores[module.key];
                  const colors = pillarColors[module.key];

                  return (
                    <div key={module.key}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: colors.main,
                            }}
                          />
                          <span className="text-sm font-semibold text-slate-700 sm:text-base">
                            {module.name}
                          </span>
                        </div>

                        <p className="text-sm font-bold sm:text-base">
                          <span style={{ color: colors.main }}>
                            {formatScore(score)}
                          </span>
                          <span className="font-normal text-slate-400">
                            {" "}/ 100
                          </span>
                        </p>
                      </div>

                      <div className="ml-6 mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${boundedScore(score)}%`,
                            backgroundColor: colors.main,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="my-7 border-t border-slate-200" />

              {/* Supporting insight */}
              <div className="mt-auto flex items-start gap-4 rounded-2xl bg-white/80 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 text-2xl">
                  💡
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold leading-6 text-slate-800">
                    Together for a stronger tomorrow
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Each pillar plays a vital role in your overall
                    ESG performance. Focus on improving the areas
                    that need the most attention.
                  </p>
                </div>
              </div>
            </article>
          </section>

{/* getting onto the modules */}
         

{/* Individual module assessment cards */}
<section>
  <div className="mb-4">
    <h2 className="text-xl font-bold text-slate-900">
      Module Assessments
    </h2>
    <p className="mt-1 text-sm text-slate-500">
      Track your KPI completion, see what remains, and continue
      your Environmental, Social and Governance assessments.
    </p>
  </div>

  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {modules.map((module) => {
      const score = moduleScores[module.key];

      // Get all KPIs belonging to this module.
      const moduleKPIs = kpiLibrary.filter(
        (kpi) => kpi.module === module.name
      );

      const totalKPIs = moduleKPIs.length;

      // Get the answers saved in the current assessment.
      const rawValues =
        assessmentData?.[module.key]?.rawValues ?? {};

      // Count only KPIs that have actually been answered.
      const answeredKPIs = moduleKPIs.filter((kpi) => {
        const value = rawValues[kpi.id];

        if (kpi.inputType === "boolean") {
          return typeof value === "boolean";
        }

        return (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        );
      }).length;

      const remainingKPIs = Math.max(
        0,
        totalKPIs - answeredKPIs
      );

      // Calculate completion percentage from the saved answers.
      const progress =
        totalKPIs > 0
          ? Math.round((answeredKPIs / totalKPIs) * 100)
          : 0;

      const isCompleted =
        totalKPIs > 0 && answeredKPIs === totalKPIs;

      const status = isCompleted
        ? "Completed"
        : answeredKPIs > 0
          ? "In progress"
          : "Not started";

      const actionLabel = isCompleted
        ? "Review assessment"
        : answeredKPIs > 0
          ? "Continue assessment"
          : "Start assessment";

      const iconStyles = {
        green: "bg-emerald-50 text-emerald-700",
        blue: "bg-blue-50 text-blue-700",
        purple: "bg-violet-50 text-violet-700",
      };

      const barStyles = {
        green: "bg-emerald-500",
        blue: "bg-blue-500",
        purple: "bg-violet-500",
      };

      const statusStyles = isCompleted
        ? "bg-emerald-50 text-emerald-700"
        : answeredKPIs > 0
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-600";

      return (
        <div
  key={module.key}
  className="group h-full"
>
          <article className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-teal-200 group-hover:shadow-md">
            {/* Module heading and status */}
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${iconStyles[module.color]}`}
              >
                {module.icon}
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles}`}
              >
                {status}
              </span>
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {module.name}
            </h3>

            <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
              {module.description}
            </p>

            {/* KPI completion count */}
            <div className="mt-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  KPIs completed
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {answeredKPIs}
                  <span className="text-base font-medium text-slate-400">
                    {" "}/ {totalKPIs}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">
                  Remaining
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-700">
                  {remainingKPIs}
                </p>
              </div>
            </div>

            {/* Progress percentage */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Assessment progress
              </span>

              <span className="text-sm font-bold text-slate-800">
                {progress}%
              </span>
            </div>

            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label={`${module.name} assessment progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${barStyles[module.color]}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Module score remains separate from completion */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs text-slate-500">
                  Module score
                </p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {formatScore(score)}
                  <span className="text-xs font-normal text-slate-500">
                    {" "}/ 100
                  </span>
                </p>
              </div>

              
<button
  type="button"
  onClick={() => navigate(module.assessmentRoute)}
  className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
>
  {actionLabel}
  <span aria-hidden="true">→</span>
</button>

            </div>
          </article>
        </div>
      );
    })}
  </div>
</section>



          {/* ESG Insights */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                ESG Insights
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Understand the factors affecting your ESG performance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-800">
                    Areas for Improvement
                  </h3>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    Planned
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Identify lower-scoring KPIs and discover which
                  areas could most improve your overall ESG performance.
                </p>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-800">
                    Performance Strengths
                  </h3>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    Planned
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Highlight strong ESG indicators and compare
                  performance across assessment periods.
                </p>
              </article>
            </div>
          </section>

          {/* Future recommendations */}
          <section className="rounded-xl border border-dashed border-teal-200 bg-white p-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl text-teal-700">
              ✦
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              ESG Improvement Recommendations
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Personalized recommendations will appear here to help
              your organization prioritize actions, strengthen ESG
              practices, and improve future assessment results.
            </p>

            <span className="mt-4 inline-block rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
              Recommendation engine — future feature
            </span>
          </section>
        </div>
      </main>

      {/* Assessment year modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl md:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-modal-title"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl">
              🌿
            </div>

            <h2
              id="assessment-modal-title"
              className="text-2xl font-bold text-slate-900"
            >
              {activeAssessment
                ? "Switch Assessment"
                : "Start ESG Assessment"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Select a year to create a new assessment or continue
              an existing one.
            </p>

            <label
              htmlFor="assessment-year"
              className="mt-6 block text-sm font-semibold text-slate-700"
            >
              Assessment Year
            </label>

            <input
              id="assessment-year"
              type="number"
              list="assessment-year-options"
              min="1900"
              max={currentYear}
              step="1"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(event.target.value)
              }
              placeholder="Enter assessment year"
            />

            <datalist id="assessment-year-options">
              {years.map((year) => (
                <option key={year} value={year} />
              ))}
            </datalist>

            {errorMessage && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {errorMessage}
              </p>
            )}

            <button
              type="button"
              onClick={startAssessment}
              disabled={saving}
              className="mt-6 w-full rounded-lg bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Preparing assessment..." : "Continue"}
            </button>

            {activeAssessment && (
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelectedYear(activeAssessment);
                  setErrorMessage("");
                }}
                className="mt-3 w-full rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;