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
  Users,
} from 'lucide-react'

/**
 * Flat list kept for page-title lookups and any callers that need all items.
 * Prefer `adminNavSections` when rendering the sidebar.
 * Each item includes `module` for RBAC checks via cmsPermissions.js.
 */
export const adminNavItems = [
  { id: 'dashboard', module: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { id: 'home', module: 'home', label: 'Home', path: '/admin/home', icon: Home },
  { id: 'services', module: 'services', label: 'Services', path: '/admin/services', icon: Layers },
  { id: 'about', module: 'about', label: 'About', path: '/admin/about', icon: Info },
  { id: 'testimonials', module: 'testimonials', label: 'Testimonials', path: '/admin/testimonials', icon: MessageSquareQuote },
  { id: 'media', module: 'media', label: 'Media Library', path: '/admin/media', icon: Image },
  { id: 'leads', module: 'leads', label: 'Leads', path: '/admin/leads', icon: Inbox },
  { id: 'users', module: 'users', label: 'Users', path: '/admin/users', icon: Users },
  { id: 'seo', module: 'seo', label: 'SEO', path: '/admin/seo', icon: Search },
  { id: 'settings', module: 'settings', label: 'Settings', path: '/admin/settings', icon: Settings },
]

/** Grouped sidebar navigation for the admin shell. */
export const adminNavSections = [
  {
    id: 'overview',
    label: 'Overview',
    items: [adminNavItems.find((item) => item.id === 'dashboard')].filter(Boolean),
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      adminNavItems.find((item) => item.id === 'home'),
      adminNavItems.find((item) => item.id === 'services'),
      adminNavItems.find((item) => item.id === 'about'),
      adminNavItems.find((item) => item.id === 'testimonials'),
      adminNavItems.find((item) => item.id === 'media'),
    ].filter(Boolean),
  },
  {
    id: 'business',
    label: 'Business',
    items: [adminNavItems.find((item) => item.id === 'leads')].filter(Boolean),
  },
  {
    id: 'system',
    label: 'System',
    items: [
      adminNavItems.find((item) => item.id === 'users'),
      adminNavItems.find((item) => item.id === 'seo'),
      adminNavItems.find((item) => item.id === 'settings'),
    ].filter(Boolean),
  },
]

/**
 * @param {string | null | undefined} role
 * @param {(moduleId: string) => boolean} canAccess
 */
export function getNavSectionsForRole(role, canAccess) {
  return adminNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccess(item.module)),
    }))
    .filter((section) => section.items.length > 0)
}
