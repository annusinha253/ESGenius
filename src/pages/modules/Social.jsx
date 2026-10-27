import { useEffect, useState } from "react";
import {
  collection,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { kpiLibrary } from "../../configure/kpiLibrary";
import { normalize } from "../../scoring/normalizationKPI";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../../context/firebase";

import {
  isModuleComplete,
  calculateModuleScore,
} from "../../scoring/moduleScoring";

const Social = () => {
  const socialKPIs = kpiLibrary.filter((kpi) => kpi.module === "Social");

  const navigate = useNavigate();

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initial = {};

    socialKPIs.forEach((kpi) => {
      if (kpi.inputType === "boolean") {
  initial[kpi.id] = null;
} else {
  initial[kpi.id] = "";
}
    });

    setFormData(initial);
  }, []);

  const handleChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login again.");
        return;
      }

      const uid = user.uid;

      // Read company document
      const companyRef = doc(db, "companies", uid);
      const companySnap = await getDoc(companyRef);

      if (!companySnap.exists()) {
        alert("Company not found.");
        return;
      }

      const currentAssessment = companySnap.data().currentAssessment;

      if (!currentAssessment) {
        alert("No active assessment found.");
        return;
      }

      // Assessment document
      const assessmentRef = doc(
        db,
        "companies",
        uid,
        "assessments",
        currentAssessment,
      );
      //converting raw values into scores
      const normalizedScores = {};

      socialKPIs.forEach((kpi) => {
        normalizedScores[kpi.id] = normalize(
          formData[kpi.id],
          kpi.normalization,
        );
      });
      
const answeredKPIs = socialKPIs.filter((kpi) => {
  const value = formData[kpi.id];

  if (kpi.inputType === "boolean") {
    return typeof value === "boolean";
  }

  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );
}).length;

const totalKPIs = socialKPIs.length;

const progress =
  totalKPIs > 0
    ? Math.round((answeredKPIs / totalKPIs) * 100)
    : 0;

      console.log("RAW VALUES",formData);
      console.log("NORMALIZED SCORE",normalizedScores);

      // 2. Check whether all required Social KPIs are answered
      const complete = isModuleComplete(
        socialKPIs,
        formData,
      );

      // 3. Calculate the Social module score only when complete
      const moduleScore = complete
        ? calculateModuleScore(
            "Social",
            socialKPIs,
            formData,
            normalizedScores,
          )
        : null;

      console.log("SOCIAL COMPLETE:", complete);
      console.log("SOCIAL MODULE SCORE:", moduleScore);

      // Update only social data
      await updateDoc(assessmentRef, {
        "social.rawValues": formData,
        "social.normalizedScores": normalizedScores,
        "social.moduleScore": moduleScore,
        "progress.social": progress,
        updatedAt: serverTimestamp(),
      });

      alert("Social data saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Error saving social data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="w-full px-6 py-4 border-b border-slate-200 bg-teal-600 flex items-center gap-4">
        <button
          onClick={() => navigate("/Dashboard")}
          className="relative z-10 text-lg font-semibold text-white hover:text-white/80 transition-colors w-fit"
        >
          ←
        </button>
        <h2 className="text-xl font-semibold text-white">Social Module</h2>
      </div>

      <div className="flex-1 flex justify-center px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl flex flex-col"
        >
          <h1 className="mb-2 text-3xl md:text-4xl font-bold tracking-tight text-teal-600 text-center">
            Social Assessment
          </h1>

          <p className="text-center text-slate-500 mb-10">
            Provide the social information for your company.
          </p>

          {socialKPIs.map((kpi) => (
            <div key={kpi.id} className="mb-8 border-b border-slate-200 pb-6">
              {/* KPI Name */}
              <label className="block mb-2 text-lg font-bold text-slate-900">
                {kpi.name}
                {kpi.unit && (
                  <span className="text-slate-500 font-medium">
                    {" "}
                    ({kpi.unit})
                  </span>
                )}
              </label>

              {/* Description */}
              <p className="text-sm text-slate-500 mb-4">{kpi.description}</p>

              {/* Number / Percentage */}
              {(kpi.inputType === "number" ||
                kpi.inputType === "percentage") && (
                <input
                  type="number"
                  step="any"
                  value={formData[kpi.id] || ""}
                  onChange={(e) => handleChange(kpi.id, e.target.value)}
                  placeholder={kpi.placeholder}
                  className="w-full rounded-full border border-slate-300 px-5 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              )}

              {/* Boolean */}
              {kpi.inputType === "boolean" && (
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="radio"
                      checked={formData[kpi.id] === true}
                      onChange={() => handleChange(kpi.id, true)}
                      className="accent-teal-600"
                    />
                    Yes
                  </label>

                  <label className="flex items-center gap-2 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="radio"
                      checked={formData[kpi.id] === false}
                      onChange={() => handleChange(kpi.id, false)}
                      className="accent-teal-600"
                    />
                    No
                  </label>
                </div>
              )}

              {/* Category */}
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-teal-600">
                {kpi.category}
              </p>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-teal-600 px-6 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Social Data"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Social;
