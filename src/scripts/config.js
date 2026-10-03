const CONFIG = {
  // Internal adapter address, never fetched over the network.
  STORE_URL: 'https://emr.local/firebase',
  FIREBASE: {
    apiKey: 'AIzaSyCohqQ3ySjCdWKZSujhKF-7XbSiV1bJPX0',
    authDomain: 'mpsreserve.firebaseapp.com',
    projectId: 'mpsreserve',
    storageBucket: 'mpsreserve.firebasestorage.app',
    messagingSenderId: '961426297157',
    appId: '1:961426297157:web:d61df305fd504870782e2c'
  },
  ADMIN_EMAIL: 'jungwookii@gmail.com',
  // Free-only operation: image storage remains disabled by user choice.
  STORAGE_ENABLED: false
};

let cameFromSearch = false;
function triggerFadeIn(el){ if(!el) return; el.classList.remove('animate-fade-in'); void el.offsetWidth; el.classList.add('animate-fade-in'); }

window.goHome = function(){
  ['report-view','deep-report-view','diet-report-view','women-report-view','pain-report-view','sports-report-view','postpartum-report-view'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.classList.remove('active');
  });
  ['app-shell','deep-app-shell','diet-app-shell','women-app-shell','pain-app-shell','sports-app-shell','postpartum-app-shell','search-view','hub-view'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
  const gw=document.getElementById('gateway-view'); gw.style.display='flex'; triggerFadeIn(gw);
};

