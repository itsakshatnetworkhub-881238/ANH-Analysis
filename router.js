/**
 * Global Router Module
 * Captures and stores page metadata in IndexedDB (ANH_DB)
 * Stores: Title, Description, URL, Logo, URL_Id
 */

class PageRouter {
  constructor() {
    this.dbName = 'ANH_DB';
    this.storeName = 'pages';
    this.db = null;
    this.init();
  }

  /**
   * Initialize IndexedDB and set up event listeners
   */
  async init() {
    try {
      await this.initDatabase();
      this.capturePageInfo();
      this.setupPageChangeListener();
    } catch (error) {
      console.error('Router initialization error:', error);
    }
  }

  /**
   * Initialize IndexedDB with ANH_DB database
   */
  initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('ANH_DB Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: 'URL_Id',
            autoIncrement: true,
          });

          // Create indexes for better querying
          objectStore.createIndex('url', 'url', { unique: true });
          objectStore.createIndex('title', 'title', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });

          console.log('Object store and indexes created');
        }
      };
    });
  }

  /**
   * Extract metadata from current page
   */
  extractPageMetadata() {
    const metadata = {
      title: this.getPageTitle(),
      description: this.getPageDescription(),
      url: window.location.href,
      logo: this.getPageLogo(),
      timestamp: new Date().toISOString(),
      favicon: this.getFavicon(),
    };

    return metadata;
  }

  /**
   * Get page title from various sources
   */
  getPageTitle() {
    // Priority: meta og:title > document.title > page heading
    const ogTitle =
      document.querySelector("meta[property='og:title']")?.getAttribute('content');
    if (ogTitle) return ogTitle;

    const pageTitle = document.title;
    if (pageTitle) return pageTitle;

    const h1 = document.querySelector('h1')?.textContent;
    return h1 || 'Untitled Page';
  }

  /**
   * Get page description from meta tags
   */
  getPageDescription() {
    // Priority: og:description > meta description
    const ogDescription = document.querySelector("meta[property='og:description']")?.getAttribute('content');
    if (ogDescription) return ogDescription;

    const metaDescription = document.querySelector("meta[name='description']")?.getAttribute('content');
    if (metaDescription) return metaDescription;

    // Fallback: first paragraph text
    const firstParagraph = document.querySelector('p')?.textContent;
    return firstParagraph || 'No description available';
  }

  /**
   * Extract logo/image from page
   */
  getPageLogo() {
    // Priority: og:image > logo element > favicon
    const ogImage = document.querySelector("meta[property='og:image']")?.getAttribute('content');
    if (ogImage) return ogImage;

    const logoImg = document.querySelector('img[alt*="logo" i], img[class*="logo" i]')?.src;
    if (logoImg) return logoImg;

    const favicon = this.getFavicon();
    return favicon || null;
  }

  /**
   * Get favicon URL
   */
  getFavicon() {
    const favicon = document.querySelector('link[rel="icon"]')?.href ||
      document.querySelector('link[rel="shortcut icon"]')?.href ||
      '/favicon.ico';
    return favicon;
  }

  /**
   * Generate unique URL_Id hash
   */
  generateUrlId(url) {
    return this.hashCode(url);
  }

  /**
   * Simple hash function for URL
   */
  hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Store page info in IndexedDB
   */
  async savePageInfo(metadata) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.warn('Database not initialized');
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      // Add URL_Id to metadata
      const dataToStore = {
        ...metadata,
        URL_Id: this.generateUrlId(metadata.url),
      };

      const request = objectStore.put(dataToStore);

      request.onerror = () => {
        console.error('Error saving page info:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Page info saved:', dataToStore);
        resolve(dataToStore);
      };
    });
  }

  /**
   * Capture current page info and store it
   */
  async capturePageInfo() {
    try {
      const metadata = this.extractPageMetadata();
      await this.savePageInfo(metadata);
    } catch (error) {
      console.error('Error capturing page info:', error);
    }
  }

  /**
   * Listen for page visibility changes and route updates
   */
  setupPageChangeListener() {
    // Capture info when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.capturePageInfo();
      }
    });

    // Handle SPA (Single Page Application) route changes
    window.addEventListener('popstate', () => {
      setTimeout(() => this.capturePageInfo(), 100);
    });

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.capturePageInfo();
    });
  }

  /**
   * Retrieve all stored pages
   */
  async getAllPages() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Retrieve page by URL_Id
   */
  async getPageById(urlId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(parseInt(urlId));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Retrieve page by URL
   */
  async getPageByUrl(url) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('url');
      const request = index.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Delete page entry by URL_Id
   */
  async deletePageById(urlId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(parseInt(urlId));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('Page deleted:', urlId);
        resolve(true);
      };
    });
  }

  /**
   * Clear all stored pages
   */
  async clearAllPages() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('All pages cleared');
        resolve(true);
      };
    });
  }

  /**
   * Export all stored data
   */
  async exportData() {
    try {
      const allPages = await this.getAllPages();
      return {
        database: this.dbName,
        store: this.storeName,
        exportDate: new Date().toISOString(),
        totalRecords: allPages.length,
        data: allPages,
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const allPages = await this.getAllPages();
      return {
        totalPages: allPages.length,
        database: this.dbName,
        storeName: this.storeName,
        pages: allPages.map((p) => ({
          URL_Id: p.URL_Id,
          title: p.title,
          url: p.url,
          timestamp: p.timestamp,
        })),
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
}

// Initialize router globally
const pageRouter = new PageRouter();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PageRouter;
}
