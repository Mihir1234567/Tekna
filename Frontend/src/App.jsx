import Navbar from "./components/Navbar";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Configurator from "./pages/Configurator";
import Quotes from "./pages/Quotes";
import QuoteDetails from "./pages/QuoteDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword"; // Import ForgotPassword
import ResetPassword from "./pages/ResetPassword"; // Import ResetPassword
import { isLoggedIn } from "./utils/auth";

export default function App() {
    const location = useLocation();

    // Routes where navbar must NOT appear
    const hideNavbar =
        location.pathname === "/" ||
        location.pathname === "/login" ||
        location.pathname === "/register" ||
        location.pathname === "/forgot-password" ||
        location.pathname.startsWith("/reset-password");


    return (
        <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
            {/* SHOW NAVBAR ONLY WHEN NOT ON LOGIN/REGISTER */}
            {!hideNavbar && <Navbar />}

            <main className={`flex-1 p-6 ${!hideNavbar ? "mt-2" : ""}`}>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                    />{" "}
                    {/* Route for Forgot Password */}
                    <Route
                        path="/reset-password/:token"
                        element={<ResetPassword />}
                    />{" "}
                    {/* Route for Reset Password */}
                    <Route
                        path="/dashboard"
                        element={
                            isLoggedIn() ? (
                                <Dashboard />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/configurator"
                        element={
                            isLoggedIn() ? (
                                <Configurator />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/quotes"
                        element={
                            isLoggedIn() ? <Quotes /> : <Navigate to="/login" />
                        }
                    />
                    <Route
                        path="/quote/:id"
                        element={
                            isLoggedIn() ? (
                                <QuoteDetails />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                </Routes>
            </main>
        </div>
    );
}
