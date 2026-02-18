/* ======================================================
   ANH CHART ENGINE v2.0
   Advanced Visualization Layer
====================================================== */

(function(){

let visitChartInstance = null;
let userChartInstance = null;
let timelineChartInstance = null;

/* ============================================
   MAIN ENTRY FUNCTION
============================================ */
window.ANH_RENDER_CHARTS = function(analytics){

  if(!analytics || analytics.length === 0){
    renderEmptyState();
    return;
  }

  renderPageVisitChart(analytics);
  renderUserActivityChart(analytics);
  renderTimelineChart(analytics);
};

/* ============================================
   EMPTY STATE
============================================ */
function renderEmptyState(){
  const canvas = document.getElementById("visitChart");
  if(canvas){
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px system-ui";
    ctx.fillText("No Analytics Data Available", 20, 50);
  }
}

/* ============================================
   PAGE VISIT BAR CHART
============================================ */
function renderPageVisitChart(analytics){

  const pageMap = {};

  analytics.forEach(a=>{
    pageMap[a.title] = (pageMap[a.title] || 0) + a.visitCount;
  });

  const labels = Object.keys(pageMap);
  const values = Object.values(pageMap);

  const ctx = document.getElementById("visitChart").getContext("2d");

  if(visitChartInstance) visitChartInstance.destroy();

  visitChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Page Visits",
        data: values,
        backgroundColor: "#3b82f6"
      }]
    },
    options: {
      responsive: true,
      plugins:{
        legend:{labels:{color:"#f1f5f9"}}
      },
      scales:{
        x:{ticks:{color:"#f1f5f9"}},
        y:{ticks:{color:"#f1f5f9"}}
      }
    }
  });
}

/* ============================================
   USER ACTIVITY DOUGHNUT
============================================ */
function renderUserActivityChart(analytics){

  const userMap = {};

  analytics.forEach(a=>{
    userMap[a.userEmail] =
      (userMap[a.userEmail] || 0) + a.visitCount;
  });

  const labels = Object.keys(userMap);
  const values = Object.values(userMap);

  const container = document.getElementById("summaryCards");

  const canvas = document.createElement("canvas");
  canvas.id = "userChart";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  if(userChartInstance) userChartInstance.destroy();

  userChartInstance = new Chart(ctx,{
    type:"doughnut",
    data:{
      labels:labels,
      datasets:[{
        data:values,
        backgroundColor:[
          "#3b82f6",
          "#16a34a",
          "#f59e0b",
          "#dc2626",
          "#8b5cf6",
          "#06b6d4"
        ]
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{labels:{color:"#f1f5f9"}}
      }
    }
  });
}

/* ============================================
   TIMELINE LINE CHART
============================================ */
function renderTimelineChart(analytics){

  const timelineMap = {};

  analytics.forEach(a=>{
    const day = new Date(a.lastVisit).toLocaleDateString();
    timelineMap[day] =
      (timelineMap[day] || 0) + a.visitCount;
  });

  const labels = Object.keys(timelineMap);
  const values = Object.values(timelineMap);

  const container = document.createElement("div");
  container.style.marginTop = "40px";

  const canvas = document.createElement("canvas");
  canvas.id = "timelineChart";
  container.appendChild(canvas);

  document.body.appendChild(container);

  const ctx = canvas.getContext("2d");

  if(timelineChartInstance) timelineChartInstance.destroy();

  timelineChartInstance = new Chart(ctx,{
    type:"line",
    data:{
      labels:labels,
      datasets:[{
        label:"Daily Activity",
        data:values,
        borderColor:"#3b82f6",
        backgroundColor:"rgba(59,130,246,0.2)",
        tension:0.3
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{labels:{color:"#f1f5f9"}}
      },
      scales:{
        x:{ticks:{color:"#f1f5f9"}},
        y:{ticks:{color:"#f1f5f9"}}
      }
    }
  });
}
})();
