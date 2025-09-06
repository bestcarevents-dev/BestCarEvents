(function(){
  try{
    var m = window.__autoTranslateEnhance;
    if(m) return;
    window.__autoTranslateEnhance = true;
    var cookie = document.cookie.split('; ').find(r=>r.startsWith('NEXT_LOCALE='));
    var locale = cookie ? decodeURIComponent(cookie.split('=')[1]) : 'en';
    if(locale==='en') return;
    fetch('/api/translate/cache',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({locale:locale,defaultLocale:'en',texts:Array.from(new Set(Array.from(document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT).toArray?[]:[])))}),
    }).catch(function(){});
  }catch(e){}
})();


