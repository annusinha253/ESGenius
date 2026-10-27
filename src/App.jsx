import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/loginPage";
import AboutPage from "./pages/AboutPage";
import Dashboard from "./pages/Dashboard";
import SignUpPage from "./pages/SignUpPage";
import Env from "./pages/modules/Env";
import Social from "./pages/modules/Social";
import Gov from "./pages/modules/Gov";
import EnvironmentInfo from "./pages/SideBar/envDashboard";
import SocialInfo from "./pages/SideBar/socDashboard";
import GovernanceInfo from "./pages/SideBar/socDashboard";
import AssessmentDetails from "./pages/SideBar/assesments";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* login */}
        <Route path="/" element={<Login />} />
        {/* about page */}
        <Route path="/about" element={<AboutPage />} />
        {/* signup page */}
        <Route path="/SignUpPage" element={<SignUpPage />} />

        {/* main dashboard after login */}
        <Route path="/Dashboard" element={<Dashboard />} />

        {/* module forms to input KPIs */}
        <Route path="/Environment" element={<Env />} />
        <Route path="/Social" element={<Social />} />
        <Route path="/Governance" element={<Gov />} />

        {/* module dashboards */}
        <Route path="/EnvironmentInfo" element={<EnvironmentInfo />} />
        <Route path="/SocialInfo" element={<SocialInfo />} />
        <Route path="/GovernanceInfo" element={<GovernanceInfo />} />

        {/* Assesments */}
        <Route path="/AssessmentDetails" element={<AssessmentDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
