/* =====================================================
   ANH SCRIPTO ENGINE v2.0
   6-Second Permission-Based Metadata Collector
===================================================== */

(function(){

/* ============================
   ANTI-DOUBLE INJECTION GUARD
============================ */
if(window.__ANH_SCRIPTO_ACTIVE__) return;
window.__ANH_SCRIPTO_ACTIVE__ = true;

/* ============================
   CONFIGURATION
============================ */
const DELAY = 6000;

/* ============================
   SAFE EXECUTION AFTER DOM READY
============================ */
function ready(fn){
  if(document.readyState !== "loading"){
    fn();
  }else{
    document.addEventListener("DOMContentLoaded", fn);
  }
}

/* ============================
   MAIN EXECUTION
============================ */
ready(function(){

  setTimeout(function(){

    /* ============================
       REQUIRE url_Id
    ============================= */
    if(typeof url_Id === "undefined" || !url_Id){
      console.warn("Scripto Blocked: url_Id not defined.");
      return;
    }

    /* ============================
       REQUIRE COLLECTOR
    ============================= */
    if(typeof ANH_COLLECT !== "function"){
      console.warn("Collector not available.");
      return;
    }

    /* ============================
       SESSION VALIDATION
    ============================= */
    const activeUser = sessionStorage.getItem("ANH_ACTIVE_USER");
    const expiry = sessionStorage.getItem("ANH_SESSION_EXPIRY");

    if(!activeUser || !expiry || Date.now() > parseInt(expiry)){
      console.warn("Scripto blocked: No active session.");
      return;
    }

    /* ============================
       METADATA EXTRACTION
    ============================= */

    const metadata = {
      url_Id: url_Id,
      pageURL: window.location.href,
      title: extractTitle(),
      description: extractDescription(),
      logo: extractLogo()
    };

    /* ============================
       SEND TO COLLECTOR
    ============================= */
    ANH_COLLECT(metadata);

  }, DELAY);

});

/* ============================
   METADATA HELPERS
============================ */

function extractTitle(){
  return document.title || "Untitled Page";
}

function extractDescription(){

  const metaDesc =
    document.querySelector("meta[name='description']") ||
    document.querySelector("meta[property='og:description']");

  return metaDesc ? metaDesc.content : "";
}

function extractLogo(){

  /* 1️⃣ OG Image */
  const og =
    document.querySelector("meta[property='og:image']");

  if(og && og.content) return og.content;

  /* 2️⃣ Favicon */
  const favicon =
    document.querySelector("link[rel*='icon']");

  if(favicon && favicon.href) return favicon.href;

  /* 3️⃣ First Large Image Fallback */
  const images = document.images;

  for(let i=0;i<images.length;i++){
    if(images[i].naturalWidth > 100 && images[i].naturalHeight > 100){
      return images[i].src;
    }
  }

  return "";
}

})();
