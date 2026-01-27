import { ArrowRight, Calendar, MapPin, BarChart3, Sparkles, CheckCircle2, Shield, Zap, Users } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onNavigate: (role: 'student' | 'organizer' | 'admin' | 'auth') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, #abcef1ff 0%, #ebeff5ff 50%, #adf6dbff 100%)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#3e50f4' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#ffffff' }} />
            </div>
            <span className="text-xl font-semibold" style={{ color: '#3e50f4' }}>CampusFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-4 py-2 transition-colors hover:text-primary"
              style={{ color: '#6b7280' }}
            >
              Home
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 transition-colors hover:text-primary"
              style={{ color: '#6b7280' }}
            >
              Features
            </button>
            <button 
              onClick={() => onNavigate('auth')}
              className="px-5 py-2.5 rounded-2xl transition-colors font-medium"
              style={{ backgroundColor: '#3e50f4', color: '#ffffff' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2e3fb4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3e50f4'}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#3e50f4', opacity: 0.1 }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#27b07d', opacity: 0.1 }} />
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fadeInLeft">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium" 
                   style={{ backgroundColor: '#27b07d20', borderColor: '#27b07d40', color: '#27b07d' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#27b07d' }} />
                <span>Trusted by 50+ Universities</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fadeInUp animate-delay-100">
                Your Campus,{" "}
                <span style={{ color: '#3e50f4' }}>Unified</span>
                {" "}
                and{" "}
                <span style={{ color: '#27b07d' }}>Simplified</span>
              </h1>
              <p className="text-lg lg:text-xl max-w-xl mx-auto lg:mx-0 animate-fadeInUp animate-delay-200" style={{ color: '#6b7280' }}>
                Transform Your Campus Events
              </p>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed animate-fadeInUp animate-delay-300">
                CampusFlow streamlines event creation, resource booking, and approvals—empowering students, organizers, and administrators with a modern, intuitive platform.
              </p>
              <div className="flex flex-wrap gap-4 animate-fadeInUp animate-delay-400">
                <button 
                  onClick={() => onNavigate('auth')}
                  className="px-8 py-4 rounded-2xl transition-colors flex items-center gap-2 font-semibold"
                  style={{ backgroundColor: '#3e50f4', color: '#ffffff' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2e3fb4'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3e50f4'}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-8 mt-10 pt-10 border-t border-slate-200 animate-fadeInUp animate-delay-500">
                <div>
                  <div className="text-3xl text-slate-900">500+</div>
                  <div className="text-sm text-slate-600">Active Events</div>
                </div>
                <div>
                  <div className="text-3xl text-slate-900">15K+</div>
                  <div className="text-sm text-slate-600">Students</div>
                </div>
                <div>
                  <div className="text-3xl text-slate-900">120+</div>
                  <div className="text-sm text-slate-600">Organizations</div>
                </div>
              </div>
            </div>
            <div className="relative animate-fadeInRight animate-delay-200">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-indigo-600/10">
                <ImageWithFallback 
                  src="/image.png"
                  alt="Students collaborating on campus"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Event Approved</div>
                    <div className="text-slate-900">Tech Symposium 2026</div>
                  </div>
                </div>
              </div>

              {/* Tech Fest 2025 Floating Card */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-lg animate-float hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Tech Fest 2025</p>
                    <p className="text-xs text-slate-600">Starting in 2 days</p>
                  </div>
                </div>
              </div>

              {/* New Registrations Floating Card */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-users w-5 h-5 text-white">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">+1,234</p>
                    <p className="text-xs text-slate-600">New registrations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4" 
                  style={{ backgroundColor: '#27b07d20', color: '#27b07d' }}>
              Features
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Everything You Need to{" "}
              <span style={{ color: '#3e50f4' }}>Run Your Campus</span>
            </h2>
            <p className="text-lg" style={{ color: '#6b7280' }}>
              A complete suite of tools designed for modern universities. 
              Streamline operations, boost engagement, and create memorable experiences.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Event Management */}
            <div className="group p-6 lg:p-8 bg-white rounded-3xl border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#3e50f420' }}
                >
                  <Calendar className="w-7 h-7" style={{ color: '#3e50f4' }} />
                </div>

                {/* Content */}
                <h3 className="text-xl lg:text-2xl font-bold mb-3">Event Management</h3>
                <p className="mb-6 flex-grow" style={{ color: '#6b7280' }}>
                  Create, manage, and promote campus events with ease. From hackathons to cultural fests, handle it all in one place.
                </p>

                {/* Feature image */}
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src="/event.png"
                    alt="Event Management"
                    className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Resource Booking */}
            <div className="group p-6 lg:p-8 bg-white rounded-3xl border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#27b07d20' }}
                >
                  <MapPin className="w-7 h-7" style={{ color: '#27b07d' }} />
                </div>

                {/* Content */}
                <h3 className="text-xl lg:text-2xl font-bold mb-3">Resource Booking</h3>
                <p className="mb-6 flex-grow" style={{ color: '#6b7280' }}>
                  Book auditoriums, labs, equipment, and more. Real-time availability and conflict-free scheduling.
                </p>

                {/* Feature image */}
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src="/resource.png"
                    alt="Resource Booking"
                    className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Smart Analytics */}
            <div className="group p-6 lg:p-8 bg-white rounded-3xl border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#f6ae3120' }}
                >
                  <BarChart3 className="w-7 h-7" style={{ color: '#f6ae31' }} />
                </div>

                {/* Content */}
                <h3 className="text-xl lg:text-2xl font-bold mb-3">Smart Analytics</h3>
                <p className="mb-6 flex-grow" style={{ color: '#6b7280' }}>
                  Gain insights into attendance, engagement, and resource utilization. Data-driven decisions made simple.
                </p>

                {/* Feature image */}
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src="/smart.png"
                    alt="Smart Analytics"
                    className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Collaboration Hub */}
            <div className="group p-6 lg:p-8 bg-white rounded-3xl border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#3e50f420' }}
                >
                  <Users className="w-7 h-7" style={{ color: '#3e50f4' }} />
                </div>

                {/* Content */}
                <h3 className="text-xl lg:text-2xl font-bold mb-3">Collaboration Hub</h3>
                <p className="mb-6 flex-grow" style={{ color: '#6b7280' }}>
                  Connect clubs, departments, and students. Multi-team events and seamless communication.
                </p>

                {/* Feature image */}
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src="/collab.png"
                    alt="Collaboration Hub"
                    className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-6" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1f2937' }}>Streamlined Workflow</h2>
            <p className="text-lg" style={{ color: '#6b7280' }}>From event creation to student registration—all in one platform</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-xl font-bold" 
                   style={{ backgroundColor: '#3e50f4', color: '#ffffff' }}>
                1
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#1f2937' }}>Organizers Create</h3>
              <p style={{ color: '#6b7280' }}>
                Event organizers use the intuitive wizard to create events, upload rulebooks, and request resources.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-xl font-bold" 
                   style={{ backgroundColor: '#27b07d', color: '#ffffff' }}>
                2
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#1f2937' }}>Admins Review</h3>
              <p style={{ color: '#6b7280' }}>
                Administrators review event details and rulebooks, then approve or request changes with detailed feedback.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-xl font-bold" 
                   style={{ backgroundColor: '#f6ae31', color: '#181d25' }}>
                3
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#1f2937' }}>Students Register</h3>
              <p style={{ color: '#6b7280' }}>
                Students discover approved events, view rulebooks, and register instantly—with QR codes for easy check-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl p-12 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                   style={{ backgroundColor: '#3e50f420' }}>
                <Shield className="w-8 h-8" style={{ color: '#3e50f4' }} />
              </div>
              <div>
                <h2 className="text-3xl font-bold" style={{ color: '#1f2937' }}>Built for Universities</h2>
                <p className="font-medium" style={{ color: '#6b7280' }}>Trusted by campus administrators and students</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: '#27b07d' }} />
                  <h4 className="font-semibold" style={{ color: '#1f2937' }}>Secure & Reliable</h4>
                </div>
                <p className="text-sm" style={{ color: '#6b7280' }}>Enterprise-grade security for your campus data</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: '#27b07d' }} />
                  <h4 className="font-semibold" style={{ color: '#1f2937' }}>Role-Based Access</h4>
                </div>
                <p className="text-sm" style={{ color: '#6b7280' }}>Granular permissions for every user type</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: '#27b07d' }} />
                  <h4 className="font-semibold" style={{ color: '#1f2937' }}>24/7 Support</h4>
                </div>
                <p className="text-sm" style={{ color: '#6b7280' }}>Always here to help your campus succeed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6" style={{ color: '#1f2937' }}>Ready to Transform Your Campus?</h2>
          <p className="text-xl mb-8" style={{ color: '#6b7280' }}>
            Join hundreds of universities using CampusFlow to manage events and resources
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => onNavigate('student')}
              className="px-8 py-4 rounded-2xl transition-all duration-300 font-semibold transform hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: '#3e50f4', color: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2e3fb4';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3e50f4';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              Get Started
            </button>
            <button className="px-8 py-4 rounded-2xl transition-colors font-medium"
                    style={{ backgroundColor: '#27b07d', color: '#ffffff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f8f66'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27b07d'}>
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6 bg-white" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" 
                   style={{ backgroundColor: '#3e50f4' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#ffffff' }} />
              </div>
              <span className="text-lg font-semibold" style={{ color: '#3e50f4' }}>CampusFlow</span>
            </div>
            <div className="text-sm font-medium" style={{ color: '#6b7280' }}>
              © 2026 CampusFlow. Built with ❤️ for universities.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}