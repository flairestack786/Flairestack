import {
  LayoutDashboard,
  Home,
  Layers,
  Info,
  MessageSquareQuote,
  Image,
  Inbox,
  Search,
  Settings,
} from 'lucide-react'

export const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { id: 'home', label: 'Home', path: '/admin/home', icon: Home },
  { id: 'services', label: 'Services', path: '/admin/services', icon: Layers },
  { id: 'about', label: 'About', path: '/admin/about', icon: Info },
  { id: 'testimonials', label: 'Testimonials', path: '/admin/testimonials', icon: MessageSquareQuote },
  { id: 'media', label: 'Media Library', path: '/admin/media', icon: Image },
  { id: 'leads', label: 'Leads', path: '/admin/leads', icon: Inbox },
  { id: 'seo', label: 'SEO', path: '/admin/seo', icon: Search },
  { id: 'settings', label: 'Settings', path: '/admin/settings', icon: Settings },
]
