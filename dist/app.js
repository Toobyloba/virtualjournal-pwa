"use strict";(()=>{function O(e){return new Promise((t,n)=>{e.oncomplete=e.onsuccess=()=>t(e.result),e.onabort=e.onerror=()=>n(e.error)})}function ze(e,t){let n,r=()=>{if(n)return n;let s=indexedDB.open(e);return s.onupgradeneeded=()=>s.result.createObjectStore(t),n=O(s),n.then(o=>{o.onclose=()=>n=void 0},()=>{}),n};return(s,o)=>r().then(a=>o(a.transaction(t,s).objectStore(t)))}var te;function ne(){return te||(te=ze("keyval-store","keyval")),te}function q(e,t=ne()){return t("readonly",n=>O(n.get(e)))}function H(e,t,n=ne()){return n("readwrite",r=>(r.put(t,e),O(r.transaction)))}function re(e,t=ne()){return t("readwrite",n=>(n.delete(e),O(n.transaction)))}function we(e){let t=new Date(e),n=new Date,r=(n.getTime()-t.getTime())/1e3;if(r<60)return"Just now";if(r<3600)return`${Math.floor(r/60)}m ago`;if(r<86400)return`${Math.floor(r/3600)}h ago`;let s=t.getFullYear()===n.getFullYear()?{month:"short",day:"numeric"}:{year:"numeric",month:"short",day:"numeric"};return t.toLocaleDateString(void 0,s)}function be(e){let t=new Date(e),n=new Date,r=t.getFullYear()===n.getFullYear()?{month:"short",day:"numeric"}:{year:"numeric",month:"short",day:"numeric"};return t.toLocaleDateString(void 0,r)}function U(e){return new Date(e).toLocaleString(void 0,{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}var V=null,se=null;function v(e,t=2500){V||(V=document.createElement("div"),V.className="toast",document.body.appendChild(V)),V.textContent=e,V.classList.add("show"),se&&clearTimeout(se),se=setTimeout(()=>{V?.classList.remove("show")},t)}function Je(e){let t=0;e.length>=8&&t++,e.length>=12&&t++,/[A-Z]/.test(e)&&/[a-z]/.test(e)&&t++,/[0-9]/.test(e)&&t++,/[^A-Za-z0-9]/.test(e)&&t++,t=Math.min(4,t);let n=["Too short","Weak","Fair","Good","Strong"],r=["#ef4444","#ef4444","#f59e0b","#3b82f6","#22c55e"];return{score:t,label:n[t],color:r[t]}}var ge=Je;var ae="srv_url",oe="srv_api_key",ie="srv_enabled",h={url:"",apiKey:""};async function j(){let e=await q(ae),t=await q(oe);e&&t&&(h.url=e,h.apiKey=t)}function T(){return h.url!==""&&h.apiKey!==""}function Ge(){return T()?h.apiKey:null}async function R(){return await q(ie)===!0}async function _(){return!1}function K(){let e=document.createElement("div");e.className="overlay",e.innerHTML=`
    <div class="modal">
      <div class="modal-title">Connect Server Storage</div>
      <p style="color:var(--text-muted);font-size:14px;line-height:1.6;margin-bottom:8px">
        Your vault is encrypted before upload \u2014 the server only stores ciphertext.
      </p>
      <div class="form-group">
        <label class="label" for="srv-url">Server URL</label>
        <input id="srv-url" type="url" class="input" placeholder="https://your-server.com" autocomplete="url">
      </div>
      <div class="form-group">
        <label class="label" for="srv-key">API Key</label>
        <input id="srv-key" type="password" class="input" placeholder="Your API key" autocomplete="off">
      </div>
      <div id="srv-error" class="error-msg"></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="srv-cancel">Cancel</button>
        <button class="btn btn-primary"   id="srv-connect">Connect</button>
      </div>
    </div>
  `,document.body.appendChild(e),e.querySelector("#srv-cancel").addEventListener("click",()=>e.remove()),e.addEventListener("click",a=>{a.target===e&&e.remove()});let t=e.querySelector("#srv-url"),n=e.querySelector("#srv-key"),r=e.querySelector("#srv-error"),s=e.querySelector("#srv-connect"),o=async()=>{let a=t.value.trim(),c=n.value.trim();if(r.textContent="",!a){r.textContent="Enter a server URL.";return}if(!c){r.textContent="Enter an API key.";return}let i=a.replace(/\/+$/,"");s.disabled=!0,s.innerHTML='<span class="spinner"></span> Testing\u2026';try{let l=await fetch(`${i}/api/vault`,{headers:{Authorization:`Bearer ${c}`}});if(!l.ok&&l.status!==404)throw new Error(`Server returned ${l.status}`);await We(i,c),e.remove(),v("\u2713 Connected to server storage")}catch(l){r.textContent=`Connection failed: ${l.message}`,s.disabled=!1,s.textContent="Connect"}};s.addEventListener("click",o),n.addEventListener("keydown",a=>{a.key==="Enter"&&o()}),t.focus()}async function he(){h.url="",h.apiKey="",await re(ae),await re(oe),await H(ie,!1)}async function Ee(e,t={}){let n=Ge();if(!n)throw new Error("Not connected to server storage");let r=`${h.url}${e}`,s=await fetch(r,{...t,headers:{...t.headers??{},Authorization:`Bearer ${n}`}});if(s.status===401)throw new Error("SERVER_AUTH_EXPIRED");if(!s.ok){let o=await s.text().catch(()=>"");throw new Error(`Server error ${s.status}: ${o.slice(0,200)}`)}return s}async function le(e){await Ee("/api/vault",{method:"PUT",headers:{"Content-Type":"application/json"},body:e})}async function z(){return(await Ee("/api/vault")).text()}async function Le(e){if(await R()&&T())try{await le(e)}catch(t){console.warn("[Glyph Server] upload failed silently:",t)}}async function We(e,t){h.url=e,h.apiKey=t,await H(ae,e),await H(oe,t),await H(ie,!0)}var ke="vaultjournal_verify",Te="vaultjournal_settings";async function Se(){return(await navigator.storage.getDirectory()).getFileHandle("vault.ejson",{create:!0})}async function m(){try{let n=await(await(await Se()).getFile()).text();return n.trim()?JSON.parse(n):null}catch{return null}}async function E(e){let t=JSON.stringify(e),r=await(await Se()).createWritable();await r.write(t),await r.close(),R().then(s=>{s&&T()&&le(t).catch(o=>{console.warn("Server sync failed:",o.message)})})}async function xe(){let e=await m();return e!==null&&Array.isArray(e.entries)}async function Ye(){let e={version:1,createdAt:new Date().toISOString(),entries:[]};await E(e)}async function Me(e){let t=await m();if(t||(await Ye(),t=await m()),!t)throw new Error("Failed to initialise vault");t.entries.unshift(e),await E(t)}async function He(e){let t=await m();if(!t)throw new Error("No vault");let n=t.entries.findIndex(r=>r.id===e.id);n!==-1&&(t.entries[n]=e),await E(t)}async function J(e){let t=await m();if(!t)throw new Error("No vault");t.entries=t.entries.filter(n=>n.id!==e),await E(t)}async function Pe(e){let t=await m();if(!t)throw new Error("No vault");t.entries=e,await E(t)}async function L(){return await q(Te)??{autoLockSeconds:60,hasVault:!1}}async function $(e){let t=await L();await H(Te,{...t,...e})}async function I(e){await H(ke,e)}async function G(){return await q(ke)??null}function F(e){if(typeof e!="object"||e===null)return!1;let t=e;return typeof t.version=="number"&&Array.isArray(t.entries)}var f={password:null,lockTimer:null,autoLockSec:60},ce=null;function Ae(e){ce=e}function D(){return f.password}function W(){return f.password===null}async function Y(e){let t=await L();f.password=e,f.autoLockSec=t.autoLockSeconds,X()}function S(){f.password=null,f.lockTimer&&clearTimeout(f.lockTimer),f.lockTimer=null,ce&&ce()}function X(){f.lockTimer&&clearTimeout(f.lockTimer),f.autoLockSec!==0&&(f.lockTimer=setTimeout(S,f.autoLockSec*1e3))}async function Ce(){let e=await L();f.autoLockSec=e.autoLockSeconds}document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&!W()&&S()});document.addEventListener("pointerdown",()=>{W()||X()});var de=null,ue=null;function Ve(e,t){ue=e,de=t,window.addEventListener("hashchange",qe),qe()}async function qe(){if(!de||!ue)return;let e=await L(),t=location.hash.replace("#","")||"home",[n,r]=t.split("?"),s=new URLSearchParams(r??"");if(!["lock","setup"].includes(n)&&W()){e.hasVault?location.hash="#lock":location.hash="#setup";return}let a;switch(n){case"setup":a={name:"setup"};break;case"lock":a={name:"lock"};break;case"editor":a={name:"editor",id:s.get("id")??void 0};break;case"entry":a={name:"entry",id:s.get("id")};break;case"settings":a={name:"settings"};break;default:a={name:"home"}}await de(a,ue)}function p(e){location.hash=e}var Re=new TextEncoder,Xe=new TextDecoder;function pe(e){let t=new Uint8Array(e),n="";for(let r=0;r<t.length;r++)n+=String.fromCharCode(t[r]);return btoa(n)}function ve(e){let t=atob(e),n=new Uint8Array(t.length);for(let r=0;r<t.length;r++)n[r]=t.charCodeAt(r);return n.buffer}async function De(e,t){let n=await crypto.subtle.importKey("raw",Re.encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:t,iterations:2e5,hash:"SHA-256"},n,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function x(e,t){let n=crypto.getRandomValues(new Uint8Array(32)),r=crypto.getRandomValues(new Uint8Array(12)),s=await De(t,n),o=await crypto.subtle.encrypt({name:"AES-GCM",iv:r},s,Re.encode(e));return{salt:pe(n.buffer),iv:pe(r.buffer),ciphertext:pe(o),version:1}}async function P(e,t){let n=new Uint8Array(ve(e.salt)),r=new Uint8Array(ve(e.iv)),s=await De(t,n),o=await crypto.subtle.decrypt({name:"AES-GCM",iv:r},s,ve(e.ciphertext));return Xe.decode(o)}async function me(e,t,n){let r=await P(e,t);return x(r,n)}async function Z(e,t){try{return await P(e,t),!0}catch{return!1}}var Fe="glyph_v1_verification_token",$e=5,Ze=30,Q=0,Ie=0;async function ee(e,t){await j();let n=await _(),r=await xe(),s=t??(r?"login":"new");e.innerHTML=`
    <div class="screen">
      <div class="setup-screen-scroll">
        <div class="setup-card">

          <div class="lock-icon" style="text-align:center">\u2726</div>
          <div class="screen-title">Glyph</div>

          <!-- 3 tabs \u2014 always all visible -->
          <div class="setup-tabs">
            <button class="setup-tab${s==="login"?" active":""}" data-tab="login">Unlock</button>
            <button class="setup-tab${s==="restore"?" active":""}" data-tab="restore">Restore</button>
            <button class="setup-tab${s==="new"?" active":""}" data-tab="new">New Vault</button>
          </div>

          <!-- UNLOCK -->
          <div id="panel-login" class="setup-panel${s==="login"?" active":""}">
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
          <div id="panel-restore" class="setup-panel${s==="restore"?" active":""}">
            <p class="screen-subtitle">Restore from a <strong>.ejson</strong> backup or remote server.</p>

            <div class="restore-source-row">
              <button class="restore-source-btn active" id="src-file">\u{1F4BE} Local file</button>
              <button class="restore-source-btn"        id="src-drive">\u2601\uFE0F Server</button>
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
          <div id="panel-new" class="setup-panel${s==="new"?" active":""}">
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
  `,Qe(e),et(e),await tt(e,n),nt(e);let o={login:"#login-pwd",restore:"#restore-pwd",new:"#pwd1"};e.querySelector(o[s])?.focus()}function Qe(e){let t=e.querySelectorAll(".setup-tab"),n=e.querySelectorAll(".setup-panel");t.forEach(r=>{r.addEventListener("click",()=>{t.forEach(o=>o.classList.remove("active")),n.forEach(o=>o.classList.remove("active")),r.classList.add("active"),e.querySelector(`#panel-${r.dataset.tab}`)?.classList.add("active");let s={login:"#login-pwd",restore:"#restore-pwd",new:"#pwd1"};e.querySelector(s[r.dataset.tab]??"")?.focus()})})}function et(e){let t=e.querySelector("#login-pwd"),n=e.querySelector("#login-btn"),r=e.querySelector("#login-error"),s=()=>{let a=Math.ceil((Ie-Date.now())/1e3);return a>0?(r.innerHTML=`<div class="error-box">Too many attempts. Try again in ${a}s.</div>`,n.disabled=!0,setTimeout(()=>{s()||(r.innerHTML="",n.disabled=!1)},1e3),!0):!1};s();let o=async()=>{if(s())return;let a=t.value.trim();if(a){n.disabled=!0,n.innerHTML='<span class="spinner"></span> Unlocking\u2026',r.innerHTML="";try{let c=await G();if(!c){e.querySelector('[data-tab="new"]')?.click();return}if(await Z(c,a))Q=0,await Y(a),p("#home");else if(Q++,t.value="",Q>=$e)Ie=Date.now()+Ze*1e3,s();else{let l=$e-Q;r.innerHTML=`<div class="error-msg">Wrong password \u2014 ${l} attempt${l!==1?"s":""} left.</div>`,n.disabled=!1,n.textContent="Unlock",t.focus()}}catch{r.innerHTML='<div class="error-msg">An error occurred. Try again.</div>',n.disabled=!1,n.textContent="Unlock"}}};n.addEventListener("click",o),t.addEventListener("keydown",a=>{a.key==="Enter"&&o()})}async function tt(e,t){let n=e.querySelector("#src-file"),r=e.querySelector("#src-drive"),s=e.querySelector("#restore-file-section"),o=e.querySelector("#restore-drive-section");n.addEventListener("click",()=>{n.classList.add("active"),r.classList.remove("active"),s.style.display="",o.style.display="none"}),r.addEventListener("click",()=>{r.classList.add("active"),n.classList.remove("active"),o.style.display="",s.style.display="none",rt(e)}),t&&(e.querySelector('[data-tab="restore"]')?.click(),r.click(),v("\u2713 Server connected \u2014 enter your password to restore"));let a=e.querySelector("#drop-zone"),c=e.querySelector("#file-input"),i=e.querySelector("#file-chosen"),l=e.querySelector("#file-name"),y=e.querySelector("#file-clear"),b=null,k=d=>{b=d,l.textContent=d.name,i.style.display="",a.style.display="none"},A=()=>{b=null,c.value="",i.style.display="none",a.style.display=""};a.addEventListener("click",()=>c.click()),c.addEventListener("change",()=>{let d=c.files?.[0];d&&k(d)}),y.addEventListener("click",A),a.addEventListener("dragover",d=>{d.preventDefault(),a.classList.add("drag-over")}),a.addEventListener("dragleave",()=>a.classList.remove("drag-over")),a.addEventListener("drop",d=>{d.preventDefault(),a.classList.remove("drag-over");let w=d.dataTransfer?.files[0];w&&k(w)});let g=e.querySelector("#restore-btn"),u=e.querySelector("#restore-error");g.addEventListener("click",async()=>{u.innerHTML="";let d=e.querySelector("#restore-pwd").value,w=r.classList.contains("active");if(!d){u.innerHTML='<div class="error-msg">Enter the vault password.</div>';return}if(!w&&!b){u.innerHTML='<div class="error-msg">Select a backup file.</div>';return}if(w&&!T()){u.innerHTML='<div class="error-msg">Connect server storage first.</div>';return}g.disabled=!0,g.innerHTML='<span class="spinner"></span> Restoring\u2026';try{let M=w?await z():await b.text(),C=JSON.parse(M);if(!F(C))throw new Error("Not a valid Glyph vault file.");let N=await x(Fe,d);await E(C),await I(N),await $({hasVault:!0}),await Y(d),v("\u2713 Vault restored"),p("#home")}catch(M){u.innerHTML=`<div class="error-msg">${M.message}</div>`,g.disabled=!1,g.textContent="Restore & Unlock"}})}function nt(e){let t=e.querySelector("#pwd1"),n=e.querySelector("#pwd2"),r=e.querySelector("#strength-bar"),s=e.querySelector("#strength-label"),o=e.querySelector("#new-error"),a=e.querySelector("#create-btn");t.addEventListener("input",()=>{let{score:c,label:i,color:l}=ge(t.value);r.style.width=`${c*25}%`,r.style.background=l,s.textContent=t.value.length?i:""}),a.addEventListener("click",async()=>{o.innerHTML="";let c=t.value,i=n.value;if(c.length<8){o.innerHTML='<div class="error-msg">Password must be at least 8 characters.</div>';return}if(c!==i){o.innerHTML='<div class="error-msg">Passwords do not match.</div>';return}a.disabled=!0,a.innerHTML='<span class="spinner"></span> Creating\u2026';try{let l=await x(Fe,c);await I(l),await $({hasVault:!0}),await Y(c),p("#home")}catch(l){o.innerHTML=`<div class="error-msg">Failed: ${l.message}</div>`,a.disabled=!1,a.textContent="Create Vault"}})}async function rt(e){let t=e.querySelector("#drive-status-area"),n=await R(),r=T();n&&r?t.innerHTML=`
      <div class="drive-status-connected">
        <span style="color:var(--success)">\u25CF Connected to server storage</span>
        <span style="color:var(--text-muted);font-size:13px">Encrypted vault will be downloaded from server.</span>
      </div>`:(t.innerHTML=`
      <p style="color:var(--text-muted);font-size:13px;line-height:1.6;margin-bottom:8px">
        Connect to your server to download your encrypted backup.
      </p>
      <button class="btn btn-secondary" id="setup-drive-connect">Connect Server</button>`,t.querySelector("#setup-drive-connect").addEventListener("click",()=>K()))}async function Ne(e){await ee(e,"login")}var st=()=>window.innerWidth>=768;async function Be(e){st()?await ot(e):await at(e)}async function at(e){e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <span class="topbar-title">Glyph</span>
        <span class="topbar-meta" id="entry-count"></span>
        <button class="icon-btn" id="settings-btn" title="Settings">\u2699\uFE0F</button>
        <button class="icon-btn" id="lock-btn" title="Lock">\u{1F512}</button>
      </div>
      <div class="scroll-area" id="entry-list">
        ${Oe(3)}
      </div>
      <button class="fab" id="new-btn" title="New entry">\uFF0B</button>
    </div>
  `,e.querySelector("#settings-btn").addEventListener("click",()=>p("#settings")),e.querySelector("#lock-btn").addEventListener("click",()=>{S()}),e.querySelector("#new-btn").addEventListener("click",()=>p("#editor")),await ye(e,null)}async function ot(e){e.innerHTML=`
    <div id="sidebar">
      <div class="topbar">
        <span class="topbar-title">Glyph</span>
        <span class="topbar-meta" id="entry-count"></span>
        <button class="fab icon-btn" id="new-btn" title="New entry">\uFF0B</button>
        <button class="icon-btn" id="settings-btn" title="Settings">\u2699\uFE0F</button>
        <button class="icon-btn" id="lock-btn"     title="Lock">\u{1F512}</button>
      </div>
      <div class="scroll-area" id="entry-list">
        ${Oe(4)}
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
  `,e.querySelector("#settings-btn").addEventListener("click",()=>p("#settings")),e.querySelector("#lock-btn").addEventListener("click",()=>{S()}),e.querySelector("#new-btn").addEventListener("click",()=>p("#editor")),e.querySelector("#welcome-new-btn").addEventListener("click",()=>p("#editor")),await ye(e,null)}async function ye(e,t){let n=e.querySelector("#entry-list"),r=e.querySelector("#entry-count"),s=D();if(!s){p("#lock");return}try{let a=(await m())?.entries??[];if(r.textContent=`${a.length} entr${a.length!==1?"ies":"y"}`,a.length===0){n.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">\u2726</div>
          <div class="empty-title">No entries yet</div>
          <div class="empty-desc">Tap + to write your first entry.</div>
        </div>`;return}let c=await Promise.all(a.map(async i=>{try{let l=await P(i.previewPayload,s);return{id:i.id,createdAt:i.createdAt,updatedAt:i.updatedAt,text:l}}catch{return{id:i.id,createdAt:i.createdAt,updatedAt:i.updatedAt,text:"[Decryption failed]"}}}));n.innerHTML=c.map(i=>`
      <div class="card${i.id===t?" active":""}" data-id="${i.id}">
        <div class="card-date">
          <span class="card-date-relative">${we(i.createdAt)}</span>
          <span class="card-date-full">${be(i.createdAt)}</span>
        </div>
        <div class="card-preview">${it(i.text)}</div>
      </div>
    `).join(""),n.querySelectorAll(".card").forEach(i=>{let l=i.dataset.id;i.addEventListener("click",()=>p(`#entry?id=${l}`));let y;i.addEventListener("pointerdown",()=>{y=setTimeout(async()=>{confirm("Delete this entry? This cannot be undone.")&&(await J(l),v("Entry deleted"),await ye(e,null))},600)}),i.addEventListener("pointerup",()=>clearTimeout(y)),i.addEventListener("pointerleave",()=>clearTimeout(y))})}catch(o){n.innerHTML=`<div class="error-box">Failed to load entries: ${o.message}</div>`}}function Oe(e){return Array.from({length:e},()=>`
    <div class="skeleton-card">
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton skeleton-line mid"></div>
    </div>
  `).join("")}function it(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}async function Ue(e,t){e.innerHTML=`
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
  `;let n=e.querySelector("#editor"),r=e.querySelector("#save-status"),s=e.querySelector("#back-btn"),o=e.querySelector("#word-count"),a=e.querySelector("#char-count"),c=D();if(!c){p("#lock");return}let i=!1,l=null,y=t??null;if(t){r.textContent="Loading\u2026";try{let d=(await m())?.entries.find(w=>w.id===t);d&&(n.value=await P(d.payload,c),b(n.value))}catch{r.textContent="Load error"}r.textContent=""}n.focus();function b(u){let d=u.trim()===""?0:u.trim().split(/\s+/).length;o.textContent=`${d} word${d!==1?"s":""}`,a.textContent=`${u.length} char${u.length!==1?"s":""}`}let k=u=>{r.className=`save-status ${u}`,r.textContent=u==="saving"?"\u23F3 Saving\u2026":u==="saved"?"\u2713 Saved":u==="unsaved"?"\u25CF Unsaved":""},A=async()=>{let u=n.value;if(!u.trim())return;let d=D();if(d){k("saving");try{let[w,M]=await Promise.all([x(u,d),x(u.slice(0,120),d)]),C=new Date().toISOString(),N;if(!y)y=crypto.randomUUID(),await Me({id:y,createdAt:C,updatedAt:C,payload:w,previewPayload:M});else{N=await m();let B=N?.entries.find(Ke=>Ke.id===y);await He({id:y,createdAt:B?.createdAt??C,updatedAt:C,payload:w,previewPayload:M})}m().then(B=>{B&&Le(JSON.stringify(B)).catch(()=>{})}),k("saved")}catch{k("unsaved")}}};n.addEventListener("input",()=>{i=!0,b(n.value),k("unsaved"),X(),l&&clearTimeout(l),l=setTimeout(async()=>{await A(),i=!1},1500)});let g=async()=>{l&&clearTimeout(l),i&&await A(),p("#home")};s.addEventListener("click",g),window.addEventListener("popstate",g,{once:!0})}async function je(e,t){e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">\u2190 Back</button>
        <span style="flex:1"></span>
        <button class="icon-btn" id="edit-btn" title="Edit">\u270F\uFE0F</button>
        <button class="icon-btn danger" id="delete-btn" title="Delete">\u{1F5D1}\uFE0F</button>
      </div>
      <div style="padding: 8px 20px; border-bottom: 1px solid var(--border); flex-shrink:0">
        <div id="entry-date" style="font-size:13px; color: var(--text-faint); display:flex; gap:12px; flex-wrap:wrap"></div>
      </div>
      <div class="entry-body" id="entry-body">
        <div class="skeleton skeleton-line long" style="margin: 20px"></div>
        <div class="skeleton skeleton-line mid"  style="margin: 0 20px 12px"></div>
        <div class="skeleton skeleton-line long" style="margin: 0 20px 12px"></div>
      </div>
    </div>
  `;let n=D();if(!n){p("#lock");return}e.querySelector("#back-btn").addEventListener("click",()=>p("#home")),e.querySelector("#edit-btn").addEventListener("click",()=>p(`#editor?id=${t}`)),e.querySelector("#delete-btn").addEventListener("click",async()=>{confirm("Delete this entry? This cannot be undone.")&&(await J(t),v("Entry deleted"),p("#home"))});try{let s=(await m())?.entries.find(l=>l.id===t);if(!s){p("#home");return}let o=await P(s.payload,n),a=e.querySelector("#entry-date"),c=e.querySelector("#entry-body"),i=s.createdAt.slice(0,10)===s.updatedAt.slice(0,10);a.innerHTML=i?`<span>Created ${U(s.createdAt)}</span>`:`<span>Created ${U(s.createdAt)}</span><span>Edited ${U(s.updatedAt)}</span>`,c.textContent=o}catch(r){let s=e.querySelector("#entry-body");s.innerHTML=`<div class="error-box" style="margin:20px">Failed to decrypt entry: ${r.message}</div>`}}var lt="glyph_v1_verification_token",ct=[{label:"Immediately (30s)",value:30},{label:"1 minute",value:60},{label:"2 minutes",value:120},{label:"5 minutes",value:300},{label:"15 minutes",value:900},{label:"Never",value:0}];async function fe(e){let t=await L();e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">\u2190 Back</button>
        <span class="topbar-title">Settings</span>
      </div>
      <div class="scroll-area">

        <div class="settings-section">
          <div class="settings-section-title">Auto-Lock</div>
          ${ct.map(n=>`
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
  `,e.querySelector("#back-btn").addEventListener("click",()=>p("#home")),_e(e),e.querySelectorAll("[data-lock]").forEach(n=>{n.addEventListener("click",async()=>{let r=parseInt(n.dataset.lock);await $({autoLockSeconds:r}),await Ce(),await fe(e)})}),e.querySelector("#change-pwd-row").addEventListener("click",()=>pt(e)),e.querySelector("#export-row").addEventListener("click",()=>dt()),e.querySelector("#import-row").addEventListener("click",()=>{e.querySelector("#import-input").click()}),e.querySelector("#import-input").addEventListener("change",async n=>{let r=n.target.files?.[0];r&&await ut(r)})}async function dt(){try{let e=await m();if(!e){v("No vault to export");return}let t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"});if("showSaveFilePicker"in window)try{let o=await(await window.showSaveFilePicker({suggestedName:"glyph-vault.ejson",types:[{description:"Encrypted Vault",accept:{"application/json":[".ejson",".json"]}}]})).createWritable();await o.write(t),await o.close(),v("Vault exported");return}catch(s){if(s.name==="AbortError")return}let n=URL.createObjectURL(t),r=document.createElement("a");r.href=n,r.download="glyph-vault.ejson",r.click(),setTimeout(()=>URL.revokeObjectURL(n),5e3),v("Vault exported to Downloads")}catch(e){v(`Export failed: ${e.message}`)}}async function ut(e){try{let t=await e.text(),n=JSON.parse(t);if(!F(n)){v("Invalid vault file");return}await E(n),v("Vault imported. Unlock with the backup's password."),S()}catch(t){v(`Import failed: ${t.message}`)}}function pt(e){let t=document.createElement("div");t.className="overlay",t.innerHTML=`
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
  `,document.body.appendChild(t),t.querySelector("#cp-cancel").addEventListener("click",()=>t.remove()),t.querySelector("#cp-submit").addEventListener("click",async()=>{let n=t.querySelector("#cp-current").value,r=t.querySelector("#cp-new").value,s=t.querySelector("#cp-confirm").value,o=t.querySelector("#cp-error"),a=t.querySelector("#cp-submit");if(o.textContent="",r.length<8){o.textContent="New password must be at least 8 characters.";return}if(r!==s){o.textContent="Passwords do not match.";return}let c=await G();if(!c){o.textContent="No verification token found.";return}if(!await Z(c,n)){o.textContent="Current password is wrong.";return}a.disabled=!0,a.innerHTML='<span class="spinner"></span>';let l=document.createElement("div");l.className="overlay",l.innerHTML=`
      <div class="modal" style="text-align:center; gap:20px">
        <div class="modal-title">Re-encrypting\u2026</div>
        <div class="spinner" style="margin: 0 auto; width:32px; height:32px; border-width:3px"></div>
        <div id="reenc-progress" style="color:var(--text-muted); font-size:14px"></div>
      </div>
    `,document.body.appendChild(l),t.remove();try{let b=(await m())?.entries??[],k=l.querySelector("#reenc-progress"),A=[];for(let u=0;u<b.length;u++){k.textContent=`Entry ${u+1} of ${b.length}`;let d=b[u],[w,M]=await Promise.all([me(d.payload,n,r),me(d.previewPayload,n,r)]);A.push({...d,payload:w,previewPayload:M})}await Pe(A);let g=await x(lt,r);await I(g),l.remove(),v("Password changed. Please log in again."),S()}catch(y){l.remove(),v(`Re-encryption failed: ${y.message}`),a.disabled=!1,a.textContent="Change"}}),t.querySelector("#cp-current").focus()}async function _e(e){let t=e.querySelector("#drive-section"),n=await R(),r=T();!n||!r?(t.innerHTML=`
      <div class="settings-section-title">Server Storage</div>
      <div style="color:var(--text-muted); font-size:14px; margin-bottom:12px; line-height:1.6">
        Automatically back up your encrypted vault to your server after every save.
        The server only sees ciphertext \u2014 your password never leaves this device.
      </div>
      <button class="btn btn-secondary" id="drive-connect-btn" style="margin-bottom:4px">
        Connect Server
      </button>
    `,t.querySelector("#drive-connect-btn").addEventListener("click",()=>K())):(t.innerHTML=`
      <div class="settings-section-title">Server Storage</div>
      <div class="settings-row" style="cursor:default; margin-bottom:2px">
        <span class="settings-row-label">Status</span>
        <span style="color:var(--success); font-size:13px">\u25CF Connected</span>
      </div>
      <div class="settings-row" id="drive-restore-row">
        <span class="settings-row-label">Restore from Server</span>
        <span style="color:var(--text-faint)">\u2193</span>
      </div>
      <div class="settings-row" id="drive-disconnect-row" style="margin-top:2px">
        <span class="settings-row-label" style="color:var(--danger)">Disconnect Server</span>
        <span style="color:var(--text-faint)">\u2192</span>
      </div>
    `,t.querySelector("#drive-restore-row").addEventListener("click",async()=>{if(confirm("Replace the local vault with the copy from the server?"))try{let s=await z(),o=JSON.parse(s);if(!F(o)){v("Invalid vault on server");return}await E(o),v("Vault restored from server. Please unlock again."),S()}catch(s){v(`Restore failed: ${s.message}`)}}),t.querySelector("#drive-disconnect-row").addEventListener("click",async()=>{confirm("Disconnect server storage? Local vault is kept.")&&(await he(),await _e(e),v("Server storage disconnected"))}))}"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(console.error);Ae(()=>{p("#setup")});async function vt(e,t){switch(t.innerHTML="",e.name){case"lock":await Ne(t);break;case"setup":await ee(t);break;case"home":await Be(t);break;case"editor":await Ue(t,e.id);break;case"entry":await je(t,e.id);break;case"settings":await fe(t);break}}async function mt(){await _()||await j();let t=document.getElementById("app"),n=await L();(!location.hash||location.hash==="#"||location.hash==="#lock")&&(location.hash=(n.hasVault,"#setup")),Ve(t,vt)}mt().catch(console.error);})();
