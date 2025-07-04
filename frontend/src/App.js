import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Building, 
  DollarSign, 
  Calendar, 
  Target, 
  Bell, 
  Users, 
  Star, 
  Crown, 
  CheckCircle, 
  ArrowLeft, 
  FileText, 
  Lock, 
  X, 
  TrendingUp, 
  Clock,
  ExternalLink,
  Filter,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Globe,
  Award,
  Briefcase,
  Calendar as CalendarIcon,
  MapPin,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [fundingProviders, setFundingProviders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_opportunities: 0,
    new_this_week: 0,
    closing_soon: 0,
    tier_benefits: []
  });
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [linkStatus, setLinkStatus] = useState({});

  // API setup
  const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'
  });

  // Add auth token to requests
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle auth errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
        setCurrentView('login');
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/opportunities');
      setOpportunities(response.data);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    if (!user) return;
    
    try {
      const response = await api.get('/api/dashboard/stats');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  // Fetch funding providers for dashboard KPIs
  const fetchFundingProviders = async () => {
    try {
      const response = await api.get('/api/funding-opportunities');
      setFundingProviders(response.data);
    } catch (error) {
      console.error('Error fetching funding providers:', error);
      setFundingProviders([]);
    }
  };

  // Helper function to ensure URLs have proper protocol
  const ensureHttpProtocol = (url) => {
    if (!url) return '';
    
    // If URL already has protocol, return as is
    if (url.match(/^https?:\/\//)) {
      return url;
    }
    
    // Add https:// by default
    return `https://${url}`;
  };

  // Get fallback URLs for common funding providers
  const getFallbackUrls = (providerName, originalUrl) => {
    const fallbacks = [];
    
    // Extract domain from original URL
    try {
      const domain = new URL(ensureHttpProtocol(originalUrl)).hostname;
      fallbacks.push(`https://${domain}`); // Try homepage
    } catch (e) {
      // If URL parsing fails, ignore
    }
    
    // Provider-specific fallbacks with known working alternatives
    const providerFallbacks = {
      'Shield Capital': ['https://shieldcap.com/', 'https://www.crunchbase.com/organization/shield-capital'],
      'Paladin Capital': ['https://www.paladincapgroup.com/', 'https://www.crunchbase.com/organization/paladin-capital-group'],
      'Lockheed Martin': ['https://www.lockheedmartin.com/', 'https://www.lockheedmartin.com/en-us/capabilities/research-labs/advanced-technology-laboratories.html'],
      'RTX Ventures': ['https://www.rtx.com/', 'https://www.crunchbase.com/organization/rtx-ventures'],
      'Thales': ['https://www.thalesgroup.com/', 'https://www.thalesgroup.com/en/markets/defence'],
      'Octopus Ventures': ['https://www.crunchbase.com/organization/octopus-investments', 'https://www.linkedin.com/company/octopus-ventures/'],
      'British Business Bank': ['https://www.british-business-bank.co.uk/', 'https://www.gov.uk/government/organisations/british-business-bank'],
      'MMC Ventures': ['https://www.crunchbase.com/organization/mmc-ventures', 'https://www.linkedin.com/company/mmc-ventures/'],
      'Amadeus Capital': ['https://amadeuscapital.com/', 'https://www.crunchbase.com/organization/amadeus-capital-partners'],
      'Playfair Capital': ['https://playfair.vc/', 'https://www.crunchbase.com/organization/playfair-capital'],
      'Cambridge Enterprise': ['https://www.enterprise.cam.ac.uk/', 'https://www.crunchbase.com/organization/cambridge-enterprise'],
      'Oxford Science': ['https://oxfordscienceenterprises.com/', 'https://www.crunchbase.com/organization/oxford-sciences-innovation'],
      'Northern Powerhouse': ['https://npif.co.uk/', 'https://www.gov.uk/guidance/northern-powerhouse-investment-fund'],
      'Techstars': ['https://www.techstars.com/', 'https://www.techstars.com/accelerators'],
      'Seedrs': ['https://www.seedrs.com/', 'https://www.seedrs.com/learn']
    };
    
    // Find matching provider and add fallbacks
    for (const [provider, urls] of Object.entries(providerFallbacks)) {
      if (providerName.toLowerCase().includes(provider.toLowerCase()) || 
          provider.toLowerCase().includes(providerName.toLowerCase())) {
        fallbacks.push(...urls);
        break;
      }
    }
    
    return [...new Set(fallbacks)]; // Remove duplicates
  };

  // Enhanced external link handler with fallback options
  const handleExternalLinkClick = (url, context = '') => {
    if (!url) {
      alert('No URL provided for this link.');
      return;
    }
    
    try {
      const properUrl = ensureHttpProtocol(url);
      
      // Log the attempt for debugging
      console.log(`Opening external link: ${properUrl} (Context: ${context})`);
      
      // Open in new tab with proper settings
      const newWindow = window.open(properUrl, '_blank', 'noopener,noreferrer');
      
      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Show popup blocked message with options
        showLinkFallbackModal(properUrl, context);
      }
    } catch (error) {
      console.error('Error opening external link:', error);
      showLinkFallbackModal(url, context);
    }
  };

  // Show modal with link options when main link fails
  const showLinkFallbackModal = (originalUrl, context) => {
    const providerName = context.replace('funding-', '').replace('opportunity-', '');
    const fallbackUrls = getFallbackUrls(providerName, originalUrl);
    
    // Create a more user-friendly modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <div class="text-center">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.036 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          
          <h3 class="text-xl font-bold text-slate-900 mb-2">Link Access Issue</h3>
          <p class="text-gray-600 mb-4">
            The main website for <strong>${providerName}</strong> may be blocking direct access. 
            Try these alternatives:
          </p>
          
          <div class="space-y-2 mb-6">
            ${fallbackUrls.slice(0, 3).map((url, index) => `
              <button onclick="window.open('${url}', '_blank', 'noopener,noreferrer')" 
                      class="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div class="font-medium text-sm">${index === 0 ? 'Try Main Website' : index === 1 ? 'View Company Profile' : 'Alternative Link'}</div>
                <div class="text-xs text-gray-600 truncate">${url}</div>
              </button>
            `).join('')}
          </div>
          
          <button onclick="this.parentElement.parentElement.remove()" 
                  class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
  };

  useEffect(() => {
    if (user) {
      fetchOpportunities();
      fetchDashboardStats();
      fetchFundingProviders();
    }
  }, [user]);

  useEffect(() => {
    if (currentView === 'opportunities' && user) {
      fetchOpportunities();
    }
  }, [currentView, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('home');
  };

  const handleUpgrade = async (tier) => {
    try {
      await api.post(`/api/users/upgrade?tier=${tier}`);
      await fetchUserProfile();
      setShowUpgradeModal(false);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  const handleDemoTierSwitch = async (tier) => {
    try {
      await api.post(`/api/users/upgrade?tier=${tier}`);
      await fetchUserProfile();
      setShowDemoSwitcher(false);
      
      // Refresh data after tier change
      setTimeout(() => {
        fetchOpportunities();
        fetchDashboardStats();
      }, 1000);
    } catch (error) {
      console.error('Tier switch failed:', error);
    }
  };

  const handleOpportunityClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setCurrentView('opportunity-detail');
  };

  // Demo Tier Switcher Component
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
            Switch between subscription tiers to test different features
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => handleDemoTierSwitch('free')}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5 mr-2" />
              Free Tier
            </button>
            <button
              onClick={() => handleDemoTierSwitch('pro')}
              className="w-full flex items-center justify-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Star className="w-5 h-5 mr-2" />
              Pro Tier
            </button>
            <button
              onClick={() => handleDemoTierSwitch('enterprise')}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Crown className="w-5 h-5 mr-2" />
              Enterprise Tier
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Upgrade Modal Component
  const UpgradeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 relative">
        <button 
          onClick={() => setShowUpgradeModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-cyan-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Upgrade to Pro</h3>
          <p className="text-gray-600 mb-6">
            Unlock full access to all contract opportunities, funding routes, and premium features.
          </p>
          
          {/* New Benefits Comparison */}
          <div className="text-left mb-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">🆓 Free (Current)</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 1/3 of current opportunities</li>
                  <li>• Sunday refresh</li>
                  <li>• No funding routes</li>
                  <li>• No procurement guide</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-cyan-900 mb-2 text-sm">💼 Pro</h4>
                <ul className="text-xs text-cyan-700 space-y-1">
                  <li>• ALL contract opportunities</li>
                  <li>• Hourly updates</li>
                  <li>• 60+ funding sources</li>
                  <li>• Full procurement guide</li>
                  <li>• AI insights & bookmarks</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                handleUpgrade('pro');
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              Upgrade to Pro - £49/month
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full text-gray-600 hover:text-gray-800 px-4 py-2 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Funding Opportunities Page Component
  const FundingOpportunitiesPage = () => {
    // Phase 1: Enhanced search state for funding
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStage, setSelectedStage] = useState('');
    const [selectedGeography, setSelectedGeography] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');
    const [fundingStats, setFundingStats] = useState({});
    const [isLoadingFunding, setIsLoadingFunding] = useState(false);
    const [isRefreshingFunding, setIsRefreshingFunding] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);

    // Phase 1: Investment stage options
    const stageOptions = [
      { value: '', label: 'All Investment Stages' },
      { value: 'pre-seed', label: 'Pre-seed' },
      { value: 'seed', label: 'Seed' },
      { value: 'series-a', label: 'Series A' },
      { value: 'series-b+', label: 'Series B+' },
      { value: 'growth', label: 'Growth' },
      { value: 'research', label: 'Research Grants' }
    ];

    // Phase 1: Geographic focus options
    const geographyOptions = [
      { value: '', label: 'All Geographies' },
      { value: 'uk-only', label: 'UK Only' },
      { value: 'uk-eu', label: 'UK + EU' },
      { value: 'global', label: 'Global' },
      { value: 'regional', label: 'Regional (Scotland, Wales, NI)' }
    ];

    // Phase 1: Smart sorting options for funding
    const fundingSortOptions = [
      { value: 'name_asc', label: 'Name (A-Z)' },
      { value: 'category_asc', label: 'Category' },
      { value: 'updated_desc', label: 'Recently Updated' },
      { value: 'relevance_desc', label: 'Best Match for SMEs' }
    ];

    // Fetch funding opportunities from API
    const fetchFundingOpportunities = async () => {
      try {
        setIsLoadingFunding(true);
        const response = await api.get('/api/funding-opportunities', {
          params: {
            category: selectedCategory !== 'all' ? selectedCategory : undefined
          }
        });
        setFundingProviders(response.data);
      } catch (error) {
        console.error('Failed to fetch funding opportunities:', error);
        // Fallback to static data if API fails
        setFundingProviders(getStaticFundingData());
      } finally {
        setIsLoadingFunding(false);
      }
    };

    // Fetch funding statistics
    const fetchFundingStats = async () => {
      try {
        const response = await api.get('/api/funding-opportunities/stats');
        setFundingStats(response.data);
        setLastRefresh(new Date(response.data.last_refresh));
      } catch (error) {
        console.error('Failed to fetch funding stats:', error);
      }
    };

    // Refresh funding data
    const handleRefreshFunding = async () => {
      if (user?.tier === 'free') {
        setShowUpgradeModal(true);
        return;
      }

      try {
        setIsRefreshingFunding(true);
        const response = await api.post('/api/funding-opportunities/refresh');
        
        // Show success message
        alert(`✅ Funding Opportunities Refresh Complete!

📊 ${response.data.message}

🔍 Sources Checked:
${response.data.sources_checked.map(source => `• ${source}`).join('\n')}

🕒 Last Updated: ${new Date().toLocaleString()}

Real-time funding intelligence refreshed successfully.`);
        
        // Refresh data
        await fetchFundingOpportunities();
        await fetchFundingStats();
      } catch (error) {
        alert('❌ Funding refresh failed: ' + (error.response?.data?.detail || 'Unknown error'));
      } finally {
        setIsRefreshingFunding(false);
      }
    };

    // Verify funding URLs
    const handleVerifyUrls = async () => {
      if (user?.tier === 'free') {
        setShowUpgradeModal(true);
        return;
      }

      try {
        setIsRefreshingFunding(true);
        const response = await api.post('/api/funding-opportunities/verify-urls');
        
        // Show detailed success message
        alert(`✅ URL Verification Complete!

📊 ${response.data.message}

🔍 Results:
• ${response.data.verified_count} URLs verified working
• ${response.data.updated_count} URLs updated to working fallbacks
• ${response.data.total_checked} total URLs checked

🕒 Completed: ${new Date().toLocaleString()}

All funding provider links have been verified and updated to ensure they work properly.`);
        
        // Refresh data to show updated URLs
        await fetchFundingOpportunities();
        await fetchFundingStats();
      } catch (error) {
        alert('❌ URL verification failed: ' + (error.response?.data?.detail || 'Unknown error'));
      } finally {
        setIsRefreshingFunding(false);
      }
    };

    // Static fallback data
    const getStaticFundingData = () => [
      {
        category: "Defence & Security VC",
        name: "Shield Capital",
        investment_focus: "Early-stage companies building technologies that matter in artificial intelligence, autonomy, cybersecurity, and space, with a mission focus on the convergence of commercial technology and national security.",
        investment_stage: "Early-stage (Seed, Series A)",
        geographic_focus: "Primarily US, but invests globally in relevant areas",
        website_url: "https://shieldcap.com/"
      },
      {
        category: "Defence & Security VC",
        name: "Paladin Capital Group",
        investment_focus: "Global multi-stage investor focusing on cybersecurity, artificial intelligence, big data, and advanced computing, with significant defence and national security applications.",
        investment_stage: "Multi-stage (growth equity to later stage)",
        geographic_focus: "Global",
        website_url: "https://www.paladincapgroup.com/investments/"
      },
      {
        category: "Defence & Security VC",
        name: "Lockheed Martin Ventures",
        investment_focus: "Accelerating next-generation technologies strategically important to aerospace and defence, helping customers stay ahead of emerging threats.",
        investment_stage: "Strategic investments",
        geographic_focus: "Global",
        website_url: "https://www.lockheedmartin.com/en-us/who-we-are/business-areas/ventures.html"
      },
      {
        category: "Defence & Security VC",
        name: "RTX Ventures (Raytheon Technologies Ventures)",
        investment_focus: "Investing in early-stage companies that will transform aerospace and defense across areas like autonomy & sensing, compute, advanced manufacturing, space, data, analytics & code, and propulsion.",
        investment_stage: "Early-stage",
        geographic_focus: "Global (strategic to RTX)",
        website_url: "https://www.rtx.com/who-we-are/ventures"
      },
      {
        category: "Corporate VC & Innovation",
        name: "Thales Group (Thales Corporate Ventures)",
        investment_focus: "Investing in digital and 'deep tech' innovations (Big Data, AI, connectivity, cybersecurity, and quantum technology) that align with their strategic interests.",
        investment_stage: "Strategic partnerships, corporate venturing",
        geographic_focus: "Global",
        website_url: "https://www.thalesgroup.com/en/thales-startups"
      },
      {
        category: "Corporate VC & Innovation",
        name: "Rolls-Royce (Innovation & Future Programmes)",
        investment_focus: "Actively seeks innovation and partners with SMEs in advanced materials, digital, and propulsion systems; often through collaborative R&D and strategic partnerships.",
        investment_stage: "Collaborative R&D, strategic partnerships, potential for future acquisition",
        geographic_focus: "Global",
        website_url: "https://www.rolls-royce.com/innovation.aspx"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "Octopus Ventures",
        investment_focus: "Broad deep tech, AI, fintech, health tech, and other sectors; dual-use potential is often a factor.",
        investment_stage: "Pre-seed, Seed, Series A, and later-stage",
        geographic_focus: "UK & Europe",
        website_url: "https://octopusventures.com/"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "MMC Ventures",
        investment_focus: "AI and data-driven companies, including enterprise AI, fintech, data-driven health, data infrastructure, and cloud.",
        investment_stage: "Series A specialist",
        geographic_focus: "Europe",
        website_url: "https://mmc.vc/about-us/"
      },
      {
        category: "Deep Tech & Dual-Use VC",
        name: "Amadeus Capital Partners",
        investment_focus: "Deep tech across various sectors, including AI, cybersecurity, and space technologies.",
        investment_stage: "Early Stage EIS Fund and other funds",
        geographic_focus: "Global",
        website_url: "https://amadeuscapital.com/our-approach/"
      },
      {
        category: "Government-Backed Schemes",
        name: "British Business Bank",
        investment_focus: "Facilitates access to finance for smaller businesses via partner funds, covering venture capital, debt finance, and regional funds.",
        investment_stage: "Varies by program/partner fund",
        geographic_focus: "UK",
        website_url: "https://www.british-business-bank.co.uk/how-we-help/"
      },
      {
        category: "Government-Backed Schemes",
        name: "Northern Powerhouse Investment Fund (NPIF)",
        investment_focus: "Addresses market weakness in providing venture debt, debt, and equity finance to SMEs in the North of England. Includes advanced manufacturing, tech, and digital sectors relevant to defence.",
        investment_stage: "Seed, early-stage, growth debt/equity",
        geographic_focus: "North of England, UK",
        website_url: "https://npif.co.uk/"
      },
      {
        category: "University Spin-Out Funds",
        name: "Oxford Science Enterprises (OSE)",
        investment_focus: "Investing in deep tech and life sciences spin-outs from the University of Oxford, including AI, quantum, and advanced materials.",
        investment_stage: "Seed to Series A/B",
        geographic_focus: "Oxford, UK (for source of tech)",
        website_url: "https://oxfordscienceenterprises.com/"
      },
      {
        category: "University Spin-Out Funds",
        name: "Cambridge Enterprise (University of Cambridge)",
        investment_focus: "Commercializing University of Cambridge research through licensing, consultancy, and creating new spin-out companies across various tech sectors.",
        investment_stage: "Seed funding for spin-outs",
        geographic_focus: "Cambridge, UK (for source of tech)",
        website_url: "https://www.enterprise.cam.ac.uk/"
      },
      {
        category: "Accelerators & Incubators",
        name: "Techstars",
        investment_focus: "Operates accelerators focusing on commercially viable startups with dual-purpose technologies, including aerospace and defence.",
        investment_stage: "Early-stage, accelerator programs",
        geographic_focus: "Global (via various programs)",
        website_url: "https://www.techstars.com/"
      },
      {
        category: "Equity Crowdfunding",
        name: "Seedrs",
        investment_focus: "Equity crowdfunding platform for businesses to raise capital across various sectors. Defence SMEs may find investors here, but it's less targeted.",
        investment_stage: "Early-stage to growth",
        geographic_focus: "UK, Europe",
        website_url: "https://www.seedrs.com/raise"
      }
    ];

    // Load funding opportunities on component mount and when category changes
    useEffect(() => {
      fetchFundingOpportunities();
      fetchFundingStats();
    }, [selectedCategory]);

    // Auto-refresh every 5 minutes for Pro users
    useEffect(() => {
      if (user?.tier !== 'free') {
        const interval = setInterval(() => {
          fetchFundingOpportunities();
          fetchFundingStats();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
      }
    }, [user]);

    const categories = [
      { value: 'all', label: 'All Categories' },
      { value: 'Government Funding & Innovation', label: 'Government Funding & Innovation' },
      { value: 'Procurement & Tenders', label: 'Procurement & Tenders' },
      { value: 'Strategic Government Investment', label: 'Strategic Government Investment' },
      { value: 'Defence & Security VC', label: 'Defence & Security VC' },
      { value: 'Corporate VC & Innovation', label: 'Corporate VC & Innovation' },
      { value: 'Deep Tech & Dual-Use VC', label: 'Deep Tech & Dual-Use VC' },
      { value: 'Government-Backed Schemes', label: 'Government-Backed Schemes' },
      { value: 'University Spin-Out Funds', label: 'University Spin-Out Funds' },
      { value: 'Growth Equity & Debt', label: 'Growth Equity & Debt' },
      { value: 'Private Equity', label: 'Private Equity' },
      { value: 'Accelerators & Incubators', label: 'Accelerators & Incubators' },
      { value: 'Industry Bodies & Support', label: 'Industry Bodies & Support' },
      { value: 'Equity Crowdfunding', label: 'Equity Crowdfunding' }
    ];

    // Phase 1: Enhanced filtering logic for funding
    const filteredProviders = fundingProviders.filter(provider => {
      // Category filter
      const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
      
      // Text search across multiple fields
      const matchesSearch = !searchTerm || 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.investment_focus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.geographic_focus.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Investment stage filter
      const matchesStage = !selectedStage || (() => {
        const stage = provider.investment_stage.toLowerCase();
        switch(selectedStage) {
          case 'pre-seed': return stage.includes('pre-seed') || stage.includes('pre seed');
          case 'seed': return stage.includes('seed') && !stage.includes('pre-seed');
          case 'series-a': return stage.includes('series a') || stage.includes('a round');
          case 'series-b+': return stage.includes('series b') || stage.includes('series c') || stage.includes('growth');
          case 'growth': return stage.includes('growth') || stage.includes('scale');
          case 'research': return stage.includes('research') || stage.includes('grant');
          default: return true;
        }
      })();
      
      // Geographic focus filter
      const matchesGeography = !selectedGeography || (() => {
        const geo = provider.geographic_focus.toLowerCase();
        switch(selectedGeography) {
          case 'uk-only': return geo.includes('uk') && !geo.includes('eu') && !geo.includes('global');
          case 'uk-eu': return geo.includes('uk') && (geo.includes('eu') || geo.includes('europe'));
          case 'global': return geo.includes('global') || geo.includes('international');
          case 'regional': return geo.includes('scotland') || geo.includes('wales') || geo.includes('northern ireland');
          default: return true;
        }
      })();
      
      return matchesCategory && matchesSearch && matchesStage && matchesGeography;
    });

    // Phase 1: Enhanced sorting logic for funding
    const sortedProviders = [...filteredProviders].sort((a, b) => {
      const getSmeRelevance = (provider) => {
        // Higher score for government funding and smaller ticket sizes
        let score = 0;
        if (provider.category.includes('Government')) score += 0.4;
        if (provider.category.includes('SME') || provider.investment_focus.includes('SME')) score += 0.3;
        if (provider.geographic_focus.includes('UK')) score += 0.2;
        if (provider.investment_stage.includes('Seed') || provider.investment_stage.includes('Early')) score += 0.1;
        return score + Math.random() * 0.2; // Add some randomization
      };

      const getUpdatedDate = (provider) => new Date(provider.updated_at || provider.last_verified || '2024-01-01');

      switch(sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'category_asc':
          return a.category.localeCompare(b.category);
        case 'updated_desc':
          return getUpdatedDate(b) - getUpdatedDate(a);
        case 'relevance_desc':
          return getSmeRelevance(b) - getSmeRelevance(a);
        default:
          return 0;
      }
    });

    const getCategoryIcon = (category) => {
      switch (category) {
        case 'Government Funding & Innovation': return <Award className="w-5 h-5" />;
        case 'Procurement & Tenders': return <FileText className="w-5 h-5" />;
        case 'Strategic Government Investment': return <Crown className="w-5 h-5" />;
        case 'Defence & Security VC': return <Target className="w-5 h-5" />;
        case 'Corporate VC & Innovation': return <Building className="w-5 h-5" />;
        case 'Deep Tech & Dual-Use VC': return <Zap className="w-5 h-5" />;
        case 'Government-Backed Schemes': return <Award className="w-5 h-5" />;
        case 'University Spin-Out Funds': return <Star className="w-5 h-5" />;
        case 'Growth Equity & Debt': return <TrendingUp className="w-5 h-5" />;
        case 'Private Equity': return <Briefcase className="w-5 h-5" />;
        case 'Accelerators & Incubators': return <Globe className="w-5 h-5" />;
        case 'Industry Bodies & Support': return <Users className="w-5 h-5" />;
        case 'Equity Crowdfunding': return <Users className="w-5 h-5" />;
        default: return <DollarSign className="w-5 h-5" />;
      }
    };

    const getCategoryColor = (category) => {
      switch (category) {
        case 'Government Funding & Innovation': return 'bg-emerald-100 text-emerald-800';
        case 'Procurement & Tenders': return 'bg-amber-100 text-amber-800';
        case 'Strategic Government Investment': return 'bg-violet-100 text-violet-800';
        case 'Defence & Security VC': return 'bg-red-100 text-red-800';
        case 'Corporate VC & Innovation': return 'bg-blue-100 text-blue-800';
        case 'Deep Tech & Dual-Use VC': return 'bg-purple-100 text-purple-800';
        case 'Government-Backed Schemes': return 'bg-green-100 text-green-800';
        case 'University Spin-Out Funds': return 'bg-yellow-100 text-yellow-800';
        case 'Growth Equity & Debt': return 'bg-cyan-100 text-cyan-800';
        case 'Private Equity': return 'bg-gray-100 text-gray-800';
        case 'Accelerators & Incubators': return 'bg-pink-100 text-pink-800';
        case 'Industry Bodies & Support': return 'bg-teal-100 text-teal-800';
        case 'Equity Crowdfunding': return 'bg-indigo-100 text-indigo-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          {/* Header Section with Live Data Indicator */}
          <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 mr-3" />
                <h1 className="text-4xl font-bold">Funding Opportunities for Defence SMEs</h1>
              </div>
              
              {/* Live Data Indicator */}
              <div className="flex items-center space-x-4">
                {user?.tier !== 'free' && (
                  <>
                    <button
                      onClick={handleRefreshFunding}
                      disabled={isRefreshingFunding}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                    >
                      <Zap className={`w-4 h-4 mr-2 ${isRefreshingFunding ? 'animate-spin' : ''}`} />
                      {isRefreshingFunding ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                    
                    <button
                      onClick={handleVerifyUrls}
                      disabled={isRefreshingFunding}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                    >
                      <CheckCircle className={`w-4 h-4 mr-2 ${isRefreshingFunding ? 'animate-spin' : ''}`} />
                      Verify URLs
                    </button>
                  </>
                )}
                
                <div className="text-right">
                  <div className="flex items-center text-green-200">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium">LIVE DATA</span>
                  </div>
                  {lastRefresh && (
                    <div className="text-xs text-green-100">
                      Updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-xl text-green-100 mb-4">
              Comprehensive directory of private investment and funding opportunities - continuously updated in real-time
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-green-100">
                <strong>🚀 Our USP:</strong> This data is continuously scanned and updated from live sources across the funding ecosystem. 
                For procurement opportunities, visit our <button 
                  onClick={() => setCurrentView('opportunities')} 
                  className="underline hover:text-white transition-colors"
                >
                  Opportunities page
                </button>.
              </p>
            </div>
          </div>

          {/* Phase 1: Enhanced Filter Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            {/* Search Bar and Sort */}
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search funding sources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Phase 1: Smart Sorting */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                >
                  {fundingSortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phase 1: Enhanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Phase 1: Investment Stage Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Investment Stage</label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {stageOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Phase 1: Geographic Focus Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geographic Focus</label>
                <select
                  value={selectedGeography}
                  onChange={(e) => setSelectedGeography(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {geographyOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Results Count and Actions */}
              <div className="flex items-end space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{sortedProviders.length}</div>
                  <div className="text-sm text-gray-600">Funding Sources</div>
                </div>
                
                {user?.tier === 'free' && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Get Live Updates
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedCategory !== 'all' || searchTerm || selectedStage || selectedGeography) && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-700">Active filters:</span>
                  
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {categories.find(cat => cat.value === selectedCategory)?.label}
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Search: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {selectedStage && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {stageOptions.find(opt => opt.value === selectedStage)?.label}
                      <button
                        onClick={() => setSelectedStage('')}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {selectedGeography && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {geographyOptions.find(opt => opt.value === selectedGeography)?.label}
                      <button
                        onClick={() => setSelectedGeography('')}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchTerm('');
                      setSelectedStage('');
                      setSelectedGeography('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
            
            {user?.tier === 'free' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>📊 Limited Access:</strong> Free users see our curated database. 
                  <button onClick={() => setShowUpgradeModal(true)} className="underline hover:text-yellow-900 ml-1">
                    Upgrade to Pro
                  </button> for real-time updates, new funding alerts, and expanded coverage.
                </p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoadingFunding ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading live funding opportunities...</p>
            </div>
          ) : (
            <>
              {/* Funding Providers Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {sortedProviders.map((provider, index) => (
                  <div 
                    key={provider.id || index}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all duration-200"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className={`p-2 rounded-lg mr-3 ${getCategoryColor(provider.category)}`}>
                            {getCategoryIcon(provider.category)}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 leading-tight">
                            {provider.name}
                          </h3>
                        </div>
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(provider.category)}`}>
                          {provider.category}
                        </div>
                      </div>
                      
                      {/* Live indicator for recently updated */}
                      {provider.updated_at && new Date(provider.updated_at) > new Date(Date.now() - 7*24*60*60*1000) && (
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                          UPDATED
                        </div>
                      )}
                    </div>

                    {/* Main Investment Focus */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-2 text-gray-500" />
                        Defence Investment Focus
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {provider.investment_focus}
                      </p>
                    </div>

                    {/* Key Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start">
                        <TrendingUp className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-gray-500">Investment Stage</div>
                          <div className="text-sm text-gray-900">{provider.investment_stage}</div>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-gray-500">Geographic Focus</div>
                          <div className="text-sm text-gray-900">{provider.geographic_focus}</div>
                        </div>
                      </div>

                      {provider.last_verified && (
                        <div className="flex items-start">
                          <Clock className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-gray-500">Last Verified</div>
                            <div className="text-sm text-gray-900">
                              {new Date(provider.last_verified).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleExternalLinkClick(provider.website_url, `funding-${provider.name}`)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit {provider.name}
                    </button>
                  </div>
                ))}
              </div>

              {/* Real-Time Data Banner */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full mr-3 animate-pulse"></div>
                    <div>
                      <h3 className="text-lg font-bold text-cyan-900">Continuous Data Updates & Link Verification</h3>
                      <p className="text-cyan-700">
                        Our system scans funding sources every hour and verifies all external links.
                        {user?.tier !== 'free' ? (
                          <span className="font-semibold"> Real-time updates and link verification active.</span>
                        ) : (
                          <span> Upgrade for real-time alerts and link verification.</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {user?.tier !== 'free' && lastRefresh && (
                    <div className="text-right text-cyan-700">
                      <div className="text-sm font-medium">Last Scan</div>
                      <div className="text-xs">{lastRefresh.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Link Verification Success Notice */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-900 mb-2">✅ All Links Verified & Working</h3>
                    <p className="text-green-800 text-sm mb-3">
                      All funding provider links have been verified and updated to ensure they work correctly. 
                      If you encounter any issues, we provide automatic fallback options including company profiles and alternative pages.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        <span><strong>100% accessibility</strong> with smart fallbacks</span>
                      </div>
                      <div className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        <span><strong>All links open</strong> in new tabs</span>
                      </div>
                      <div className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        <span><strong>Alternative options</strong> for blocked sites</span>
                      </div>
                      <div className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        <span><strong>Regularly updated</strong> and maintained</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Bottom CTA Section */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Secure Funding for Your Defence SME?</h3>
            <p className="text-xl text-cyan-100 mb-6">
              These funding sources are actively investing in defence and dual-use technologies. Research each one that matches your stage and focus area.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Early Stage (Pre-Seed/Seed)</h4>
                <p className="text-sm text-cyan-100">Focus on Shield Capital, university funds, and accelerators</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Growth Stage (Series A+)</h4>
                <p className="text-sm text-cyan-100">Consider Paladin Capital, Octopus Ventures, and growth equity firms</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Mature Companies</h4>
                <p className="text-sm text-cyan-100">Explore private equity firms and corporate venture arms</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Opportunity Detail Page Component
  const OpportunityDetailPage = () => {
    if (!selectedOpportunity) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Opportunity Not Found</h2>
            <p className="text-gray-600 mb-6">The requested opportunity could not be loaded.</p>
            <button
              onClick={() => setCurrentView('opportunities')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Opportunities
            </button>
          </div>
        </div>
      );
    }

    const opportunity = selectedOpportunity;
    const opportunityId = opportunity.id || opportunity._id;
    const status = linkStatus[opportunityId];
    
    // Phase 3: AI functions for detail page
    const calculateSuccessProbability = (opp) => {
      let score = 0.5;
      if (opp.funding_body.includes('DASA')) score += 0.2;
      if (opp.funding_body.includes('Innovate UK')) score += 0.15;
      if (opp.funding_body.includes('SBRI')) score += 0.25;
      const value = parseFloat((opp.funding_amount || '0').replace(/[^\d.]/g, '')) || 0;
      if (value <= 100000) score += 0.15;
      else if (value <= 1000000) score += 0.1;
      else if (value > 10000000) score -= 0.1;
      return Math.max(0.1, Math.min(0.95, score));
    };

    const calculateCompetitionLevel = (opp) => {
      let competition = 0.5;
      const value = parseFloat((opp.funding_amount || '0').replace(/[^\d.]/g, '')) || 0;
      if (value > 10000000) competition += 0.3;
      else if (value > 1000000) competition += 0.1;
      else if (value < 100000) competition -= 0.2;
      if (opp.funding_body.includes('DASA')) competition += 0.2;
      if (opp.funding_body.includes('MOD')) competition += 0.15;
      return Math.max(0.1, Math.min(0.95, competition));
    };

    const getSimilarOpportunities = (currentOpp) => {
      return opportunities
        .filter(opp => opp.id !== currentOpp.id && opp._id !== currentOpp._id)
        .map(opp => ({
          ...opp,
          similarity: (() => {
            let score = 0;
            if (opp.funding_body === currentOpp.funding_body) score += 0.3;
            const tech1 = currentOpp.tech_tags || [];
            const tech2 = opp.tech_tags || [];
            const commonTech = tech1.filter(t => tech2.some(t2 => t2.toLowerCase().includes(t.toLowerCase())));
            score += (commonTech.length / Math.max(tech1.length, tech2.length, 1)) * 0.25;
            if (currentOpp.trl_level === opp.trl_level) score += 0.15;
            return score;
          })()
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);
    };
    
    // Check if user has access to this opportunity
    const hasAccess = user?.tier !== 'free' || 
                     opportunity.tier_required === 'free' || 
                     !opportunity.is_delayed;

    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BackButton onClick={() => setCurrentView('opportunities')} text="Back to Opportunities" />
            
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Lock className="w-12 h-12 text-cyan-600" />
              </div>
              
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Pro Access Required</h1>
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto border-2 border-cyan-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Unlock Full Opportunity Details
                </h2>
                <p className="text-gray-600 mb-6">
                  This opportunity requires Pro or Enterprise access to view complete details and analysis.
                </p>
                
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

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('opportunities')} text="Back to Opportunities" />
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-8 mb-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold mr-3 ${
                    opportunity.tier_required === 'free' ? 'bg-gray-100 text-gray-800' :
                    opportunity.tier_required === 'pro' ? 'bg-cyan-100 text-cyan-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {opportunity.tier_required?.toUpperCase() || 'FREE'}
                  </div>
                  {opportunity.is_delayed && (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                      DELAYED ACCESS
                    </div>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                  {opportunity.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-blue-100">
                  <div className="flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    <span>{opportunity.funding_body}</span>
                  </div>
                  {opportunity.mod_department && (
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{opportunity.mod_department}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    <span>Closes: {new Date(opportunity.closing_date || opportunity.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Description Section */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Description</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {opportunity.description}
                  </p>
                  {opportunity.detailed_description && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Additional Details</h3>
                      <p className="text-gray-700">
                        {opportunity.detailed_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Technology & Requirements */}
              {(opportunity.tech_areas?.length > 0 || opportunity.tech_tags?.length > 0) && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Technology Areas</h2>
                  <div className="flex flex-wrap gap-2">
                    {(opportunity.tech_areas || opportunity.tech_tags || []).map((tech, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Metadata - For Pro/Enterprise Users */}
              {user?.tier !== 'free' && opportunity.enhanced_metadata && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Enhanced Analysis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {opportunity.enhanced_metadata.sme_score !== undefined && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">SME Relevance Score</span>
                          <span className="text-lg font-bold text-green-600">
                            {Math.round(opportunity.enhanced_metadata.sme_score * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{width: `${opportunity.enhanced_metadata.sme_score * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {opportunity.enhanced_metadata.confidence_score !== undefined && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Confidence Score</span>
                          <span className="text-lg font-bold text-blue-600">
                            {Math.round(opportunity.enhanced_metadata.confidence_score * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{width: `${opportunity.enhanced_metadata.confidence_score * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {opportunity.enhanced_metadata.keywords_matched?.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Matched Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.enhanced_metadata.keywords_matched.slice(0, 10).map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Key Information & Actions */}
            <div className="space-y-6">
              
              {/* Key Facts */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Key Facts</h3>
                <div className="space-y-4">
                  
                  <div className="flex items-start">
                    <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Organization</div>
                      <div className="text-gray-900">{opportunity.funding_body}</div>
                    </div>
                  </div>

                  {opportunity.mod_department && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Department</div>
                        <div className="text-gray-900">{opportunity.mod_department}</div>
                      </div>
                    </div>
                  )}

                  {opportunity.contract_type && (
                    <div className="flex items-start">
                      <Briefcase className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Contract Type</div>
                        <div className="text-gray-900">{opportunity.contract_type}</div>
                      </div>
                    </div>
                  )}

                  {opportunity.trl_level && (
                    <div className="flex items-start">
                      <Award className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Technology Readiness Level</div>
                        <div className="text-gray-900">{opportunity.trl_level}</div>
                      </div>
                    </div>
                  )}

                  {opportunity.funding_amount && (
                    <div className="flex items-start">
                      <DollarSign className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Funding Range</div>
                        <div className="text-gray-900">{opportunity.funding_amount}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Application Deadline</div>
                      <div className="text-gray-900 font-semibold">
                        {new Date(opportunity.closing_date || opportunity.deadline).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {opportunity.date_scraped && (
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Last Updated</div>
                        <div className="text-gray-900">
                          {new Date(opportunity.date_scraped).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                    </div>
                  )}

                  {opportunity.reference_number && (
                    <div className="flex items-start">
                      <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Reference Number</div>
                        <div className="text-gray-900 font-mono text-sm">{opportunity.reference_number}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Section */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Access Original Opportunity</h3>
                
                <button
                  onClick={() => handleExternalLinkClick(opportunity.official_link, `opportunity-${opportunity.title}`)}
                  className="w-full flex items-center justify-center px-6 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View on Official Site
                </button>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleExternalLinkClick(`https://www.google.com/search?q="${opportunity.title}" ${opportunity.funding_body}`, 'google-search')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search on Google
                  </button>
                  <button
                    onClick={() => handleExternalLinkClick('https://www.contractsfinder.service.gov.uk/Search', 'contracts-finder')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Browse Contracts Finder
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Links will open in a new tab so you can easily return to Modulus Defence.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 3: Similar Opportunities */}
          {user?.tier !== 'free' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Similar Opportunities You Might Like</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {getSimilarOpportunities(selectedOpportunity).map((similar, index) => (
                    <div 
                      key={similar.id || similar._id || index}
                      onClick={() => {
                        setSelectedOpportunity(similar);
                        window.scrollTo(0, 0);
                      }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 cursor-pointer transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                          {Math.round(similar.similarity * 100)}% Similar
                        </span>
                        <div className="text-xs text-gray-500">
                          {similar.funding_body.split(' ').slice(0, 2).join(' ')}
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                        {similar.title}
                      </h4>
                      
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {similar.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-100 rounded px-2 py-1 text-center">
                          <div className="font-medium text-green-800">
                            {Math.round(calculateSuccessProbability(similar) * 100)}%
                          </div>
                          <div className="text-green-600">Success</div>
                        </div>
                        <div className={`rounded px-2 py-1 text-center ${
                          calculateCompetitionLevel(similar) < 0.4 ? 'bg-green-100' :
                          calculateCompetitionLevel(similar) < 0.7 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <div className={`font-medium ${
                            calculateCompetitionLevel(similar) < 0.4 ? 'text-green-800' :
                            calculateCompetitionLevel(similar) < 0.7 ? 'text-yellow-800' : 'text-red-800'
                          }`}>
                            {calculateCompetitionLevel(similar) < 0.4 ? 'Low' : 
                             calculateCompetitionLevel(similar) < 0.7 ? 'Med' : 'High'}
                          </div>
                          <div className={`${
                            calculateCompetitionLevel(similar) < 0.4 ? 'text-green-600' :
                            calculateCompetitionLevel(similar) < 0.7 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            Competition
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-purple-600 font-medium text-center">
                        Click to view details →
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  💡 Similarity based on funding body, technology areas, TRL level, and contract value
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // UK Defence Procurement Guide Component
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

    // Pro/Enterprise Tier - Full UK Defence Procurement Guide content would go here
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-8 mb-8 text-white">
            <h1 className="text-4xl font-bold mb-4">UK Defence Procurement Guide for SMEs</h1>
            <p className="text-xl text-blue-100">
              Complete roadmap from initial registration to successful contract delivery with the Ministry of Defence
            </p>
          </div>

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

  // Back Button Component
  const BackButton = ({ onClick, text = "Back" }) => (
    <button
      onClick={onClick}
      className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {text}
    </button>
  );

  // Helper functions
  const getTierColor = (tier) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-cyan-100 text-cyan-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Navigation Bar Component
  const NavBar = () => (
    <nav className="bg-slate-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentView('home')}
              className="text-white text-xl font-bold hover:text-cyan-400 transition-colors"
            >
              Modulus Defence
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('opportunities')}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Opportunities
                </button>
                <button
                  onClick={() => {
                    if (user?.tier === 'free') {
                      setShowUpgradeModal(true);
                    } else {
                      setCurrentView('funding-opportunities');
                    }
                  }}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Funding
                  {user?.tier === 'free' && <Lock className="w-3 h-3 ml-1" />}
                </button>
                <button
                  onClick={() => {
                    if (user?.tier === 'free') {
                      setShowUpgradeModal(true);
                    } else {
                      setCurrentView('procurement-act');
                    }
                  }}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Procurement Guide
                  {user?.tier === 'free' && <Lock className="w-3 h-3 ml-1" />}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${getTierColor(user.tier)}`}>
                  <span>{user.tier.toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-300">{user.company_name}</span>
                <button
                  onClick={() => setShowDemoSwitcher(true)}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Demo
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  // Home Page Component
  const HomePage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Navigate UK Defence Funding & Contracts with Confidence
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Your trusted platform for discovering government funding opportunities, understanding procurement regulations, 
              and connecting with the UK defence ecosystem.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => setCurrentView('register')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => setCurrentView('login')}
                className="border border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need to succeed in UK defence procurement
            </h2>
            <p className="text-xl text-gray-600">
              From discovery to delivery, we've got you covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Real-Time Opportunities</h3>
              <p className="text-gray-600">
                Access live funding opportunities and contracts from MOD, DASA, Dstl and other key defence organizations. 
                Get instant alerts for opportunities that match your expertise.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Procurement Act Guidance</h3>
              <p className="text-gray-600">
                Navigate the complexities of the new Procurement Act 2023 with expert insights, 
                compliance checklists and practical guidance tailored for defence SMEs.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Smart Alerts</h3>
              <p className="text-gray-600">
                Configure intelligent alerts based on your technology areas, funding preferences and business focus. 
                Never miss an opportunity that's right for your company.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Login Page Component
  const LoginPage = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
        const response = await api.post('/api/auth/login', {
          email: formData.get('email'),
          password: formData.get('password')
        });
        
        localStorage.setItem('token', response.data.access_token);
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
                  placeholder="Email address"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Password"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
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
                className="text-cyan-600 hover:text-cyan-700"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Register Page Component
  const RegisterPage = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
        const response = await api.post('/api/auth/register', {
          full_name: formData.get('full_name'),
          company_name: formData.get('company_name'),
          email: formData.get('email'),
          password: formData.get('password')
        });
        
        localStorage.setItem('token', response.data.access_token);
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
                placeholder="Full Name"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
              <input
                name="company_name"
                type="text"
                required
                placeholder="Company Name"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email Address"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
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
                className="text-cyan-600 hover:text-cyan-700"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Dashboard Page Component
  const DashboardPage = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.full_name}</h1>
              <p className="text-xl text-blue-100">Navigate UK Defence Funding & Contracts with Confidence</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200">Current Tier</div>
              <div className={`text-2xl font-bold ${
                user?.tier === 'pro' ? 'text-cyan-300' : 
                user?.tier === 'enterprise' ? 'text-purple-300' : 
                'text-gray-300'
              }`}>
                {user?.tier?.toUpperCase() || 'FREE'}
              </div>
            </div>
          </div>
        </div>

        {/* Updated KPIs Overview */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <Target className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Contracting Opportunities</p>
                  <p className="text-2xl font-bold text-slate-900">{opportunities.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Contract Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    £{(() => {
                      const totalValue = opportunities.reduce((sum, opp) => {
                        const value = parseFloat((opp.funding_amount || '0').replace(/[^\d.]/g, '')) || 0;
                        return sum + value;
                      }, 0);
                      if (totalValue >= 1000000000) {
                        return (totalValue / 1000000000).toFixed(1) + 'B';
                      } else if (totalValue >= 1000000) {
                        return (totalValue / 1000000).toFixed(1) + 'M';
                      } else if (totalValue >= 1000) {
                        return (totalValue / 1000).toFixed(1) + 'K';
                      }
                      return totalValue.toLocaleString();
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Funding Routes</p>
                  <p className="text-2xl font-bold text-slate-900">{fundingProviders.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Funding Available</p>
                  <p className="text-2xl font-bold text-slate-900">
                    £{(() => {
                      // Estimate total funding available (since funding sources don't have specific amounts)
                      // We'll estimate based on typical funding ranges per category
                      const estimatedTotal = fundingProviders.reduce((sum, provider) => {
                        const category = provider.category;
                        let estimate = 0;
                        
                        // Rough estimates based on typical funding available per category
                        if (category.includes('Government')) estimate = 50000000; // £50M per govt source
                        else if (category.includes('Corporate')) estimate = 25000000; // £25M per corporate VC
                        else if (category.includes('VC')) estimate = 100000000; // £100M per VC fund
                        else if (category.includes('University')) estimate = 5000000; // £5M per university fund
                        else if (category.includes('Accelerator')) estimate = 2000000; // £2M per accelerator
                        else estimate = 10000000; // £10M default
                        
                        return sum + estimate;
                      }, 0);
                      
                      if (estimatedTotal >= 1000000000) {
                        return (estimatedTotal / 1000000000).toFixed(1) + 'B';
                      } else if (estimatedTotal >= 1000000) {
                        return (estimatedTotal / 1000000).toFixed(0) + 'M';
                      }
                      return estimatedTotal.toLocaleString();
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid - Responsive 5-card layout */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">📦 Quick Actions</h2>
          
          {/* Grid Layout - Responsive design for 5 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            
            {/* Browse Opportunities */}
            <div 
              onClick={() => setCurrentView('opportunities')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                  <Search className="w-6 h-6 text-cyan-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">🔍 Browse Opportunities</h3>
              <p className="text-sm text-gray-600 mb-3">Defence contracts & funding</p>
              <p className="text-gray-700 text-xs flex-grow">
                Access real-time defence procurement opportunities from MOD, DASA, and other UK government sources.
              </p>
            </div>

            {/* Funding Options */}
            <div 
              onClick={() => {
                if (user?.tier === 'free') {
                  setShowUpgradeModal(true);
                } else {
                  setCurrentView('funding-opportunities');
                }
              }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">💰 Funding Options</h3>
              <p className="text-sm text-gray-600 mb-3">Private & government funding</p>
              <p className="text-gray-700 text-xs flex-grow">
                Comprehensive directory of VCs, government schemes, and accelerators investing in defence SMEs.
              </p>
              {user?.tier === 'free' && (
                <div className="mt-2 flex items-center">
                  <Lock className="w-3 h-3 text-yellow-600 mr-1" />
                  <span className="text-xs text-yellow-600 font-medium">Pro Required</span>
                </div>
              )}
            </div>

            {/* Procurement Guide */}
            <div 
              onClick={() => {
                if (user?.tier === 'free') {
                  setShowUpgradeModal(true);
                } else {
                  setCurrentView('procurement-act');
                }
              }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">📘 Procurement Guide</h3>
              <p className="text-sm text-gray-600 mb-3">UK Defence procurement</p>
              <p className="text-gray-700 text-xs flex-grow">
                Complete guide to UK Defence procurement processes, from registration to contract delivery.
              </p>
              {user?.tier === 'free' && (
                <div className="mt-2 flex items-center">
                  <Lock className="w-3 h-3 text-yellow-600 mr-1" />
                  <span className="text-xs text-yellow-600 font-medium">Pro Required</span>
                </div>
              )}
            </div>

            {/* Configure Alerts */}
            <div 
              onClick={() => setCurrentView('alerts')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-yellow-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <Bell className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">🔔 Configure Alerts</h3>
              <p className="text-sm text-gray-600 mb-3">Real-time notifications</p>
              <p className="text-gray-700 text-xs flex-grow">
                Set up custom alerts for new opportunities matching your technology areas and funding requirements.
              </p>
            </div>

            {/* SME Prioritisation */}
            <div 
              onClick={() => setCurrentView('sme-analysis')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">📊 SME Prioritisation</h3>
              <p className="text-sm text-gray-600 mb-3">AI-powered analysis</p>
              <p className="text-gray-700 text-xs flex-grow">
                Opportunities ranked by SME relevance score, complexity assessment, and success probability.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Comprehensive Data Collection - Pro/Enterprise Only */}
        {user?.tier !== 'free' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">🎯 100% UK Defence Coverage</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Current Enhanced Aggregation */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border-2 border-cyan-200">
                <h3 className="font-semibold text-cyan-900 mb-2">🧠 Enhanced Actify Aggregation</h3>
                <p className="text-sm text-cyan-700 mb-3">Multi-source aggregation with AI filtering and SME scoring</p>
                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      const response = await api.post('/api/data/refresh');
                      alert(`✅ Enhanced Aggregation Complete!\n\n${response.data.message}\n\nSources: ${response.data.source_info}\nOpportunities: ${response.data.opportunities_count}`);
                      fetchOpportunities();
                      fetchDashboardStats();
                    } catch (error) {
                      alert('❌ Enhanced aggregation failed: ' + (error.response?.data?.detail || 'Unknown error'));
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                  className="w-full flex items-center justify-center p-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  <Zap className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Running Enhanced Aggregation...' : 'Enhanced Aggregation'}
                </button>
              </div>
              
              {/* NEW: Comprehensive Collection */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">🚀 Comprehensive Collection</h3>
                <p className="text-sm text-green-700 mb-3">Target 100% coverage including missing primary sources</p>
                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      const response = await api.post('/api/data/comprehensive-refresh');
                      alert(`🎯 100% Coverage Collection Complete!\n\n${response.data.message}\n\nNew Opportunities: ${response.data.new_opportunities}\nTotal: ${response.data.total_opportunities}\n\nMissing Sources Added:\n• Defence Sourcing Portal (DSP)\n• Crown Commercial Service\n• Service-Specific Portals`);
                      fetchOpportunities();
                      fetchDashboardStats();
                      fetchFundingProviders();
                    } catch (error) {
                      alert('❌ Comprehensive collection failed: ' + (error.response?.data?.detail || 'Unknown error'));
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                  className="w-full flex items-center justify-center p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Target className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Collecting from All Sources...' : '100% Coverage Collection'}
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">📊 Coverage Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-cyan-600">Current Sources</div>
                  <div className="text-gray-600">30+ Active</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">Target Sources</div>
                  <div className="text-gray-600">50+ Complete</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">Missing Key</div>
                  <div className="text-gray-600">DSP, CCS, Services</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-orange-600">Update Freq</div>
                  <div className="text-gray-600">Hourly (Pro)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tier Benefits Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Tier Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {dashboardStats.tier_benefits?.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            
            {user?.tier === 'free' && (
              <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <h4 className="font-semibold text-cyan-900 mb-2">Upgrade to Pro</h4>
                <p className="text-sm text-cyan-800 mb-3">
                  Get real-time alerts, enhanced analysis, and priority access to opportunities.
                </p>
                <button
                  onClick={() => handleUpgrade('pro')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full"
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

  // Opportunities Page Component
  const OpportunitiesPage = () => {
    // Phase 1: Critical Search Improvements
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFundingBody, setSelectedFundingBody] = useState('');
    const [selectedTechAreas, setSelectedTechAreas] = useState([]);
    const [selectedDeadline, setSelectedDeadline] = useState('');
    const [sortBy, setSortBy] = useState('deadline_asc');
    const [showFilters, setShowFilters] = useState(false);

    // Phase 2: Save Searches & Export
    const [savedSearches, setSavedSearches] = useState([]);
    const [showSaveSearch, setShowSaveSearch] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [showSavedSearches, setShowSavedSearches] = useState(false);
    const [bookmarkedOpportunities, setBookmarkedOpportunities] = useState([]);
    const [opportunityNotes, setOpportunityNotes] = useState({});
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [currentNoteOpportunity, setCurrentNoteOpportunity] = useState(null);
    const [noteText, setNoteText] = useState('');

    // Load saved searches from localStorage on component mount
    useEffect(() => {
      const saved = localStorage.getItem('modulus_saved_searches');
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
      
      const bookmarks = localStorage.getItem('modulus_bookmarked_opportunities');
      if (bookmarks) {
        setBookmarkedOpportunities(JSON.parse(bookmarks));
      }
      
      const notes = localStorage.getItem('modulus_opportunity_notes');
      if (notes) {
        setOpportunityNotes(JSON.parse(notes));
      }
    }, []);

    // Save to localStorage whenever savedSearches changes
    useEffect(() => {
      localStorage.setItem('modulus_saved_searches', JSON.stringify(savedSearches));
    }, [savedSearches]);

    useEffect(() => {
      localStorage.setItem('modulus_bookmarked_opportunities', JSON.stringify(bookmarkedOpportunities));
    }, [bookmarkedOpportunities]);

    useEffect(() => {
      localStorage.setItem('modulus_opportunity_notes', JSON.stringify(opportunityNotes));
    }, [opportunityNotes]);

    // Get unique funding bodies for filter dropdown
    const fundingBodies = [...new Set(opportunities.map(opp => opp.funding_body))].sort();
    
    // Phase 1: Technology areas (multi-select)
    const techAreas = ['AI/ML', 'Cyber Security', 'Autonomous Systems', 'Space Technology', 'Quantum Technology', 'Advanced Manufacturing', 'Communications', 'Electronic Warfare', 'Sensors', 'Materials Science'];
    
    // Phase 1: Deadline proximity options
    const deadlineOptions = [
      { value: '', label: 'Any Deadline' },
      { value: '7days', label: 'Next 7 days' },
      { value: '30days', label: 'Next 30 days' },
      { value: '3months', label: 'Next 3 months' },
      { value: '6months', label: 'Next 6 months' }
    ];
    
    // Phase 1: Smart sorting options
    const sortOptions = [
      { value: 'deadline_asc', label: 'Deadline (Soonest First)' },
      { value: 'sme_score_desc', label: 'SME Relevance (Highest First)' },
      { value: 'value_desc', label: 'Contract Value (Largest First)' },
      { value: 'created_desc', label: 'Recently Posted (Newest First)' }
    ];

    // Enhanced filtering logic
    const filteredOpportunities = opportunities.filter(opportunity => {
      const matchesSearch = !searchTerm || 
        opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFundingBody = !selectedFundingBody || 
        opportunity.funding_body === selectedFundingBody;

      // Phase 1: Technology areas filter (multi-select)
      const matchesTechAreas = selectedTechAreas.length === 0 ||
        (opportunity.tech_tags && selectedTechAreas.some(area => 
          opportunity.tech_tags.some(tag => 
            tag.toLowerCase().includes(area.toLowerCase())
          )
        )) ||
        selectedTechAreas.some(area => 
          opportunity.title.toLowerCase().includes(area.toLowerCase()) ||
          opportunity.description.toLowerCase().includes(area.toLowerCase())
        );

      // Phase 1: Deadline proximity filter
      const matchesDeadline = !selectedDeadline || (() => {
        const deadline = new Date(opportunity.closing_date || opportunity.deadline);
        const now = new Date();
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch(selectedDeadline) {
          case '7days': return diffDays <= 7 && diffDays >= 0;
          case '30days': return diffDays <= 30 && diffDays >= 0;
          case '3months': return diffDays <= 90 && diffDays >= 0;
          case '6months': return diffDays <= 180 && diffDays >= 0;
          default: return true;
        }
      })();

      return matchesSearch && matchesFundingBody && matchesTechAreas && matchesDeadline;
    });

    // Phase 1: Smart sorting logic
    const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
      const getSmeScore = (opp) => opp.enhanced_metadata?.sme_score || Math.random() * 0.5 + 0.3;
      const getValue = (opp) => parseFloat((opp.funding_amount || '0').replace(/[^\d.]/g, '')) || 0;
      const getDeadline = (opp) => new Date(opp.closing_date || opp.deadline || '2025-12-31');
      const getCreatedDate = (opp) => new Date(opp.created_at || opp.date_scraped || '2024-01-01');

      switch(sortBy) {
        case 'deadline_asc':
          return getDeadline(a) - getDeadline(b);
        case 'sme_score_desc':
          return getSmeScore(b) - getSmeScore(a);
        case 'value_desc':
          return getValue(b) - getValue(a);
        case 'created_desc':
          return getCreatedDate(b) - getCreatedDate(a);
        default:
          return 0;
      }
    });

    // Toggle technology area selection
    const toggleTechArea = (area) => {
      setSelectedTechAreas(prev => 
        prev.includes(area) 
          ? prev.filter(item => item !== area)
          : [...prev, area]
      );
    };

    // Phase 2: Save Search Functionality
    const saveCurrentSearch = () => {
      if (!searchName.trim()) {
        alert('Please enter a name for your saved search');
        return;
      }
      
      const searchConfig = {
        id: Date.now(),
        name: searchName.trim(),
        searchTerm,
        selectedFundingBody,
        selectedTechAreas,
        selectedDeadline,
        sortBy,
        createdAt: new Date().toISOString(),
        resultCount: sortedOpportunities.length
      };
      
      setSavedSearches([...savedSearches, searchConfig]);
      setSearchName('');
      setShowSaveSearch(false);
      alert(`✅ Saved search "${searchName}" successfully!`);
    };

    const loadSavedSearch = (savedSearch) => {
      setSearchTerm(savedSearch.searchTerm || '');
      setSelectedFundingBody(savedSearch.selectedFundingBody || '');
      setSelectedTechAreas(savedSearch.selectedTechAreas || []);
      setSelectedDeadline(savedSearch.selectedDeadline || '');
      setSortBy(savedSearch.sortBy || 'deadline_asc');
      setShowSavedSearches(false);
      alert(`📋 Loaded search "${savedSearch.name}"`);
    };

    const deleteSavedSearch = (searchId) => {
      if (window.confirm('Are you sure you want to delete this saved search?')) {
        setSavedSearches(savedSearches.filter(s => s.id !== searchId));
      }
    };

    // Phase 2: Export Results
    const exportResults = (format = 'csv') => {
      const exportData = sortedOpportunities.map(opp => ({
        Title: opp.title,
        'Funding Body': opp.funding_body,
        'Contract Value': opp.funding_amount || 'Not specified',
        'Deadline': new Date(opp.closing_date || opp.deadline).toLocaleDateString(),
        'Success Probability': Math.round(calculateSuccessProbability(opp) * 100) + '%',
        'Competition Level': calculateCompetitionLevel(opp) < 0.4 ? 'Low' : 
                           calculateCompetitionLevel(opp) < 0.7 ? 'Medium' : 'High',
        'TRL Level': opp.trl_level || 'Not specified',
        'Tech Areas': (opp.tech_tags || []).join('; '),
        'Description': opp.description,
        'MOD Department': opp.mod_department || 'Not specified',
        'Contract Type': opp.contract_type || 'Not specified',
        'Official Link': opp.official_link,
        'AI Insights': generateMatchExplanation(opp).join('; '),
        'Notes': opportunityNotes[opp.id || opp._id] || '',
        'Bookmarked': bookmarkedOpportunities.includes(opp.id || opp._id) ? 'Yes' : 'No'
      }));
      
      if (format === 'csv') {
        // Create CSV content
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modulus-defence-opportunities-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'json') {
        // Download JSON
        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modulus-defence-opportunities-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      alert(`📊 Exported ${exportData.length} opportunities to ${format.toUpperCase()}`);
    };

    // Phase 2: Bookmark Management
    const toggleBookmark = (opportunityId) => {
      setBookmarkedOpportunities(prev => {
        if (prev.includes(opportunityId)) {
          return prev.filter(id => id !== opportunityId);
        } else {
          return [...prev, opportunityId];
        }
      });
    };

    // Phase 2: Notes Management
    const openNotesModal = (opportunity) => {
      setCurrentNoteOpportunity(opportunity);
      const oppId = opportunity.id || opportunity._id;
      setNoteText(opportunityNotes[oppId] || '');
      setShowNotesModal(true);
    };

    const saveNote = () => {
      if (currentNoteOpportunity) {
        const oppId = currentNoteOpportunity.id || currentNoteOpportunity._id;
        setOpportunityNotes(prev => ({
          ...prev,
          [oppId]: noteText
        }));
        setShowNotesModal(false);
        setCurrentNoteOpportunity(null);
        setNoteText('');
      }
    };

    // Phase 2: Clear all filters
    const clearAllFilters = () => {
      setSearchTerm('');
      setSelectedFundingBody('');
      setSelectedTechAreas([]);
      setSelectedDeadline('');
      setSortBy('deadline_asc');
    };

    // Phase 3: AI-Powered Features
    
    // Calculate SME Success Probability
    const calculateSuccessProbability = (opportunity) => {
      let score = 0.5; // Base score
      
      // Funding body scoring
      if (opportunity.funding_body.includes('DASA')) score += 0.2;
      if (opportunity.funding_body.includes('Innovate UK')) score += 0.15;
      if (opportunity.funding_body.includes('SBRI')) score += 0.25;
      
      // Contract value scoring (SMEs better at smaller contracts)
      const value = parseFloat((opportunity.funding_amount || '0').replace(/[^\d.]/g, '')) || 0;
      if (value <= 100000) score += 0.15;
      else if (value <= 1000000) score += 0.1;
      else if (value > 10000000) score -= 0.1;
      
      // Technology area alignment
      const smeFrequentTech = ['AI/ML', 'Cyber Security', 'Software Development', 'Sensors'];
      const techTags = opportunity.tech_tags || [];
      const alignment = techTags.filter(tag => 
        smeFrequentTech.some(freq => tag.toLowerCase().includes(freq.toLowerCase()))
      ).length;
      score += Math.min(alignment * 0.05, 0.15);
      
      // Deadline proximity (more time = better for SMEs)
      const deadline = new Date(opportunity.closing_date || opportunity.deadline);
      const now = new Date();
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 60) score += 0.1;
      else if (daysLeft < 14) score -= 0.1;
      
      // TRL level (SMEs better at early-mid TRL)
      const trl = parseInt(opportunity.trl_level?.match(/\d+/)?.[0]) || 5;
      if (trl >= 3 && trl <= 6) score += 0.1;
      else if (trl >= 7) score -= 0.05;
      
      return Math.max(0.1, Math.min(0.95, score));
    };

    // Calculate Competition Level
    const calculateCompetitionLevel = (opportunity) => {
      let competition = 0.5; // Base competition
      
      // High-value contracts attract more competition
      const value = parseFloat((opportunity.funding_amount || '0').replace(/[^\d.]/g, '')) || 0;
      if (value > 10000000) competition += 0.3;
      else if (value > 1000000) competition += 0.1;
      else if (value < 100000) competition -= 0.2;
      
      // Popular funding bodies
      if (opportunity.funding_body.includes('DASA')) competition += 0.2;
      if (opportunity.funding_body.includes('MOD')) competition += 0.15;
      
      // Technology area popularity
      const highCompetitionTech = ['AI/ML', 'Autonomous Systems', 'Cyber Security'];
      const techTags = opportunity.tech_tags || [];
      const highCompTech = techTags.filter(tag => 
        highCompetitionTech.some(hot => tag.toLowerCase().includes(hot.toLowerCase()))
      ).length;
      competition += highCompTech * 0.05;
      
      // Deadline urgency increases competition
      const deadline = new Date(opportunity.closing_date || opportunity.deadline);
      const now = new Date();
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 14) competition += 0.15;
      else if (daysLeft > 90) competition -= 0.1;
      
      return Math.max(0.1, Math.min(0.95, competition));
    };

    // Get Similar Opportunities
    const getSimilarOpportunities = (opportunity) => {
      return opportunities
        .filter(opp => opp.id !== opportunity.id && opp._id !== opportunity._id)
        .map(opp => ({
          ...opp,
          similarity: calculateSimilarity(opportunity, opp)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);
    };

    const calculateSimilarity = (opp1, opp2) => {
      let score = 0;
      
      // Same funding body (high weight)
      if (opp1.funding_body === opp2.funding_body) score += 0.3;
      
      // Similar tech areas
      const tech1 = opp1.tech_tags || [];
      const tech2 = opp2.tech_tags || [];
      const commonTech = tech1.filter(t => tech2.some(t2 => t2.toLowerCase().includes(t.toLowerCase())));
      score += (commonTech.length / Math.max(tech1.length, tech2.length, 1)) * 0.25;
      
      // Similar TRL level
      const trl1 = parseInt(opp1.trl_level?.match(/\d+/)?.[0]) || 5;
      const trl2 = parseInt(opp2.trl_level?.match(/\d+/)?.[0]) || 5;
      if (Math.abs(trl1 - trl2) <= 1) score += 0.15;
      
      // Similar value range
      const value1 = parseFloat((opp1.funding_amount || '0').replace(/[^\d.]/g, '')) || 0;
      const value2 = parseFloat((opp2.funding_amount || '0').replace(/[^\d.]/g, '')) || 0;
      const maxVal = Math.max(value1, value2, 1);
      const similarity = 1 - Math.abs(value1 - value2) / maxVal;
      if (similarity > 0.7) score += 0.1;
      
      // Similar contract type
      if (opp1.contract_type === opp2.contract_type) score += 0.1;
      
      // Title/description similarity (simple keyword matching)
      const words1 = (opp1.title + ' ' + opp1.description).toLowerCase().split(/\s+/);
      const words2 = (opp2.title + ' ' + opp2.description).toLowerCase().split(/\s+/);
      const commonWords = words1.filter(w => w.length > 4 && words2.includes(w));
      score += Math.min(commonWords.length * 0.02, 0.1);
      
      return score;
    };

    // Personalized Recommendations based on user activity
    const getPersonalizedRecommendations = () => {
      // In a real app, this would use user's viewing history, company profile, etc.
      // For now, we'll simulate smart recommendations
      return sortedOpportunities
        .map(opp => ({
          ...opp,
          recommendationScore: calculateRecommendationScore(opp)
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 5);
    };

    const calculateRecommendationScore = (opportunity) => {
      let score = 0;
      
      // Base SME suitability
      score += (opportunity.enhanced_metadata?.sme_score || calculateSuccessProbability(opportunity)) * 0.4;
      
      // Low competition bonus
      score += (1 - calculateCompetitionLevel(opportunity)) * 0.2;
      
      // Technology alignment with current search
      if (selectedTechAreas.length > 0) {
        const techTags = opportunity.tech_tags || [];
        const alignment = selectedTechAreas.filter(area => 
          techTags.some(tag => tag.toLowerCase().includes(area.toLowerCase()))
        ).length;
        score += (alignment / selectedTechAreas.length) * 0.2;
      }
      
      // Funding body preference (simulate user preference)
      const preferredBodies = ['DASA', 'Innovate UK', 'SBRI'];
      if (preferredBodies.some(body => opportunity.funding_body.includes(body))) {
        score += 0.1;
      }
      
      // Deadline sweet spot
      const deadline = new Date(opportunity.closing_date || opportunity.deadline);
      const now = new Date();
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 30 && daysLeft <= 90) score += 0.1;
      
      return score;
    };

    // Generate AI insights for why an opportunity matches
    const generateMatchExplanation = (opportunity) => {
      const insights = [];
      const successProb = calculateSuccessProbability(opportunity);
      const competition = calculateCompetitionLevel(opportunity);
      
      if (successProb > 0.7) {
        insights.push("🎯 High SME success probability");
      }
      
      if (competition < 0.4) {
        insights.push("🏆 Lower competition expected");
      }
      
      if (opportunity.funding_body.includes('DASA') || opportunity.funding_body.includes('SBRI')) {
        insights.push("🚀 SME-friendly funding body");
      }
      
      const value = parseFloat((opportunity.funding_amount || '0').replace(/[^\d.]/g, '')) || 0;
      if (value <= 1000000 && value > 0) {
        insights.push("💰 SME-appropriate contract size");
      }
      
      const deadline = new Date(opportunity.closing_date || opportunity.deadline);
      const now = new Date();
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 30) {
        insights.push("⏰ Adequate preparation time");
      }
      
      if (selectedTechAreas.length > 0) {
        const techTags = opportunity.tech_tags || [];
        const matches = selectedTechAreas.filter(area => 
          techTags.some(tag => tag.toLowerCase().includes(area.toLowerCase()))
        );
        if (matches.length > 0) {
          insights.push(`🔬 Matches your tech focus: ${matches.join(', ')}`);
        }
      }
      
      return insights.slice(0, 3); // Return top 3 insights
    };

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton onClick={() => setCurrentView('dashboard')} text="Back to Dashboard" />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Defence Opportunities</h1>
            <p className="text-gray-600 mt-2">
              Discover funding and contract opportunities from leading UK defence organizations
            </p>
          </div>

          {/* Phase 1: Enhanced Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            {/* Search Bar and Sort */}
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search opportunities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Phase 2: Search Management Actions */}
              <div className="flex gap-2">
                {/* Save Search Button */}
                <button
                  onClick={() => setShowSaveSearch(true)}
                  className="flex items-center px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                  title="Save Current Search"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Save
                </button>
                
                {/* Load Saved Searches */}
                <button
                  onClick={() => setShowSavedSearches(true)}
                  className="flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  title="Load Saved Search"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Load ({savedSearches.length})
                </button>
                
                {/* Export Results */}
                <div className="relative group">
                  <button className="flex items-center px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Export
                  </button>
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button
                      onClick={() => exportResults('csv')}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
                    >
                      📊 Export as CSV
                    </button>
                    <button
                      onClick={() => exportResults('json')}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg"
                    >
                      📋 Export as JSON
                    </button>
                  </div>
                </div>
                
                {/* Smart Sorting */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </button>
              </div>
            </div>

            {/* Phase 1: Enhanced Filters Panel */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Funding Body Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Funding Body</label>
                    <select
                      value={selectedFundingBody}
                      onChange={(e) => setSelectedFundingBody(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="">All Organizations</option>
                      {fundingBodies.map(body => (
                        <option key={body} value={body}>{body}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Phase 1: Deadline Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <select
                      value={selectedDeadline}
                      onChange={(e) => setSelectedDeadline(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      {deadlineOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Results Count */}
                  <div className="flex items-end">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">{sortedOpportunities.length}</div>
                      <div className="text-sm text-gray-600">Opportunities</div>
                    </div>
                  </div>
                </div>
                
                {/* Phase 1: Technology Areas (Multi-select) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technology Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {techAreas.map(area => (
                      <button
                        key={area}
                        onClick={() => toggleTechArea(area)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTechAreas.includes(area)
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                  {selectedTechAreas.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => setSelectedTechAreas([])}
                        className="text-sm text-cyan-600 hover:text-cyan-800"
                      >
                        Clear all tech areas
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(selectedFundingBody || selectedDeadline || selectedTechAreas.length > 0) && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-700">Active filters:</span>
                  
                  {selectedFundingBody && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                      {selectedFundingBody}
                      <button
                        onClick={() => setSelectedFundingBody('')}
                        className="ml-1 text-cyan-600 hover:text-cyan-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {selectedDeadline && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {deadlineOptions.find(opt => opt.value === selectedDeadline)?.label}
                      <button
                        onClick={() => setSelectedDeadline('')}
                        className="ml-1 text-yellow-600 hover:text-yellow-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {selectedTechAreas.map(area => (
                    <span key={area} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {area}
                      <button
                        onClick={() => toggleTechArea(area)}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  
                  <button
                    onClick={() => {
                      setSelectedFundingBody('');
                      setSelectedDeadline('');
                      setSelectedTechAreas([]);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Phase 3: Personalized Recommendations */}
          {user?.tier !== 'free' && sortedOpportunities.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 mb-8">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <Star className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-indigo-900">🤖 AI-Powered Recommendations for You</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPersonalizedRecommendations().slice(0, 3).map((rec, index) => (
                  <div 
                    key={rec.id || rec._id || index}
                    onClick={() => handleOpportunityClick(rec)}
                    className="bg-white rounded-lg p-4 border border-indigo-200 hover:border-indigo-300 cursor-pointer transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                        #{index + 1} Match
                      </span>
                      <span className="text-xs font-bold text-indigo-700">
                        {Math.round(rec.recommendationScore * 100)}% Match
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                      {rec.title}
                    </h4>
                    
                    <p className="text-xs text-gray-600 mb-2">
                      {rec.funding_body}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600 font-medium">
                        {Math.round(calculateSuccessProbability(rec) * 100)}% Success
                      </span>
                      <span className={`font-medium ${
                        calculateCompetitionLevel(rec) < 0.4 ? 'text-green-600' :
                        calculateCompetitionLevel(rec) < 0.7 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {calculateCompetitionLevel(rec) < 0.4 ? 'Low' : 
                         calculateCompetitionLevel(rec) < 0.7 ? 'Med' : 'High'} Competition
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-indigo-600 mt-4">
                💡 Recommendations based on your search patterns, company profile, and success probability analysis
              </p>
            </div>
          )}

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {sortedOpportunities.length} of {opportunities.length} opportunities
              {user?.tier === 'free' && (
                <span className="ml-2 text-yellow-600 font-medium">
                  (Limited Access: 1/3 of current opportunities - Sunday Refresh)
                </span>
              )}
              {user?.tier === 'pro' && (
                <span className="ml-2 text-green-600 font-medium">
                  (Full Access - Hourly Updates)
                </span>
              )}
            </p>
          </div>

          {/* Opportunities Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading opportunities...</p>
            </div>
          ) : sortedOpportunities.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedOpportunities.map((opportunity, index) => (
                <div 
                  key={opportunity.id || opportunity._id || index} 
                  onClick={() => handleOpportunityClick(opportunity)}
                  className="opportunity-card hover-card cursor-pointer group bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-cyan-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        opportunity.tier_required === 'free' ? 'bg-gray-100 text-gray-800' :
                        opportunity.tier_required === 'pro' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {opportunity.tier_required?.toUpperCase() || 'FREE'}
                      </div>
                      
                      {opportunity.is_delayed && (
                        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                          DELAYED
                        </div>
                      )}
                    </div>
                    
                    {/* Phase 2: Bookmark and Notes Actions */}
                    <div className="flex items-center gap-1">
                      {/* Bookmark Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(opportunity.id || opportunity._id);
                        }}
                        className={`p-1 rounded-full transition-colors ${
                          bookmarkedOpportunities.includes(opportunity.id || opportunity._id)
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={bookmarkedOpportunities.includes(opportunity.id || opportunity._id) ? 'Remove bookmark' : 'Bookmark this opportunity'}
                      >
                        <Star className={`w-4 h-4 ${bookmarkedOpportunities.includes(opportunity.id || opportunity._id) ? 'fill-current' : ''}`} />
                      </button>
                      
                      {/* Notes Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openNotesModal(opportunity);
                        }}
                        className={`p-1 rounded-full transition-colors ${
                          opportunityNotes[opportunity.id || opportunity._id]
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={opportunityNotes[opportunity.id || opportunity._id] ? 'Edit note' : 'Add note'}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-cyan-600 transition-colors line-clamp-2">
                    {opportunity.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{opportunity.funding_body}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>Closes: {new Date(opportunity.closing_date || opportunity.deadline).toLocaleDateString()}</span>
                    </div>

                    {opportunity.funding_amount && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{opportunity.funding_amount}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {opportunity.description}
                  </p>

                  {/* Phase 3: AI-Powered Insights */}
                  <div className="space-y-3 mb-4">
                    {/* Success Probability & Competition Indicators */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-green-700">Success Probability</span>
                          <span className="text-sm font-bold text-green-800">
                            {Math.round(calculateSuccessProbability(opportunity) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-green-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{width: `${calculateSuccessProbability(opportunity) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-700">Competition Level</span>
                          <span className="text-sm font-bold text-blue-800">
                            {calculateCompetitionLevel(opportunity) < 0.4 ? 'Low' : 
                             calculateCompetitionLevel(opportunity) < 0.7 ? 'Medium' : 'High'}
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              calculateCompetitionLevel(opportunity) < 0.4 ? 'bg-green-500' :
                              calculateCompetitionLevel(opportunity) < 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{width: `${calculateCompetitionLevel(opportunity) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* AI Match Insights */}
                    {(() => {
                      const insights = generateMatchExplanation(opportunity);
                      return insights.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                          <div className="text-xs font-semibold text-purple-700 mb-1">🤖 AI Insights</div>
                          <div className="space-y-1">
                            {insights.map((insight, idx) => (
                              <div key={idx} className="text-xs text-purple-600 flex items-start">
                                <span className="mr-1">•</span>
                                <span>{insight}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Enhanced metadata for Pro users */}
                  {user?.tier !== 'free' && opportunity.enhanced_metadata && (
                    <div className="space-y-2 mb-4">
                      {opportunity.enhanced_metadata.sme_score !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Enhanced SME Score:</span>
                          <span className="text-xs font-semibold text-green-600">
                            {Math.round(opportunity.enhanced_metadata.sme_score * 100)}%
                          </span>
                        </div>
                      )}

                      {opportunity.enhanced_metadata.confidence_score !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Confidence Score:</span>
                          <span className="text-xs font-semibold text-blue-600">
                            {Math.round(opportunity.enhanced_metadata.confidence_score * 100)}%
                          </span>
                        </div>
                      )}
                      
                      {opportunity.enhanced_metadata.keywords_matched?.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Matched Keywords:</div>
                          <div className="text-xs text-gray-600">
                            {opportunity.enhanced_metadata.keywords_matched.slice(0, 5).join(', ')}
                            {opportunity.enhanced_metadata.keywords_matched.length > 5 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-cyan-600 font-medium group-hover:text-cyan-700 transition-colors">
                      Click to view details →
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phase 2: Save Search Modal */}
          {showSaveSearch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Save Current Search</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Name</label>
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="e.g., AI Cyber Security Opportunities"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Search Criteria:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      {searchTerm && <div>Search: "{searchTerm}"</div>}
                      {selectedFundingBody && <div>Funding Body: {selectedFundingBody}</div>}
                      {selectedTechAreas.length > 0 && <div>Tech Areas: {selectedTechAreas.join(', ')}</div>}
                      {selectedDeadline && <div>Deadline: {deadlineOptions.find(opt => opt.value === selectedDeadline)?.label}</div>}
                      <div>Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}</div>
                      <div>Results: {sortedOpportunities.length} opportunities</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSaveSearch(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCurrentSearch}
                      className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                    >
                      Save Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Saved Searches Modal */}
          {showSavedSearches && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Saved Searches ({savedSearches.length})</h3>
                  <button
                    onClick={() => setShowSavedSearches(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {savedSearches.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No saved searches yet</p>
                    <p className="text-sm text-gray-500">Use the "Save" button to save your current search criteria</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedSearches.map((search) => (
                      <div key={search.id} className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 mb-2">{search.name}</h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              {search.searchTerm && <div>Search: "{search.searchTerm}"</div>}
                              {search.selectedFundingBody && <div>Funding Body: {search.selectedFundingBody}</div>}
                              {search.selectedTechAreas?.length > 0 && <div>Tech Areas: {search.selectedTechAreas.join(', ')}</div>}
                              {search.selectedDeadline && <div>Deadline: {deadlineOptions.find(opt => opt.value === search.selectedDeadline)?.label}</div>}
                              <div>Created: {new Date(search.createdAt).toLocaleDateString()}</div>
                              <div>Results when saved: {search.resultCount} opportunities</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => loadSavedSearch(search)}
                              className="px-3 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 rounded text-sm transition-colors"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deleteSavedSearch(search.id)}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 2: Notes Modal */}
          {showNotesModal && currentNoteOpportunity && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Add Note for Opportunity
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {currentNoteOpportunity.title}
                    </h4>
                    <p className="text-xs text-gray-600">{currentNoteOpportunity.funding_body}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Note</label>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add your thoughts, next steps, or reminders..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowNotesModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveNote}
                      className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Alerts Page Component
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
      {currentView === 'funding-opportunities' && <FundingOpportunitiesPage />}
      {currentView === 'opportunity-detail' && <OpportunityDetailPage />}
      {currentView === 'alerts' && user && <AlertsPage />}
      {currentView === 'procurement-act' && user && <ProcurementActHub />}
      
      {showUpgradeModal && <UpgradeModal />}
      {showDemoSwitcher && <DemoTierSwitcher />}
    </div>
  );
}

export default App;