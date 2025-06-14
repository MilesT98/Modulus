import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  Zap, 
  Target, 
  FileText, 
  BarChart3, 
  Plus, 
  Clock, 
  Search, 
  Bell, 
  Edit, 
  CheckCircle,
  Shield,
  Cpu,
  Users,
  Star,
  Crown,
  Menu,
  X,
  Lock,
  AlertCircle,
  Calendar,
  ExternalLink,
  Building,
  TrendingUp,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import './App.css';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    funding_body: '',
    industry: ''  // Changed from tech_area to industry
  });
  const [dashboardStats, setDashboardStats] = useState(null);
  const [alertPreferences, setAlertPreferences] = useState({
    keywords: [],
    tech_areas: [],
    funding_bodies: []
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const params = {};
      
      // Get search term from DOM input
      const searchInput = document.getElementById('search-input');
      if (searchInput && searchInput.value.trim()) {
        params.search = searchInput.value.trim();
      }
      
      if (selectedFilters.funding_body) {
        params.funding_body = selectedFilters.funding_body;
      }
      if (selectedFilters.industry) {  // Changed from tech_area to industry
        params.tech_area = selectedFilters.industry;
      }

      const response = await api.get('/api/opportunities', { params });
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    if (user && currentView === 'opportunities') {
      fetchOpportunities();
    }
  }, [user, currentView, selectedFilters]);

  useEffect(() => {
    if (user && currentView === 'dashboard') {
      fetchDashboardStats();
    }
  }, [user, currentView]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setCurrentView('home');
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleUpgrade = async (tier) => {
    try {
      await api.post('/api/users/upgrade', null, { params: { tier } });
      alert(`Successfully upgraded to ${tier.toUpperCase()} tier!`);
      fetchUserProfile();
      fetchDashboardStats();
    } catch (error) {
      alert('Upgrade failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleDemoTierSwitch = async (tier) => {
    try {
      await api.post('/api/users/upgrade', null, { params: { tier } });
      await fetchUserProfile();
      if (currentView === 'dashboard') {
        await fetchDashboardStats();
      }
      setShowDemoSwitcher(false);
    } catch (error) {
      alert('Tier switch failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      await api.post('/api/data/refresh');
      alert('Data refresh initiated! New opportunities will appear shortly.');
      setTimeout(() => {
        fetchOpportunities();
      }, 3000);
    } catch (error) {
      alert('Refresh failed: ' + (error.response?.data?.detail || 'Upgrade to Pro for data refresh'));
    } finally {
      setLoading(false);
    }
  };

  // Demo Tier Switcher Component (inside App to access state)
  const DemoTierSwitcher = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button 
          onClick={() => setShowDemoSwitcher(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Demo Tier Switcher</h3>
          <p className="text-gray-600 mb-6">
            Switch between tiers to demo the different access levels
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => handleDemoTierSwitch('free')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <Users className="w-5 h-5 mr-2" />
              Switch to FREE Tier
            </button>
            <button
              onClick={() => handleDemoTierSwitch('pro')}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <Star className="w-5 h-5 mr-2" />
              Switch to PRO Tier
            </button>
            <button
              onClick={() => handleDemoTierSwitch('enterprise')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <Crown className="w-5 h-5 mr-2" />
              Switch to ENTERPRISE Tier
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Upgrade Modal Component
  const UpgradeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button 
          onClick={() => setShowUpgradeModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-cyan-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Pro Feature Required</h3>
          <p className="text-gray-600 mb-6">
            This feature requires a Pro/SME subscription. Upgrade now for instant access and expert insights!
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                handleUpgrade('pro');
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Upgrade to Pro - £49/month
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Procurement Act Hub Component - COMPLETELY REBUILT
  const ProcurementActHub = () => {
    const [openAccordions, setOpenAccordions] = useState({});
    
    const toggleAccordion = (section) => {
      setOpenAccordions(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    if (user?.tier === 'free') {
      // Free Tier - Locked Content
      return (
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
            
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Lock className="w-12 h-12 text-cyan-600" />
              </div>
              
              <h1 className="text-4xl font-bold text-slate-900 mb-4">UK Defence Procurement Guide</h1>
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto border-2 border-cyan-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Unlock the Complete Defence Procurement Guide
                </h2>
                <p className="text-gray-600 mb-6">
                  Get comprehensive guidance on MOD procurement, from registration to contract delivery, plus expert consultancy support.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-left">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
                      <CheckCircle className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Complete Registration Guide</h4>
                      <p className="text-sm text-gray-600">Step-by-step guidance for DSP, DASA, and framework registrations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-left">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
                      <CheckCircle className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Bidding Process Mastery</h4>
                      <p className="text-sm text-gray-600">Expert guidance on ITT/RFP responses and proposal development</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-left">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
                      <CheckCircle className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Consultancy Support</h4>
                      <p className="text-sm text-gray-600">Direct access to procurement experts and strategic advisory</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleUpgrade('pro')}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Upgrade to Pro - £49/month
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Pro/Enterprise Tier - Full UK Defence Procurement Guide
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-8 mb-8 text-white">
            <h1 className="text-4xl font-bold mb-4">UK Defence Procurement Guide for SMEs</h1>
            <p className="text-xl text-blue-100">
              Complete roadmap from initial registration to successful contract delivery with the Ministry of Defence
            </p>
          </div>

          {/* Introduction Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Introduction to UK Defence Procurement</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                The UK Ministry of Defence (MOD) is one of the largest procurement organizations in Europe, investing billions annually in defense contracts. 
                For UK Small and Medium-sized Enterprises (SMEs), engaging with MOD procurement offers significant growth opportunities and a chance to contribute to national security.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Why Engage with MOD Procurement?</h3>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>£20+ billion annually</strong> with commitment to 2.5% of GDP by 2027</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Government backing</strong> for increased SME participation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Innovation demand</strong> in AI, autonomous systems, cybersecurity</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Long-term stability</strong> and expansion potential</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-200">
                  <h3 className="text-xl font-bold text-cyan-900 mb-4">How We Can Help You Here:</h3>
                  <ul className="space-y-2 text-cyan-800">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-cyan-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Market Entry Strategy Sessions</strong> - Assess MOD market fit for your capabilities</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-cyan-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>"Why Us for MOD?" Development</strong> - Articulate your unique defence sector value</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Key Organizations Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Key Organizations and Roles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Ministry of Defence (MOD)",
                  description: "Overarching government department responsible for defense policy and procurement"
                },
                {
                  title: "Defence Equipment & Support (DE&S)",
                  description: "MOD's procurement arm, managing complex projects to buy, manage, and maintain equipment"
                },
                {
                  title: "Defence Science and Technology Laboratory (Dstl)",
                  description: "Provides MOD with science and technology advice, actively seeking innovative SME solutions"
                },
                {
                  title: "Defence Infrastructure Organisation (DIO)",
                  description: "Manages MOD's vast estate and infrastructure requirements"
                },
                {
                  title: "Defence and Security Accelerator (DASA)",
                  description: "Key entry point for SMEs with innovative dual-use technologies"
                },
                {
                  title: "Crown Commercial Service (CCS)",
                  description: "Largest UK public procurement organization, operating frameworks MOD utilizes"
                }
              ].map((org, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-bold text-slate-900 mb-2">{org.title}</h3>
                  <p className="text-sm text-gray-600">{org.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-6 bg-cyan-50 rounded-lg border border-cyan-200">
              <h3 className="text-xl font-bold text-cyan-900 mb-3">How We Can Help You Here:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-cyan-800">Targeted Stakeholder Engagement Planning</h4>
                  <p className="text-sm text-cyan-700">Guide you on who to approach within MOD and related agencies</p>
                </div>
                <div>
                  <h4 className="font-semibold text-cyan-800">Prime Contractor Partnership Strategies</h4>
                  <p className="text-sm text-cyan-700">Identify relevant primes and develop compelling approaches</p>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started Section - Collapsible */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <button
              onClick={() => toggleAccordion('gettingStarted')}
              className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <h2 className="text-3xl font-bold text-slate-900">3. Getting Started: Registration and Pre-Qualification</h2>
              {openAccordions['gettingStarted'] ? (
                <ChevronUp className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-500" />
              )}
            </button>
            {openAccordions['gettingStarted'] && (
              <div className="px-8 pb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Essential Registrations</h3>
                <div className="space-y-6">
                  {[
                    {
                      title: "Defence Sourcing Portal (DSP)",
                      url: "https://contracts.mod.uk/",
                      description: "MOD's official e-sourcing platform and primary hub for contract opportunities",
                      benefits: ["View live contract opportunities", "Tailor notifications by category", "Participate in sourcing events"]
                    },
                    {
                      title: "Contracts Finder",
                      description: "Government portal for contracts worth over £10,000 from all central government departments"
                    },
                    {
                      title: "Find a Tender Service (FTS)",
                      description: "High-value contracts (typically above £139,688) advertised here"
                    },
                    {
                      title: "Helios SME Portal",
                      description: "Enhances SME visibility to buyers across defence, aerospace, and security sectors"
                    },
                    {
                      title: "R-Cloud (Dstl)",
                      description: "For science and technology solutions, matches capabilities with Dstl requirements"
                    }
                  ].map((portal, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-bold text-slate-900 mb-2">{portal.title}</h4>
                      <p className="text-gray-700 mb-2">{portal.description}</p>
                      {portal.benefits && (
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {portal.benefits.map((benefit, idx) => (
                            <li key={idx}>{benefit}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-6 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="text-xl font-bold text-orange-900 mb-4">Pre-Qualification Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-orange-800 mb-2">Key Certifications:</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Cyber Essentials Certification (mandatory)</li>
                        <li>• ISO 9001 & AS9100 Certifications</li>
                        <li>• Financial health demonstration</li>
                        <li>• Security clearances (NSV process)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-800 mb-2">How We Help:</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Registration assistance & profile optimization</li>
                        <li>• Compliance & certification roadmap</li>
                        <li>• Security clearance guidance (NSV)</li>
                        <li>• PQQ/SQ review & optimization</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Finding Opportunities Section - Collapsible */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <button
              onClick={() => toggleAccordion('findingOpportunities')}
              className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <h2 className="text-3xl font-bold text-slate-900">4. Finding Opportunities</h2>
              {openAccordions['findingOpportunities'] ? (
                <ChevronUp className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-500" />
              )}
            </button>
            {openAccordions['findingOpportunities'] && (
              <div className="px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Framework Agreements & DPS</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900">Frameworks</h4>
                        <p className="text-blue-800 text-sm">Long-term agreements with pre-qualified suppliers. Examples: CCS frameworks, DE&S Frameworks, TS3, G-Cloud</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900">Dynamic Purchasing Systems</h4>
                        <p className="text-green-800 text-sm">Flexible systems where suppliers can join anytime. Procurement Act 2023 introduces Dynamic Markets</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">DASA Opportunities</h3>
                    <div className="space-y-3">
                      <div className="p-3 border border-gray-200 rounded">
                        <h4 className="font-semibold text-slate-900">Open Call for Innovation</h4>
                        <p className="text-sm text-gray-600">Broad mechanism for disruptive concepts</p>
                      </div>
                      <div className="p-3 border border-gray-200 rounded">
                        <h4 className="font-semibold text-slate-900">Themed Competitions</h4>
                        <p className="text-sm text-gray-600">Specific challenges with targeted funding</p>
                      </div>
                      <div className="p-3 border border-gray-200 rounded">
                        <h4 className="font-semibold text-slate-900">Innovation Loans</h4>
                        <p className="text-sm text-gray-600">Funding for commercializing mature innovations</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-cyan-50 rounded-lg border border-cyan-200">
                  <h3 className="text-xl font-bold text-cyan-900 mb-3">How We Can Help You Here:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-cyan-800">Real-time Contract Access</h4>
                      <p className="text-sm text-cyan-700">Our dedicated supplier portal provides access to all defence contracts in real time</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-800">DASA Application Support</h4>
                      <p className="text-sm text-cyan-700">Guidance for Open Calls, themed competitions, and innovation loan applications</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bidding Process Section - Collapsible */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <button
              onClick={() => toggleAccordion('biddingProcess')}
              className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <h2 className="text-3xl font-bold text-slate-900">5. Bidding Process</h2>
              {openAccordions['biddingProcess'] ? (
                <ChevronUp className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-500" />
              )}
            </button>
            {openAccordions['biddingProcess'] && (
              <div className="px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  {[
                    { step: 1, title: "Download Tender Documents", desc: "Access ITT/RFP documents and read thoroughly" },
                    { step: 2, title: "Develop Proposal", desc: "Ensure compliance and articulate value proposition" },
                    { step: 3, title: "Complete SAQ", desc: "Supplier Assurance Questionnaire using Octavian tool" },
                    { step: 4, title: "Submit Bid", desc: "Submit through DSP by deadline with correct formats" },
                    { step: 5, title: "Evaluation", desc: "MOD evaluates against pre-agreed criteria" },
                    { step: 6, title: "Feedback", desc: "Seek feedback regardless of outcome for improvement" }
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                        {item.step}
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-xs text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-6 bg-cyan-50 rounded-lg border border-cyan-200">
                  <h3 className="text-xl font-bold text-cyan-900 mb-3">How We Can Help You Here:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-cyan-800">Bid/No-Bid Decision Making</h4>
                      <p className="text-sm text-cyan-700">Assess whether a tender is worth the investment</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-800">Proposal Development & Review</h4>
                      <p className="text-sm text-cyan-700">Comprehensive support in drafting and refining proposals</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-800">SAQ Completion Guidance</h4>
                      <p className="text-sm text-cyan-700">Ensure cyber security compliance is accurately represented</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-800">Feedback Analysis</h4>
                      <p className="text-sm text-cyan-700">Interpret MOD feedback for future improvement</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Remaining sections as collapsible content */}
          {/* Support and Resources */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <button
              onClick={() => toggleAccordion('support')}
              className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <h2 className="text-3xl font-bold text-slate-900">7. Support and Resources for SMEs</h2>
              {openAccordions['support'] ? (
                <ChevronUp className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-500" />
              )}
            </button>
            {openAccordions['support'] && (
              <div className="px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    "MOD SME Helpdesk",
                    "Defence and Security Accelerator (DASA)",
                    "Defence Technology Exploitation Programme (DTEP)",
                    "Knowledge in Defence (KiD)",
                    "SME Export Toolkit",
                    "Trade Associations (ADS Group, Make UK Defence, techUK)",
                    "Defence Suppliers Forum (DSF)",
                    "Defence Procurement LinkedIn channel",
                    "Bid Writing Support"
                  ].map((resource, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <h4 className="font-semibold text-slate-900">{resource}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Common Challenges */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <button
              onClick={() => toggleAccordion('challenges')}
              className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <h2 className="text-3xl font-bold text-slate-900">8. Common Challenges and Tips for SMEs</h2>
              {openAccordions['challenges'] ? (
                <ChevronUp className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-500" />
              )}
            </button>
            {openAccordions['challenges'] && (
              <div className="px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Key Challenges</h3>
                    <div className="space-y-4">
                      {[
                        "Complexity of MOD Procurement",
                        "Compliance and Security Requirements", 
                        "Early Engagement Timing",
                        "Building Relationships",
                        "Proving Track Record",
                        "Resource Constraints"
                      ].map((challenge, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="font-semibold text-red-900">{challenge}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">How We Help</h3>
                    <div className="space-y-4">
                      {[
                        "Strategic Advisory & Complexity Management",
                        "Risk Management Workshops",
                        "Relationship Building Guidance", 
                        "Growth & Scaling Advisory",
                        "Innovation Positioning",
                        "Resource Optimization"
                      ].map((solution, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-semibold text-green-900">{solution}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Call-to-Action Footer */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Navigate MOD Procurement?</h3>
            <p className="text-xl text-cyan-100 mb-6">
              Our expert team can provide tailored guidance for your defence contracting journey.
            </p>
            <div className="space-x-4">
              <button className="bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Book Strategy Session
              </button>
              <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-cyan-600 transition-colors">
                Contact Expert Team
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Back button component
  const BackButton = ({ onClick, text = "Back" }) => (
    <button
      onClick={onClick}
      className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {text}
    </button>
  );

  // Helper functions for styling
  const getTierColor = (tier) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-cyan-100 text-cyan-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'free': return <Users className="w-3 h-3" />;
      case 'pro': return <Star className="w-3 h-3" />;
      case 'enterprise': return <Crown className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  // Navigation component
  const NavBar = () => (
    <nav className="bg-slate-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentView('home')}
              className="text-2xl font-bold text-white hover:text-cyan-400 transition-colors"
            >
              Modulus Defence
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'dashboard' ? 'bg-slate-700 text-cyan-400' : 'text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('opportunities')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    currentView === 'opportunities' ? 'bg-slate-700 text-cyan-400' : 'text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Opportunities
                </button>
                <button
                  onClick={() => {
                    if (user?.tier === 'free') {
                      setShowUpgradeModal(true);
                    } else {
                      setCurrentView('procurement-act');
                    }
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    currentView === 'procurement-act' ? 'bg-slate-700 text-cyan-400' : 'text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Procurement Act
                  {user?.tier === 'free' && <Lock className="w-3 h-3 ml-1" />}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${getTierColor(user.tier)}`}>
                  {getTierIcon(user.tier)} 
                  <span className="ml-1">{user.tier.toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-300">{user.company_name}</span>
                <button
                  onClick={() => setShowDemoSwitcher(true)}
                  className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center text-white"
                  title="Demo: Switch Tiers"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Demo
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  // Home page component
  const HomePage = () => (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Modulus Defence: Your Core for UK Defence Opportunity
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Navigate UK Defence Funding & Contracts with Confidence. Access real-time opportunities, 
              expert insights, and procurement guidance designed specifically for defence SMEs.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => setCurrentView('register')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Start Free Today
              </button>
              <button
                onClick={() => setCurrentView('login')}
                className="border border-slate-300 text-white hover:bg-slate-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything Defence SMEs Need in One Platform
            </h2>
            <p className="text-xl text-gray-600">
              From opportunity discovery to procurement compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Real-Time Opportunities</h3>
              <p className="text-gray-600">
                Access the most comprehensive database of UK defence funding and contracts, 
                updated in real-time from government sources.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Procurement Act Guidance</h3>
              <p className="text-gray-600">
                Navigate the new UK Procurement Act 2023 with expert interpretations 
                and interactive compliance tools.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Smart Alerts</h3>
              <p className="text-gray-600">
                Get instant notifications for opportunities matching your expertise, 
                ensuring you never miss a relevant contract.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Choose Your Access Level
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need advanced features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-slate-900 mb-4">£0</div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Basic opportunity listings (48hr delay)</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>General procurement guides</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Email alerts</span>
                </li>
              </ul>
              <button
                onClick={() => setCurrentView('register')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-cyan-500 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-cyan-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                <div className="text-4xl font-bold text-slate-900 mb-4">£49</div>
                <p className="text-gray-600">Per month - SME focused</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Real-time opportunity access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Advanced search & filtering</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Full Procurement Act Hub</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Expert insights & analysis</span>
                </li>
              </ul>
              <button
                onClick={() => setCurrentView('register')}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Start Pro Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-slate-900 mb-4">£149</div>
                <p className="text-gray-600">Per month - Team access</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Multi-user access (5 seats)</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Custom reports</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Priority support</span>
                </li>
              </ul>
              <button
                onClick={() => setCurrentView('register')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Login page component
  const LoginPage = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const email = formData.get('email');
      const password = formData.get('password');
      
      try {
        const response = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('access_token', response.data.access_token);
        setUser(response.data.user);
        setCurrentView('dashboard');
      } catch (error) {
        alert('Login failed: ' + (error.response?.data?.detail || 'Unknown error'));
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Sign in
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentView('register')}
                className="text-cyan-600 hover:text-cyan-500"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Register page component
  const RegisterPage = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const full_name = formData.get('full_name');
      const company_name = formData.get('company_name');
      const email = formData.get('email');
      const password = formData.get('password');
      
      try {
        const response = await api.post('/api/auth/register', { full_name, company_name, email, password });
        localStorage.setItem('access_token', response.data.access_token);
        setUser(response.data.user);
        setCurrentView('dashboard');
      } catch (error) {
        alert('Registration failed: ' + (error.response?.data?.detail || 'Unknown error'));
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <input
                name="full_name"
                type="text"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="Full name"
              />
              <input
                name="company_name"
                type="text"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="Company name"
              />
              <input
                name="email"
                type="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="Email address"
              />
              <input
                name="password"
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="Password"
              />
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Create Account
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="text-cyan-600 hover:text-cyan-500"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Dashboard page component
  const DashboardPage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.company_name} • {user?.tier.toUpperCase()} tier
          </p>
        </div>

        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <Target className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardStats.total_opportunities}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Week</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardStats.new_this_week}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Closing Soon</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardStats.closing_soon}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('opportunities')}
                className="w-full flex items-center p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors text-left"
              >
                <Search className="w-5 h-5 text-cyan-600 mr-3" />
                <div>
                  <div className="font-medium text-slate-900">Browse Opportunities</div>
                  <div className="text-sm text-gray-600">Discover new funding and contracts</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (user?.tier === 'free') {
                    setShowUpgradeModal(true);
                  } else {
                    setCurrentView('procurement-act');
                  }
                }}
                className="w-full flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
              >
                <FileText className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-slate-900">UK Defence Procurement Guide</div>
                  <div className="text-sm text-gray-600">Complete guide to MOD procurement</div>
                </div>
              </button>

              {user?.tier !== 'free' && (
                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      const response = await api.post('/api/data/refresh');
                      alert(`✅ Actify Defence Aggregation Complete!\n${response.data.message}\nOpportunities: ${response.data.opportunities_count}`);
                      // Refresh dashboard stats
                      fetchDashboardStats();
                    } catch (error) {
                      alert('❌ Data refresh failed: ' + (error.response?.data?.detail || 'Unknown error'));
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                  className="w-full flex items-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 rounded-lg transition-colors text-left border-2 border-cyan-200"
                >
                  <Zap className={`w-5 h-5 text-cyan-600 mr-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <div>
                    <div className="font-medium text-slate-900">
                      {isRefreshing ? 'Running Actify Defence Aggregation...' : '🧠 Actify Defence Aggregation'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isRefreshing ? 'Collecting from multiple sources...' : 'Refresh data from UK, EU, NATO sources with AI filtering'}
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={() => setCurrentView('alerts')}
                className="w-full flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
              >
                <Bell className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <div className="font-medium text-slate-900">Configure Alerts</div>
                  <div className="text-sm text-gray-600">Set up personalized notifications</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Benefits</h2>
            <div className="space-y-3">
              {dashboardStats?.tier_benefits.map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {user?.tier === 'free' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                <h3 className="font-semibold text-slate-900 mb-2">Upgrade to Pro</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get instant access to opportunities, advanced filtering, and the full Procurement Act Hub.
                </p>
                <button
                  onClick={() => handleUpgrade('pro')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Upgrade Now - £49/month
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Opportunities page with Actify Defence features
  const OpportunitiesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({
      techArea: '',
      source: '',
      smeRelevance: '',
      deadline: '',
      country: ''
    });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [aggregationStats, setAggregationStats] = useState(null);

    const fetchAggregationStats = async () => {
      if (user?.tier !== 'free') {
        try {
          const response = await api.get('/api/opportunities/aggregation-stats');
          setAggregationStats(response.data);
        } catch (error) {
          console.error('Failed to fetch aggregation stats:', error);
        }
      }
    };

    useEffect(() => {
      fetchAggregationStats();
    }, [user]);

    const filteredOpportunities = opportunities.filter(opp => {
      const matchesSearch = searchTerm === '' || 
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.funding_body.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTechArea = !selectedFilters.techArea || 
        (opp.enhanced_metadata?.tech_tags || []).includes(selectedFilters.techArea);

      const matchesSource = !selectedFilters.source || 
        opp.source.toLowerCase().includes(selectedFilters.source.toLowerCase());

      const matchesSmeRelevance = !selectedFilters.smeRelevance || 
        (selectedFilters.smeRelevance === 'high' && (opp.enhanced_metadata?.sme_score || 0) >= 0.7) ||
        (selectedFilters.smeRelevance === 'medium' && (opp.enhanced_metadata?.sme_score || 0) >= 0.5 && (opp.enhanced_metadata?.sme_score || 0) < 0.7) ||
        (selectedFilters.smeRelevance === 'low' && (opp.enhanced_metadata?.sme_score || 0) < 0.5);

      const matchesDeadline = !selectedFilters.deadline || (() => {
        const deadline = new Date(opp.closing_date);
        const now = new Date();
        const daysDiff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        
        return (selectedFilters.deadline === 'week' && daysDiff <= 7) ||
               (selectedFilters.deadline === 'month' && daysDiff <= 30) ||
               (selectedFilters.deadline === 'quarter' && daysDiff <= 90);
      })();

      const matchesCountry = !selectedFilters.country || 
        opp.country === selectedFilters.country;

      return matchesSearch && matchesTechArea && matchesSource && matchesSmeRelevance && matchesDeadline && matchesCountry;
    });

    const getTierBadgeColor = (tier) => {
      switch (tier) {
        case 'free': return 'bg-gray-100 text-gray-800';
        case 'pro': return 'bg-cyan-100 text-cyan-800';
        case 'enterprise': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getSourceBadgeColor = (source) => {
      if (source.includes('TED') || source.includes('EU')) return 'bg-blue-100 text-blue-800';
      if (source.includes('NATO') || source.includes('NSPA')) return 'bg-indigo-100 text-indigo-800';
      if (source.includes('USA') || source.includes('SAM')) return 'bg-red-100 text-red-800';
      if (source.includes('BAE') || source.includes('Leonardo') || source.includes('Thales')) return 'bg-green-100 text-green-800';
      return 'bg-cyan-100 text-cyan-800';
    };

    const getSmeRelevanceColor = (score) => {
      if (score >= 0.7) return 'text-green-600';
      if (score >= 0.5) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getSmeRelevanceLabel = (score) => {
      if (score >= 0.7) return 'High';
      if (score >= 0.5) return 'Medium';
      return 'Low';
    };

    const groupOpportunitiesByDeadline = (opportunities) => {
      const now = new Date();
      const thisWeek = [];
      const next14Days = [];
      const later = [];

      opportunities.forEach(opp => {
        const deadline = new Date(opp.closing_date);
        const daysDiff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 7) {
          thisWeek.push(opp);
        } else if (daysDiff <= 14) {
          next14Days.push(opp);
        } else {
          later.push(opp);
        }
      });

      return { thisWeek, next14Days, later };
    };

    const groupedOpportunities = groupOpportunitiesByDeadline(filteredOpportunities);

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          {/* Enhanced Header with Actify Defence branding */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  🧠 Actify Defence Intelligence
                </h1>
                <p className="text-gray-600">
                  Comprehensive defence procurement opportunities from {user?.tier !== 'free' ? 'multiple global sources' : 'UK government sources'}
                </p>
              </div>
              
              {user?.tier !== 'free' && aggregationStats && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                  <div className="text-sm text-gray-600">Last Updated</div>
                  <div className="text-lg font-bold text-slate-900">
                    {new Date(aggregationStats.last_updated).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {aggregationStats.total_opportunities} opportunities
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search opportunities, technologies, or agencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center"
              >
                <Filter className="w-5 h-5 mr-2" />
                Advanced Filters
              </button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Technology Area Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Technology Area</label>
                    <select
                      value={selectedFilters.techArea}
                      onChange={(e) => setSelectedFilters({...selectedFilters, techArea: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">All Technologies</option>
                      <option value="Artificial Intelligence & Machine Learning">AI & ML</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="UAV/UAS & Autonomous Systems">UAV/UAS</option>
                      <option value="Space Technologies">Space</option>
                      <option value="Quantum Technologies">Quantum</option>
                      <option value="Electronic Warfare">Electronic Warfare</option>
                      <option value="C4ISR & Communications">C4ISR</option>
                      <option value="Maritime Defence">Maritime</option>
                    </select>
                  </div>

                  {/* Source Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                    <select
                      value={selectedFilters.source}
                      onChange={(e) => setSelectedFilters({...selectedFilters, source: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">All Sources</option>
                      <option value="DASA">DASA</option>
                      <option value="Find a Tender">Find a Tender</option>
                      <option value="Contracts Finder">Contracts Finder</option>
                      {user?.tier !== 'free' && (
                        <>
                          <option value="TED">TED (EU)</option>
                          <option value="NSPA">NSPA (NATO)</option>
                          <option value="SAM">SAM.gov (USA)</option>
                          <option value="BAE">BAE Systems</option>
                          <option value="Leonardo">Leonardo</option>
                          <option value="Thales">Thales</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* SME Relevance Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SME Relevance</label>
                    <select
                      value={selectedFilters.smeRelevance}
                      onChange={(e) => setSelectedFilters({...selectedFilters, smeRelevance: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">All Relevance</option>
                      <option value="high">High (70%+)</option>
                      <option value="medium">Medium (50-70%)</option>
                      <option value="low">Low (50%)</option>
                    </select>
                  </div>

                  {/* Deadline Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                    <select
                      value={selectedFilters.deadline}
                      onChange={(e) => setSelectedFilters({...selectedFilters, deadline: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">All Deadlines</option>
                      <option value="week">This Week</option>
                      <option value="month">Next 30 Days</option>
                      <option value="quarter">Next 90 Days</option>
                    </select>
                  </div>

                  {/* Country Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      value={selectedFilters.country}
                      onChange={(e) => setSelectedFilters({...selectedFilters, country: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">All Countries</option>
                      <option value="UK">United Kingdom</option>
                      {user?.tier !== 'free' && (
                        <>
                          <option value="EU">European Union</option>
                          <option value="NATO">NATO</option>
                          <option value="USA">United States</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedFilters({techArea: '', source: '', smeRelevance: '', deadline: '', country: ''})}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-slate-900">
                {filteredOpportunities.length} opportunities found
              </div>
              
              {user?.tier !== 'free' && aggregationStats && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Sources: {aggregationStats.source_breakdown?.length || 0}</span>
                  <span>•</span>
                  <span>High SME Relevance: {aggregationStats.sme_relevance?.high_relevance || 0}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grouped Opportunities Display */}
          {filteredOpportunities.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* This Week */}
              {groupedOpportunities.thisWeek.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Clock className="w-6 h-6 text-red-600 mr-2" />
                    Closing This Week ({groupedOpportunities.thisWeek.length})
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {groupedOpportunities.thisWeek.map((opportunity) => (
                      <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                    ))}
                  </div>
                </div>
              )}

              {/* Next 14 Days */}
              {groupedOpportunities.next14Days.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Calendar className="w-6 h-6 text-yellow-600 mr-2" />
                    Next 14 Days ({groupedOpportunities.next14Days.length})
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {groupedOpportunities.next14Days.map((opportunity) => (
                      <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                    ))}
                  </div>
                </div>
              )}

              {/* Later */}
              {groupedOpportunities.later.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Calendar className="w-6 h-6 text-green-600 mr-2" />
                    Later ({groupedOpportunities.later.length})
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {groupedOpportunities.later.map((opportunity) => (
                      <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );

    // Enhanced Opportunity Card Component
    function OpportunityCard({ opportunity }) {
      const metadata = opportunity.enhanced_metadata || {};
      const smeScore = metadata.sme_score || 0;
      const techTags = metadata.tech_tags || [];
      
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          {/* Header with source badge and SME score */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(opportunity.source)}`}>
                  {opportunity.source}
                </span>
                
                {user?.tier !== 'free' && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSmeRelevanceColor(smeScore)} bg-gray-100`}>
                    SME: {getSmeRelevanceLabel(smeScore)} ({Math.round(smeScore * 100)}%)
                  </span>
                )}

                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadgeColor(opportunity.tier_required)}`}>
                  {opportunity.tier_required.toUpperCase()}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                {opportunity.title}
              </h3>
            </div>
          </div>

          {/* Technology tags */}
          {techTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {techTags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                  {tag}
                </span>
              ))}
              {techTags.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                  +{techTags.length - 3} more
                </span>
              )}
            </div>
          )}

          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {opportunity.description}
          </p>

          {/* Opportunity details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm">
              <Building className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-700">{opportunity.funding_body}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-700">{opportunity.funding_amount}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-700">
                Closes: {new Date(opportunity.closing_date).toLocaleDateString()}
              </span>
            </div>

            {metadata.trl && (
              <div className="flex items-center text-sm">
                <Zap className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-700">TRL: {metadata.trl}</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={() => window.open(opportunity.official_link, '_blank')}
            className="w-full flex items-center justify-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </button>
        </div>
      );
    }
  };

  // Alerts page component
  const AlertsPage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Alert Preferences</h1>
          <p className="text-gray-600 mt-2">
            Configure personalized notifications for opportunities that match your interests
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (comma-separated)
              </label>
              <input
                name="keywords"
                type="text"
                placeholder="e.g., AI, cybersecurity, quantum computing"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Industries
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Artificial Intelligence',
                  'Cybersecurity', 
                  'Advanced Materials & Manufacturing',
                  'Quantum Technologies',
                  'Space Technologies',
                  'Robotics & Autonomous Systems',
                  'Sensors & Signal Processing',
                  'Human Factors & Training Technologies',
                  'Propulsion & Energy Systems',
                  'CBRN Defence',
                  'Maritime Defence',
                  'Aerospace'
                ].map((area) => (
                  <label key={area} className="flex items-center">
                    <input type="checkbox" className="rounded text-cyan-600 focus:ring-cyan-500 mr-2" />
                    <span className="text-sm text-gray-700">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Bodies
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['MOD', 'DSTL', 'DASA', 'Innovate UK', 'UKRI', 'Crown Commercial Service'].map((body) => (
                  <label key={body} className="flex items-center">
                    <input type="checkbox" className="rounded text-cyan-600 focus:ring-cyan-500 mr-2" />
                    <span className="text-sm text-gray-700">{body}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Funding (£)
                </label>
                <input
                  name="min_funding"
                  type="number"
                  placeholder="e.g., 50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Funding (£)
                </label>
                <input
                  name="max_funding"
                  type="number"
                  placeholder="e.g., 2000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Save Alert Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <NavBar />
      
      {currentView === 'home' && <HomePage />}
      {currentView === 'login' && <LoginPage />}
      {currentView === 'register' && <RegisterPage />}
      {currentView === 'dashboard' && user && <DashboardPage />}
      {currentView === 'opportunities' && <OpportunitiesPage />}
      {currentView === 'alerts' && user && <AlertsPage />}
      {currentView === 'procurement-act' && user && <ProcurementActHub />}
      
      {showUpgradeModal && <UpgradeModal />}
      {showDemoSwitcher && <DemoTierSwitcher />}
    </div>
  );
}

export default App;