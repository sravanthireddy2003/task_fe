import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaLock, FaUsers, FaProjectDiagram, FaTasks, FaChartPie, FaBell, FaFileAlt,
  FaCogs, FaComments, FaCalendarAlt, FaSlidersH, FaCheck, FaRocket, FaShieldAlt,
  FaSync, FaCloud, FaMobileAlt, FaChevronRight, FaGlobe, FaUserFriends
} from 'react-icons/fa';
import { FiMenu, FiX } from 'react-icons/fi';

export default function TaskFlowEnterprise() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('home');

  // Scroll offset for sticky navbar
  const NAV_OFFSET = 80;

  const handleNavClick = (section) => {
    setActiveNavItem(section);
    setMobileMenuOpen(false);
    const element = document.getElementById(section);
    if (element) {
      const top = element.offsetTop - NAV_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });

      element.classList.add('ring-4', 'ring-blue-300', 'rounded-xl');
      setTimeout(() => element.classList.remove('ring-4', 'ring-blue-300', 'rounded-xl'), 1500);
    }
  };

  const handlePageNav = (path) => window.location.href = path;
  const handleLogin = () => window.location.href = '/log-in';
  const handleSignup = () => window.location.href = '/log-in';
  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveNavItem('home');
  };

  // --- DATA ---
  const heroFeatures = [
    { icon: FaShieldAlt, text: 'Enterprise Security', color: 'text-blue-400' },
    { icon: FaGlobe, text: 'Multi-tenant Ready', color: 'text-green-400' },
    { icon: FaSync, text: 'Real-time Sync', color: 'text-purple-400' },
    { icon: FaMobileAlt, text: 'Mobile First', color: 'text-pink-400' }
  ];

