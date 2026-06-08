"use strict";(()=>{var nt=Object.defineProperty;var O=(e,t)=>()=>(e&&(t=e(e=0)),t);var st=(e,t)=>{for(var r in t)nt(e,r,{get:t[r],enumerable:!0})};function X(e){return new Promise((t,r)=>{e.oncomplete=e.onsuccess=()=>t(e.result),e.onabort=e.onerror=()=>r(e.error)})}function at(e,t){let r,n=()=>{if(r)return r;let s=indexedDB.open(e);return s.onupgradeneeded=()=>s.result.createObjectStore(t),r=X(s),r.then(o=>{o.onclose=()=>r=void 0},()=>{}),r};return(s,o)=>n().then(a=>o(a.transaction(t,s).objectStore(t)))}function de(){return ce||(ce=at("keyval-store","keyval")),ce}function I(e,t=de()){return t("readonly",r=>X(r.get(e)))}function M(e,t,r=de()){return r("readwrite",n=>(n.put(t,e),X(n.transaction)))}function Z(e,t=de()){return t("readwrite",r=>(r.delete(e),X(r.transaction)))}var ce,ue=O(()=>{});function xe(e){let t=new Date(e),r=new Date,n=(r.getTime()-t.getTime())/1e3;if(n<60)return"Just now";if(n<3600)return`${Math.floor(n/60)}m ago`;if(n<86400)return`${Math.floor(n/3600)}h ago`;let s=t.getFullYear()===r.getFullYear()?{month:"short",day:"numeric"}:{year:"numeric",month:"short",day:"numeric"};return t.toLocaleDateString(void 0,s)}function Me(e){let t=new Date(e),r=new Date,n=t.getFullYear()===r.getFullYear()?{month:"short",day:"numeric"}:{year:"numeric",month:"short",day:"numeric"};return t.toLocaleDateString(void 0,n)}function Q(e){return new Date(e).toLocaleString(void 0,{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}function y(e,t=2500){$||($=document.createElement("div"),$.className="toast",document.body.appendChild($)),$.textContent=e,$.classList.add("show"),pe&&clearTimeout(pe),pe=setTimeout(()=>{$?.classList.remove("show")},t)}function ot(e){let t=0;e.length>=8&&t++,e.length>=12&&t++,/[A-Z]/.test(e)&&/[a-z]/.test(e)&&t++,/[0-9]/.test(e)&&t++,/[^A-Za-z0-9]/.test(e)&&t++,t=Math.min(4,t);let r=["Too short","Weak","Fair","Good","Strong"],n=["#ef4444","#ef4444","#f59e0b","#3b82f6","#22c55e"];return{score:t,label:r[t],color:n[t]}}var $,pe,He,q=O(()=>{"use strict";$=null,pe=null;He=ot});function ve(e){let t=new Uint8Array(e),r="";for(let n=0;n<t.length;n++)r+=String.fromCharCode(t[n]);return btoa(r)}function ye(e){let t=atob(e),r=new Uint8Array(t.length);for(let n=0;n<t.length;n++)r[n]=t.charCodeAt(n);return r.buffer}async function Ae(e,t){let r=await crypto.subtle.importKey("raw",Pe.encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:t,iterations:21e4,hash:"SHA-256"},r,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function g(e,t){let r=crypto.getRandomValues(new Uint8Array(32)),n=crypto.getRandomValues(new Uint8Array(12)),s=await Ae(t,r),o=await crypto.subtle.encrypt({name:"AES-GCM",iv:n},s,Pe.encode(e));return{salt:ve(r.buffer),iv:ve(n.buffer),ciphertext:ve(o),version:1}}async function E(e,t){if(e.version<1)throw new Error(`Unsupported payload version ${e.version} (min 1)`);let r=new Uint8Array(ye(e.salt)),n=new Uint8Array(ye(e.iv)),s=await Ae(t,r),o=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},s,ye(e.ciphertext));return it.decode(o)}async function me(e,t,r){let n=await E(e,t);return g(n,r)}async function ee(e,t){try{return await E(e,t),!0}catch{return!1}}var Pe,it,K=O(()=>{"use strict";Pe=new TextEncoder,it=new TextDecoder});async function te(){let e=await I(fe),t=await I(B);e&&(v.url=e,v.encryptedKey=t??null)}async function Ce(e){if(v.encryptedKey)try{v.apiKey=await E(v.encryptedKey,e)}catch{v.apiKey=""}}function qe(){v.apiKey=""}async function Ve(e,t){if(v.encryptedKey)try{let r=await E(v.encryptedKey,e);v.encryptedKey=await g(r,t),await M(B,v.encryptedKey),v.apiKey=r}catch{v.encryptedKey=null,v.apiKey="",await Z(B)}}function H(){return v.url!==""&&v.apiKey!==""}function lt(){return H()?v.apiKey:null}async function N(){return await I(we)===!0}async function re(){return!1}function ne(){let e=document.createElement("div");e.className="overlay",e.innerHTML=`
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
  `,document.body.appendChild(e),e.querySelector("#srv-cancel").addEventListener("click",()=>e.remove()),e.addEventListener("click",a=>{a.target===e&&e.remove()});let t=e.querySelector("#srv-url"),r=e.querySelector("#srv-key"),n=e.querySelector("#srv-error"),s=e.querySelector("#srv-connect"),o=async()=>{let a=t.value.trim(),c=r.value.trim();if(n.textContent="",!a){n.textContent="Enter a server URL.";return}if(!c){n.textContent="Enter an API key.";return}let i=a.replace(/\/+$/,"");if(!i.startsWith("https://")){n.textContent="Server URL must use HTTPS.";return}s.disabled=!0,s.innerHTML='<span class="spinner"></span> Testing\u2026';try{let l=await fetch(`${i}/api/vault`,{headers:{Authorization:`Bearer ${c}`}});if(!l.ok&&l.status!==404)throw new Error(`Server returned ${l.status}`);await ct(i,c),e.remove(),y("\u2713 Connected to server storage")}catch(l){n.textContent=`Connection failed: ${l.message}`,s.disabled=!1,s.textContent="Connect"}};s.addEventListener("click",o),r.addEventListener("keydown",a=>{a.key==="Enter"&&o()}),t.focus()}async function Re(){v.url="",v.apiKey="",v.encryptedKey=null,await Z(fe),await Z(B),await M(we,!1)}async function De(e,t={}){let r=lt();if(!r)throw new Error("Not connected to server storage");let n=`${v.url}${e}`,s=await fetch(n,{...t,headers:{...t.headers??{},Authorization:`Bearer ${r}`}});if(s.status===401)throw new Error("SERVER_AUTH_EXPIRED");if(!s.ok){let o=await s.text().catch(()=>"");throw new Error(`Server error ${s.status}: ${o.slice(0,200)}`)}return s}async function be(e){await De("/api/vault",{method:"PUT",headers:{"Content-Type":"application/json"},body:e})}async function se(){return(await De("/api/vault")).text()}async function Ie(e){if(await N()&&H())try{await be(e)}catch(t){console.warn("[Glyph Server] upload failed silently:",t)}}async function ct(e,t){v.url=e,v.apiKey=t;let{getPassword:r}=await Promise.resolve().then(()=>(P(),$e)),n=r();if(n){let s=await g(t,n);v.encryptedKey=s,await M(B,s)}await M(fe,e),await M(we,!0)}var fe,B,we,v,F=O(()=>{"use strict";ue();q();K();fe="srv_url",B="srv_encrypted_key",we="srv_enabled",v={url:"",apiKey:"",encryptedKey:null}});async function Fe(){return(await navigator.storage.getDirectory()).getFileHandle("vault.ejson",{create:!0})}async function m(){try{let r=await(await(await Fe()).getFile()).text();return r.trim()?JSON.parse(r):null}catch{return null}}async function k(e){let t=JSON.stringify(e),n=await(await Fe()).createWritable();await n.write(t),await n.close(),N().then(s=>{s&&H()&&be(t).catch(o=>{console.warn("Server sync failed:",o.message)})})}async function Oe(){let e=await m();return e!==null&&Array.isArray(e.entries)}async function dt(){let e={version:1,createdAt:new Date().toISOString(),entries:[]};await k(e)}async function Be(e){let t=await m();if(t||(await dt(),t=await m()),!t)throw new Error("Failed to initialise vault");t.entries.unshift(e),await k(t)}async function Ue(e){let t=await m();if(!t)throw new Error("No vault");let r=t.entries.findIndex(n=>n.id===e.id);r!==-1&&(t.entries[r]=e),await k(t)}async function ae(e){let t=await m();if(!t)throw new Error("No vault");t.entries=t.entries.filter(r=>r.id!==e),await k(t)}async function je(e){let t=await m();if(!t)throw new Error("No vault");t.entries=e,await k(t)}async function T(){return await I(Ne)??{autoLockSeconds:60,hasVault:!1}}async function U(e){let t=await T();await M(Ne,{...t,...e})}async function j(e){await M(Ke,e)}async function oe(){return await I(Ke)??null}function _(e){if(typeof e!="object"||e===null)return!1;let t=e;return typeof t.version!="number"||!Array.isArray(t.entries)?!1:t.entries.every(r=>{if(typeof r!="object"||r===null)return!1;let n=r;return typeof n.id=="string"&&typeof n.createdAt=="string"&&typeof n.updatedAt=="string"&&typeof n.payload=="object"&&n.payload!==null&&typeof n.previewPayload=="object"&&n.previewPayload!==null})}var Ke,Ne,A=O(()=>{"use strict";ue();F();Ke="vaultjournal_verify",Ne="vaultjournal_settings"});var $e={};st($e,{getPassword:()=>V,isLocked:()=>z,lock:()=>S,onLock:()=>he,refreshAutoLockSec:()=>Ee,resetAutoLockTimer:()=>G,unlock:()=>J});function he(e){ge=e}function V(){return w.password}function z(){return w.password===null}async function J(e){let t=await T();w.password=e,w.autoLockSec=t.autoLockSeconds,G(),Ce(e).catch(()=>{})}function S(){w.password=null,w.lockTimer&&clearTimeout(w.lockTimer),w.lockTimer=null,qe(),ge&&ge()}function G(){w.lockTimer&&clearTimeout(w.lockTimer),w.autoLockSec!==0&&(w.lockTimer=setTimeout(S,w.autoLockSec*1e3))}async function Ee(){let e=await T();w.autoLockSec=e.autoLockSeconds}var w,ge,P=O(()=>{"use strict";A();F();w={password:null,lockTimer:null,autoLockSec:60},ge=null;document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&!z()&&S()});document.addEventListener("pointerdown",()=>{z()||G()})});P();A();var Le=null,ke=null;function ze(e,t){ke=e,Le=t,window.addEventListener("hashchange",_e),_e()}async function _e(){if(!Le||!ke)return;let e=await T(),t=location.hash.replace("#","")||"home",[r,n]=t.split("?"),s=new URLSearchParams(n??"");if(!["lock","setup"].includes(r)&&z()){e.hasVault?location.hash="#lock":location.hash="#setup";return}let a;switch(r){case"setup":a={name:"setup"};break;case"lock":a={name:"lock"};break;case"editor":a={name:"editor",id:s.get("id")??void 0};break;case"entry":a={name:"entry",id:s.get("id")};break;case"settings":a={name:"settings"};break;default:a={name:"home"}}await Le(a,ke)}function p(e){location.hash=e}P();A();F();A();K();P();q();F();var We="glyph_v1_verification_token",Je=5,ut=30,ie=0,Ge=0;async function le(e,t){await te();let r=await re(),n=await Oe(),s=t??(n?"login":"new");e.innerHTML=`
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
  `,pt(e),vt(e),await yt(e,r),mt(e);let o={login:"#login-pwd",restore:"#restore-pwd",new:"#pwd1"};e.querySelector(o[s])?.focus()}function pt(e){let t=e.querySelectorAll(".setup-tab"),r=e.querySelectorAll(".setup-panel");t.forEach(n=>{n.addEventListener("click",()=>{t.forEach(o=>o.classList.remove("active")),r.forEach(o=>o.classList.remove("active")),n.classList.add("active"),e.querySelector(`#panel-${n.dataset.tab}`)?.classList.add("active");let s={login:"#login-pwd",restore:"#restore-pwd",new:"#pwd1"};e.querySelector(s[n.dataset.tab]??"")?.focus()})})}function vt(e){let t=e.querySelector("#login-pwd"),r=e.querySelector("#login-btn"),n=e.querySelector("#login-error"),s=()=>{let a=Math.ceil((Ge-Date.now())/1e3);return a>0?(n.innerHTML=`<div class="error-box">Too many attempts. Try again in ${a}s.</div>`,r.disabled=!0,setTimeout(()=>{s()||(n.innerHTML="",r.disabled=!1)},1e3),!0):!1};s();let o=async()=>{if(s())return;let a=t.value.trim();if(a){r.disabled=!0,r.innerHTML='<span class="spinner"></span> Unlocking\u2026',n.innerHTML="";try{let c=await oe();if(!c){e.querySelector('[data-tab="new"]')?.click();return}if(await ee(c,a))ie=0,await J(a),p("#home");else if(ie++,t.value="",ie>=Je)Ge=Date.now()+ut*1e3,s();else{let l=Je-ie;n.innerHTML=`<div class="error-msg">Wrong password \u2014 ${l} attempt${l!==1?"s":""} left.</div>`,r.disabled=!1,r.textContent="Unlock",t.focus()}}catch{n.innerHTML='<div class="error-msg">An error occurred. Try again.</div>',r.disabled=!1,r.textContent="Unlock"}}};r.addEventListener("click",o),t.addEventListener("keydown",a=>{a.key==="Enter"&&o()})}async function yt(e,t){let r=e.querySelector("#src-file"),n=e.querySelector("#src-drive"),s=e.querySelector("#restore-file-section"),o=e.querySelector("#restore-drive-section");r.addEventListener("click",()=>{r.classList.add("active"),n.classList.remove("active"),s.style.display="",o.style.display="none"}),n.addEventListener("click",()=>{n.classList.add("active"),r.classList.remove("active"),o.style.display="",s.style.display="none",ft(e)}),t&&(e.querySelector('[data-tab="restore"]')?.click(),n.click(),y("\u2713 Server connected \u2014 enter your password to restore"));let a=e.querySelector("#drop-zone"),c=e.querySelector("#file-input"),i=e.querySelector("#file-chosen"),l=e.querySelector("#file-name"),f=e.querySelector("#file-clear"),h=null,x=d=>{h=d,l.textContent=d.name,i.style.display="",a.style.display="none"},R=()=>{h=null,c.value="",i.style.display="none",a.style.display=""};a.addEventListener("click",()=>c.click()),c.addEventListener("change",()=>{let d=c.files?.[0];d&&x(d)}),f.addEventListener("click",R),a.addEventListener("dragover",d=>{d.preventDefault(),a.classList.add("drag-over")}),a.addEventListener("dragleave",()=>a.classList.remove("drag-over")),a.addEventListener("drop",d=>{d.preventDefault(),a.classList.remove("drag-over");let b=d.dataTransfer?.files[0];b&&x(b)});let L=e.querySelector("#restore-btn"),u=e.querySelector("#restore-error");L.addEventListener("click",async()=>{u.innerHTML="";let d=e.querySelector("#restore-pwd").value,b=n.classList.contains("active");if(!d){u.innerHTML='<div class="error-msg">Enter the vault password.</div>';return}if(!b&&!h){u.innerHTML='<div class="error-msg">Select a backup file.</div>';return}if(b&&!H()){u.innerHTML='<div class="error-msg">Connect server storage first.</div>';return}L.disabled=!0,L.innerHTML='<span class="spinner"></span> Restoring\u2026';try{let C=b?await se():await h.text(),D=JSON.parse(C);if(!_(D))throw new Error("Not a valid Glyph vault file.");let W=await g(We,d);await k(D),await j(W),await U({hasVault:!0}),await J(d),y("\u2713 Vault restored"),p("#home")}catch(C){u.innerHTML=`<div class="error-msg">${C.message}</div>`,L.disabled=!1,L.textContent="Restore & Unlock"}})}function mt(e){let t=e.querySelector("#pwd1"),r=e.querySelector("#pwd2"),n=e.querySelector("#strength-bar"),s=e.querySelector("#strength-label"),o=e.querySelector("#new-error"),a=e.querySelector("#create-btn");t.addEventListener("input",()=>{let{score:c,label:i,color:l}=He(t.value);n.style.width=`${c*25}%`,n.style.background=l,s.textContent=t.value.length?i:""}),a.addEventListener("click",async()=>{o.innerHTML="";let c=t.value,i=r.value;if(c.length<8){o.innerHTML='<div class="error-msg">Password must be at least 8 characters.</div>';return}if(c!==i){o.innerHTML='<div class="error-msg">Passwords do not match.</div>';return}a.disabled=!0,a.innerHTML='<span class="spinner"></span> Creating\u2026';try{let l=await g(We,c);await j(l),await U({hasVault:!0}),await J(c),p("#home")}catch(l){o.innerHTML=`<div class="error-msg">Failed: ${l.message}</div>`,a.disabled=!1,a.textContent="Create Vault"}})}async function ft(e){let t=e.querySelector("#drive-status-area"),r=await N(),n=H();r&&n?t.innerHTML=`
      <div class="drive-status-connected">
        <span style="color:var(--success)">\u25CF Connected to server storage</span>
        <span style="color:var(--text-muted);font-size:13px">Encrypted vault will be downloaded from server.</span>
      </div>`:(t.innerHTML=`
      <p style="color:var(--text-muted);font-size:13px;line-height:1.6;margin-bottom:8px">
        Connect to your server to download your encrypted backup.
      </p>
      <button class="btn btn-secondary" id="setup-drive-connect">Connect Server</button>`,t.querySelector("#setup-drive-connect").addEventListener("click",()=>ne()))}async function Ye(e){await le(e,"login")}A();K();P();q();q();var wt=()=>window.innerWidth>=768;async function Xe(e){wt()?await gt(e):await bt(e)}async function bt(e){e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <span class="topbar-title">Glyph</span>
        <span class="topbar-meta" id="entry-count"></span>
        <button class="icon-btn" id="settings-btn" title="Settings">\u2699\uFE0F</button>
        <button class="icon-btn" id="lock-btn" title="Lock">\u{1F512}</button>
      </div>
      <div class="scroll-area" id="entry-list">
        ${Ze(3)}
      </div>
      <button class="fab" id="new-btn" title="New entry">\uFF0B</button>
    </div>
  `,e.querySelector("#settings-btn").addEventListener("click",()=>p("#settings")),e.querySelector("#lock-btn").addEventListener("click",()=>{S()}),e.querySelector("#new-btn").addEventListener("click",()=>p("#editor")),await Te(e,null)}async function gt(e){e.innerHTML=`
    <div id="sidebar">
      <div class="topbar">
        <span class="topbar-title">Glyph</span>
        <span class="topbar-meta" id="entry-count"></span>
        <button class="fab icon-btn" id="new-btn" title="New entry">\uFF0B</button>
        <button class="icon-btn" id="settings-btn" title="Settings">\u2699\uFE0F</button>
        <button class="icon-btn" id="lock-btn"     title="Lock">\u{1F512}</button>
      </div>
      <div class="scroll-area" id="entry-list">
        ${Ze(4)}
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
  `,e.querySelector("#settings-btn").addEventListener("click",()=>p("#settings")),e.querySelector("#lock-btn").addEventListener("click",()=>{S()}),e.querySelector("#new-btn").addEventListener("click",()=>p("#editor")),e.querySelector("#welcome-new-btn").addEventListener("click",()=>p("#editor")),await Te(e,null)}async function Te(e,t){let r=e.querySelector("#entry-list"),n=e.querySelector("#entry-count"),s=V();if(!s){p("#lock");return}try{let a=(await m())?.entries??[];if(n.textContent=`${a.length} entr${a.length!==1?"ies":"y"}`,a.length===0){r.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">\u2726</div>
          <div class="empty-title">No entries yet</div>
          <div class="empty-desc">Tap + to write your first entry.</div>
        </div>`;return}let c=await Promise.all(a.map(async i=>{try{let l=await E(i.previewPayload,s);return{id:i.id,createdAt:i.createdAt,updatedAt:i.updatedAt,text:l}}catch{return{id:i.id,createdAt:i.createdAt,updatedAt:i.updatedAt,text:"[Decryption failed]"}}}));r.innerHTML=c.map(i=>`
      <div class="card${i.id===t?" active":""}" data-id="${i.id}">
        <div class="card-date">
          <span class="card-date-relative">${xe(i.createdAt)}</span>
          <span class="card-date-full">${Me(i.createdAt)}</span>
        </div>
        <div class="card-preview">${ht(i.text)}</div>
      </div>
    `).join(""),r.querySelectorAll(".card").forEach(i=>{let l=i.dataset.id;i.addEventListener("click",()=>p(`#entry?id=${l}`));let f;i.addEventListener("pointerdown",()=>{f=setTimeout(async()=>{confirm("Delete this entry? This cannot be undone.")&&(await ae(l),y("Entry deleted"),await Te(e,null))},600)}),i.addEventListener("pointerup",()=>clearTimeout(f)),i.addEventListener("pointerleave",()=>clearTimeout(f))})}catch(o){r.innerHTML=`<div class="error-box">Failed to load entries: ${o.message}</div>`}}function Ze(e){return Array.from({length:e},()=>`
    <div class="skeleton-card">
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton skeleton-line mid"></div>
    </div>
  `).join("")}function ht(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}A();K();P();F();async function Qe(e,t){e.innerHTML=`
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
  `;let r=e.querySelector("#editor"),n=e.querySelector("#save-status"),s=e.querySelector("#back-btn"),o=e.querySelector("#word-count"),a=e.querySelector("#char-count"),c=V();if(!c){p("#lock");return}let i=!1,l=null,f=t??null;if(t){n.textContent="Loading\u2026";try{let d=(await m())?.entries.find(b=>b.id===t);d&&(r.value=await E(d.payload,c),h(r.value))}catch{n.textContent="Load error"}n.textContent=""}r.focus();function h(u){let d=u.trim()===""?0:u.trim().split(/\s+/).length;o.textContent=`${d} word${d!==1?"s":""}`,a.textContent=`${u.length} char${u.length!==1?"s":""}`}let x=u=>{n.className=`save-status ${u}`,n.textContent=u==="saving"?"\u23F3 Saving\u2026":u==="saved"?"\u2713 Saved":u==="unsaved"?"\u25CF Unsaved":""},R=async()=>{let u=r.value;if(!u.trim())return;let d=V();if(d){x("saving");try{let[b,C]=await Promise.all([g(u,d),g(u.slice(0,120),d)]),D=new Date().toISOString(),W;if(!f)f=crypto.randomUUID(),await Be({id:f,createdAt:D,updatedAt:D,payload:b,previewPayload:C});else{W=await m();let Y=W?.entries.find(rt=>rt.id===f);await Ue({id:f,createdAt:Y?.createdAt??D,updatedAt:D,payload:b,previewPayload:C})}m().then(Y=>{Y&&Ie(JSON.stringify(Y)).catch(()=>{})}),x("saved")}catch{x("unsaved")}}};r.addEventListener("input",()=>{i=!0,h(r.value),x("unsaved"),G(),l&&clearTimeout(l),l=setTimeout(async()=>{await R(),i=!1},1500)});let L=async()=>{l&&clearTimeout(l),i&&await R(),p("#home")};s.addEventListener("click",L),window.addEventListener("popstate",L,{once:!0})}A();K();P();q();q();async function et(e,t){e.innerHTML=`
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
  `;let r=V();if(!r){p("#lock");return}e.querySelector("#back-btn").addEventListener("click",()=>p("#home")),e.querySelector("#edit-btn").addEventListener("click",()=>p(`#editor?id=${t}`)),e.querySelector("#delete-btn").addEventListener("click",async()=>{confirm("Delete this entry? This cannot be undone.")&&(await ae(t),y("Entry deleted"),p("#home"))});try{let s=(await m())?.entries.find(l=>l.id===t);if(!s){p("#home");return}let o=await E(s.payload,r),a=e.querySelector("#entry-date"),c=e.querySelector("#entry-body"),i=s.createdAt.slice(0,10)===s.updatedAt.slice(0,10);a.innerHTML=i?`<span>Created ${Q(s.createdAt)}</span>`:`<span>Created ${Q(s.createdAt)}</span><span>Edited ${Q(s.updatedAt)}</span>`,c.textContent=o}catch(n){let s=e.querySelector("#entry-body");s.innerHTML=`<div class="error-box" style="margin:20px">Failed to decrypt entry: ${n.message}</div>`}}A();K();P();q();F();var Et="glyph_v1_verification_token",Lt=[{label:"Immediately (30s)",value:30},{label:"1 minute",value:60},{label:"2 minutes",value:120},{label:"5 minutes",value:300},{label:"15 minutes",value:900},{label:"Never",value:0}];async function Se(e){let t=await T();e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">\u2190 Back</button>
        <span class="topbar-title">Settings</span>
      </div>
      <div class="scroll-area">

        <div class="settings-section">
          <div class="settings-section-title">Auto-Lock</div>
          ${Lt.map(r=>`
            <div class="settings-row" data-lock="${r.value}">
              <span class="settings-row-label">${r.label}</span>
              <span class="settings-row-check" style="opacity:${t.autoLockSeconds===r.value?1:0}">\u2713</span>
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
  `,e.querySelector("#back-btn").addEventListener("click",()=>p("#home")),tt(e),e.querySelectorAll("[data-lock]").forEach(r=>{r.addEventListener("click",async()=>{let n=parseInt(r.dataset.lock);await U({autoLockSeconds:n}),await Ee(),await Se(e)})}),e.querySelector("#change-pwd-row").addEventListener("click",()=>St(e)),e.querySelector("#export-row").addEventListener("click",()=>kt()),e.querySelector("#import-row").addEventListener("click",()=>{e.querySelector("#import-input").click()}),e.querySelector("#import-input").addEventListener("change",async r=>{let n=r.target.files?.[0];n&&await Tt(n)})}async function kt(){try{let e=await m();if(!e){y("No vault to export");return}let t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"});if("showSaveFilePicker"in window)try{let o=await(await window.showSaveFilePicker({suggestedName:"glyph-vault.ejson",types:[{description:"Encrypted Vault",accept:{"application/json":[".ejson",".json"]}}]})).createWritable();await o.write(t),await o.close(),y("Vault exported");return}catch(s){if(s.name==="AbortError")return}let r=URL.createObjectURL(t),n=document.createElement("a");n.href=r,n.download="glyph-vault.ejson",n.click(),setTimeout(()=>URL.revokeObjectURL(r),5e3),y("Vault exported to Downloads")}catch(e){y(`Export failed: ${e.message}`)}}async function Tt(e){try{let t=await e.text(),r=JSON.parse(t);if(!_(r)){y("Invalid vault file");return}await k(r),y("Vault imported. Unlock with the backup's password."),S()}catch(t){y(`Import failed: ${t.message}`)}}function St(e){let t=document.createElement("div");t.className="overlay",t.innerHTML=`
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
  `,document.body.appendChild(t),t.querySelector("#cp-cancel").addEventListener("click",()=>t.remove()),t.querySelector("#cp-submit").addEventListener("click",async()=>{let r=t.querySelector("#cp-current").value,n=t.querySelector("#cp-new").value,s=t.querySelector("#cp-confirm").value,o=t.querySelector("#cp-error"),a=t.querySelector("#cp-submit");if(o.textContent="",n.length<8){o.textContent="New password must be at least 8 characters.";return}if(n!==s){o.textContent="Passwords do not match.";return}let c=await oe();if(!c){o.textContent="No verification token found.";return}if(!await ee(c,r)){o.textContent="Current password is wrong.";return}a.disabled=!0,a.innerHTML='<span class="spinner"></span>';let l=document.createElement("div");l.className="overlay",l.innerHTML=`
      <div class="modal" style="text-align:center; gap:20px">
        <div class="modal-title">Re-encrypting\u2026</div>
        <div class="spinner" style="margin: 0 auto; width:32px; height:32px; border-width:3px"></div>
        <div id="reenc-progress" style="color:var(--text-muted); font-size:14px"></div>
      </div>
    `,document.body.appendChild(l),t.remove();try{let h=(await m())?.entries??[],x=l.querySelector("#reenc-progress"),R=[];for(let u=0;u<h.length;u++){x.textContent=`Entry ${u+1} of ${h.length}`;let d=h[u],[b,C]=await Promise.all([me(d.payload,r,n),me(d.previewPayload,r,n)]);R.push({...d,payload:b,previewPayload:C})}await je(R);let L=await g(Et,n);await j(L),await Ve(r,n),l.remove(),y("Password changed. Please log in again."),S()}catch(f){l.remove(),y(`Re-encryption failed: ${f.message}`),a.disabled=!1,a.textContent="Change"}}),t.querySelector("#cp-current").focus()}async function tt(e){let t=e.querySelector("#drive-section"),r=await N(),n=H();!r||!n?(t.innerHTML=`
      <div class="settings-section-title">Server Storage</div>
      <div style="color:var(--text-muted); font-size:14px; margin-bottom:12px; line-height:1.6">
        Automatically back up your encrypted vault to your server after every save.
        The server only sees ciphertext \u2014 your password never leaves this device.
      </div>
      <button class="btn btn-secondary" id="drive-connect-btn" style="margin-bottom:4px">
        Connect Server
      </button>
    `,t.querySelector("#drive-connect-btn").addEventListener("click",()=>ne())):(t.innerHTML=`
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
    `,t.querySelector("#drive-restore-row").addEventListener("click",async()=>{if(confirm("Replace the local vault with the copy from the server?"))try{let s=await se(),o=JSON.parse(s);if(!_(o)){y("Invalid vault on server");return}await k(o),y("Vault restored from server. Please unlock again."),S()}catch(s){y(`Restore failed: ${s.message}`)}}),t.querySelector("#drive-disconnect-row").addEventListener("click",async()=>{confirm("Disconnect server storage? Local vault is kept.")&&(await Re(),await tt(e),y("Server storage disconnected"))}))}"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(console.error);he(()=>{p("#setup")});async function xt(e,t){switch(t.innerHTML="",e.name){case"lock":await Ye(t);break;case"setup":await le(t);break;case"home":await Xe(t);break;case"editor":await Qe(t,e.id);break;case"entry":await et(t,e.id);break;case"settings":await Se(t);break}}async function Mt(){await re()||await te();let t=document.getElementById("app"),r=await T();(!location.hash||location.hash==="#"||location.hash==="#lock")&&(location.hash=(r.hasVault,"#setup")),ze(t,xt)}Mt().catch(console.error);})();
