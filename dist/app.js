"use strict";(()=>{function I(e){return new Promise((t,n)=>{e.oncomplete=e.onsuccess=()=>t(e.result),e.onabort=e.onerror=()=>n(e.error)})}function Be(e,t){let n,r=()=>{if(n)return n;let o=indexedDB.open(e);return o.onupgradeneeded=()=>o.result.createObjectStore(t),n=I(o),n.then(a=>{a.onclose=()=>n=void 0},()=>{}),n};return(o,a)=>r().then(s=>a(s.transaction(t,o).objectStore(t)))}var z;function Y(){return z||(z=Be("keyval-store","keyval")),z}function E(e,t=Y()){return t("readonly",n=>I(n.get(e)))}function w(e,t,n=Y()){return n("readwrite",r=>(r.put(t,e),I(r.transaction)))}function C(e,t=Y()){return t("readwrite",n=>(n.delete(e),I(n.transaction)))}var Ge=window.__GOOGLE_CLIENT_ID__??"YOUR_CLIENT_ID_HERE",Ke="https://www.googleapis.com/auth/drive.appdata",Je=window.location.origin+window.location.pathname,ce="vault.ejson",de="appDataFolder",R="gd_access_token",Z="gd_token_expiry",V="gd_file_id",Q="gd_enabled",f={accessToken:null,expiry:0};async function ue(){let e=await E(R),t=await E(Z);e&&t&&Date.now()<t&&(f.accessToken=e,f.expiry=t)}function D(){return!!f.accessToken&&Date.now()<f.expiry-6e4}function We(){return D()?f.accessToken:null}async function ze(e,t){let n=Date.now()+t*1e3;f.accessToken=e,f.expiry=n,await w(R,e),await w(Z,n)}async function pe(){let e=f.accessToken;f.accessToken=null,f.expiry=0,await C(R),await C(Z),await C(V),await w(Q,!1),e&&fetch(`https://oauth2.googleapis.com/revoke?token=${e}`,{method:"POST"}).catch(()=>{})}var X="gd_oauth_state";function me(){let e=crypto.randomUUID();sessionStorage.setItem(X,e);let t=new URLSearchParams({client_id:Ge,redirect_uri:Je,response_type:"token",scope:Ke,state:e,prompt:"consent"});window.location.href=`https://accounts.google.com/o/oauth2/v2/auth?${t}`}async function ve(){let e=new URLSearchParams(window.location.hash.replace("#","")),t=e.get("access_token"),n=e.get("expires_in"),r=e.get("state");if(!t||!n)return!1;let o=sessionStorage.getItem(X);return sessionStorage.removeItem(X),r!==o?(console.error("OAuth state mismatch \u2014 possible CSRF"),!1):(await ze(t,parseInt(n,10)),await w(Q,!0),history.replaceState(null,"",window.location.pathname),!0)}async function _(e,t={}){let n=We();if(!n)throw new Error("Not authenticated with Google Drive");let r=await fetch(e,{...t,headers:{...t.headers??{},Authorization:`Bearer ${n}`}});if(r.status===401)throw await C(R),f.accessToken=null,new Error("DRIVE_AUTH_EXPIRED");if(!r.ok){let o=await r.text().catch(()=>"");throw new Error(`Drive API error ${r.status}: ${o.slice(0,200)}`)}return r}async function ye(){let e=await E(V);if(e)return e;let t=new URLSearchParams({spaces:de,q:`name = '${ce}'`,fields:"files(id)"}),r=await(await _(`https://www.googleapis.com/drive/v3/files?${t}`)).json();if(r.files.length>0){let o=r.files[0].id;return await w(V,o),o}return null}async function q(){return await E(Q)===!0}async function fe(e){let t=new Blob([e],{type:"application/json"}),n=await ye();if(n)await _(`https://www.googleapis.com/upload/drive/v3/files/${n}?uploadType=media`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:t});else{let r=JSON.stringify({name:ce,parents:[de]}),o=new FormData;o.append("metadata",new Blob([r],{type:"application/json"})),o.append("file",t),n=(await(await _("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",{method:"POST",body:o})).json()).id,await w(V,n)}}async function we(){let e=await ye();if(!e)throw new Error("No vault found in Google Drive");return(await _(`https://www.googleapis.com/drive/v3/files/${e}?alt=media`)).text()}var ge="vaultjournal_verify",he="vaultjournal_settings";async function be(){return(await navigator.storage.getDirectory()).getFileHandle("vault.ejson",{create:!0})}async function p(){try{let n=await(await(await be()).getFile()).text();return n.trim()?JSON.parse(n):null}catch{return null}}async function b(e){let t=JSON.stringify(e),r=await(await be()).createWritable();await r.write(t),await r.close(),q().then(o=>{o&&D()&&fe(t).catch(a=>{console.warn("Drive sync failed:",a.message)})})}async function ke(){let e={version:1,createdAt:new Date().toISOString(),entries:[]};await b(e)}async function Ee(e){let t=await p();if(!t)throw new Error("No vault");t.entries.unshift(e),await b(t)}async function Te(e){let t=await p();if(!t)throw new Error("No vault");let n=t.entries.findIndex(r=>r.id===e.id);n!==-1&&(t.entries[n]=e),await b(t)}async function N(e){let t=await p();if(!t)throw new Error("No vault");t.entries=t.entries.filter(n=>n.id!==e),await b(t)}async function xe(e){let t=await p();if(!t)throw new Error("No vault");t.entries=e,await b(t)}async function g(){return await E(he)??{autoLockSeconds:60,hasVault:!1}}async function F(e){let t=await g();await w(he,{...t,...e})}async function O(e){await w(ge,e)}async function $(){return await E(ge)??null}function j(e){if(typeof e!="object"||e===null)return!1;let t=e;return typeof t.version=="number"&&Array.isArray(t.entries)}var m={password:null,lockTimer:null,autoLockSec:60},ee=null;function Le(e){ee=e}function P(){return m.password}function U(){return m.password===null}async function B(e){let t=await g();m.password=e,m.autoLockSec=t.autoLockSeconds,G()}function T(){m.password=null,m.lockTimer&&clearTimeout(m.lockTimer),m.lockTimer=null,ee&&ee()}function G(){m.lockTimer&&clearTimeout(m.lockTimer),m.autoLockSec!==0&&(m.lockTimer=setTimeout(T,m.autoLockSec*1e3))}async function Se(){let e=await g();m.autoLockSec=e.autoLockSeconds}document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&!U()&&T()});document.addEventListener("pointerdown",()=>{U()||G()});var te=null,ne=null;function Me(e,t){ne=e,te=t,window.addEventListener("hashchange",Pe),Pe()}async function Pe(){if(!te||!ne)return;let e=await g(),t=location.hash.replace("#","")||"home",[n,r]=t.split("?"),o=new URLSearchParams(r??"");if(!["lock","setup"].includes(n)&&U()){e.hasVault?location.hash="#lock":location.hash="#setup";return}let s;switch(n){case"setup":s={name:"setup"};break;case"lock":s={name:"lock"};break;case"editor":s={name:"editor",id:o.get("id")??void 0};break;case"entry":s={name:"entry",id:o.get("id")};break;case"settings":s={name:"settings"};break;default:s={name:"home"}}await te(s,ne)}function c(e){location.hash=e}var Ae=new TextEncoder,Ye=new TextDecoder;function re(e){let t=new Uint8Array(e),n="";for(let r=0;r<t.length;r++)n+=String.fromCharCode(t[r]);return btoa(n)}function oe(e){let t=atob(e),n=new Uint8Array(t.length);for(let r=0;r<t.length;r++)n[r]=t.charCodeAt(r);return n.buffer}async function He(e,t){let n=await crypto.subtle.importKey("raw",Ae.encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:t,iterations:2e5,hash:"SHA-256"},n,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function x(e,t){let n=crypto.getRandomValues(new Uint8Array(32)),r=crypto.getRandomValues(new Uint8Array(12)),o=await He(t,n),a=await crypto.subtle.encrypt({name:"AES-GCM",iv:r},o,Ae.encode(e));return{salt:re(n.buffer),iv:re(r.buffer),ciphertext:re(a),version:1}}async function L(e,t){let n=new Uint8Array(oe(e.salt)),r=new Uint8Array(oe(e.iv)),o=await He(t,n),a=await crypto.subtle.decrypt({name:"AES-GCM",iv:r},o,oe(e.ciphertext));return Ye.decode(a)}async function ae(e,t,n){let r=await L(e,t);return x(r,n)}async function K(e,t){try{return await L(e,t),!0}catch{return!1}}var Ce=5,Xe=30,J=0,De=0;async function Ie(e){e.innerHTML=`
    <div class="screen">
      <div class="center-screen" style="padding-bottom: calc(32px + env(safe-area-inset-bottom))">
        <div class="lock-icon">\u{1F512}</div>
        <div class="screen-title">VaultJournal</div>
        <div class="screen-subtitle">Enter your password to unlock</div>

        <div class="form-group">
          <input id="pwd-input" type="password" class="input" placeholder="Password" autocomplete="current-password">
        </div>

        <div id="error-area"></div>

        <button id="unlock-btn" class="btn btn-primary">Unlock</button>
      </div>
    </div>
  `;let t=e.querySelector("#pwd-input"),n=e.querySelector("#unlock-btn"),r=e.querySelector("#error-area");t.focus();let o=()=>{let s=Math.ceil((De-Date.now())/1e3);return s>0?(r.innerHTML=`<div class="error-box">Too many failed attempts. Wait ${s}s.</div>`,n.disabled=!0,setTimeout(o,1e3),!0):(n.disabled=!1,!1)};if(o())return;let a=async()=>{if(o())return;let s=t.value.trim();if(s){n.disabled=!0,n.textContent="Unlocking\u2026";try{let i=await $();if(!i){c("#setup");return}if(await K(i,s))J=0,await B(s),c("#home");else if(J++,t.value="",J>=Ce)De=Date.now()+Xe*1e3,o();else{let d=Ce-J;r.innerHTML=`<div class="error-msg">Wrong password. ${d} attempt${d!==1?"s":""} left.</div>`,n.disabled=!1,n.textContent="Unlock",t.focus()}}catch{r.innerHTML='<div class="error-msg">An error occurred. Please try again.</div>',n.disabled=!1,n.textContent="Unlock"}}};n.addEventListener("click",a),t.addEventListener("keydown",s=>{s.key==="Enter"&&a()})}function Ve(e){let t=new Date(e),n=new Date,r=(n.getTime()-t.getTime())/1e3;if(r<60)return"Just now";if(r<3600)return`${Math.floor(r/60)}m ago`;if(r<86400)return`${Math.floor(r/3600)}h ago`;let o=t.getFullYear()===n.getFullYear()?{month:"short",day:"numeric"}:{year:"numeric",month:"short",day:"numeric"};return t.toLocaleDateString(void 0,o)}function _e(e){return new Date(e).toLocaleString(void 0,{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}var M=null,se=null;function u(e,t=2500){M||(M=document.createElement("div"),M.className="toast",document.body.appendChild(M)),M.textContent=e,M.classList.add("show"),se&&clearTimeout(se),se=setTimeout(()=>{M?.classList.remove("show")},t)}function Re(e){let t=0;e.length>=8&&t++,e.length>=12&&t++,/[A-Z]/.test(e)&&/[a-z]/.test(e)&&t++,/[0-9]/.test(e)&&t++,/[^A-Za-z0-9]/.test(e)&&t++,t=Math.min(4,t);let n=["Too short","Weak","Fair","Good","Strong"],r=["#ef4444","#ef4444","#f59e0b","#3b82f6","#22c55e"];return{score:t,label:n[t],color:r[t]}}var Ze="vaultjournal_v1_verification_token";function qe(e){e.innerHTML=`
    <div class="screen">
      <div class="center-screen" style="padding-bottom: calc(32px + env(safe-area-inset-bottom)); overflow-y: auto; justify-content: flex-start; padding-top: calc(48px + env(safe-area-inset-top))">
        <div class="lock-icon">\u{1F4D3}</div>
        <div class="screen-title">Create Vault</div>
        <div class="screen-subtitle">Set a strong password. It encrypts everything.</div>

        <div class="warning-box">
          \u26A0\uFE0F This password cannot be recovered. If you forget it, your entries are permanently lost. Write it down somewhere safe.
        </div>

        <div class="form-group">
          <label class="label" for="pwd1">Password</label>
          <input id="pwd1" type="password" class="input" placeholder="Choose a password" autocomplete="new-password">
          <div class="strength-bar-wrap"><div class="strength-bar" id="str-bar" style="width:0%"></div></div>
          <div class="strength-label" id="str-label"></div>
        </div>

        <div class="form-group">
          <label class="label" for="pwd2">Confirm password</label>
          <input id="pwd2" type="password" class="input" placeholder="Confirm password" autocomplete="new-password">
        </div>

        <div id="error-area"></div>

        <button id="create-btn" class="btn btn-primary">Create Vault</button>
      </div>
    </div>
  `;let t=e.querySelector("#pwd1"),n=e.querySelector("#pwd2"),r=e.querySelector("#str-bar"),o=e.querySelector("#str-label"),a=e.querySelector("#error-area"),s=e.querySelector("#create-btn");t.addEventListener("input",()=>{let{score:l,label:d,color:v}=Re(t.value);r.style.width=`${l/4*100}%`,r.style.background=v,o.style.color=v,o.textContent=t.value?d:""});let i=async()=>{let l=t.value,d=n.value;if(a.innerHTML="",l.length<8){a.innerHTML='<div class="error-msg">Password must be at least 8 characters.</div>';return}if(l!==d){a.innerHTML='<div class="error-msg">Passwords do not match.</div>';return}s.disabled=!0,s.innerHTML='<span class="spinner"></span> Creating vault\u2026';try{await ke();let v=await x(Ze,l);await O(v),await F({autoLockSeconds:60,hasVault:!0}),await B(l),c("#home")}catch(v){a.innerHTML=`<div class="error-msg">Failed to create vault: ${v.message}</div>`,s.disabled=!1,s.textContent="Create Vault"}};s.addEventListener("click",i),n.addEventListener("keydown",l=>{l.key==="Enter"&&i()}),t.focus()}async function Ne(e){e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <span class="topbar-title">Journal</span>
        <span class="topbar-meta" id="entry-count"></span>
        <button class="icon-btn" id="settings-btn" title="Settings">\u2699\uFE0F</button>
        <button class="icon-btn" id="lock-btn" title="Lock">\u{1F512}</button>
      </div>
      <div class="scroll-area" id="entry-list">
        ${Qe(3)}
      </div>
      <button class="fab" id="new-btn" title="New entry">\uFF0B</button>
    </div>
  `,e.querySelector("#settings-btn").addEventListener("click",()=>c("#settings")),e.querySelector("#lock-btn").addEventListener("click",()=>{T()}),e.querySelector("#new-btn").addEventListener("click",()=>c("#editor")),await Fe(e)}function Qe(e){return Array.from({length:e},()=>`
    <div class="skeleton-card">
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton skeleton-line mid"></div>
    </div>
  `).join("")}async function Fe(e){let t=e.querySelector("#entry-list"),n=e.querySelector("#entry-count"),r=P();if(!r){c("#lock");return}try{let a=(await p())?.entries??[];if(n.textContent=`${a.length} entr${a.length!==1?"ies":"y"}`,a.length===0){t.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">\u{1F4D3}</div>
          <div class="empty-title">No entries yet</div>
          <div class="empty-desc">Tap + to write your first entry. Everything is encrypted.</div>
        </div>`;return}let s=await Promise.all(a.map(async i=>{try{let l=await L(i.previewPayload,r);return{id:i.id,date:i.createdAt,text:l}}catch{return{id:i.id,date:i.createdAt,text:"[Decryption failed]"}}}));t.innerHTML=s.map(i=>`
      <div class="card" data-id="${i.id}">
        <div class="card-date">${Ve(i.date)}</div>
        <div class="card-preview">${et(i.text)}</div>
      </div>
    `).join(""),t.querySelectorAll(".card").forEach(i=>{let l=i.dataset.id;i.addEventListener("click",()=>c(`#entry?id=${l}`));let d;i.addEventListener("pointerdown",()=>{d=setTimeout(async()=>{confirm("Delete this entry? This cannot be undone.")&&(await N(l),u("Entry deleted"),await Fe(e))},600)}),i.addEventListener("pointerup",()=>clearTimeout(d)),i.addEventListener("pointerleave",()=>clearTimeout(d))})}catch(o){t.innerHTML=`<div class="error-box">Failed to load entries: ${o.message}</div>`}}function et(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}async function Oe(e,t){e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">\u2190 Back</button>
        <span style="flex:1"></span>
        <span class="save-status unsaved" id="save-status"></span>
      </div>
      <textarea class="editor-textarea" id="editor" placeholder="Start writing\u2026" spellcheck="true"></textarea>
    </div>
  `;let n=e.querySelector("#editor"),r=e.querySelector("#save-status"),o=e.querySelector("#back-btn"),a=P();if(!a){c("#lock");return}let s=!1,i=null,l=t??null;if(t){r.textContent="Loading\u2026";try{let h=(await p())?.entries.find(H=>H.id===t);h&&(n.value=await L(h.payload,a))}catch{r.textContent="Load error"}r.textContent=""}n.focus();let d=y=>{r.className=`save-status ${y}`,r.textContent=y==="saving"?"\u23F3 Saving\u2026":y==="saved"?"\u2713 Saved":y==="unsaved"?"\u25CF Unsaved":""},v=async()=>{let y=n.value;if(!y.trim())return;let h=P();if(h){d("saving");try{let[H,S]=await Promise.all([x(y,h),x(y.slice(0,120),h)]),k=new Date().toISOString();if(!l)l=crypto.randomUUID(),await Ee({id:l,createdAt:k,updatedAt:k,payload:H,previewPayload:S});else{let W=(await p())?.entries.find(Ue=>Ue.id===l);await Te({id:l,createdAt:W?.createdAt??k,updatedAt:k,payload:H,previewPayload:S})}d("saved")}catch{d("unsaved")}}};n.addEventListener("input",()=>{s=!0,d("unsaved"),G(),i&&clearTimeout(i),i=setTimeout(async()=>{await v(),s=!1},1500)});let A=async()=>{i&&clearTimeout(i),s&&await v(),c("#home")};o.addEventListener("click",A),window.addEventListener("popstate",A,{once:!0})}async function $e(e,t){e.innerHTML=`
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
  `;let n=P();if(!n){c("#lock");return}e.querySelector("#back-btn").addEventListener("click",()=>c("#home")),e.querySelector("#edit-btn").addEventListener("click",()=>c(`#editor?id=${t}`)),e.querySelector("#delete-btn").addEventListener("click",async()=>{confirm("Delete this entry? This cannot be undone.")&&(await N(t),u("Entry deleted"),c("#home"))});try{let o=(await p())?.entries.find(l=>l.id===t);if(!o){c("#home");return}let a=await L(o.payload,n),s=e.querySelector("#entry-date"),i=e.querySelector("#entry-body");s.textContent=_e(o.updatedAt),i.textContent=a}catch(r){let o=e.querySelector("#entry-body");o.innerHTML=`<div class="error-box" style="margin:20px">Failed to decrypt entry: ${r.message}</div>`}}var tt="vaultjournal_v1_verification_token",nt=[{label:"Immediately (30s)",value:30},{label:"1 minute",value:60},{label:"2 minutes",value:120},{label:"5 minutes",value:300},{label:"15 minutes",value:900},{label:"Never",value:0}];async function ie(e){let t=await g();e.innerHTML=`
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">\u2190 Back</button>
        <span class="topbar-title">Settings</span>
      </div>
      <div class="scroll-area">

        <div class="settings-section">
          <div class="settings-section-title">Auto-Lock</div>
          ${nt.map(n=>`
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
            <span class="settings-row-label">VaultJournal</span>
            <span style="color:var(--text-faint); font-size:13px">v1.0 PWA</span>
          </div>
        </div>

      </div>
    </div>

    <!-- hidden file input for import -->
    <input type="file" id="import-input" accept=".ejson,.json" style="display:none">
  `,e.querySelector("#back-btn").addEventListener("click",()=>c("#home")),je(e),e.querySelectorAll("[data-lock]").forEach(n=>{n.addEventListener("click",async()=>{let r=parseInt(n.dataset.lock);await F({autoLockSeconds:r}),await Se(),await ie(e)})}),e.querySelector("#change-pwd-row").addEventListener("click",()=>at(e)),e.querySelector("#export-row").addEventListener("click",()=>rt()),e.querySelector("#import-row").addEventListener("click",()=>{e.querySelector("#import-input").click()}),e.querySelector("#import-input").addEventListener("change",async n=>{let r=n.target.files?.[0];r&&await ot(r)})}async function rt(){try{let e=await p();if(!e){u("No vault to export");return}let t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"});if("showSaveFilePicker"in window)try{let a=await(await window.showSaveFilePicker({suggestedName:"vault.ejson",types:[{description:"Encrypted Vault",accept:{"application/json":[".ejson",".json"]}}]})).createWritable();await a.write(t),await a.close(),u("Vault exported");return}catch(o){if(o.name==="AbortError")return}let n=URL.createObjectURL(t),r=document.createElement("a");r.href=n,r.download="vault.ejson",r.click(),setTimeout(()=>URL.revokeObjectURL(n),5e3),u("Vault exported to Downloads")}catch(e){u(`Export failed: ${e.message}`)}}async function ot(e){try{let t=await e.text(),n=JSON.parse(t);if(!j(n)){u("Invalid vault file");return}await b(n),u("Vault imported. Unlock with the backup's password."),T()}catch(t){u(`Import failed: ${t.message}`)}}function at(e){let t=document.createElement("div");t.className="overlay",t.innerHTML=`
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
  `,document.body.appendChild(t),t.querySelector("#cp-cancel").addEventListener("click",()=>t.remove()),t.querySelector("#cp-submit").addEventListener("click",async()=>{let n=t.querySelector("#cp-current").value,r=t.querySelector("#cp-new").value,o=t.querySelector("#cp-confirm").value,a=t.querySelector("#cp-error"),s=t.querySelector("#cp-submit");if(a.textContent="",r.length<8){a.textContent="New password must be at least 8 characters.";return}if(r!==o){a.textContent="Passwords do not match.";return}let i=await $();if(!i){a.textContent="No verification token found.";return}if(!await K(i,n)){a.textContent="Current password is wrong.";return}s.disabled=!0,s.innerHTML='<span class="spinner"></span>';let d=document.createElement("div");d.className="overlay",d.innerHTML=`
      <div class="modal" style="text-align:center; gap:20px">
        <div class="modal-title">Re-encrypting\u2026</div>
        <div class="spinner" style="margin: 0 auto; width:32px; height:32px; border-width:3px"></div>
        <div id="reenc-progress" style="color:var(--text-muted); font-size:14px"></div>
      </div>
    `,document.body.appendChild(d),t.remove();try{let A=(await p())?.entries??[],y=d.querySelector("#reenc-progress"),h=[];for(let S=0;S<A.length;S++){y.textContent=`Entry ${S+1} of ${A.length}`;let k=A[S],[le,W]=await Promise.all([ae(k.payload,n,r),ae(k.previewPayload,n,r)]);h.push({...k,payload:le,previewPayload:W})}await xe(h);let H=await x(tt,r);await O(H),d.remove(),u("Password changed. Please log in again."),T()}catch(v){d.remove(),u(`Re-encryption failed: ${v.message}`),s.disabled=!1,s.textContent="Change"}}),t.querySelector("#cp-current").focus()}async function je(e){let t=e.querySelector("#drive-section"),n=await q(),r=D();!n||!r?(t.innerHTML=`
      <div class="settings-section-title">Google Drive</div>
      <div style="color:var(--text-muted); font-size:14px; margin-bottom:12px; line-height:1.6">
        Automatically back up your encrypted vault to Google Drive after every save.
        Google only sees ciphertext \u2014 your password never leaves this device.
      </div>
      <button class="btn btn-secondary" id="drive-connect-btn" style="margin-bottom:4px">
        Connect Google Drive
      </button>
    `,t.querySelector("#drive-connect-btn").addEventListener("click",()=>{me()})):(t.innerHTML=`
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
    `,t.querySelector("#drive-restore-row").addEventListener("click",async()=>{if(confirm("Replace the local vault with the copy from Google Drive? The current local vault will be overwritten."))try{let o=await we(),a=JSON.parse(o);if(!j(a)){u("Invalid vault in Drive");return}await b(a),u("Vault restored from Drive. Please unlock again."),T()}catch(o){u(`Restore failed: ${o.message}`)}}),t.querySelector("#drive-disconnect-row").addEventListener("click",async()=>{confirm("Disconnect Google Drive? Your local vault is kept. Drive copy is NOT deleted.")&&(await pe(),await je(e),u("Google Drive disconnected"))}))}"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(console.error);Le(()=>{c("#lock")});async function st(e,t){switch(t.innerHTML="",e.name){case"lock":await Ie(t);break;case"setup":qe(t);break;case"home":await Ne(t);break;case"editor":await Oe(t,e.id);break;case"entry":await $e(t,e.id);break;case"settings":await ie(t);break}}async function it(){await ve()||await ue();let t=document.getElementById("app");(await g()).hasVault?(!location.hash||location.hash==="#"||location.hash==="#home")&&(location.hash="#lock"):location.hash="#setup",Me(t,st)}it().catch(console.error);})();
