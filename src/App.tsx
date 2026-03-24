import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, Doctor, Appointment, MedicalReport } from './types';
import { LogIn, LogOut, User, Calendar, FileText, LayoutDashboard, Settings, Menu, X, ChevronRight, Stethoscope, Heart, Brain, Activity, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import { ErrorBoundary } from './components/ErrorBoundary';

// --- Components ---

const Navbar = ({ user, profile, onLogin, onLogout }: { user: any, profile: UserProfile | null, onLogin: () => void, onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Departments', path: '/departments' },
    { name: 'Doctors', path: '/doctors' },
  ];

  if (profile?.role === 'admin') {
    navLinks.push({ name: 'Admin', path: '/admin' });
  } else if (profile?.role === 'patient') {
    navLinks.push({ name: 'Dashboard', path: '/dashboard' });
  }

  return (
    <nav className="bg-white border-b border-emerald-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-emerald-900 tracking-tight">MediGreen Test</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                  location.pathname === link.path ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-emerald-100" />
                  <span className="text-sm font-medium text-slate-700">{user.displayName}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-emerald-50 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                >
                  {link.name}
                </Link>
              ))}
              {!user && (
                <button
                  onClick={() => { onLogin(); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-emerald-600 hover:bg-emerald-50"
                >
                  Login
                </button>
              )}
              {user && (
                <button
                  onClick={() => { onLogout(); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
              <Stethoscope className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">MediGreen</span>
          </div>
          <p className="text-sm leading-relaxed">
            Providing world-class healthcare with a focus on sustainability and patient-centric care.
          </p>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-emerald-400">Home</Link></li>
            <li><Link to="/departments" className="hover:text-emerald-400">Departments</Link></li>
            <li><Link to="/doctors" className="hover:text-emerald-400">Doctors</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-4">Contact</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center"><Phone className="w-4 h-4 mr-2 text-emerald-500" /> +1 (555) 123-4567</li>
            <li className="flex items-center"><Mail className="w-4 h-4 mr-2 text-emerald-500" /> contact@medigreen.com</li>
            <li className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-emerald-500" /> 123 Health Ave, Green City</li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-4">Newsletter</h3>
          <p className="text-sm mb-4">Stay updated with our latest health tips.</p>
          <div className="flex">
            <input type="email" placeholder="Your email" className="bg-slate-800 border-none rounded-l px-4 py-2 w-full focus:ring-1 focus:ring-emerald-500" />
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-r hover:bg-emerald-700 transition-colors">Join</button>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs">
        &copy; {new Date().getFullYear()} MediGreen Hospital. All rights reserved.
      </div>
    </div>
  </footer>
);

// --- Pages ---

const Home = () => (
  <div className="space-y-20 pb-20">
    {/* Hero Section */}
    <section className="relative h-[600px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000"
          alt="Hospital"
          className="w-full h-full object-cover brightness-50"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl text-white"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Your Health, <span className="text-emerald-400 text-italic">Our Priority.</span>
          </h1>
          <p className="text-lg text-slate-200 mb-8 leading-relaxed">
            Experience modern healthcare in a serene, green environment. Our world-class specialists are here to provide the best care for you and your family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/doctors" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg">
              Book Appointment
            </Link>
            <Link to="/departments" className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-lg text-white hover:bg-white/10 transition-all">
              Explore Departments
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Features */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Clock, title: '24/7 Service', desc: 'Emergency care available round the clock for any medical needs.' },
          { icon: User, title: 'Expert Doctors', desc: 'A team of highly qualified and experienced medical professionals.' },
          { icon: Activity, title: 'Modern Tech', desc: 'Equipped with the latest medical technology for precise diagnosis.' },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white rounded-2xl border border-emerald-50 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
              <feature.icon className="text-emerald-600 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
            <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Stats */}
    <section className="bg-emerald-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Happy Patients', value: '15k+' },
            { label: 'Expert Doctors', value: '120+' },
            { label: 'Departments', value: '25+' },
            { label: 'Awards Won', value: '10+' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-emerald-300 text-sm uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

const Departments = () => {
  const depts = [
    { icon: Heart, name: 'Cardiology', desc: 'Specialized care for heart and vascular health.' },
    { icon: Brain, name: 'Neurology', desc: 'Advanced treatment for brain and nervous system disorders.' },
    { icon: Activity, name: 'Orthopedics', desc: 'Expert care for bones, joints, and musculoskeletal issues.' },
    { icon: Stethoscope, name: 'Pediatrics', desc: 'Comprehensive healthcare for infants, children, and adolescents.' },
    { icon: Activity, name: 'Oncology', desc: 'Personalized cancer treatment and compassionate care.' },
    { icon: Brain, name: 'Psychiatry', desc: 'Mental health support and psychiatric evaluations.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Departments</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          We offer a wide range of medical specialties to ensure comprehensive care for all our patients.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {depts.map((dept, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="p-8 bg-white rounded-2xl border border-emerald-50 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <dept.icon className="text-emerald-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{dept.name}</h3>
            <p className="text-slate-600 leading-relaxed mb-6">{dept.desc}</p>
            <Link to="/doctors" className="text-emerald-600 font-medium flex items-center hover:underline">
              Find a Doctor <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Doctors = ({ doctors }: { doctors: Doctor[] }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Meet Our Specialists</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Our team consists of world-renowned doctors dedicated to providing exceptional medical care.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {doctors.map((doctor) => (
          <motion.div
            key={doctor.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-emerald-50 shadow-sm overflow-hidden group"
          >
            <div className="h-64 overflow-hidden relative">
              <img
                src={doctor.image}
                alt={doctor.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-600 shadow-sm">
                {doctor.department}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{doctor.name}</h3>
              <p className="text-emerald-600 text-sm font-medium mb-4">{doctor.specialty}</p>
              <button
                onClick={() => navigate(`/book/${doctor.id}`)}
                className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-600 hover:text-white transition-all"
              >
                Book Appointment
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const BookAppointment = ({ doctors, user, profile }: { doctors: Doctor[], user: any, profile: UserProfile | null }) => {
  const { doctorId } = useLocation().pathname.split('/').pop() as any;
  const doctor = doctors.find(d => d.id === doctorId);
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Login to Book</h2>
        <p className="text-slate-600 mb-8">You need to be logged in as a patient to book an appointment.</p>
        <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-emerald-600 text-white px-6 py-2 rounded-lg">Login with Google</button>
      </div>
    );
  }

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;
    setLoading(true);
    try {
      const appointmentId = Math.random().toString(36).substr(2, 9);
      const newAppointment: Appointment = {
        id: appointmentId,
        patientId: user.uid,
        patientName: user.displayName || 'Patient',
        doctorId: doctor.id,
        doctorName: doctor.name,
        date,
        time,
        status: 'pending',
        notes,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'appointments', appointmentId), newAppointment);
      alert('Appointment booked successfully!');
      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appointments');
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) return <div className="py-20 text-center">Doctor not found</div>;

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <div className="bg-white rounded-3xl border border-emerald-50 shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/3 bg-emerald-50 p-8 flex flex-col items-center text-center">
          <img src={doctor.image} alt={doctor.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4" referrerPolicy="no-referrer" />
          <h3 className="text-xl font-bold text-slate-900">{doctor.name}</h3>
          <p className="text-emerald-600 text-sm font-medium mb-2">{doctor.specialty}</p>
          <div className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full mt-2">
            {doctor.experience} Years Experience
          </div>
        </div>
        <div className="md:w-2/3 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Book Your Visit</h2>
          <form onSubmit={handleBook} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Time</label>
                <select
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">Choose a slot</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly describe your symptoms..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const PatientDashboard = ({ user, profile }: { user: any, profile: UserProfile | null }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportUrl, setReportUrl] = useState('');

  useEffect(() => {
    if (!user) return;

    const unsubAppts = onSnapshot(
      query(collection(db, 'appointments'), where('patientId', '==', user.uid)),
      (snapshot) => {
        setAppointments(snapshot.docs.map(doc => doc.data() as Appointment));
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'appointments')
    );

    const unsubReports = onSnapshot(
      query(collection(db, 'reports'), where('patientId', '==', user.uid)),
      (snapshot) => {
        setReports(snapshot.docs.map(doc => doc.data() as MedicalReport));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
    );

    return () => { unsubAppts(); unsubReports(); };
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const reportId = Math.random().toString(36).substr(2, 9);
      const newReport: MedicalReport = {
        id: reportId,
        patientId: user.uid,
        title: reportTitle,
        fileUrl: reportUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'reports', reportId), newReport);
      setReportTitle('');
      setReportUrl('');
      setShowUpload(false);
      alert('Report added successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reports');
    }
  };

  if (!user) return <div className="py-20 text-center">Please login to view dashboard</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.displayName}</h1>
          <p className="text-slate-500">Manage your health records and appointments.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowUpload(true)}
            className="bg-white border border-emerald-600 text-emerald-600 px-6 py-2 rounded-lg font-medium hover:bg-emerald-50"
          >
            Add Report
          </button>
          <Link to="/doctors" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 shadow-sm">
            Book New Appointment
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Add Medical Report</h3>
                <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Report Title</label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g., Blood Test Result"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Report URL (Optional)</label>
                  <input
                    type="url"
                    value={reportUrl}
                    onChange={(e) => setReportUrl(e.target.value)}
                    placeholder="https://example.com/report.pdf"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Save Report
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-emerald-50 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-emerald-600" /> My Appointments
              </h2>
            </div>
            {loading ? (
              <div className="py-10 text-center text-slate-400">Loading...</div>
            ) : appointments.length === 0 ? (
              <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                No appointments found.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(appt => (
                  <div key={appt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center border border-emerald-100 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-emerald-600">{format(new Date(appt.date), 'MMM')}</span>
                        <span className="text-lg font-bold text-slate-900 leading-none">{format(new Date(appt.date), 'dd')}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{appt.doctorName}</h4>
                        <p className="text-xs text-slate-500">{appt.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        appt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reports */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-emerald-50 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center mb-6">
              <FileText className="w-5 h-5 mr-2 text-emerald-600" /> Medical Reports
            </h2>
            {reports.length === 0 ? (
              <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                No reports uploaded.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(report => (
                  <a
                    key={report.id}
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center mr-3 shadow-sm">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">{report.title}</h4>
                      <p className="text-[10px] text-slate-500">{format(new Date(report.date), 'PPP')}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ user, profile }: { user: any, profile: UserProfile | null }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const unsubAppts = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      setAppointments(snapshot.docs.map(doc => doc.data() as Appointment));
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    });

    return () => { unsubAppts(); unsubUsers(); };
  }, [profile]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await setDoc(doc(db, 'appointments', id), { status }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'appointments');
    }
  };

  if (profile?.role !== 'admin') return <div className="py-20 text-center">Access Denied</div>;

  const filteredAppts = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center">
          <LayoutDashboard className="w-8 h-8 mr-3 text-emerald-600" /> Admin Console
        </h1>
        <div className="flex space-x-4">
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center">
            <span className="text-xs font-bold text-slate-500 uppercase mr-2">Total Patients:</span>
            <span className="text-lg font-bold text-emerald-600">{users.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Manage Appointments</h2>
          <div className="flex space-x-2">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filter === f ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(appt => (
                <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{appt.patientName}</div>
                    <div className="text-[10px] text-slate-400">ID: {appt.patientId.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">{appt.doctorName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">{format(new Date(appt.date), 'PPP')}</div>
                    <div className="text-[10px] text-slate-400">{appt.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                      appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      appt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      appt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {appt.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(appt.id, 'confirmed')}
                        className="text-[10px] font-bold text-emerald-600 hover:underline"
                      >
                        Confirm
                      </button>
                    )}
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <button
                        onClick={() => updateStatus(appt.id, 'cancelled')}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAppts.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic">No appointments match the filter.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || '',
            photoURL: u.photoURL || '',
            role: u.email === 'oshan951@gmail.com' ? 'admin' : 'patient',
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const unsubDoctors = onSnapshot(collection(db, 'doctors'), (snapshot) => {
      if (snapshot.empty) {
        // Seed initial doctors if empty
        const initialDoctors: Doctor[] = [
          { id: 'd1', name: 'Dr. Sarah Wilson', specialty: 'Cardiologist', experience: 12, about: 'Expert in heart health.', image: 'https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=400', department: 'Cardiology', availableDays: ['Mon', 'Wed', 'Fri'] },
          { id: 'd2', name: 'Dr. James Miller', specialty: 'Neurologist', experience: 15, about: 'Specialist in brain disorders.', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400', department: 'Neurology', availableDays: ['Tue', 'Thu'] },
          { id: 'd3', name: 'Dr. Elena Rodriguez', specialty: 'Pediatrician', experience: 8, about: 'Caring for your little ones.', image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400', department: 'Pediatrics', availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
          { id: 'd4', name: 'Dr. David Chen', specialty: 'Orthopedic Surgeon', experience: 20, about: 'Expert in bone and joint surgery.', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400', department: 'Orthopedics', availableDays: ['Mon', 'Thu'] },
        ];
        initialDoctors.forEach(d => setDoc(doc(db, 'doctors', d.id), d));
      }
      setDoctors(snapshot.docs.map(doc => doc.data() as Doctor));
    });

    return () => { unsubAuth(); unsubDoctors(); };
  }, []);

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl"
        >
          <Stethoscope className="text-white w-8 h-8" />
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
          <Navbar user={user} profile={profile} onLogin={handleLogin} onLogout={handleLogout} />
          <main className="min-h-[calc(100vh-64px-300px)]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/doctors" element={<Doctors doctors={doctors} />} />
              <Route path="/book/:doctorId" element={<BookAppointment doctors={doctors} user={user} profile={profile} />} />
              <Route path="/dashboard" element={<PatientDashboard user={user} profile={profile} />} />
              <Route path="/admin" element={<AdminPanel user={user} profile={profile} />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
