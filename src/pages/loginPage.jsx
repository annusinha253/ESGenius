import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../context/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Login = () => {
  const navigate = useNavigate();

  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const trimmedEmail = email.trim();
      const trimmedCompanyId = companyId.trim();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password,
      );

      const uid = userCredential.user.uid;

      const companyRef = doc(db, "companies", uid);
      const companySnap = await getDoc(companyRef);

      if (!companySnap.exists()) {
        await signOut(auth);
        alert(
          "No company profile found for this account. Registration may have failed while saving to Firestore. Register again after fixing Firestore rules, or remove the orphaned user in Firebase Authentication.",
        );
        return;
      }

      const companyData = companySnap.data();

      if (companyData.companyId !== trimmedCompanyId) {
        await signOut(auth);
        alert("Invalid Company ID");
        return;
      }

      alert("Login Successful!");
      navigate("/Dashboard");
    } catch (error) {
      console.error(error);
      alert("Invalid Email or Password. Please register first.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* ===== Left panel ===== */}
      <div className="relative w-full lg:w-1/2 bg-teal-600 overflow-hidden flex flex-col px-10 py-8 min-h-[320px] lg:min-h-screen">
        {/* Decorative: big translucent circle top-left */}
        <div className="pointer-events-none absolute -left-24 top-16 h-[420px] w-[420px] rounded-full bg-white/10" />

        {/* Decorative: dotted grid (top right) */}
        <div
          className="pointer-events-none absolute right-28 top-32 h-12 w-16 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        />

        {/* Decorative: circle outline */}
        <div className="pointer-events-none absolute right-44 top-24 h-8 w-8 rounded-full border-2 border-white/70" />

        {/* Decorative: X mark (bottom left) */}
        <div className="pointer-events-none absolute bottom-40 left-44 text-white/80 text-4xl font-light select-none">
          ✕
        </div>

        {/* Decorative: dotted grid (bottom left) */}
        <div
          className="pointer-events-none absolute bottom-20 left-10 h-12 w-16 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        />

        {/* Decorative: orbit ring + teal gradient orb (bottom) */}
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/4 rounded-full border border-white/40" />
        <div className="pointer-events-none absolute -bottom-10 left-1/2 h-56 w-56 -translate-x-1/4 rounded-full bg-gradient-to-br from-teal-300 to-white-400" />
        <div className="pointer-events-none absolute bottom-28 left-[58%] h-5 w-5 rounded-full bg-gradient-to-br from-cyan-200 to-teal-300" />

        {/* About link */}
        <a
          href="/about"
          onClick={() => navigate("/about")}
          className="relative z-10 text-lg font-semibold text-white hover:text-white/80 transition-colors w-fit"
        >
          About
        </a>

        {/* Headline */}
        <div className="absolute left-12 top-1/2 -translate-y-1/2 z-10 max-w-xl">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            AI-Powered
          </h2>
          <h2 className="mt-2 text-3xl font-bold text-white leading-snug">
            ESG Assessment &amp; Sustainability Intelligence Platform
          </h2>
          <h3 className="mt-2 text-3xl font-bold text-white leading-snug">
            ESGenius
          </h3>
        </div>
      </div>

      
      {/* ===== Right panel (form) ===== */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 lg:px-20">
        <form onSubmit={handleLogin} className=" max-w-lg flex flex-col">
          <h1 className="mb-6 text-3xl md:text-4xl font-bold tracking-tight text-teal-600 text-balance text-center">
            Welcome!
          </h1>

          {/* Company ID */}
          <label
            htmlFor="companyId"
            className="mb-2 text-lg font-bold text-slate-900"
          >
            Company ID
          </label>
          <input
            id="companyId"
            name="companyId"
            placeholder="Enter company ID"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mb-5 w-full rounded-full border border-slate-300 px-5 py-3.5 text-slate-900 placeholder:text-slate-400  focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {/* Email */}
          <label
            htmlFor="email"
            className="mb-2 text-lg font-bold text-slate-900"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-5 w-full rounded-full border border-slate-300 px-5 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {/* Password */}
          <label
            htmlFor="password"
            className="mb-2 text-lg font-bold text-slate-900"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-7 w-full rounded-full border border-slate-300 px-5 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {/* Login button */}
          <button
            type="submit"
            className="w-full rounded-full bg-teal-600 px-6 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            Login
          </button>

          {/* Divider with text */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-300" />
            <span className="text-sm text-slate-500">not registered ?</span>
            <span className="h-px flex-1 bg-slate-300" />
          </div>

          {/* Register button */}
          <button
            type="button"
            onClick={() => navigate("/SignUpPage")}
            className="mx-auto rounded-full border border-slate-300 px-10 py-3 text-lg font-bold text-slate-900 transition-colors hover:bg-slate-50"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;