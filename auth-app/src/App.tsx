import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import ResetPasswordConfirm from './pages/ResetPasswordConfirm'
import VerifyEmail from './pages/VerifyEmail'
import Profile from './pages/Profile'
import { useLocation } from 'react-router-dom'

function AuthRoutes() {
  const location = useLocation()
  const resetToken = new URLSearchParams(location.search).has('token') && location.pathname === '/reset-password'

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset-password" element={resetToken ? <ResetPasswordConfirm /> : <ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  )
}

function App() {
  return <Router><AuthRoutes /></Router>
}

export default App
