(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

  // THEME
  function currentTheme(){ return document.documentElement.getAttribute('data-theme') || 'light'; }
  function setTheme(theme){
    document.documentElement.setAttribute('data-theme',theme);
    localStorage.setItem('theme',theme);
    const logo = $('#logo');
    if(logo) logo.src = (theme==='dark')?logo.dataset.dark:logo.dataset.light;
    const fav = $('#favicon');
    if(fav) fav.href = (theme==='dark')?'logo_D.png':'Logo_L.png';
  }

  // I18N
  const UI = {
    en:{sub:"Open-source projects showcase",search:"Search projects...",hi:"Hi — we are AbikusSudoTM",intro:"We build small, useful open-source tools and utilities. Browse projects below. Click a card to see details, usage notes and repository links.",status:"Status",details:"Details",link:"Open",close:"Close",loading1:"Preparing assets…",loading2:"Fetching project list…"},
    ru:{sub:"Витрина open-source проектов",search:"Поиск проектов...",hi:"Привет — мы AbikusSudoTM",intro:"Мы создаём маленькие и полезные open-source инструменты и утилиты. Ниже — проекты. Нажмите на карточку, чтобы увидеть детали и ссылки.",status:"Статус",details:"Детали",link:"Открыть",close:"Закрыть",loading1:"Подготавливаем ресурсы…",loading2:"Загружаем список проектов…"}
  };

  function getLangFromURL(){const p=new URLSearchParams(location.search);const l=(p.get('lang')||'').toLowerCase();return(l==='ru'||l==='en')?l:'en';}
  let LANG = getLangFromURL();

  function applyUIText(){
    $('#siteSub').textContent=UI[LANG].sub;
    $('#searchInput').placeholder=UI[LANG].search;
    $('#introTitle').textContent=UI[LANG].hi;
    $('#introText').textContent=UI[LANG].intro;
    $('#statusTitle').textContent=UI[LANG].status;
    $('#closeModal').textContent=UI[LANG].close;
  }

  // DATA
  let PROJECTS_DATA = null;
  function normalizeText(val){if(!val)return''; if(typeof val==='string')return val; if(typeof val==='object')return val[LANG]||val.en||Object.values(val)[0]||''; return String(val);}

  function buildCard(name,p){
    const desc=normalizeText(p.desc);
    const stat=normalizeText(p.stat);
    const link=p.link||'#';
    const card=document.createElement('div');
    card.className='card'; card.dataset.project=name;
    card.innerHTML=`<h3>${normalizeText(p.title)||name}</h3><p>${desc}</p><div class="meta">${stat?`<span class="badge">${stat}</span>`:''}<a class="link" href="${link}" target="_blank" rel="noopener">${UI[LANG].link}</a><button class="link" data-action="open" data-project="${name}">${UI[LANG].details}</button></div>`;
    return card;
  }

  function renderProjects(filter=''){
    const wrap=$('#projects'); wrap.innerHTML=''; if(!PROJECTS_DATA)return;
    const list=Array.isArray(PROJECTS_DATA.projects)?PROJECTS_DATA.projects:[];
    const q=filter.trim().toLowerCase();
    list.forEach(name=>{
      const p=PROJECTS_DATA[name]; if(!p)return;
      const title=(normalizeText(p.title)||name).toLowerCase();
      const desc=normalizeText(p.desc).toLowerCase();
      if(q&&!(title.includes(q)||desc.includes(q)))return;
      wrap.appendChild(buildCard(name,p));
    });
    attachModalHandlers();
  }

  function attachModalHandlers(){
    $$('[data-action="open"]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.project)));
  }

  function openModal(key){
    if(!PROJECTS_DATA||!PROJECTS_DATA[key])return;
    const data=PROJECTS_DATA[key];
    const title=normalizeText(data.title)||key;
    const desc=normalizeText(data.desc);
    const stat=normalizeText(data.stat);
    const features=Array.isArray(data.features)?data.features:[];
    const usage=Array.isArray(data.usage)?data.usage:[];
    const links=Array.isArray(data.links)?data.links:[];
    $('#modalContent').innerHTML=`<h3>${title}</h3>${stat?`<span class="badge">${stat}</span>`:''}${desc?`<p>${desc}</p>`:''}${features.length?`<div><strong>${LANG==='ru'?'Функции':'Features'}:</strong><ul>${features.map(f=>`<li>${normalizeText(f)}</li>`).join('')}</ul></div>`:''}${usage.length?`<div><strong>${LANG==='ru'?'Использование':'Usage'}:</strong>${usage.map(u=>`<pre>${normalizeText(u)}</pre>`).join('')}</div>`:''}${links.length?`<div><strong>${LANG==='ru'?'Ссылки':'Links'}:</strong>${links.map(l=>`<a class="link" href="${l.url}" target="_blank">${normalizeText(l.label)}</a>`).join(' ')}</div>`:''}`;
    $('#overlay').classList.add('open'); $('#overlay').setAttribute('aria-hidden','false');
  }

  function closeModal(){const overlay=$('#overlay'); if(!overlay)return; overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); $('#modalContent').innerHTML='';}

  // Loader utils
  function preloadImage(src){return new Promise(res=>{const img=new Image();img.onload=img.onerror=()=>res(src);img.src=src;});}
  function wait(ms){return new Promise(r=>setTimeout(r,ms));}

  async function boot(){
    setTheme(currentTheme());
    if($('#langSelect'))$('#langSelect').value=LANG;
    applyUIText();
    $('#loaderSub').textContent=UI[LANG].loading1;

    const bar=$('#progressBar'); const info=$('#progressInfo');
    let progress=0;
    const tick=setInterval(()=>{progress=Math.min(progress+Math.random()*10,90); if(bar)bar.style.width=progress+'%'; if(info)info.textContent=Math.floor(progress)+'%';},200);

    const real=(async()=>{
      $('#loaderSub').textContent=UI[LANG].loading2;
      const [_,__,data]=await Promise.all([preloadImage('Logo_L.png'),preloadImage('logo_D.png'),fetch('info.json',{cache:'no-store'}).then(r=>r.json())]);
      PROJECTS_DATA=data;
    })();

    const fakeDelay=3000+Math.random()*2000;
    await Promise.all([real,wait(fakeDelay)]);
    clearInterval(tick);
    if(bar) bar.style.width='100%'; if(info) info.textContent='100%';

    renderProjects('');
    $('#projects').classList.add('fade-in');
    $('#loader').classList.add('hide');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if($('#themeBtn'))$('#themeBtn').addEventListener('click',()=>setTheme(currentTheme()==='dark'?'light':'dark'));
    const sel=$('#langSelect'); if(sel) sel.addEventListener('change',()=>{ LANG=sel.value; history.replaceState({},'',new URL(location.href).href); applyUIText(); renderProjects($('#searchInput').value||''); });
    const search=$('#searchInput'); if(search) search.addEventListener('input',e=>renderProjects(e.target.value||''));
    $('#closeModal').addEventListener('click',closeModal);
    $('#overlay').addEventListener('click',e=>{if(e.target.id==='overlay')closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
    boot();
  });
})();