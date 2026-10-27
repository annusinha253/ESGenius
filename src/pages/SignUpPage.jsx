import { useState } from "react";
import { auth, db } from "../context/firebase";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function SignUpPage() {
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const registerCompany = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    let userCredential = null;

    try {
      const trimmedEmail = email.trim();
      const trimmedCompanyId = companyId.trim();

      userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password,
      );

      const uid = userCredential.user.uid;

      await setDoc(doc(db, "companies", uid), {
        uid,
        companyId: trimmedCompanyId,
        companyName: companyName.trim(),
        industry,
        email: trimmedEmail,
        createdAt: serverTimestamp(),
      });

      alert("Company Registered Successfully!");
      navigate("/");
    } catch (error) {
      if (userCredential?.user) {
        try {
          await deleteUser(userCredential.user);
        } catch (rollbackError) {
          console.error("Could not roll back auth user after signup failure:", rollbackError);
        }
      }

      if (error.code === "auth/email-already-in-use") {
        alert(
          "This email is already registered. If signup failed before, delete the user in Firebase Authentication and try again, or log in with the same Company ID you used when registering.",
        );
        navigate("/");
      } else if (error.code === "permission-denied") {
        alert(
          "Your account was not saved: Firestore blocked the write. In Firebase Console → Firestore → Rules, allow signed-in users to write their own companies/{uid} document (see firestore.rules in this project), then register again.",
        );
      } else {
        console.error(error);
        alert(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/*header*/}
      <div className="w-full px-6 py-4 border-b border-slate-200 bg-teal-600">
        <button
          onClick={() => navigate(-1)}
          className="relative z-10 text-lg font-semibold text-white hover:text-white/80 transition-colors w-fit"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <form
          onSubmit={registerCompany}
          className=" w-full max-w-lg flex flex-col "
        >
          <h1 className="mb-6 text-3xl md:text-4xl font-bold tracking-tight text-teal-600 text-balance text-center">
            Register Your Company
          </h1>

          <label className="mb-2 text-lg font-bold text-slate-900">
            Company ID
          </label>
          <input
            type="text"
            value={companyId}
            placeholder="Enter company ID"
            onChange={(e) => setCompanyId(e.target.value)}
            className="mb-5 w-full rounded-full border border-slate-300 px-5 py-3.5 text-slate-900 placeholder:text-slate-400  focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            required
          />

          <label className="mb-2 text-lg font-bold text-slate-900">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            placeholder="Enter company name"
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="mb-5 w-full rounded-full border border-slate-300 px-5 py-3.5 text-slate-900 placeholder:text-slate-400  focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {/* dropdown for indutry type */}
          <label className="mb-2 text-lg font-bold text-slate-900">
            Industry
          </label>

          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            className="mb-5 w-full rounded-full border border-slate-300 px-5 py-3.5 text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select Industry</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="IT_Services">IT Services</option>
            <option value="Banking_Finance">Banking & Finance</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Retail_Ecommerce">Retail & E-commerce</option>
            <option value="Education">Education</option>
            <option value="Energy_Utilities">Energy & Utilities</option>
            <option value="Telecommunications">Telecommunications</option>
            <option value="Logistics_Transportation">
              Logistics & Transportation
            </option>
            <option value="Construction_RealEstate">
              Construction & Real Estate
            </option>
            <option value="Hospitality_Tourism">Hospitality & Tourism</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Media_Entertainment">Media & Entertainment</option>
            <option value="Other">Other</option>
          </select>

          <label className="mb-2 text-lg font-bold text-slate-900">Email</label>
          <input
            type="email"
            value={email}
            placeholder="Enter company email"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-5 w-full rounded-full border border-slate-300 px-5 py-3.5 text-slate-900 placeholder:text-slate-400  focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <label className="mb-2 text-lg font-bold text-slate-900">
            Password
          </label>
          <input
            type="password"
            value={password}
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mb-5 w-full rounded-full border border-slate-300 px-5 py-3.5 text-slate-900 placeholder:text-slate-400  focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-teal-600 px-6 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Registering…" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUpPage;
