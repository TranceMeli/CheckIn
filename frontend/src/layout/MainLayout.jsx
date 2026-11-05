import { Outlet } from "react-router";
import { CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import UserMenu from "../components/UserMenu";
import Footer from "../components/Footer";

const MainLayout = () => (
    <div className="layout-container">
        <header className="topbar">
            <div className="topbar__logo">
                <CheckCircle2 size={20} aria-hidden="true" />
                CheckIn
            </div>
            <Navbar variant="top" />
            <span className="topbar__spacer" />
            <UserMenu />
        </header>

        <main className="main">
            <Outlet />
            <Footer />
        </main>

        <Navbar variant="tab" />
    </div>
);

export default MainLayout;
