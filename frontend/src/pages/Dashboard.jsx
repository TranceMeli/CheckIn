import UserView from "./UserView";
import AdminPanel from "./AdminPanel";
import {useAuth} from "../contexts/AuthContext";

const Dashboard = () => {
    const {user} = useAuth();

return (  
    <>
    {user?.role === "Mitarbeiter" && <UserView />}
    {user?.role === "Admin" && <AdminPanel />}
    </>
);
};


export default Dashboard;

