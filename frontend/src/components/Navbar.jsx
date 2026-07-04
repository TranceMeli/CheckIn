import "../styles/components.css"
import {useAuth} from "../contexts/AuthContext";
import { BrowserRouter, Route, Link } from "react-router-dom";

const Navbar = () => {

    const {user, } = useAuth();

    

    return(
        <div className="navbar">
            <ul className="nav-left">
                {user?.role === "Admin" && (
                    <li>
                        
                        <Link to="/dashboard">Auswertungen</Link>
                        <Link to="/manage">Manage</Link>
                        <Link to="/list">List</Link>
                        </li>
                        )}
                    {user?.role === "Mitarbeiter" && (
                        <li>
                    <Link  to="/checkin">CheckIn</Link>
                    <Link to="/dashboard">Auswertungen</Link>
                    </li>
    )}

            </ul>
        </div>
    )
}

export default Navbar;