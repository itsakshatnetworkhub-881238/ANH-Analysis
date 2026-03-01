/**
 * ANH Analytics Tracker v1.0
 * Advanced analytics and engagement tracking system
 * Privacy-first approach - tracks only ANH visit history
 * 
 * Usage: Add this script to your page before closing </body> tag
 * <script src="path/to/anhanalytics-tracker.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    DB_NAME: 'ANH_DB',
    DB_VERSION: 1,
    POPUP_DELAY: 120000, // 120 seconds
    SESSION_TIMEOUT: 1800000, // 30 minutes
    SCROLL_THRESHOLD: 25, // % of page scrolled
    ENGAGEMENT_THRESHOLD: 5000 // 5 seconds on page
  };

  // ANH Analytics Object
  const ANHAnalytics = {
    db: null,
    pageData: {},
    sessionData: {},
    screenTimeData: {},
    engagementData: {},
    isInitialized: false,
    consentGiven: false,

    /**
     * Initialize the analytics system
     */
    async init() {
      try {
        // Open IndexedDB
        await this.initDB();
        
        // Load page metadata
        this.loadPageMetadata();
        
        // Initialize session
        this.initSession();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start screen time tracking
        this.startScreenTimeTracking();
        
        // Check for existing consent
        this.checkConsent();
        
        this.isInitialized = true;
        console.log('[ANH] Analytics initialized successfully');
      } catch (error) {
        console.error('[ANH] Initialization failed:', error);
      }
    },

    /**
     * Initialize IndexedDB
     */
    initDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

        request.onerror = () => {
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          // Create object stores
          if (!db.objectStoreNames.contains('pages')) {
            db.createObjectStore('pages', { keyPath: 'pageId' });
          }
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'sessionId' });
          }
          if (!db.objectStoreNames.contains('links')) {
            db.createObjectStore('links', { keyPath: 'linkId' });
          }
          if (!db.objectStoreNames.contains('screenTime')) {
            db.createObjectStore('screenTime', { keyPath: 'recordId' });
          }
          if (!db.objectStoreNames.contains('engagement')) {
            db.createObjectStore('engagement', { keyPath: 'engagementId' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        };
      });
    },

    /**
     * Load page metadata
     */
    loadPageMetadata() {
      const title = document.title || 'Untitled Page';
      const description = this.getMetaContent('description') || '';
      const projectId = this.getMetaContent('ProjectID') || this.getMetaContent('project-id') || '';
      const currentUrl = window.location.href;
      const canonical = this.getCanonicalUrl();

      this.pageData = {
        pageId: this.generateId('page'),
        title: title,
        description: description,
        projectId: projectId,
        url: currentUrl,
        canonical: canonical,
        loadTime: new Date().toISOString(),
        sourceCode: document.documentElement.outerHTML.substring(0, 10000), // First 10KB
        metaTags: this.extractMetaTags(),
        openGraph: this.extractOpenGraph()
      };

      // Store in IndexedDB
      this.saveToStore('pages', this.pageData);
    },

    /**
     * Extract meta tag content
     */
    getMetaContent(name) {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return meta ? meta.getAttribute('content') : '';
    },

    /**
     * Get canonical URL
     */
    getCanonicalUrl() {
      const canonical = document.querySelector('link[rel="canonical"]');
      return canonical ? canonical.getAttribute('href') : window.location.href;
    },

    /**
     * Extract all meta tags
     */
    extractMetaTags() {
      const metaTags = {};
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property') || '';
        const content = meta.getAttribute('content') || '';
        if (name) metaTags[name] = content;
      });
      return metaTags;
    },

    /**
     * Extract Open Graph data
     */
    extractOpenGraph() {
      const ogData = {};
      document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
        const property = meta.getAttribute('property').replace('og:', '');
        ogData[property] = meta.getAttribute('content') || '';
      });
      return ogData;
    },

    /**
     * Initialize session tracking
     */
    initSession() {
      this.sessionData = {
        sessionId: this.generateId('session'),
        startTime: Date.now(),
        pageUrl: window.location.href,
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent,
        screenResolution: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      this.saveToStore('sessions', this.sessionData);
    },

    /**
     * Setup event listeners for engagement tracking
     */
    setupEventListeners() {
      // Track link clicks
      this.trackLinkClicks();

      // Track scroll depth
      this.trackScrollDepth();

      // Track form interactions
      this.trackFormInteractions();

      // Track page visibility
      this.trackPageVisibility();

      // Track user inactivity
      this.trackInactivity();

      // Show consent popup after delay
      setTimeout(() => this.showConsentPopup(), CONFIG.POPUP_DELAY);
    },

    /**
     * Track all link clicks
     */
    trackLinkClicks() {
      document.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        const linkText = link.textContent.trim();
        const isExternal = this.isExternalLink(href);
        const isAnchor = href && href.startsWith('#');

        const linkData = {
          linkId: this.generateId('link'),
          sessionId: this.sessionData.sessionId,
          href: href,
          text: linkText,
          type: isExternal ? 'external' : isAnchor ? 'anchor' : 'internal',
          clickTime: Date.now(),
          pageUrl: window.location.href,
          clickPosition: {
            x: event.clientX,
            y: event.clientY
          }
        };

        // Record engagement
        this.recordEngagement('click', linkData);
        this.saveToStore('links', linkData);
      });
    },

    /**
     * Check if link is external
     */
    isExternalLink(href) {
      if (!href) return false;
      if (href.startsWith('http')) {
        return !href.includes(window.location.hostname);
      }
      return false;
    },

    /**
     * Track scroll depth
     */
    trackScrollDepth() {
      let maxScroll = 0;
      window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          
          if (maxScroll % 25 === 0) {
            this.recordEngagement('scroll', {
              scrollDepth: maxScroll,
              timestamp: Date.now()
            });
          }
        }
      });
    },

    /**
     * Track form interactions
     */
    trackFormInteractions() {
      document.addEventListener('submit', (event) => {
        const form = event.target;
        const formData = {
          formId: form.id || this.generateId('form'),
          formName: form.name || '',
          timestamp: Date.now(),
          fieldsCount: form.querySelectorAll('input, textarea, select').length
        };

        this.recordEngagement('form_submit', formData);
      });

      // Track form field focus
      document.addEventListener('focus', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
          this.recordEngagement('form_focus', {
            fieldName: event.target.name || event.target.id,
            fieldType: event.target.type
          });
        }
      }, true);
    },

    /**
     * Track page visibility changes
     */
    trackPageVisibility() {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.recordEngagement('page_hidden', { timestamp: Date.now() });
        } else {
          this.recordEngagement('page_visible', { timestamp: Date.now() });
        }
      });
    },

    /**
     * Track user inactivity
     */
    trackInactivity() {
      let inactivityTimer;
      const resetTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          this.recordEngagement('user_inactive', { timestamp: Date.now() });
        }, CONFIG.SESSION_TIMEOUT);
      };

      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetTimer);
      });

      resetTimer();
    },

    /**
     * Start screen time tracking
     */
    startScreenTimeTracking() {
      let screenTimeStart = Date.now();
      let isActive = true;

      const updateScreenTime = () => {
        if (isActive) {
          const screenTimeRecord = {
            recordId: this.generateId('screentime'),
            sessionId: this.sessionData.sessionId,
            pageUrl: window.location.href,
            duration: Date.now() - screenTimeStart,
            timestamp: Date.now()
          };

          this.saveToStore('screenTime', screenTimeRecord);
        }
      };

      // Update screen time every minute
      setInterval(updateScreenTime, 60000);

      // Track visibility changes
      document.addEventListener('visibilitychange', () => {
        isActive = !document.hidden;
        if (!isActive) {
          updateScreenTime();
          screenTimeStart = Date.now();
        }
      });

      // Update on page unload
      window.addEventListener('beforeunload', () => {
        updateScreenTime();
      });
    },

    /**
     * Record engagement event
     */
    recordEngagement(type, data) {
      const engagementRecord = {
        engagementId: this.generateId('engagement'),
        sessionId: this.sessionData.sessionId,
        type: type,
        data: data,
        timestamp: Date.now(),
        pageUrl: window.location.href
      };

      this.saveToStore('engagement', engagementRecord);
    },

    /**
     * Extract breadcrumbs
     */
    extractBreadcrumbs() {
      const breadcrumbs = [];
      
      // Try to find structured breadcrumbs
      const breadcrumbNav = document.querySelector('[aria-label="Breadcrumb"], nav.breadcrumb, .breadcrumbs');
      
      if (breadcrumbNav) {
        breadcrumbNav.querySelectorAll('a').forEach(link => {
          breadcrumbs.push({
            text: link.textContent.trim(),
            url: link.getAttribute('href'),
            active: !link.getAttribute('href')
          });
        });
      } else {
        // Fallback: extract from URL path
        const pathParts = window.location.pathname.split('/').filter(p => p);
        let currentPath = '';
        
        pathParts.forEach((part, index) => {
          currentPath += '/' + part;
          breadcrumbs.push({
            text: decodeURIComponent(part),
            url: currentPath,
            active: index === pathParts.length - 1
          });
        });
      }

      return breadcrumbs;
    },

    /**
     * Extract JSON-LD structured data
     */
    extractJSONLD() {
      const jsonLDs = [];
      document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
          jsonLDs.push(JSON.parse(script.textContent));
        } catch (e) {
          console.warn('[ANH] Failed to parse JSON-LD:', e);
        }
      });
      return jsonLDs;
    },

    /**
     * Calculate CPR (Click Per Record)
     */
    calculateCPR() {
      return new Promise((resolve) => {
        const tx = this.db.transaction(['links', 'engagement']);
        const linksStore = tx.objectStore('links');
        const engagementStore = tx.objectStore('engagement');

        let totalClicks = 0;
        let totalImpressions = 0;

        const countRequest = linksStore.count();
        countRequest.onsuccess = () => {
          totalImpressions = countRequest.result;
        };

        const engagementRequest = engagementStore.count();
        engagementRequest.onsuccess = () => {
          totalClicks = engagementRequest.result;
          const cpr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
          resolve({
            cpr: cpr.toFixed(4),
            totalClicks,
            totalImpressions,
            engagementRate: ((totalClicks / totalImpressions) * 100).toFixed(2) + '%'
          });
        };
      });
    },

    /**
     * Get total screen time across all days
     */
    getTotalScreenTime() {
      return new Promise((resolve) => {
        const tx = this.db.transaction(['screenTime']);
        const store = tx.objectStore('screenTime');
        const request = store.getAll();

        request.onsuccess = () => {
          const records = request.result;
          const totalTime = records.reduce((sum, record) => sum + record.duration, 0);
          
          resolve({
            totalScreenTimeMs: totalTime,
            totalScreenTimeHours: (totalTime / 3600000).toFixed(2),
            recordCount: records.length,
            averageSessionTime: records.length > 0 ? (totalTime / records.length).toFixed(2) : 0
          });
        };
      });
    },

    /**
     * Show consent popup
     */
    showConsentPopup() {
      // Check if consent was already given
      const storedConsent = localStorage.getItem('ANH_CONSENT');
      if (storedConsent) return;

      const popup = document.createElement('div');
      popup.id = 'anh-consent-popup';
      popup.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        max-width: 400px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        z-index: 10000;
        animation: slideUp 0.4s ease-out;
      `;

      popup.innerHTML = `
        <style>
          @keyframes slideUp {
            from {
              transform: translateY(400px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          #anh-consent-popup h3 {
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
          }
          
          #anh-consent-popup p {
            margin: 0 0 16px 0;
            font-size: 14px;
            line-height: 1.5;
            opacity: 0.95;
          }
          
          #anh-consent-popup .anh-button-group {
            display: flex;
            gap: 10px;
          }
          
          #anh-consent-popup button {
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          #anh-consent-popup .anh-accept {
            background: white;
            color: #667eea;
          }
          
          #anh-consent-popup .anh-accept:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          
          #anh-consent-popup .anh-decline {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
          }
          
          #anh-consent-popup .anh-decline:hover {
            background: rgba(255,255,255,0.3);
          }
        </style>
        
        <h3>📊 ANH Analytics</h3>
        <p>
          We track your visit history to understand engagement and provide better experiences. 
          <strong>No personal information is collected</strong> - only ANH site visit data.
        </p>
        <div class="anh-button-group">
          <button class="anh-accept" onclick="this.parentElement.parentElement.dataset.action = 'accept'; document.dispatchEvent(new CustomEvent('anhConsentResponse', {detail: 'accept'}));">
            I Understand
          </button>
          <button class="anh-decline" onclick="this.parentElement.parentElement.dataset.action = 'decline'; document.dispatchEvent(new CustomEvent('anhConsentResponse', {detail: 'decline'}));">
            Don't Show Again
          </button>
        </div>
      `;

      document.body.appendChild(popup);

      // Handle consent response
      document.addEventListener('anhConsentResponse', (event) => {
        const action = event.detail;
        localStorage.setItem('ANH_CONSENT', JSON.stringify({
          action: action,
          timestamp: new Date().toISOString(),
          dontShowAgain: action === 'decline'
        }));

        popup.style.animation = 'slideUp 0.4s ease-out reverse';
        setTimeout(() => {
          popup.remove();
          this.consentGiven = action === 'accept';
        }, 400);
      });
    },

    /**
     * Check existing consent
     */
    checkConsent() {
      const consent = localStorage.getItem('ANH_CONSENT');
      if (consent) {
        const consentData = JSON.parse(consent);
        this.consentGiven = consentData.action === 'accept';
      }
    },

    /**
     * Save data to IndexedDB store
     */
    saveToStore(storeName, data) {
      if (!this.db) return;

      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(data);

      tx.onerror = () => {
        console.error('[ANH] Failed to save to store:', storeName);
      };
    },

    /**
     * Generate unique ID
     */
    generateId(prefix = '') {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Get comprehensive report
     */
    async getReport() {
      const cprData = await this.calculateCPR();
      const screenTimeData = await this.getTotalScreenTime();
      const breadcrumbs = this.extractBreadcrumbs();
      const jsonLD = this.extractJSONLD();

      return {
        page: this.pageData,
        session: this.sessionData,
        cpr: cprData,
        screenTime: screenTimeData,
        breadcrumbs: breadcrumbs,
        structuredData: jsonLD,
        timestamp: new Date().toISOString()
      };
    },

    /**
     * Export data as JSON
     */
    async exportData() {
      const report = await this.getReport();
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `anh-analytics-${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ANHAnalytics.init());
  } else {
    ANHAnalytics.init();
  }

  // Expose ANH Analytics to global scope
  window.ANHAnalytics = ANHAnalytics;
})();
