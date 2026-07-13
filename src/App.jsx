import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import AboutPage from './pages/AboutPage'
import ServiceDetail from './pages/ServiceDetail'
import AdminLogin from './pages/admin/AdminLogin'
import DashboardPage from './pages/admin/DashboardPage'
import AdminHomePage from './pages/admin/AdminHomePage'
import AdminServicesPage from './pages/admin/AdminServicesPage'
import AdminServiceEditPage from './pages/admin/AdminServiceEditPage'
import AdminAboutPage from './pages/admin/AdminAboutPage'
import AdminTestimonialsPage from './pages/admin/AdminTestimonialsPage'
import AdminTestimonialEditPage from './pages/admin/AdminTestimonialEditPage'
import AdminMediaPage from './pages/admin/AdminMediaPage'
import AdminLeadsPage from './pages/admin/AdminLeadsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSeoPage from './pages/admin/AdminSeoPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminForbiddenPage from './pages/admin/AdminForbiddenPage'
import Loader from './components/Loader'
import FloatingCallButton from './components/FloatingCallButton'
import ScrollToTopButton from './components/ScrollToTopButton'
import ProtectedRoute from './components/admin/ProtectedRoute'
import PermissionRoute from './components/admin/PermissionRoute'
import GuestRoute from './components/admin/GuestRoute'
import AdminLayout from './components/admin/AdminLayout'
import { AuthProvider } from './context/AuthContext'
import { SiteSettingsProvider } from './hooks/useSiteSettings'
import { PublishedServicesProvider } from './hooks/usePublishedServices'
import { PublishedTestimonialsProvider } from './hooks/useTestimonials'
import { HomePageProvider } from './hooks/useHomePage'

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
    <SiteSettingsProvider>
      <PublishedServicesProvider>
        <PublishedTestimonialsProvider>
          <HomePageProvider>
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
          </HomePageProvider>
        </PublishedTestimonialsProvider>
      </PublishedServicesProvider>
    </SiteSettingsProvider>
  )
}

function withModule(module, element) {
  return <PermissionRoute module={module}>{element}</PermissionRoute>
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
            <Route path="forbidden" element={<AdminForbiddenPage />} />
            <Route path="dashboard" element={withModule('dashboard', <DashboardPage />)} />
            <Route path="home" element={withModule('home', <AdminHomePage />)} />
            <Route path="services" element={withModule('services', <AdminServicesPage />)} />
            <Route
              path="services/:serviceId"
              element={withModule('services', <AdminServiceEditPage />)}
            />
            <Route path="about" element={withModule('about', <AdminAboutPage />)} />
            <Route
              path="testimonials"
              element={withModule('testimonials', <AdminTestimonialsPage />)}
            />
            <Route
              path="testimonials/:testimonialId"
              element={withModule('testimonials', <AdminTestimonialEditPage />)}
            />
            <Route path="media" element={withModule('media', <AdminMediaPage />)} />
            <Route path="leads" element={withModule('leads', <AdminLeadsPage />)} />
            <Route path="users" element={withModule('users', <AdminUsersPage />)} />
            <Route path="seo" element={withModule('seo', <AdminSeoPage />)} />
            <Route path="settings" element={withModule('settings', <AdminSettingsPage />)} />
          </Route>
          <Route path="/*" element={<PublicSite />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
