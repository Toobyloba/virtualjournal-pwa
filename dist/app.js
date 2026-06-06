"use strict";(()=>{function U(e){return new Promise((t,n)=>{e.oncomplete=e.onsuccess=()=>t(e.result),e.onabort=e.onerror=()=>n(e.error)})}function et(e,t){let n,r=()=>{if(n)return n;let o=indexedDB.open(e);return o.onupgradeneeded=()=>o.result.createObjectStore(t),n=U(o),n.then(a=>{a.onclose=()=>n=void 0},()=>{}),n};return(o,a)=>r().then(s=>a(s.transaction(t,o).objectStore(t)))}var se;function ae(){return se||(se=et("keyval-store","keyval")),se}function H(e,t=ae()){return t("readonly",n=>U(n.get(e)))}function E(e,t,n=ae()){return n("readwrite",r=>(r.put(t,e),U(r.transaction)))}function _(e,t=ae()){return t("readwrite",n=>(n.delete(e),U(n.transaction)))}var be=window.__GOOGLE_CLIENT_ID__??"YOUR_CLIENT_ID_HERE",he="https://www.googleapis.com/auth/drive.appdata",Ee=window.location.origin+window.location.pathname,Te="glyph-vault.ejson",ke="appDataFolder",K="gd_access_token",ie="gd_token_expiry",j="gd_file_id",le="gd_enabled",b={accessToken:null,expiry:0};async function J(){let e=await H(K),t=await H(ie);e&&t&&Date.now()<t&&(b.accessToken=e,b.expiry=t)}function L(){return!!b.accessToken&&Date.now()<b.expiry-6e4}function tt(){return L()?b.accessToken:null}async function Le(e,t){let n=Date.now()+t*1e3;b.accessToken=e,b.expiry=n,await E(K,e),await E(ie,n)}async function Se(){let e=b.accessToken;b.accessToken=null,b.expiry=0,await _(K),await _(ie),await _(j),await E(le,!1),e&&fetch(`https://oauth2.googleapis.com/revoke?token=${e}`,{method:"POST"}).catch(()=>{})}var V="gd_oauth_state";function z(){let e=crypto.randomUUID();sessionStorage.setItem(V,e);let t=new URLSearchParams({client_id:be,redirect_uri:Ee,response_type:"token",scope:he,state:e,prompt:"consent"});window.location.href=`https://accounts.google.com/o/oauth2/v2/auth?${t}`}async function W(){let e=new URLSearchParams(window.location.hash.replace("#","")),t=e.get("access_token"),n=e.get("expires_in"),r=e.get("state");if(!t||!n)return!1;let o=sessionStorage.getItem(V);return sessionStorage.removeItem(V),r!==o?(console.error("OAuth state mismatch"),!1):(await Le(t,parseInt(n,10)),await E(le,!0),history.replaceState(null,"",window.location.pathname),!0)}function nt(){return new Promise(e=>{let t=crypto.randomUUID();sessionStorage.setItem(V,t);let n=new URLSearchParams({client_id:be,redirect_uri:Ee,response_type:"token",scope:he,state:t,prompt:"none"}),r=document.createElement("iframe");r.style.display="none",r.src=`https://accounts.google.com/o/oauth2/v2/auth?${n}`;let o=setTimeout(()=>{r.remove(),e(!1)},1e4);r.addEventListener("load",async()=>{clearTimeout(o);try{let a=new URLSearchParams((r.contentWindow?.location.hash??"").replace("#","")),s=a.get("access_token"),d=a.get("expires_in"),i=a.get("state");if(s&&d&&i===sessionStorage.getItem(V)){sessionStorage.removeItem(V),await Le(s,parseInt(d,10)),r.remove(),e(!0);return}}catch{}r.remove(),e(!1)}),document.body.appendChild(r)})}async function G(e,t={}){let n=tt();if(!n)throw new Error("Not authenticated with Google Drive");let r=await fetch(e,{...t,headers:{...t.headers??{},Authorization:`Bearer ${n}`}});if(r.status===401)throw await _(K),b.accessToken=null,new Error("DRIVE_AUTH_EXPIRED");if(!r.ok){let o=await r.text().catch(()=>"");throw new Error(`Drive API error ${r.status}: ${o.slice(0,200)}`)}return r}async function xe(){let e=await H(j);if(e)return e;let t=new URLSearchParams({spaces:ke,q:`name = '${Te}'`,fields:"files(id)"}),r=await(await G(`https://www.googleapis.com/drive/v3/files?${t}`)).json();if(r.files.length>0){let o=r.files[0].id;return await E(j,o),o}return null}async function q(){return await H(le)===!0}async function ce(e){let t=new Blob([e],{type:"application/json"}),n=await xe();if(n)await G(`https://www.googleapis.com/upload/drive/v3/files/${n}?uploadType=media`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:t});else{let r=JSON.stringify({name:Te,parents:[ke]}),o=new FormData;o.append("metadata",new Blob([r],{type:"application/json"})),o.append("file",t),n=(await(await G("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",{method:"POST",body:o})).json()).id,await E(j,n)}}async function Y(){let e=await xe();if(!e)throw new Error("No vault found in Google Drive");return(await G(`https://www.googleapis.com/drive/v3/files/${e}?alt=media`)).text()}async function Me(e){if(await q()&&!(!L()&&!await nt()))try{await ce(e)}catch(t){console.warn("[Glyph Drive] upload failed silently:",t)}}var Pe="vaultjournal_verify",He="vaultjournal_settings";async function De(){return(await navigator.storage.getDirectory()).getFileHandle("vault.ejson",{create:!0})}async function m(){try{let n=await(await(await De()).getFile()).text();return n.trim()?JSON.parse(n):null}catch{return null}}async function S(e){let t=JSON.stringify(e),r=await(await De()).createWritable();await r.write(t),await r.close(),q().then(o=>{o&&L()&&ce(t).catch(a=>{console.warn("Drive sync failed:",a.message)})})}async function Ae(){let e=await m();return e!==null&&Array.isArray(e.entries)}async function Ce(e){let t=await m();if(!t)throw new Error("No vault");t.entries.unshift(e),await S(t)}async function qe(e){let t=await m();if(!t)throw new Error("No vault");let n=t.entries.findIndex(r=>r.id===e.id);n!==-1&&(t.entries[n]=e),await S(t)}async function X(e){let t=await m();if(!t)throw new Error("No vault");t.entries=t.entries.filter(n=>n.id!==e),await S(t)}async function Ie(e){let t=await m();if(!t)throw new Error("No vault");t.entries=e,await S(t)}async function T(){return await H(He)??{autoLockSeconds:60,hasVault:!1}}async function $(e){let t=await T();await E(He,{...t,...e})}async function N(e){await E(Pe,e)}async function Z(){return await H(Pe)??null}function F(e){if(typeof e!="object"||e===null)return!1;let t=e;return typeof t.version=="number"&&Array.isArray(t.entries)}var f={password:null,lockTimer:null,autoLockSec:60},de=null;function Re(e){de=e}function I(){return f.password}function Q(){return f.password===null}async function ee(e){let t=await T();f.password=e,f.autoLockSec=t.autoLockSeconds,te()}function x(){f.password=null,f.lockTimer&&clearTimeout(f.lockTimer),f.lockTimer=null,de&&de()}function te(){f.lockTimer&&clearTimeout(f.lockTimer),f.autoLockSec!==0&&(f.lockTimer=setTimeout(x,f.autoLockSec*1e3))}async function Ve(){let e=await T();f.autoLockSec=e.autoLockSeconds}document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&!Q()&&x()});document.addEventListener("pointerdown",()=>{Q()||te()});var ue=null,pe=null;function $e(e,t){pe=e,ue=t,window.addEventListener("hashchange",_e),_e()}async function _e(){if(!ue||!pe)return;let e=await T(),t=location.hash.replace("#","")||"home",[n,r]=t.split("?"),o=new URLSearchParams(r??"");if(!["lock","setup"].includes(n)&&Q()){e.hasVault?location.hash="#lock":location.hash="#setup";return}let s;switch(n){case"setup":s={name:"setup"};break;case"lock":s={name:"lock"};break;case"editor":s={name:"editor",id:o.get("id")??void 0};break;case"entry":s={name:"entry",id:o.get("id")};break;case"settings":s={name:"settings"};break;default:s={name:"home"}}await ue(s,pe)}function p(e){location.hash=e}var Ne=new TextEncoder,rt=new TextDecoder;function ve(e){let t=new Uint8Array(e),n="";for(let r=0;r<t.length;r++)n+=String.fromCharCode(t[r]);return btoa(n)}function me(e){let t=atob(e),n=new Uint8Array(t.length);for(let r=0;r<t.length;r++)n[r]=t.charCodeAt(r);return n.buffer}async function Fe(e,t){let n=await crypto.subtle.importKey("raw",Ne.encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:t,iterations:2e5,hash:"SHA-256"},n,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function M(e,t){let n=crypto.getRandomValues(new Uint8Array(32)),r=crypto.getRandomValues(new Uint8Array(12)),o=await Fe(t,n),a=await crypto.subtle.encrypt({name:"AES-GCM",iv:r},o,Ne.encode(e));return{salt:ve(n.buffer),iv:ve(r.buffer),ciphertext:ve(a),version:1}}async function D(e,t){let n=new Uint8Array(me(e.salt)),r=new Uint8Array(me(e.iv)),o=await Fe(t,n),a=await crypto.subtle.decrypt({name:"AES-GCM",iv:r},o,me(e.ciphertext));return rt.decode(a)}async function ye(e,t,n){let r=await D(e,t);return M(r,n)}async function ne(e,t){try{return await D(e,t),!0}catch{return!1}}function Oe(e){let t=new Date(e),n=new Date,r=(n.getTime()-t.getTime())/1e3;if(r<60)return"Just now";if(r<3600)return`${Math.floor(r/60)}m ago`;if(r<86400)return`${Math.floor(r/3600)}h ago`;let o=t.getFullYear()===n.getFullYear()?{month:"short",day:"numeric"}:{year:"numeric",month:"short",day:"numeric"};return t.toLocaleDateString(void 0,o)}function Be(e){return new Date(e).toLocaleString(void 0,{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}var R=null,fe=null;function v(e,t=2500){R||(R=document.createElement("div"),R.className="toast",document.body.appendChild(R)),R.textContent=e,R.classList.add("show"),fe&&clearTimeout(fe),fe=setTimeout(()=>{R?.classList.remove("show")},t)}function ot(e){let t=0;e.length>=8&&t++,e.length>=12&&t++,/[A-Z]/.test(e)&&/[a-z]/.test(e)&&t++,/[0-9]/.test(e)&&t++,/[^A-Za-z0-9]/.test(e)&&t++,t=Math.min(4,t);let n=["Too short","Weak","Fair","Good","Strong"],r=["#ef4444","#ef4444","#f59e0b","#3b82f6","#22c55e"];return{score:t,label:n[t],color:r[t]}}var Ue=ot;var Ke="glyph_v1_verification_token",je=5,st=30,re=0,Ge=0;async function oe(e,t){await J();let n=await W(),r=await Ae(),o=t??(r?"login":"new");e.innerHTML=`
    <div class="screen">
      <div class="setup-screen-scroll">
        <div class="setup-card">

          <div class="lock-icon" style="text-align:center">\u2726</div>
          <div class="screen-title">Glyph</div>

          <!-- 3 tabs \u2014 always all visible -->
          <div class="setup-tabs">
            <button class="setup-tab${o==="login"?" active":""}" data-tab="login">Unlock</button>
            <button class="setup-tab${o==="restore"?" active":""}" data-tab="restore">Restore</button>
            <button class="setup-tab${o==="new"?" active":""}" data-tab="new">New Vault</button>
          </div>

          <!-- UNLOCK -->
          <div id="panel-login" class="setup-panel${o==="login"?" active":""}">
            <p class="screen-subtitle">Welcome back \u2014 enter your master password.</p>
            <div class="form-group">
              <label class="label" for="login-pwd">Password</label>
              <input id="login-pwd" type="password" class="input"
                placeholder="Master password" autocomplete="current-password">
            </div>
            <div id="login-error" class="error-area"></div>
            <button id="login-btn" class="btn btn-primary">Unlock</button>
          </div>

          <!-- RESTORE -->
          <div id="panel-restore" class="setup-panel${o==="restore"?" active":""}">
            <p class="screen-subtitle">Restore from a <strong>.ejson</strong> backup or Google Drive.</p>

            <div class="restore-source-row">
              <button class="restore-source-btn active" id="src-file">\u{1F4BE} Local file</button>
              <button class="restore-source-btn"        id="src-drive">\u2601\uFE0F Google Drive</button>
            </div>

            <div id="restore-file-section">
              <div class="drop-zone" id="drop-zone">
                Drop .ejson here or <u>browse</u>
                <input type="file" id="file-input" accept=".ejson,.json" style="display:none">
              </div>
              <div id="file-chosen" style="display:none" class="file-chosen-row">
                <span id="file-name"></span>
                <button class="icon-btn" id="file-clear">\u2715</button>
              </div>
            </div>

            <div id="restore-drive-section" style="display:none">
              <div id="drive-status-area"></div>
            </div>

            <div class="form-group">
              <label class="label" for="restore-pwd">Vault password</label>
              <input id="restore-pwd" type="password" class="input"
                placeholder="Password used when vault was created"
                autocomplete="current-password">
            </div>
            <div id="restore-error" class="error-area"></div>
            <button id="restore-btn" class="btn btn-primary">Restore &amp; Unlock</button>
          </div>

          <!-- NEW VAULT -->
          <div id="panel-new" class="setup-panel${o==="new"?" active":""}">
            <p class="screen-subtitle">
              Create a master password to encrypt your journal.
              This cannot be recovered if lost.
            </p>
            <div class="warning-box">
              \u26A0\uFE0F Your password is never stored or sent anywhere. If you forget it, your entries cannot be recovered.
            </div>
            <div class="form-group">
              <label class="label" for="pwd1">Master password</label>
              <input id="pwd1" type="password" class="input"
                placeholder="Min 8 characters" autocomplete="new-password">
              <div class="strength-bar-wrap">
                <div class="strength-bar" id="strength-bar" style="width:0%"></div>
              </div>
              <div class="strength-label" id="strength-label"></div>
            </div>
            <div class="form-group">
              <label class="label" for="pwd2">Confirm password</label>
              <input id="pwd2" type="password" class="input"
                placeholder="Repeat password" autocomplete="new-password">
            </div>
            <div id="new-error" class="error-area"></div>
            <button id="create-btn" class="btn btn-primary">Create Vault</button>
          </div>

        </div>
      </div>
    </div>
  `,at(e),it(e),await lt(e,n),ct(e);let a={login:"#login-pwd",restore:"#restore-pwd",new:"#pwd1"};e.querySelector(a[o])?.focus()}function at(e){let t=e.querySelectorAll(".setup-tab"),n=e.querySelectorAll(".setup-panel");t.forEach(r=>{r.addEventListener("click",()=>{t.forEach(a=>a.classList.remove("active")),n.forEach(a=>a.classList.remove("active")),r.classList.add("active"),e.querySelector(`#panel-${r.dataset.tab}`)?.classList.add("active");let o={login:"#login-pwd",restore:"#restore-pwd",new:"#pwd1"};e.querySelector(o[r.dataset.tab]??"")?.focus()})})}function it(e){let t=e.querySelector("#login-pwd"),n=e.querySelector("#login-btn"),r=e.querySelector("#login-error"),o=()=>{let s=Math.ceil((Ge-Date.now())/1e3);return s>0?(r.innerHTML=`<div class="error-box">Too many attempts. Try again in ${s}s.</div>`,n.disabled=!0,setTimeout(()=>{o()||(r.innerHTML="",n.disabled=!1)},1e3),!0):!1};o();let a=async()=>{if(o())return;let s=t.value.trim();if(s){n.disabled=!0,n.innerHTML='<span class="spinner"></span> Unlocking\u2026',r.innerHTML="";try{let d=await Z();if(!d){e.querySelector('[data-tab="new"]')?.click();return}if(await ne(d,s))re=0,await ee(s),p("#home");else if(re++,t.value="",re>=je)Ge=Date.now()+st*1e3,o();else{let l=je-re;r.innerHTML=`<div class="error-msg">Wrong password \u2014 ${l} attempt${l!==1?"s":""} left.</div>`,n.disabled=!1,n.textContent="Unlock",t.focus()}}catch{r.innerHTML='<div class="error-msg">An error occurred. Try again.</div>',n.disabled=!1,n.textContent="Unlock"}}};n.addEventListener("click",a),t.addEventListener("keydown",s=>{s.key==="Enter"&&a()})}async function lt(e,t){let n=e.querySelector("#src-file"),r=e.querySelector("#src-drive"),o=e.querySelector("#restore-file-section"),a=e.querySelector("#restore-drive-section");n.addEventListener("click",()=>{n.classList.add("active"),r.classList.remove("active"),o.style.display="",a.style.display="none"}),r.addEventListener("click",()=>{r.classList.add("active"),n.classList.remove("active"),a.style.display="",o.style.display="none",dt(e)}),t&&(e.querySelector('[data-tab="restore"]')?.click(),r.click(),v("\u2713 Google Drive connected \u2014 enter your password to restore"));let s=e.querySelector("#drop-zone"),d=e.querySelector("#file-input"),i=e.querySelector("#file-chosen"),l=e.querySelector("#file-name"),y=e.querySelector("#file-clear"),g=null,k=c=>{g=c,l.textContent=c.name,i.style.display="",s.style.display="none"},A=()=>{g=null,d.value="",i.style.display="none",s.style.display=""};s.addEventListener("click",()=>d.click()),d.addEventListener("change",()=>{let c=d.files?.[0];c&&k(c)}),y.addEventListener("click",A),s.addEventListener("dragover",c=>{c.preventDefault(),s.classList.add("drag-over")}),s.addEventListener("dragleave",()=>s.classList.remove("drag-over")),s.addEventListener("drop",c=>{c.preventDefault(),s.classList.remove("drag-over");let w=c.dataTransfer?.files[0];w&&k(w)});let h=e.querySelector("#restore-btn"),u=e.querySelector("#restore-error");h.addEventListener("click",async()=>{u.innerHTML="";let c=e.querySelector("#restore-pwd").value,w=r.classList.contains("active");if(!c){u.innerHTML='<div class="error-msg">Enter the vault password.</div>';return}if(!w&&!g){u.innerHTML='<div class="error-msg">Select a backup file.</div>';return}if(w&&!L()){u.innerHTML='<div class="error-msg">Connect Google Drive first.</div>';return}h.disabled=!0,h.innerHTML='<span class="spinner"></span> Restoring\u2026';try{let P=w?await Y():await g.text(),C=JSON.parse(P);if(!F(C))throw new Error("Not a valid Glyph vault file.");let O=await M(Ke,c);await S(C),await N(O),await $({hasVault:!0}),await ee(c),v("\u2713 Vault restored"),p("#home")}catch(P){u.innerHTML=`<div class="error-msg">${P.message}</div>`,h.disabled=!1,h.textContent="Restore & Unlock"}})}function ct(e){let t=e.querySelector("#pwd1"),n=e.querySelector("#pwd2"),r=e.querySelector("#strength-bar"),o=e.querySelector("#strength-label"),a=e.querySelector("#new-error"),s=e.querySelector("#create-btn");t.addEventListener("input",()=>{let{score:d,label:i,color:l}=Ue(t.value);r.style.width=`${d*25}%`,r.style.background=l,o.textContent=t.value.length?i:""}),s.addEventListener("click",async()=>{a.innerHTML="";let d=t.value,i=n.value;if(d.length<8){a.innerHTML='<div class="error-msg">Password must be at least 8 characters.</div>';return}if(d!==i){a.innerHTML='<div class="error-msg">Passwords do not match.</div>';return}s.disabled=!0,s.innerHTML='<span class="spinner"></span> Creating\u2026';try{let l=await M(Ke,d);await N(l),await $({hasVault:!0}),await ee(d),p("#home")}catch(l){a.innerHTML=`<div class="error-msg">Failed: ${l.message}</div>`,s.disabled=!1,s.textContent="Create Vault"}})}async function dt(e){let t=e.querySelector("#drive-status-area"),n=await q(),r=L();n&&r?t.innerHTML=`
      <div class="drive-status-connected">
        <span style="color:var(--success)">\u25CF Connected to Google Drive</span>
        <span style="color:var(--text-muted);font-size:13px">Encrypted vault will be downloaded from Drive.</span>
      </div>`:(t.innerHTML=`
      <p style="color:var(--text-muted);font-size:13px;line-height:1.6;margin-bottom:8px">
        Connect Google Drive to download your encrypted backup.
      </p>
      <button class="btn btn-secondary" id="setup-drive-connect">Connect Google Drive</button>`,t.querySelector("#setup-drive-connect").addEventListener("click",()=>z()))}async function Je(e){await oe(e,"login")}var ut=()=>window.innerWidth>=768;async function ze(e){ut()?await vt(e):await pt(e)}async function pt(e){e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <span class="topbar-title">Glyph</span>
        <span class="topbar-meta" id="entry-count"></span>
        <button class="icon-btn" id="settings-btn" title="Settings">\u2699\uFE0F</button>
        <button class="icon-btn" id="lock-btn" title="Lock">\u{1F512}</button>
      </div>
      <div class="scroll-area" id="entry-list">
        ${We(3)}
      </div>
      <button class="fab" id="new-btn" title="New entry">\uFF0B</button>
    </div>
  `,e.querySelector("#settings-btn").addEventListener("click",()=>p("#settings")),e.querySelector("#lock-btn").addEventListener("click",()=>{x()}),e.querySelector("#new-btn").addEventListener("click",()=>p("#editor")),await we(e,null)}async function vt(e){e.innerHTML=`
    <div id="sidebar">
      <div class="topbar">
        <span class="topbar-title">Glyph</span>
        <span class="topbar-meta" id="entry-count"></span>
        <button class="fab icon-btn" id="new-btn" title="New entry">\uFF0B</button>
        <button class="icon-btn" id="settings-btn" title="Settings">\u2699\uFE0F</button>
        <button class="icon-btn" id="lock-btn"     title="Lock">\u{1F512}</button>
      </div>
      <div class="scroll-area" id="entry-list">
        ${We(4)}
      </div>
    </div>
    <div id="main-panel">
      <div class="welcome-pane">
        <div class="welcome-icon">\u2726</div>
        <div class="welcome-title">Select an entry</div>
        <div class="welcome-desc">Choose an entry from the list, or create a new one.</div>
        <button class="btn btn-primary" id="welcome-new-btn" style="max-width:220px; margin-top:8px">\uFF0B New Entry</button>
      </div>
    </div>
  `,e.querySelector("#settings-btn").addEventListener("click",()=>p("#settings")),e.querySelector("#lock-btn").addEventListener("click",()=>{x()}),e.querySelector("#new-btn").addEventListener("click",()=>p("#editor")),e.querySelector("#welcome-new-btn").addEventListener("click",()=>p("#editor")),await we(e,null)}async function we(e,t){let n=e.querySelector("#entry-list"),r=e.querySelector("#entry-count"),o=I();if(!o){p("#lock");return}try{let s=(await m())?.entries??[];if(r.textContent=`${s.length} entr${s.length!==1?"ies":"y"}`,s.length===0){n.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">\u2726</div>
          <div class="empty-title">No entries yet</div>
          <div class="empty-desc">Tap + to write your first entry.</div>
        </div>`;return}let d=await Promise.all(s.map(async i=>{try{let l=await D(i.previewPayload,o);return{id:i.id,date:i.createdAt,text:l}}catch{return{id:i.id,date:i.createdAt,text:"[Decryption failed]"}}}));n.innerHTML=d.map(i=>`
      <div class="card${i.id===t?" active":""}" data-id="${i.id}">
        <div class="card-date">${Oe(i.date)}</div>
        <div class="card-preview">${mt(i.text)}</div>
      </div>
    `).join(""),n.querySelectorAll(".card").forEach(i=>{let l=i.dataset.id;i.addEventListener("click",()=>p(`#entry?id=${l}`));let y;i.addEventListener("pointerdown",()=>{y=setTimeout(async()=>{confirm("Delete this entry? This cannot be undone.")&&(await X(l),v("Entry deleted"),await we(e,null))},600)}),i.addEventListener("pointerup",()=>clearTimeout(y)),i.addEventListener("pointerleave",()=>clearTimeout(y))})}catch(a){n.innerHTML=`<div class="error-box">Failed to load entries: ${a.message}</div>`}}function We(e){return Array.from({length:e},()=>`
    <div class="skeleton-card">
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton skeleton-line mid"></div>
    </div>
  `).join("")}function mt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}async function Ye(e,t){e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">\u2190 Back</button>
        <span style="flex:1"></span>
        <span class="save-status unsaved" id="save-status"></span>
      </div>
      <textarea class="editor-textarea" id="editor" placeholder="Start writing\u2026" spellcheck="true"></textarea>
      <div class="editor-meta">
        <span id="word-count">0 words</span>
        <span id="char-count" style="margin-left:auto">0 chars</span>
      </div>
    </div>
  `;let n=e.querySelector("#editor"),r=e.querySelector("#save-status"),o=e.querySelector("#back-btn"),a=e.querySelector("#word-count"),s=e.querySelector("#char-count"),d=I();if(!d){p("#lock");return}let i=!1,l=null,y=t??null;if(t){r.textContent="Loading\u2026";try{let c=(await m())?.entries.find(w=>w.id===t);c&&(n.value=await D(c.payload,d),g(n.value))}catch{r.textContent="Load error"}r.textContent=""}n.focus();function g(u){let c=u.trim()===""?0:u.trim().split(/\s+/).length;a.textContent=`${c} word${c!==1?"s":""}`,s.textContent=`${u.length} char${u.length!==1?"s":""}`}let k=u=>{r.className=`save-status ${u}`,r.textContent=u==="saving"?"\u23F3 Saving\u2026":u==="saved"?"\u2713 Saved":u==="unsaved"?"\u25CF Unsaved":""},A=async()=>{let u=n.value;if(!u.trim())return;let c=I();if(c){k("saving");try{let[w,P]=await Promise.all([M(u,c),M(u.slice(0,120),c)]),C=new Date().toISOString(),O;if(!y)y=crypto.randomUUID(),await Ce({id:y,createdAt:C,updatedAt:C,payload:w,previewPayload:P});else{O=await m();let B=O?.entries.find(Qe=>Qe.id===y);await qe({id:y,createdAt:B?.createdAt??C,updatedAt:C,payload:w,previewPayload:P})}m().then(B=>{B&&Me(JSON.stringify(B)).catch(()=>{})}),k("saved")}catch{k("unsaved")}}};n.addEventListener("input",()=>{i=!0,g(n.value),k("unsaved"),te(),l&&clearTimeout(l),l=setTimeout(async()=>{await A(),i=!1},1500)});let h=async()=>{l&&clearTimeout(l),i&&await A(),p("#home")};o.addEventListener("click",h),window.addEventListener("popstate",h,{once:!0})}async function Xe(e,t){e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">\u2190 Back</button>
        <span style="flex:1"></span>
        <button class="icon-btn" id="edit-btn" title="Edit">\u270F\uFE0F</button>
        <button class="icon-btn danger" id="delete-btn" title="Delete">\u{1F5D1}\uFE0F</button>
      </div>
      <div style="padding: 8px 20px; border-bottom: 1px solid var(--border); flex-shrink:0">
        <div id="entry-date" style="font-size:13px; color: var(--text-faint)"></div>
      </div>
      <div class="entry-body" id="entry-body">
        <div class="skeleton skeleton-line long" style="margin: 20px"></div>
        <div class="skeleton skeleton-line mid"  style="margin: 0 20px 12px"></div>
        <div class="skeleton skeleton-line long" style="margin: 0 20px 12px"></div>
      </div>
    </div>
  `;let n=I();if(!n){p("#lock");return}e.querySelector("#back-btn").addEventListener("click",()=>p("#home")),e.querySelector("#edit-btn").addEventListener("click",()=>p(`#editor?id=${t}`)),e.querySelector("#delete-btn").addEventListener("click",async()=>{confirm("Delete this entry? This cannot be undone.")&&(await X(t),v("Entry deleted"),p("#home"))});try{let o=(await m())?.entries.find(i=>i.id===t);if(!o){p("#home");return}let a=await D(o.payload,n),s=e.querySelector("#entry-date"),d=e.querySelector("#entry-body");s.textContent=Be(o.updatedAt),d.textContent=a}catch(r){let o=e.querySelector("#entry-body");o.innerHTML=`<div class="error-box" style="margin:20px">Failed to decrypt entry: ${r.message}</div>`}}var yt="glyph_v1_verification_token",ft=[{label:"Immediately (30s)",value:30},{label:"1 minute",value:60},{label:"2 minutes",value:120},{label:"5 minutes",value:300},{label:"15 minutes",value:900},{label:"Never",value:0}];async function ge(e){let t=await T();e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">\u2190 Back</button>
        <span class="topbar-title">Settings</span>
      </div>
      <div class="scroll-area">

        <div class="settings-section">
          <div class="settings-section-title">Auto-Lock</div>
          ${ft.map(n=>`
            <div class="settings-row" data-lock="${n.value}">
              <span class="settings-row-label">${n.label}</span>
              <span class="settings-row-check" style="opacity:${t.autoLockSeconds===n.value?1:0}">\u2713</span>
            </div>
          `).join("")}
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Security</div>
          <div class="settings-row" id="change-pwd-row">
            <span class="settings-row-label">Change password</span>
            <span style="color:var(--text-faint)">\u2192</span>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Backup &amp; Restore</div>
          <div class="settings-row" id="export-row">
            <span class="settings-row-label">Export vault</span>
            <span style="color:var(--text-faint)">\u2193</span>
          </div>
          <div class="settings-row" id="import-row">
            <span class="settings-row-label">Import vault</span>
            <span style="color:var(--text-faint)">\u2191</span>
          </div>
        </div>

        <div class="settings-section" id="drive-section">
          <!-- Drive section rendered dynamically -->
        </div>

        <div class="settings-section">
          <div class="settings-section-title">About</div>
          <div class="settings-row" style="cursor:default">
            <span class="settings-row-label">Glyph</span>
            <span style="color:var(--text-faint); font-size:13px">v1.0 PWA</span>
          </div>
        </div>

      </div>
    </div>

    <input type="file" id="import-input" accept=".ejson,.json" style="display:none">
  `,e.querySelector("#back-btn").addEventListener("click",()=>p("#home")),Ze(e),e.querySelectorAll("[data-lock]").forEach(n=>{n.addEventListener("click",async()=>{let r=parseInt(n.dataset.lock);await $({autoLockSeconds:r}),await Ve(),await ge(e)})}),e.querySelector("#change-pwd-row").addEventListener("click",()=>bt(e)),e.querySelector("#export-row").addEventListener("click",()=>wt()),e.querySelector("#import-row").addEventListener("click",()=>{e.querySelector("#import-input").click()}),e.querySelector("#import-input").addEventListener("change",async n=>{let r=n.target.files?.[0];r&&await gt(r)})}async function wt(){try{let e=await m();if(!e){v("No vault to export");return}let t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"});if("showSaveFilePicker"in window)try{let a=await(await window.showSaveFilePicker({suggestedName:"glyph-vault.ejson",types:[{description:"Encrypted Vault",accept:{"application/json":[".ejson",".json"]}}]})).createWritable();await a.write(t),await a.close(),v("Vault exported");return}catch(o){if(o.name==="AbortError")return}let n=URL.createObjectURL(t),r=document.createElement("a");r.href=n,r.download="glyph-vault.ejson",r.click(),setTimeout(()=>URL.revokeObjectURL(n),5e3),v("Vault exported to Downloads")}catch(e){v(`Export failed: ${e.message}`)}}async function gt(e){try{let t=await e.text(),n=JSON.parse(t);if(!F(n)){v("Invalid vault file");return}await S(n),v("Vault imported. Unlock with the backup's password."),x()}catch(t){v(`Import failed: ${t.message}`)}}function bt(e){let t=document.createElement("div");t.className="overlay",t.innerHTML=`
    <div class="modal">
      <div class="modal-title">Change Password</div>
      <div class="form-group">
        <label class="label">Current password</label>
        <input id="cp-current" type="password" class="input" placeholder="Current password" autocomplete="current-password">
      </div>
      <div class="form-group">
        <label class="label">New password</label>
        <input id="cp-new" type="password" class="input" placeholder="New password (min 8 chars)" autocomplete="new-password">
      </div>
      <div class="form-group">
        <label class="label">Confirm new password</label>
        <input id="cp-confirm" type="password" class="input" placeholder="Confirm new password" autocomplete="new-password">
      </div>
      <div id="cp-error" class="error-msg"></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cp-cancel">Cancel</button>
        <button class="btn btn-primary"   id="cp-submit">Change</button>
      </div>
    </div>
  `,document.body.appendChild(t),t.querySelector("#cp-cancel").addEventListener("click",()=>t.remove()),t.querySelector("#cp-submit").addEventListener("click",async()=>{let n=t.querySelector("#cp-current").value,r=t.querySelector("#cp-new").value,o=t.querySelector("#cp-confirm").value,a=t.querySelector("#cp-error"),s=t.querySelector("#cp-submit");if(a.textContent="",r.length<8){a.textContent="New password must be at least 8 characters.";return}if(r!==o){a.textContent="Passwords do not match.";return}let d=await Z();if(!d){a.textContent="No verification token found.";return}if(!await ne(d,n)){a.textContent="Current password is wrong.";return}s.disabled=!0,s.innerHTML='<span class="spinner"></span>';let l=document.createElement("div");l.className="overlay",l.innerHTML=`
      <div class="modal" style="text-align:center; gap:20px">
        <div class="modal-title">Re-encrypting\u2026</div>
        <div class="spinner" style="margin: 0 auto; width:32px; height:32px; border-width:3px"></div>
        <div id="reenc-progress" style="color:var(--text-muted); font-size:14px"></div>
      </div>
    `,document.body.appendChild(l),t.remove();try{let g=(await m())?.entries??[],k=l.querySelector("#reenc-progress"),A=[];for(let u=0;u<g.length;u++){k.textContent=`Entry ${u+1} of ${g.length}`;let c=g[u],[w,P]=await Promise.all([ye(c.payload,n,r),ye(c.previewPayload,n,r)]);A.push({...c,payload:w,previewPayload:P})}await Ie(A);let h=await M(yt,r);await N(h),l.remove(),v("Password changed. Please log in again."),x()}catch(y){l.remove(),v(`Re-encryption failed: ${y.message}`),s.disabled=!1,s.textContent="Change"}}),t.querySelector("#cp-current").focus()}async function Ze(e){let t=e.querySelector("#drive-section"),n=await q(),r=L();!n||!r?(t.innerHTML=`
      <div class="settings-section-title">Google Drive</div>
      <div style="color:var(--text-muted); font-size:14px; margin-bottom:12px; line-height:1.6">
        Automatically back up your encrypted vault to Google Drive after every save.
        Google only sees ciphertext \u2014 your password never leaves this device.
      </div>
      <button class="btn btn-secondary" id="drive-connect-btn" style="margin-bottom:4px">
        Connect Google Drive
      </button>
    `,t.querySelector("#drive-connect-btn").addEventListener("click",()=>z())):(t.innerHTML=`
      <div class="settings-section-title">Google Drive</div>
      <div class="settings-row" style="cursor:default; margin-bottom:2px">
        <span class="settings-row-label">Status</span>
        <span style="color:var(--success); font-size:13px">\u25CF Connected</span>
      </div>
      <div class="settings-row" id="drive-restore-row">
        <span class="settings-row-label">Restore from Drive</span>
        <span style="color:var(--text-faint)">\u2193</span>
      </div>
      <div class="settings-row" id="drive-disconnect-row" style="margin-top:2px">
        <span class="settings-row-label" style="color:var(--danger)">Disconnect Drive</span>
        <span style="color:var(--text-faint)">\u2192</span>
      </div>
    `,t.querySelector("#drive-restore-row").addEventListener("click",async()=>{if(confirm("Replace the local vault with the copy from Google Drive?"))try{let o=await Y(),a=JSON.parse(o);if(!F(a)){v("Invalid vault in Drive");return}await S(a),v("Vault restored from Drive. Please unlock again."),x()}catch(o){v(`Restore failed: ${o.message}`)}}),t.querySelector("#drive-disconnect-row").addEventListener("click",async()=>{confirm("Disconnect Google Drive? Local vault is kept.")&&(await Se(),await Ze(e),v("Google Drive disconnected"))}))}"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(console.error);Re(()=>{p("#setup")});async function ht(e,t){switch(t.innerHTML="",e.name){case"lock":await Je(t);break;case"setup":await oe(t);break;case"home":await ze(t);break;case"editor":await Ye(t,e.id);break;case"entry":await Xe(t,e.id);break;case"settings":await ge(t);break}}async function Et(){await W()||await J();let t=document.getElementById("app"),n=await T();(!location.hash||location.hash==="#"||location.hash==="#lock")&&(location.hash=(n.hasVault,"#setup")),$e(t,ht)}Et().catch(console.error);})();