const modules = [
    { id: 'auth', icon: FaLock, title: 'Secure Authentication', description: '2FA, SSO, RBAC with multi-tenant SaaS architecture', features: ['Google SSO', 'Password Policies', 'Login History', 'Suspicious Alerts'], color: 'from-blue-500/20 to-cyan-500/20' },
    { id: 'dashboard', icon: FaChartPie, title: 'Smart Dashboard', description: 'AI-powered insights with real-time KPIs and predictive analytics', features: ['Task Heatmaps', 'AI Insights', 'Productivity Scores', 'Trend Analysis'], color: 'from-purple-500/20 to-pink-500/20' },
    { id: 'clients', icon: FaUsers, title: 'Client Management', description: 'Complete client lifecycle with portal access and automation', features: ['Client Portals', 'Auto Onboarding', 'Multiple Contacts', 'Document Mgmt'], color: 'from-emerald-500/20 to-green-500/20' },
    { id: 'projects', icon: FaProjectDiagram, title: 'Project Suite', description: 'Gantt charts, milestones, budgets, and profitability tracking', features: ['Gantt Views', 'Budget Tracking', 'Templates', 'Time-Cost Analysis'], color: 'from-amber-500/20 to-orange-500/20' },
    { id: 'tasks', icon: FaTasks, title: 'Task Engine', description: 'Advanced task management with dependencies and automation', features: ['Kanban/Calendar', 'Dependencies', 'Recurring Tasks', 'Gamification'], color: 'from-rose-500/20 to-red-500/20' },
    { id: 'team', icon: FaUserFriends, title: 'Team Collaboration', description: 'Real-time chat, approvals, and workload balancing', features: ['Live Chat', 'Approval Workflows', 'Performance Tracking', 'Workload Balance'], color: 'from-indigo-500/20 to-violet-500/20' }
  ];

  const solutions = [
    { id: 'enterprises', title: 'For Enterprises', description: 'Scalable solutions for large organizations with complex workflows', features: ['Multi-department setup', 'Advanced security', 'Custom workflows'], color: 'blue' },
    { id: 'agencies', title: 'For Agencies', description: 'Client portal and project management for creative agencies', features: ['Client collaboration', 'Project templates', 'Time tracking'], color: 'purple' },
    { id: 'startups', title: 'For Startups', description: 'Affordable plans with essential features for growing teams', features: ['Simple pricing', 'Easy setup', 'Core features'], color: 'green' }
  ];

  const solutionColors = {
    blue: 'border-blue-500 bg-blue-50',
    purple: 'border-purple-500 bg-purple-50',
    green: 'border-green-500 bg-green-50'
  };

  const stats = [
    { value: '47%', label: 'Productivity Boost', description: 'Average increase reported by teams' },
    { value: '92%', label: 'Client Satisfaction', description: 'Rating from platform users' },
    { value: '10K+', label: 'Active Users', description: 'Across 500+ organizations' },
    { value: '24/7', label: 'Support', description: 'Enterprise-grade support' }
  ];

  const navItems = [
    { id: 'features', label: 'Features', type: 'scroll', section: 'features' },
    { id: 'solutions', label: 'Solutions', type: 'scroll', section: 'solutions' },
    { id: 'resources', label: 'Resources', type: 'scroll', section: 'resources' },
    { id: 'contact', label: 'Contact', type: 'scroll', section: 'contact' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={handleLogoClick}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-md opacity-70" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">TF</div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Task Manager</h1>
              <p className="text-xs text-gray-500">Business Task Platform</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`font-medium transition-colors ${activeNavItem === item.id ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'}`}
                onClick={() => item.type === 'scroll' ? handleNavClick(item.section) : handlePageNav(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:block px-6 py-2.5 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-600 shadow-sm hover:shadow-md transition-all" onClick={handleLogin}>Sign In</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all" onClick={handleSignup}>Start Free Trial</motion.button>
            <button className="lg:hidden text-gray-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}</button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden mt-4 border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-3 px-6">
                {navItems.map(item => (
                  <button key={item.id} className={`text-left py-2 font-medium ${activeNavItem === item.id ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'}`} onClick={() => handleNavClick(item.section)}>
                    {item.label}
                  </button>
                ))}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 mt-2 px-4 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-600 transition-all" onClick={handleLogin}>
                  Sign In
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section id="home" className="relative pt-16 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50" />
        {/* Floating Blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-200/30 rounded-full filter blur-3xl animate-slow-spin"></div>
        <div className="absolute -bottom-16 -right-16 w-96 h-96 bg-pink-200/30 rounded-full filter blur-3xl animate-slow-spin-reverse"></div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6">
              <FaRocket className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Trusted by 500+ companies worldwide</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">Complete Task Management</span><br />
              <span className="text-gray-800">For Modern Businesses</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">Everything you need to manage tasks, collaborate with teams, and delight clients in one powerful platform.</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3" onClick={handleSignup}>
                Start 14-Day Free Trial <FaChevronRight />
              </motion.button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap justify-center gap-8">
              {heroFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 text-gray-700">
                  <div className={`p-2 rounded-lg bg-blue-50 ${feature.color}`}><feature.icon /></div>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-lg font-semibold text-gray-800 mb-1">{stat.label}</div>
                <div className="text-gray-600">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Everything You Need in <span className="text-blue-600">One Platform</span></h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Comprehensive modules designed to handle every aspect of modern task and project management</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module, idx) => (
              <motion.div key={module.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color}`}><module.icon className="w-6 h-6 text-white" /></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{module.title}</h3>
                    <p className="text-gray-600">{module.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {module.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700">
                      <FaCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Solutions for <span className="text-blue-600">Every Business</span></h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Tailored packages designed to meet the unique needs of different organizations</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {solutions.map((solution, idx) => (
              <motion.div key={solution.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -5 }} className={`border-2 ${solutionColors[solution.color]} rounded-xl p-8 shadow-lg hover:shadow-xl transition-all`}>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{solution.title}</h3>
                <p className="text-gray-600 mb-4">{solution.description}</p>
                <ul className="space-y-2">
                  {solution.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700">
                      <FaCheck className="w-4 h-4 text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section id="resources" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Resources & Insights</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Guides, webinars, and case studies to help your business grow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {['E-book: Task Optimization', 'Case Study: Enterprise Workflow', 'Webinar: Productivity'].map((res, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -5 }} className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{res}</h3>
                <p className="text-gray-600 text-sm">Learn strategies to improve task management and team productivity.</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Get in Touch</h2>
            <p className="text-gray-600 text-lg">Have questions or want a demo? Fill the form and our team will contact you.</p>
          </div>
          <form className="grid gap-6">
            <input type="text" placeholder="Full Name" className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
            <input type="email" placeholder="Email Address" className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
            <textarea placeholder="Message" className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none" rows={5} required></textarea>
            <button type="submit" className="py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all">Send Message</button>
          </form>
        </div>
      </section>

      <footer className="py-8 bg-white text-center text-gray-500 border-t border-gray-200">
        © 2025 TaskFlow Enterprise. All rights reserved.
      </footer>
    </div>
  );
}
