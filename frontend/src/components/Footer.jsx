import { Link } from "react-router-dom";

const Footer = ({ className = "footer" }) => (
    <footer className={className}>
        <span>© 2026 CheckIn – fiktives Demoprojekt</span>
        <nav aria-label="Rechtliches">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
        </nav>
    </footer>
);

export default Footer;
