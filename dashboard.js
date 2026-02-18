/* ======================================================
   ANH DASHBOARD ENGINE v2.0
   Dynamic Summary + User Activity Renderer
====================================================== */

(function(){

const DB_NAME = "ANH_DB";
let db;

/* ============================
   INIT DATABASE
============================ */
const request = indexedDB.open(DB_NAME,1);

request.onsuccess = function(e){
  db = e.target.result;
  loadDashboard();
};

/* ============================
   LOAD DASHBOARD DATA
============================ */
function loadDashboard(){

  if(!db) return;

  const tx = db.transaction(["analytics","users"],"readonly");
  const analyticsStore = tx.objectStore("analytics");
  const userStore = tx.objectStore("users");

  const analyticsReq = analyticsStore.getAll();
  const usersReq = userStore.getAll();

  analyticsReq.onsuccess = function(){
    usersReq.onsuccess = function(){

      const analytics = analyticsReq.result || [];
      const users = usersReq.result || [];

      renderSummary(analytics, users);
      renderUserActivity(analytics);

      /* Send data to charts.js */
      if(typeof ANH_RENDER_CHARTS === "function"){
        ANH_RENDER_CHARTS(analytics);
      }

    };
  };
}

/* ============================
   SUMMARY CALCULATIONS
============================ */
function renderSummary(analytics, users){

  const container = document.getElementById("summaryCards");
  if(!container) return;

  if(analytics.length === 0){
    container.innerHTML = `
      <div class="card">
        <h3>No Analytics Data Yet</h3>
      </div>
    `;
    return;
  }

  const totalUsers = users.length;
  const totalVisits = analytics.reduce((sum,a)=>sum+a.visitCount,0);

  const uniquePages = new Set(analytics.map(a=>a.pageURL)).size;

  /* Most Visited Page */
  const mostVisited = analytics.sort((a,b)=>b.visitCount-a.visitCount)[0];

  /* Most Active User */
  const userActivityMap = {};
  analytics.forEach(a=>{
    userActivityMap[a.userEmail] =
      (userActivityMap[a.userEmail] || 0) + a.visitCount;
  });

  const mostActiveUser = Object.keys(userActivityMap)
    .sort((a,b)=>userActivityMap[b]-userActivityMap[a])[0];

  container.innerHTML = `
    <div class="card">
      <h3>Total Users Count (As per Akshat Netwrk Hub Analysis)</h3>
      <p>${totalUsers}</p>
    </div>

    <div class="card">
      <h3>Total Visits</h3>
      <p>${totalVisits}</p>
    </div>

    <div class="card">
      <h3>Unique Pages</h3>
      <p>${uniquePages}</p>
    </div>

    <div class="card">
      <h3>Most Visited Page</h3>
      <p>${mostVisited.title}</p>
      <small>${mostVisited.visitCount} visits</small>
    </div>

    <div class="card">
      <h3>Most Active User</h3>
      <p>${mostActiveUser || "N/A"}</p>
    </div>
  `;
}

/* ============================
   USER ACTIVITY TABLE
============================ */
function renderUserActivity(analytics){

  const container = document.getElementById("userActivity");
  if(!container) return;

  if(analytics.length === 0){
    container.innerHTML = "";
    return;
  }

  const grouped = {};

  analytics.forEach(a=>{
    if(!grouped[a.userEmail]){
      grouped[a.userEmail] = [];
    }
    grouped[a.userEmail].push(a);
  });

  let html = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#1e293b;">
          <th style="padding:8px;">User</th>
          <th style="padding:8px;">Page</th>
          <th style="padding:8px;">Visits</th>
          <th style="padding:8px;">Last Visit</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.keys(grouped).forEach(user=>{
    grouped[user].forEach(record=>{
      html += `
        <tr style="border-bottom:1px solid #334155;">
          <td style="padding:8px;">${user}</td>
          <td style="padding:8px;">${record.title}</td>
          <td style="padding:8px;">${record.visitCount}</td>
          <td style="padding:8px;">
            ${new Date(record.lastVisit).toLocaleString()}
          </td>
        </tr>
      `;
    });
  });

  html += "</tbody></table>";

  container.innerHTML = html;
}

})();
