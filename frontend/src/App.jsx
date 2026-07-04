import './styles/App.css';
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import CheckInPage from './pages/CheckInPage';
import MainLayout from './layout/MainLayout';
import AdminManage from './pages/AdminManage';
import AdminList from './pages/AdminList';



function App() {
  return (
  <AuthProvider>

 <Routes>
  <Route path="/" element={<Login></Login>} />
  <Route path="/login" element={<Login />} />
  {/* <Route path="/checkin" element={<CheckInPage />} /> */}

  <Route element={<ProtectedRoute />}>
  <Route element={<MainLayout />}>
  <Route path="/dashboard" element={<Dashboard />}/>
  <Route path="/checkin" element={<CheckInPage />} />


  </Route>
  </Route>
  <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
  <Route element={<MainLayout />}>
  <Route path="/manage" element={<AdminManage />} />
  <Route path="/list" element={<AdminList />} />
  </Route>
  </Route>
</Routes>

    </AuthProvider>
  );
}

export default App
