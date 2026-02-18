/* ==========================================
   ANH GUEST LIMIT ENGINE v2.0
   3 Pages Per Day Restriction
========================================== */

(function(){

const DB_NAME = "ANH_DB";
const DB_VERSION = 1;
const MAX_VISITS = 3;
const LOGIN_PAGE = "login.htm";

let db;

/* =========================
   INIT DATABASE
========================= */

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = function(e){
  db = e.target.result;

  if(!db.objectStoreNames.contains("guestVisits")){
    db.createObjectStore("guestVisits", { keyPath:"date" });
  }
};

request.onsuccess = function(e){
  db = e.target.result;
  enforceLimit();
};

/* =========================
   CHECK IF LOGGED USER
========================= */

function isLoggedIn(){
  const activeUser = sessionStorage.getItem("ANH_ACTIVE_USER");
  const expiry = sessionStorage.getItem("ANH_SESSION_EXPIRY");

  if(activeUser && expiry && Date.now() < parseInt(expiry)){
    return true;
  }
  return false;
}

/* =========================
   MAIN LIMIT ENFORCER
========================= */

function enforceLimit(){

  if(isLoggedIn()) return; // Bypass for logged users

  const today = new Date().toISOString().split("T")[0];

  const tx = db.transaction("guestVisits","readwrite");
  const store = tx.objectStore("guestVisits");
  const req = store.get(today);

  req.onsuccess = function(){

    let record = req.result;

    if(!record){
      // First visit today
      store.add({
        date: today,
        count: 1,
        pages: [window.location.pathname],
        lastVisit: Date.now()
      });
      return;
    }

    /* =========================
       TAMPER CHECK
    ========================== */

    if(record.count < 0 || record.count > 100){
      console.warn("Tampering detected. Resetting record.");
      record.count = 0;
    }

    /* =========================
       PAGE UNIQUE CHECK
    ========================== */

    if(!record.pages.includes(window.location.pathname)){
      record.count += 1;
      record.pages.push(window.location.pathname);
      record.lastVisit = Date.now();
    }

    /* =========================
       LIMIT LOGIC
    ========================== */

    if(record.count > MAX_VISITS){

      showBlockScreen(record.count);

      setTimeout(()=>{
        window.location.href = LOGIN_PAGE;
      }, 3000);

      return;
    }

    /* =========================
       SOFT WARNING
    ========================== */

    if(record.count === MAX_VISITS){
      console.warn("Guest limit reached. Next visit will require login.");
      showWarning();
    }

    store.put(record);
  };
}

/* =========================
   WARNING UI
========================= */

function showWarning(){

  const banner = document.createElement("div");
  banner.innerText = "Guest Limit Reached (3/3). Login required on next visit.";
  styleBanner(banner, "#f59e0b");

  document.body.prepend(banner);
}

/* =========================
   BLOCK UI
========================= */

function showBlockScreen(count){

  document.body.innerHTML = "";

  const container = document.createElement("div");
  container.style.height = "100vh";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.justifyContent = "center";
  container.style.alignItems = "center";
  container.style.background = "#0f172a";
  container.style.color = "#f1f5f9";
  container.style.textAlign = "center";

  container.innerHTML = `
    <h2>Access Restricted</h2>
    <p>You have exceeded the guest limit (${count} visits).</p>
    <p>Please login to continue.</p>
  `;

  document.body.appendChild(container);
}

/* =========================
   BANNER STYLING
========================= */

function styleBanner(element, color){
  element.style.background = color;
  element.style.color = "#fff";
  element.style.padding = "10px";
  element.style.textAlign = "center";
  element.style.fontSize = "14px";
  element.style.fontWeight = "bold";
}

})();
