/**
 * router.js
 * Advanced ANH History Tracker
 * Features:
 * - IndexedDB storage
 * - Duplicate prevention
 * - Session tracking
 * - Resume journey popup
 * - Dashboard quick access
 */

(function () {
    "use strict";

    const DB_NAME = "ANH_v1.0 db";
    const STORE_NAME = "history";
    const DB_VERSION = 1;
    const DASHBOARD_URL = "/index.htm";
    const DUPLICATE_WINDOW_MS = 10000;

    /* ==============================
       DATABASE
    ============================== */

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: "id",
                        autoIncrement: true
                    });
                    store.createIndex("url", "url", { unique: false });
                    store.createIndex("timestamp", "timestamp", { unique: false });
                    store.createIndex("sessionId", "sessionId", { unique: false });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /* ==============================
       SESSION MANAGEMENT
    ============================== */

    function getSessionId() {
        let sessionId = sessionStorage.getItem("ANH_SESSION_ID");
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem("ANH_SESSION_ID", sessionId);
        }
        return sessionId;
    }

    /* ==============================
       SAVE HISTORY
    ============================== */

    async function saveHistory() {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = async () => {
            const records = request.result || [];
            const now = Date.now();
            const currentUrl = window.location.href;

            const recentDuplicate = records.find(
                r => r.url === currentUrl && (now - r.timestamp < DUPLICATE_WINDOW_MS)
            );

            if (recentDuplicate) return;

            const writeTx = db.transaction(STORE_NAME, "readwrite");
            writeTx.objectStore(STORE_NAME).add({
                url: currentUrl,
                title: document.title || "Untitled",
                timestamp: now,
                sessionId: getSessionId(),
                referrer: document.referrer || null
            });
        };
    }

    /* ==============================
       GET LAST VISIT
    ============================== */

    async function getLastVisitedPage() {
        const db = await openDatabase();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const records = request.result || [];
                const sorted = records.sort((a, b) => b.timestamp - a.timestamp);
                const currentUrl = window.location.href;

                const last = sorted.find(r => r.url !== currentUrl);
                resolve(last || null);
            };
        });
    }

    /* ==============================
       POPUP UI
    ============================== */

    function createPopup(lastPage) {
        if (!lastPage) return;
        if (sessionStorage.getItem("ANH_POPUP_DISMISSED")) return;

        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.bottom = "20px";
        container.style.right = "20px";
        container.style.width = "300px";
        container.style.background = "#2c3e50";
        container.style.color = "#fff";
        container.style.padding = "15px";
        container.style.borderRadius = "10px";
        container.style.boxShadow = "0 5px 20px rgba(0,0,0,0.3)";
        container.style.zIndex = "9999";
        container.style.fontFamily = "Arial";

        container.innerHTML = `
            <strong>Resume Your Journey</strong>
            <p style="font-size:13px;margin:8px 0;">
                Last visited: ${lastPage.title}
            </p>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
                <button id="anh-resume">Resume</button>
                <button id="anh-dashboard">Dashboard</button>
                <button id="anh-close">X</button>
            </div>
        `;

        document.body.appendChild(container);

        document.getElementById("anh-resume").onclick = () => {
            window.location.href = lastPage.url;
        };

        document.getElementById("anh-dashboard").onclick = () => {
            window.location.href = DASHBOARD_URL;
        };

        document.getElementById("anh-close").onclick = () => {
            sessionStorage.setItem("ANH_POPUP_DISMISSED", "true");
            container.remove();
        };
    }

    /* ==============================
       FLOATING DASHBOARD BUTTON
    ============================== */

    function createFloatingDashboardButton() {
        const btn = document.createElement("button");
        btn.innerText = "ANH Dashboard";
        btn.style.position = "fixed";
        btn.style.bottom = "20px";
        btn.style.left = "20px";
        btn.style.padding = "10px 15px";
        btn.style.background = "#3498db";
        btn.style.color = "#fff";
        btn.style.border = "none";
        btn.style.borderRadius = "30px";
        btn.style.cursor = "pointer";
        btn.style.zIndex = "9999";

        btn.onclick = () => {
            window.location.href = DASHBOARD_URL;
        };

        document.body.appendChild(btn);
    }

    /* ==============================
       INIT
    ============================== */

    async function init() {
        await saveHistory();
        const lastPage = await getLastVisitedPage();
        createPopup(lastPage);
        createFloatingDashboardButton();
    }

    window.addEventListener("load", init);

})();
