import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import AboutPage from './pages/AboutPage'
import ServiceDetail from './pages/ServiceDetail'
import AdminLogin from './pages/admin/AdminLogin'
import DashboardPage from './pages/admin/DashboardPage'
import AdminHomePage from './pages/admin/AdminHomePage'
import AdminServicesPage from './pages/admin/AdminServicesPage'
import AdminAboutPage from './pages/admin/AdminAboutPage'
import AdminTestimonialsPage from './pages/admin/AdminTestimonialsPage'
import AdminMediaPage from './pages/admin/AdminMediaPage'
import AdminLeadsPage from './pages/admin/AdminLeadsPage'
import AdminSeoPage from './pages/admin/AdminSeoPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import Loader from './components/Loader'
import FloatingCallButton from './components/FloatingCallButton'
import ScrollToTopButton from './components/ScrollToTopButton'
import ProtectedRoute from './components/admin/ProtectedRoute'
import GuestRoute from './components/admin/GuestRoute'
import AdminLayout from './components/admin/AdminLayout'
import { AuthProvider } from './context/AuthContext'

const LOADER_MIN_MS = 1100

function PublicSite() {
  const [loading, setLoading] = useState(true)
  const [contentReady, setContentReady] = useState(false)

  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, LOADER_MIN_MS))
    const windowReady = new Promise((resolve) => {
      if (document.readyState === 'complete') resolve()
      else window.addEventListener('load', resolve, { once: true })
    })

    Promise.all([minDelay, windowReady]).then(() => {
      setLoading(false)
      setContentReady(true)
    })
  }, [])

  return (
    <>
      <div className={`app-shell ${contentReady ? 'app-shell--visible' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
        </Routes>
        <FloatingCallButton />
        <ScrollToTopButton />
      </div>
      <Loader active={loading} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/admin/login"
            element={
              <GuestRoute>
                <AdminLogin />
              </GuestRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="home" element={<AdminHomePage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="about" element={<AdminAboutPage />} />
            <Route path="testimonials" element={<AdminTestimonialsPage />} />
            <Route path="media" element={<AdminMediaPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="seo" element={<AdminSeoPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          <Route path="/*" element={<PublicSite />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
