import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  )
}

export default App
