/* =====================================================
   ANH COLLECTOR ENGINE v2.0
   Metadata Storage + Visit Counter + Deduplication
===================================================== */

(function(){

const DB_NAME = "ANH_DB";
const DB_VERSION = 1;

let db;

/* ===============================
   INIT DATABASE
=============================== */

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = function(e){
  db = e.target.result;

  if(!db.objectStoreNames.contains("analytics")){
    const store = db.createObjectStore("analytics", {
      keyPath: "id",
      autoIncrement: true
    });
    store.createIndex("userEmail", "userEmail", { unique: false });
    store.createIndex("pageURL", "pageURL", { unique: false });
  }
};

request.onsuccess = function(e){
  db = e.target.result;
};

/* ===============================
   RECEIVE DATA FROM SCRIPTO
=============================== */

window.ANH_COLLECT = function(metadata){

  if(!db) return;

  const activeUser = sessionStorage.getItem("ANH_ACTIVE_USER");
  const expiry = sessionStorage.getItem("ANH_SESSION_EXPIRY");

  /* Session Validation */
  if(!activeUser || !expiry || Date.now() > parseInt(expiry)){
    console.warn("Collector blocked: No active session.");
    return;
  }

  const tx = db.transaction("analytics", "readwrite");
  const store = tx.objectStore("analytics");

  const index = store.index("pageURL");

  const getAllRequest = store.getAll();

  getAllRequest.onsuccess = function(){

    const records = getAllRequest.result;

    /* Check if same user + same page exists */
    const existing = records.find(r =>
      r.userEmail === activeUser &&
      r.pageURL === metadata.pageURL
    );

    if(existing){

      /* Update visit count */
      existing.visitCount += 1;
      existing.lastVisit = Date.now();

      store.put(existing);

    } else {

      /* New Record */
      store.add({
        userEmail: activeUser,
        url_Id: metadata.url_Id,
        pageURL: metadata.pageURL,
        title: metadata.title,
        description: metadata.description,
        logo: metadata.logo,
        firstVisit: Date.now(),
        lastVisit: Date.now(),
        visitCount: 1
      });

    }

  };

};

/* ===============================
   GLOBAL ANALYTICS HELPER
=============================== */

window.ANH_GET_ANALYTICS = function(callback){

  const tx = db.transaction("analytics","readonly");
  const store = tx.objectStore("analytics");
  const request = store.getAll();

  request.onsuccess = function(){
    callback(request.result);
  };

};

/* ===============================
   CLEAR ANALYTICS (ADMIN ONLY)
=============================== */

window.ANH_CLEAR_ANALYTICS = function(){

  const confirmClear = confirm("Are you sure you want to clear analytics?");
  if(!confirmClear) return;

  const tx = db.transaction("analytics","readwrite");
  const store = tx.objectStore("analytics");
  store.clear();

  alert("Analytics Cleared Successfully.");
};

})();
