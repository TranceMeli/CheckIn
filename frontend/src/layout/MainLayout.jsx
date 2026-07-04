import Navbar from "../components/Navbar";
import { Outlet } from "react-router"
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DateTime from "..//components/DateTime";




const MainLayout = () => {

const {user, logout } = useAuth();

const navigate = useNavigate();

const handleLogout = () => {
    logout();
    navigate("/login");
    }
    return (
        <div className="layout-container">
            <div className="header">
                <span className="user">Eingeloggt als {user?.email}</span>
    
              {/* <div className="showDate"><DateTime /></div> */}

              <button onClick={handleLogout}>Abmelden</button>
              </div>

    <div className="nav"><Navbar></Navbar></div>
    <div className="main">
<Outlet />
    </div>
      
        <div className="footer"></div>
        </div>
    );
};
export default MainLayout;