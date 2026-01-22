import { Routes, Route, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

// Pages
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import TestPage from './pages/TestPage'

// Layout components
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Layout wrapper that conditionally shows navbar/footer
const Layout = ({ children }) => {
  const location = useLocation()
  
  // Auth pages or Test page don't show navbar/footer
  const isAuthPage = ['/login', '/register', '/test'].includes(location.pathname)
  
  if (isAuthPage) {
    return <>{children}</>
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <>
      <Helmet>
        <title>LowSplit - Comparte suscripciones, ahorra dinero</title>
      </Helmet>
      
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
