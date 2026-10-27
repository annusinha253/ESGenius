import { useNavigate } from "react-router-dom";
import annuPhoto from "../assets/annuPhoto.jpg"
const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-teal-600">
        <button
          onClick={() => navigate(-1)}
         className="relative z-10 text-lg font-semibold text-white hover:text-white/80 transition-colors w-fit"
        >
          ← Back
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* About section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Left: Profile */}
          <div className="flex flex-col items-center md:items-start">
            {/* Profile image */}
            <div className="mb-6">
              <img
                src={annuPhoto}
                alt="Annu Sinha"
                className="h-48 w-48 rounded-full object-cover border-4 border-slate-200 shadow-lg"
              />
            </div>
            {/* Signature */}
            <div className=" signature mb-2 text-slate-600 text-lg italic font-script ">
              AnnuSinha
            </div>
            <h3 className="text-center md:text-left text-slate-900 font-semibold">
              Annu Sinha
            </h3>
          </div>

          {/* Right: Text content */}
          <div className="md:col-span-2">
            <h2 className="mb-6 text-3xl md:text-4xl font-bold tracking-tight text-teal-600 text-balance">
              Turning ESG Data into Sustainable Business Intelligence
            </h2>

            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                ESGenius is an intelligent ESG (Environmental, Social, and
                Governance) analytics platform designed to help organizations
                measure, evaluate, improve, and forecast their sustainability
                performance.
              </p>

              <p>
                The platform provides a secure company-specific environment
                where organizations can assess their ESG practices through
                structured Environmental, Social, and Governance modules. By
                combining automated scoring, risk analysis, benchmarking,
                forecasting, and AI-driven recommendations, ESGenius transforms
                raw ESG data into actionable business insights. Our goal is not
                only to evaluate an organization&apos;s current sustainability
                performance but also to provide a clear roadmap for continuous
                improvement and long-term ESG excellence.
              </p>
            </div>
          </div>
        </div>

        {/* Vision section */}
        <div className="mb-16">
          <h2 className="mb-8 text-3xl md:text-4xl font-bold text-teal-600">
            Vision
          </h2>

          <p className="max-w-2xl text-lg text-slate-700 leading-relaxed mb-12">
            To empower organizations with intelligent ESG analytics, predictive
            insights, and actionable recommendations that drive sustainable
            growth, responsible governance, and long-term value creation.
          </p>

          
        </div>
      </div>
    </div>
  );
};

export default AboutPage;