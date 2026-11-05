import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "./Footer";
import "../styles/legal.css";

const LegalPage = ({ title, children }) => (
    <div className="legal-page">
        <main className="legal-content">
            <Link to="/login" className="legal-back">
                <ArrowLeft size={16} aria-hidden="true" /> Zurück zur Anmeldung
            </Link>
            <h1>{title}</h1>
            {children}
        </main>
        <Footer className="legal-footer" />
    </div>
);

export default LegalPage;
