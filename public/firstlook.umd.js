(function(v,k){typeof exports=="object"&&typeof module<"u"?k(exports):typeof define=="function"&&define.amd?define(["exports"],k):(v=typeof globalThis<"u"?globalThis:v||self,k(v.FirstLook={}))})(this,function(v){"use strict";const k=['input[type="password"]',"[data-sensitive]","[data-mask]",".uat-mask"];function q(a){var t,e,s,i,n,o,l,c,d,h,p;if(!a.endpoint)throw new Error("[FirstLook] 'endpoint' is required. Set your Supabase ingest-session URL.");return{projectId:a.projectId,apiKey:a.apiKey,userId:a.userId,role:a.role,context:a.context??{},endpoint:a.endpoint,triggers:{tapCount:((t=a.triggers)==null?void 0:t.tapCount)??5,deepLink:((e=a.triggers)==null?void 0:e.deepLink)??!0,shake:((s=a.triggers)==null?void 0:s.shake)??!0,keyboard:((i=a.triggers)==null?void 0:i.keyboard)??!0,customCheck:(n=a.triggers)==null?void 0:n.customCheck},security:{watermark:((o=a.security)==null?void 0:o.watermark)??!0,maskSelectors:((l=a.security)==null?void 0:l.maskSelectors)??k},recording:{domSnapshot:((c=a.recording)==null?void 0:c.domSnapshot)??!0,voice:((d=a.recording)==null?void 0:d.voice)??!0,maxDuration:((h=a.recording)==null?void 0:h.maxDuration)??600,snapshotInterval:((p=a.recording)==null?void 0:p.snapshotInterval)??1e3}}}function S(){return{userAgent:navigator.userAgent,platform:navigator.platform,language:navigator.language,screenWidth:window.screen.width,screenHeight:window.screen.height,pixelRatio:window.devicePixelRatio,touchSupport:"ontouchstart"in window||navigator.maxTouchPoints>0}}class I{constructor(){this.listeners=new Map}on(t,e){return this.listeners.has(t)||this.listeners.set(t,new Set),this.listeners.get(t).add(e),()=>this.off(t,e)}off(t,e){var s;(s=this.listeners.get(t))==null||s.delete(e)}emit(t){var e,s;(e=this.listeners.get(t.type))==null||e.forEach(i=>{try{i(t)}catch(n){console.error("[FirstLook] Event listener error:",n)}}),(s=this.listeners.get("*"))==null||s.forEach(i=>{try{i(t)}catch(n){console.error("[FirstLook] Event listener error:",n)}})}removeAll(){this.listeners.clear()}}class M{constructor(t){this.events=t,this.quests=[],this.results=[],this.currentIndex=-1,this.sessionStartTime=0,this.blocked=!1,this.pendingFeedbacks=[]}loadQuests(t){this.quests=[...t].sort((e,s)=>e.order-s.order),this.results=[],this.currentIndex=-1,this.blocked=!1}startSession(t){this.sessionStartTime=t,this.advance()}getCurrentQuest(){return this.blocked||this.currentIndex<0||this.currentIndex>=this.quests.length?null:this.quests[this.currentIndex]}getStatus(){return{total:this.quests.length,completed:this.results.filter(t=>t.status==="COMPLETED").length,failed:this.results.filter(t=>t.status==="FAILED").length,current:this.currentIndex,isBlocked:this.blocked,isFinished:this.currentIndex>=this.quests.length}}getQuestStatuses(){return this.quests.map((t,e)=>{const s=this.results.find(i=>i.questId===t.id);return s?s.status:e===this.currentIndex&&!this.blocked?"ACTIVE":this.blocked&&e>=this.currentIndex?"BLOCKED":"PENDING"})}completeCurrentQuest(t,e){const s=this.getCurrentQuest();if(!s)return null;const i={questId:s.id,status:"COMPLETED",timestamp:Date.now(),relativeTime:Date.now()-this.sessionStartTime,voiceMemoBlob:e==null?void 0:e.voiceMemo,logs:t,comment:e==null?void 0:e.comment,concern:(e==null?void 0:e.concern)??!1,feedbacks:this.drainFeedbacks()};return this.results.push(i),this.events.emit({type:"quest:completed",questId:s.id}),this.advance(),i}failCurrentQuest(t,e,s){const i=this.getCurrentQuest();if(!i)return null;const n={questId:i.id,status:"FAILED",timestamp:Date.now(),relativeTime:Date.now()-this.sessionStartTime,voiceMemoBlob:s,logs:t,comment:e,concern:!1,feedbacks:this.drainFeedbacks()};return this.results.push(n),this.events.emit({type:"quest:failed",questId:i.id}),i.blocking?(this.blocked=!0,this.events.emit({type:"quest:blocked",questId:i.id})):this.advance(),n}addFeedback(t){this.pendingFeedbacks.push(t)}getResults(){return[...this.results]}drainFeedbacks(){const t=this.pendingFeedbacks;return this.pendingFeedbacks=[],t}advance(){this.currentIndex++,this.currentIndex<this.quests.length&&this.events.emit({type:"quest:started",questId:this.quests[this.currentIndex].id})}}function r(a,t,e){const s=document.createElement(a);if(t)for(const[i,n]of Object.entries(t))i==="className"?s.className=n:s.setAttribute(i,n);if(e)for(const i of e)typeof i=="string"?s.appendChild(document.createTextNode(i)):s.appendChild(i);return s}function E(){return`fl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`}function R(a){const t=Math.floor(a/60),e=a%60;return`${t.toString().padStart(2,"0")}:${e.toString().padStart(2,"0")}`}class L{constructor(t,e){this.shadowRoot=t,this.callbacks=e,this.minimized=!1,this.timerInterval=null,this.startTime=0,this.root=document.createElement("div"),this.root.className="fl-quest-overlay",this.root.style.pointerEvents="auto";for(const s of["click","mousedown","mouseup","pointerdown","pointerup","touchstart","touchend"])this.root.addEventListener(s,i=>i.stopPropagation());this.shadowRoot.appendChild(this.root)}renderQuest(t,e,s){this.minimized=!1,this.root.className="fl-quest-overlay",this.root.innerHTML="";const i=e.indexOf("ACTIVE"),n=r("div",{className:"fl-quest-header"},[r("div",{className:"fl-quest-header-left"},[r("span",{className:"fl-quest-badge"},[`Q${i+1}/${e.length}`]),r("span",{className:"fl-quest-title"},[t.title])]),this.createMinimizeBtn()]);this.root.appendChild(n);const o=r("div",{className:"fl-quest-content"}),l=r("div",{className:"fl-quest-progress"});for(const p of e){const g=p==="COMPLETED"?"fl-completed":p==="FAILED"?"fl-failed":p==="ACTIVE"?"fl-active":"";l.appendChild(r("div",{className:`fl-quest-progress-dot ${g}`}))}const c=r("div",{className:"fl-quest-body"},[l,r("p",{className:"fl-quest-description"},[t.description]),r("div",{className:"fl-quest-memo-row"},[this.createButton("fl-btn fl-btn-memo","📝 メモを残す",()=>this.renderFeedbackModal(t.title))]),r("div",{className:"fl-quest-actions"},[this.createButton("fl-btn fl-btn-ok","✓ OK",()=>this.renderFeedbackModal(t.title,"ok")),this.createButton("fl-btn fl-btn-concern","⚠ 気になる",()=>this.renderFeedbackModal(t.title,"concern")),this.createButton("fl-btn fl-btn-ng","✗ NG",this.callbacks.onNg)])]);o.appendChild(c),s&&o.appendChild(r("div",{className:"fl-voice-indicator"},[r("span",{className:"fl-voice-dot"}),"Recording..."]));const d=r("div",{className:"fl-status-bar"});s&&d.appendChild(r("span",{className:"fl-status-recording"},[r("span",{className:"fl-voice-dot"}),"REC"]));const h=r("span",{className:"fl-status-timer"},["00:00"]);d.appendChild(h),o.appendChild(d),this.root.appendChild(o),this.startTimer(h),this.root.onclick=()=>{this.minimized&&(this.minimized=!1,this.root.className="fl-quest-overlay",this.root.innerHTML="",this.root.appendChild(n),this.root.appendChild(o),this.startTimer(h))}}renderFeedbackModal(t,e="memo"){const s=r("div",{className:"fl-feedback-modal"}),i={ng:"fl-quest-header fl-quest-header-ng",ok:"fl-quest-header fl-quest-header-ok",concern:"fl-quest-header fl-quest-header-concern",memo:"fl-quest-header"},n={ng:"NG",ok:"✓ OK",concern:"⚠ 気になる",memo:"📝"},o={ng:"fl-quest-badge fl-badge-ng",ok:"fl-quest-badge fl-badge-ok",concern:"fl-quest-badge fl-badge-concern",memo:"fl-quest-badge"},l=r("div",{className:i[e]},[r("div",{className:"fl-quest-header-left"},[r("span",{className:o[e]},[n[e]]),r("span",{className:"fl-quest-title"},[t])])]);s.appendChild(l);const c=r("div",{className:"fl-quest-content"}),d={ng:"何がうまくいかなかったか教えてください...",ok:"コメント（任意）",concern:"気になった点を教えてください...",memo:"気づいたことをメモ...📝"},h=document.createElement("textarea");h.className="fl-feedback-textarea fl-feedback-textarea-modal",h.placeholder=d[e],h.rows=3,c.appendChild(h);const p="送信",g=e==="ok"?"スキップ":"キャンセル",f=r("div",{className:"fl-quest-actions fl-feedback-modal-actions"},[this.createButton("fl-btn fl-btn-skip",g,()=>{e==="ng"?this.callbacks.onNgWithFeedback(""):e==="ok"&&this.callbacks.onOkWithFeedback(""),s.remove()}),this.createButton("fl-btn fl-btn-finish",p,()=>{const m=h.value.trim();if(e==="ng")this.callbacks.onNgWithFeedback(m);else if(e==="ok")this.callbacks.onOkWithFeedback(m);else if(e==="concern"){if(!m)return;this.callbacks.onConcern(m)}else{if(!m){s.remove();return}this.callbacks.onMemo(m)}s.remove()})]);c.appendChild(f),s.appendChild(c),this.root.appendChild(s),h.focus()}renderSummary(t,e,s){this.stopTimer(),this.root.className="fl-quest-overlay",this.root.innerHTML="";const i=r("div",{className:"fl-summary"},[r("div",{className:"fl-summary-icon"},[t===s?"🎉":"📋"]),r("div",{className:"fl-summary-title"},[t===s?"All Quests Complete!":"Session Complete"]),r("div",{className:"fl-summary-subtitle"},[`${t+e} of ${s} quests attempted`]),r("div",{className:"fl-summary-stats"},[this.createStat(t.toString(),"Passed","fl-ok"),this.createStat(e.toString(),"Failed","fl-ng")]),this.createButton("fl-btn fl-btn-finish","Finish & Upload",this.callbacks.onFinish)]);this.root.appendChild(i)}renderBlocked(t){this.stopTimer(),this.root.className="fl-quest-overlay",this.root.innerHTML="";const e=r("div",{className:"fl-summary"},[r("div",{className:"fl-summary-icon"},["🛑"]),r("div",{className:"fl-summary-title"},["Blocked"]),r("div",{className:"fl-summary-subtitle"},[`Quest "${t}" is blocking. Session halted.`]),this.createButton("fl-btn fl-btn-finish","Finish & Upload",this.callbacks.onFinish)]);this.root.appendChild(e)}destroy(){this.stopTimer(),this.root.remove()}createMinimizeBtn(){const t=r("button",{className:"fl-quest-minimize-btn"},["−"]);return t.onclick=e=>{e.stopPropagation(),this.minimized=!0,this.root.className="fl-quest-overlay fl-minimized",this.root.innerHTML="";const s=r("span",{className:"fl-minimize-icon"},["🔍"]);this.root.appendChild(s),this.callbacks.onMinimize()},t}createButton(t,e,s){const i=r("button",{className:t});return i.textContent=e,i.onclick=n=>{n.stopPropagation(),s()},i}createStat(t,e,s){return r("div",{className:"fl-stat"},[r("div",{className:`fl-stat-value ${s}`},[t]),r("div",{className:"fl-stat-label"},[e])])}startTimer(t){this.stopTimer(),this.startTime||(this.startTime=Date.now()),this.timerInterval=setInterval(()=>{const e=Math.floor((Date.now()-this.startTime)/1e3);t.textContent=R(e)},1e3)}stopTimer(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null)}}const A=100,D=2*1024*1024;class N{constructor(t,e,s){this.config=t,this.events=e,this.maskSelector=s,this.actionLogs=[],this.snapshots=[],this.snapshotTimer=null,this.startTime=0,this.running=!1,this.handleClick=this.onClick.bind(this),this.handleScroll=this.throttle(this.onScroll.bind(this),500),this.handleInput=this.onInput.bind(this)}start(){this.running||(this.running=!0,this.startTime=Date.now(),this.actionLogs=[],this.snapshots=[],document.addEventListener("click",this.handleClick,{capture:!0,passive:!0}),document.addEventListener("scroll",this.handleScroll,{capture:!0,passive:!0}),document.addEventListener("input",this.handleInput,{capture:!0,passive:!0}),this.config.recording.domSnapshot&&(this.captureSnapshot(),this.snapshotTimer=setInterval(()=>this.captureSnapshot(),this.config.recording.snapshotInterval)),this.events.emit({type:"recording:started"}))}stop(){this.running&&(this.running=!1,document.removeEventListener("click",this.handleClick,{capture:!0}),document.removeEventListener("scroll",this.handleScroll,{capture:!0}),document.removeEventListener("input",this.handleInput,{capture:!0}),this.snapshotTimer&&(clearInterval(this.snapshotTimer),this.snapshotTimer=null),this.captureSnapshot(),this.events.emit({type:"recording:stopped"}))}getActionLogs(){return[...this.actionLogs]}getSnapshots(){return[...this.snapshots]}getElapsedMs(){return this.running?Date.now()-this.startTime:0}addLog(t){this.actionLogs.push({...t,timestamp:Date.now()-this.startTime})}onClick(t){const e=t.target;this.addLog({type:"click",target:w(e)})}onScroll(){this.addLog({type:"scroll",value:`${window.scrollX},${window.scrollY}`})}onInput(t){const e=t.target;if(e.hasAttribute("data-fl-masked"))this.addLog({type:"input",target:w(e),value:"[MASKED]"});else{const s=e.value;this.addLog({type:"input",target:w(e),value:s==null?void 0:s.slice(0,100)})}}captureSnapshot(){try{const t=document.documentElement.cloneNode(!0);if(this.maskSelector){const n=t.querySelectorAll(this.maskSelector);for(const o of n)(o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement)&&(o.value="***"),o.textContent="***"}const e=t.querySelectorAll("script");for(const n of e)n.remove();const s=t.querySelector("#firstlook-sdk-root");s==null||s.remove();const i=t.outerHTML;if(i.length>D)return;this.snapshots.length>=A&&this.snapshots.shift(),this.snapshots.push({type:"dom-snapshot",timestamp:Date.now()-this.startTime,data:i})}catch{}}throttle(t,e){let s=0;return(...i)=>{const n=Date.now();n-s>=e&&(s=n,t(...i))}}}function w(a){var n;const t=a.tagName.toLowerCase(),e=a.id?`#${a.id}`:"",s=a.className&&typeof a.className=="string"?`.${a.className.trim().split(/\s+/).slice(0,2).join(".")}`:"",i=((n=a.textContent)==null?void 0:n.trim().slice(0,30))||"";return`${t}${e}${s}${i?` "${i}"`:""}`}class F{constructor(t){this.events=t,this.mediaRecorder=null,this.stream=null,this.chunks=[],this._recording=!1}get recording(){return this._recording}async start(){if(!this._recording)try{this.stream=await navigator.mediaDevices.getUserMedia({audio:!0});const t=this.getSupportedMimeType(),e=t?{mimeType:t}:{};this.mediaRecorder=new MediaRecorder(this.stream,e),this.chunks=[],this.mediaRecorder.ondataavailable=s=>{s.data.size>0&&this.chunks.push(s.data)},this.mediaRecorder.start(1e3),this._recording=!0}catch(t){console.warn("[FirstLook] Voice recording unavailable:",t),this.events.emit({type:"error",error:new Error(`Voice recording failed: ${t.message}`)})}}async stopAsync(){return!this._recording||!this.mediaRecorder?null:new Promise(t=>{this.mediaRecorder.onstop=()=>{var s;const e=this.chunks.length>0?new Blob(this.chunks,{type:((s=this.mediaRecorder)==null?void 0:s.mimeType)||"audio/webm"}):null;this.cleanup(),t(e)},this.mediaRecorder.stop()})}async captureSnippet(t=1e4){return await this.start(),new Promise(e=>{setTimeout(async()=>{const s=await this.stopAsync();e(s)},t)})}cleanup(){if(this._recording=!1,this.stream){for(const t of this.stream.getTracks())t.stop();this.stream=null}this.mediaRecorder=null,this.chunks=[]}getSupportedMimeType(){const t=["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/mp4"];for(const e of t)if(typeof MediaRecorder<"u"&&MediaRecorder.isTypeSupported(e))return e;return""}}class P{constructor(t,e){this.shadowRoot=t,this.config=e,this.container=null,this.refreshInterval=null,this.cachedIp=null}show(){this.container||(this.container=document.createElement("div"),this.container.className="fl-watermark",this.renderTiles(),this.shadowRoot.appendChild(this.container),this.fetchIp().then(()=>this.renderTiles()),this.refreshInterval=setInterval(()=>this.renderTiles(),6e4))}hide(){this.container&&(this.container.remove(),this.container=null),this.refreshInterval&&(clearInterval(this.refreshInterval),this.refreshInterval=null)}async fetchIp(){if(!this.cachedIp)try{const t=await fetch("https://api.ipify.org?format=text");t.ok&&(this.cachedIp=await t.text())}catch{this.cachedIp="N/A"}}renderTiles(){if(!this.container)return;this.container.innerHTML="";const t=this.cachedIp??"",e=new Date().toISOString().slice(0,19),s=t?`${this.config.userId} | ${e} | ${t}`:`${this.config.userId} | ${e}`,i=320,n=80,o=Math.ceil(window.innerWidth/i)+1,l=Math.ceil(window.innerHeight/n)+1;for(let c=0;c<l;c++)for(let d=0;d<o;d++){const h=document.createElement("span");h.className="fl-watermark-tile",h.textContent=s,h.style.left=`${d*i}px`,h.style.top=`${c*n}px`,this.container.appendChild(h)}}}class z{constructor(t){this.selectors=t,this.observer=null,this.maskedElements=new Set}start(){this.scanAndMark(),this.observer=new MutationObserver(()=>this.scanAndMark()),this.observer.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["type","class","data-sensitive","data-mask"]})}stop(){var t;(t=this.observer)==null||t.disconnect(),this.observer=null;for(const e of this.maskedElements)e.removeAttribute("data-fl-masked");this.maskedElements.clear()}isMasked(t){return t.hasAttribute("data-fl-masked")}getCombinedSelector(){return this.selectors.join(", ")}scanAndMark(){const t=this.getCombinedSelector();if(t)try{const e=document.querySelectorAll(t);for(const s of e)this.maskedElements.has(s)||(s.setAttribute("data-fl-masked","true"),this.maskedElements.add(s));for(const s of this.maskedElements)document.contains(s)||this.maskedElements.delete(s)}catch{}}}const O="firstlook_uat",Q=1,u={sessions:"sessions",recordings:"recordings",annotations:"annotations",uploadQueue:"upload_queue"};class B{constructor(){this.db=null}async open(){if(!this.db)return new Promise((t,e)=>{const s=indexedDB.open(O,Q);s.onupgradeneeded=()=>{const i=s.result;i.objectStoreNames.contains(u.sessions)||i.createObjectStore(u.sessions,{keyPath:"sessionId"}),i.objectStoreNames.contains(u.recordings)||i.createObjectStore(u.recordings,{autoIncrement:!0}).createIndex("sessionId","sessionId",{unique:!1}),i.objectStoreNames.contains(u.annotations)||i.createObjectStore(u.annotations,{autoIncrement:!0}).createIndex("sessionId","sessionId",{unique:!1}),i.objectStoreNames.contains(u.uploadQueue)||i.createObjectStore(u.uploadQueue,{autoIncrement:!0})},s.onsuccess=()=>{this.db=s.result,t()},s.onerror=()=>e(s.error)})}async saveSession(t){await this.put(u.sessions,t)}async getSession(t){return this.get(u.sessions,t)}async saveRecording(t,e){await this.put(u.recordings,{sessionId:t,...e})}async saveAnnotation(t,e){await this.put(u.annotations,{sessionId:t,...e})}async getAnnotations(t){return this.getAllByIndex(u.annotations,"sessionId",t)}async enqueueUpload(t){await this.put(u.uploadQueue,{payload:t,createdAt:Date.now(),attempts:0})}async getPendingUploads(){const t=this.ensureDb();return new Promise((e,s)=>{const o=t.transaction(u.uploadQueue,"readonly").objectStore(u.uploadQueue).openCursor(),l=[];o.onsuccess=()=>{const c=o.result;c?(l.push({key:c.key,payload:c.value.payload,attempts:c.value.attempts,lastAttemptAt:c.value.lastAttemptAt}),c.continue()):e(l)},o.onerror=()=>s(o.error)})}async removeFromQueue(t){const e=this.ensureDb();return new Promise((s,i)=>{const o=e.transaction(u.uploadQueue,"readwrite").objectStore(u.uploadQueue).delete(t);o.onsuccess=()=>s(),o.onerror=()=>i(o.error)})}async incrementAttempts(t){const e=this.ensureDb();return new Promise((s,i)=>{const n=e.transaction(u.uploadQueue,"readwrite"),o=n.objectStore(u.uploadQueue),l=o.get(t);l.onsuccess=()=>{const c=l.result;c&&(c.attempts=(c.attempts??0)+1,c.lastAttemptAt=Date.now(),o.put(c,t))},n.oncomplete=()=>s(),n.onerror=()=>i(n.error)})}async clearSession(t){const s=this.ensureDb().transaction([u.sessions,u.recordings,u.annotations],"readwrite");s.objectStore(u.sessions).delete(t);for(const i of[u.recordings,u.annotations]){const l=s.objectStore(i).index("sessionId").openCursor(IDBKeyRange.only(t));l.onsuccess=()=>{const c=l.result;c&&(c.delete(),c.continue())}}return new Promise((i,n)=>{s.oncomplete=()=>i(),s.onerror=()=>n(s.error)})}close(){var t;(t=this.db)==null||t.close(),this.db=null}ensureDb(){if(!this.db)throw new Error("[FirstLook] Storage not opened. Call open() first.");return this.db}async put(t,e){const s=this.ensureDb();return new Promise((i,n)=>{const o=s.transaction(t,"readwrite");o.objectStore(t).put(e),o.oncomplete=()=>i(),o.onerror=()=>n(o.error)})}async get(t,e){const s=this.ensureDb();return new Promise((i,n)=>{const l=s.transaction(t,"readonly").objectStore(t).get(e);l.onsuccess=()=>i(l.result),l.onerror=()=>n(l.error)})}async getAllByIndex(t,e,s){const i=this.ensureDb();return new Promise((n,o)=>{const d=i.transaction(t,"readonly").objectStore(t).index(e).getAll(s);d.onsuccess=()=>n(d.result),d.onerror=()=>o(d.error)})}}const T=["#e17055","#6c5ce7","#00b894","#fdcb6e","#ffffff"];class U{constructor(t){this.shadowRoot=t,this.overlay=null,this.canvas=null,this.ctx=null,this.drawing=!1,this.currentPath=[],this.paths=[],this.selectedColor=T[0],this.screenshotDataUrl=""}async open(){return this.screenshotDataUrl=await this.captureScreenshot(),new Promise(t=>{this.overlay=r("div",{className:"fl-annotation-overlay"});const e=r("div",{className:"fl-annotation-canvas-wrap"});this.canvas=document.createElement("canvas"),this.canvas.className="fl-annotation-canvas",e.appendChild(this.canvas),this.overlay.appendChild(e);const s=r("input",{className:"fl-annotation-comment",type:"text",placeholder:"Add a comment..."}),i=r("div",{className:"fl-color-picker"});for(const c of T){const d=r("div",{className:`fl-color-swatch ${c===this.selectedColor?"fl-selected":""}`});d.style.background=c,d.onclick=()=>{this.selectedColor=c,i.querySelectorAll(".fl-color-swatch").forEach(h=>h.classList.remove("fl-selected")),d.classList.add("fl-selected")},i.appendChild(d)}const n=r("button",{className:"fl-btn fl-btn-ok"},["Submit"]);n.onclick=()=>{const c={screenshotDataUrl:this.getAnnotatedImage(),drawings:[...this.paths],comment:s.value,timestamp:Date.now()};this.close(),t(c)};const o=r("button",{className:"fl-btn fl-btn-ng"},["Cancel"]);o.onclick=()=>{this.close(),t(null)};const l=r("div",{className:"fl-annotation-toolbar"},[i,s,n,o]);this.overlay.appendChild(l),this.shadowRoot.appendChild(this.overlay),this.initCanvas()})}close(){var t;(t=this.overlay)==null||t.remove(),this.overlay=null,this.canvas=null,this.ctx=null,this.paths=[],this.currentPath=[]}async captureScreenshot(){try{const t=window.innerWidth,e=window.innerHeight,s=document.documentElement.cloneNode(!0),i=s.querySelector("#firstlook-sdk-root");i==null||i.remove();const n=s.querySelectorAll('[data-fl-masked], input[type="password"]');for(const f of n)(f instanceof HTMLInputElement||f instanceof HTMLTextAreaElement)&&(f.value="[MASKED]"),f.textContent="[MASKED]";for(const f of s.querySelectorAll("script"))f.remove();const o=s.querySelector("body");if(o){const f=window.getComputedStyle(document.body);o.style.backgroundColor=f.backgroundColor,o.style.color=f.color,o.style.fontFamily=f.fontFamily,o.style.margin="0",o.style.overflow="hidden"}const l=new XMLSerializer().serializeToString(s),c=`<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${e}">
        <foreignObject width="100%" height="100%">
          ${l}
        </foreignObject>
      </svg>`,d=new Blob([c],{type:"image/svg+xml;charset=utf-8"}),h=URL.createObjectURL(d),p=document.createElement("canvas");p.width=t*window.devicePixelRatio,p.height=e*window.devicePixelRatio;const g=p.getContext("2d");return g.scale(window.devicePixelRatio,window.devicePixelRatio),new Promise(f=>{const m=new Image;m.onload=()=>{g.drawImage(m,0,0,t,e),URL.revokeObjectURL(h),f(p.toDataURL("image/png"))},m.onerror=()=>{URL.revokeObjectURL(h),f(this.captureScreenshotFallback(t,e))},m.src=h})}catch{return this.captureScreenshotFallback(window.innerWidth,window.innerHeight)}}captureScreenshotFallback(t,e){const s=document.createElement("canvas");s.width=t,s.height=e;const i=s.getContext("2d"),n=window.getComputedStyle(document.body);return i.fillStyle=n.backgroundColor||"#ffffff",i.fillRect(0,0,t,e),i.fillStyle="#333",i.font="14px sans-serif",i.fillText(`URL: ${window.location.href}`,20,30),i.fillText(`Time: ${new Date().toISOString()}`,20,50),i.fillText("(SVG capture unavailable — metadata view)",20,70),s.toDataURL("image/png")}initCanvas(){if(!this.canvas)return;const t=new Image;t.onload=()=>{const e=window.innerWidth*.9,s=window.innerHeight*.7,i=Math.min(e/t.width,s/t.height,1);this.canvas.width=t.width*i,this.canvas.height=t.height*i,this.ctx=this.canvas.getContext("2d"),this.ctx.drawImage(t,0,0,this.canvas.width,this.canvas.height),this.canvas.addEventListener("pointerdown",this.onDrawStart.bind(this)),this.canvas.addEventListener("pointermove",this.onDrawMove.bind(this)),this.canvas.addEventListener("pointerup",this.onDrawEnd.bind(this)),this.canvas.addEventListener("pointerleave",this.onDrawEnd.bind(this))},t.src=this.screenshotDataUrl}onDrawStart(t){this.drawing=!0;const e=this.canvas.getBoundingClientRect();this.currentPath=[{x:t.clientX-e.left,y:t.clientY-e.top}]}onDrawMove(t){if(!this.drawing||!this.ctx)return;const e=this.canvas.getBoundingClientRect(),s={x:t.clientX-e.left,y:t.clientY-e.top};if(this.currentPath.push(s),this.ctx.strokeStyle=this.selectedColor,this.ctx.lineWidth=3,this.ctx.lineCap="round",this.ctx.lineJoin="round",this.currentPath.length>=2){const i=this.currentPath[this.currentPath.length-2];this.ctx.beginPath(),this.ctx.moveTo(i.x,i.y),this.ctx.lineTo(s.x,s.y),this.ctx.stroke()}}onDrawEnd(){this.drawing&&this.currentPath.length>0&&this.paths.push({points:[...this.currentPath],color:this.selectedColor,width:3}),this.drawing=!1,this.currentPath=[]}getAnnotatedImage(){var t;return((t=this.canvas)==null?void 0:t.toDataURL("image/png"))||this.screenshotDataUrl}}class j{constructor(t){this.onShake=t,this.lastX=0,this.lastY=0,this.lastZ=0,this.shakeCount=0,this.lastShakeTime=0,this.handler=null,this.THRESHOLD=15,this.SHAKE_INTERVAL=400,this.REQUIRED_SHAKES=2}async start(){if(typeof DeviceMotionEvent.requestPermission=="function")try{if(await DeviceMotionEvent.requestPermission()!=="granted")return}catch{return}this.handler=this.onMotion.bind(this),window.addEventListener("devicemotion",this.handler,{passive:!0})}stop(){this.handler&&(window.removeEventListener("devicemotion",this.handler),this.handler=null)}onMotion(t){const e=t.accelerationIncludingGravity;if(!e||e.x==null||e.y==null||e.z==null)return;const s=Math.abs(e.x-this.lastX),i=Math.abs(e.y-this.lastY),n=Math.abs(e.z-this.lastZ);if(s+i+n>this.THRESHOLD){const o=Date.now();o-this.lastShakeTime<this.SHAKE_INTERVAL?(this.shakeCount++,this.shakeCount>=this.REQUIRED_SHAKES&&(this.shakeCount=0,this.onShake())):this.shakeCount=1,this.lastShakeTime=o}this.lastX=e.x,this.lastY=e.y,this.lastZ=e.z}}class K{constructor(t,e){this.shadowRoot=t,this.events=e,this.annotations=[],this.active=!1,this.onKeydown=s=>{s.ctrlKey&&s.shiftKey&&s.key==="R"&&(s.preventDefault(),this.trigger())},this.annotationCanvas=new U(t),this.shakeTrigger=new j(()=>this.trigger())}async start(){await this.shakeTrigger.start(),document.addEventListener("keydown",this.onKeydown)}stop(){this.shakeTrigger.stop(),document.removeEventListener("keydown",this.onKeydown)}getAnnotations(){return[...this.annotations]}async trigger(){if(!this.active){this.active=!0;try{const t=await this.annotationCanvas.open();t&&(this.annotations.push(t),this.events.emit({type:"report:submitted"}))}finally{this.active=!1}}}}class ${constructor(t,e){this.requiredTaps=t,this.onActivate=e,this.tapCount=0,this.tapTimer=null,this.handler=null}start(){this.handler=this.onTap.bind(this),document.addEventListener("pointerdown",this.handler,{passive:!0})}stop(){this.handler&&(document.removeEventListener("pointerdown",this.handler),this.handler=null),this.reset()}onTap(t){this.tapCount++,this.tapTimer&&clearTimeout(this.tapTimer),this.tapCount>=this.requiredTaps?(this.reset(),this.onActivate()):this.tapTimer=setTimeout(()=>this.reset(),800)}reset(){this.tapCount=0,this.tapTimer&&(clearTimeout(this.tapTimer),this.tapTimer=null)}}const y="firstlook:uat-active";class C{constructor(t){this.onActivate=t,this.handlers=[]}start(){if(this.checkUrl()){this.persist(),this.onActivate();return}if(this.hasPersisted()){this.onActivate();return}const t=()=>{this.checkUrl()&&(this.persist(),this.onActivate())};window.addEventListener("hashchange",t),this.handlers.push(["hashchange",t]),window.addEventListener("popstate",t),this.handlers.push(["popstate",t])}stop(){for(const[t,e]of this.handlers)window.removeEventListener(t,e);this.handlers=[]}static clearPersisted(){try{sessionStorage.removeItem(y)}catch{}}checkUrl(){const t=new URLSearchParams(window.location.search);if(t.has("firstlook")||t.has("uat-mode")||t.get("uat")==="1")return!0;const e=window.location.hash,s=e.indexOf("?");if(s!==-1){const i=new URLSearchParams(e.substring(s));if(i.has("firstlook")||i.has("uat-mode")||i.get("uat")==="1")return!0}return!1}persist(){try{sessionStorage.setItem(y,"1")}catch{}}hasPersisted(){try{return sessionStorage.getItem(y)==="1"}catch{return!1}}}class H{constructor(t){this.onActivate=t,this.handler=null}start(){this.handler=t=>{t.code==="KeyU"&&t.shiftKey&&(t.ctrlKey||t.metaKey)&&(t.preventDefault(),this.onActivate())},window.addEventListener("keydown",this.handler)}stop(){this.handler&&(window.removeEventListener("keydown",this.handler),this.handler=null)}}class _{constructor(t,e){this.shadowRoot=t,this.callbacks=e,this.root=null,this.outsideClickHandler=null}show(){if(this.root)return;this.root=r("div",{className:"fl-debug-menu"}),this.root.style.pointerEvents="auto";for(const e of["click","mousedown","mouseup","pointerdown","pointerup","touchstart","touchend"])this.root.addEventListener(e,s=>s.stopPropagation());const t=[{icon:"▶",label:"Start Session",action:this.callbacks.onStartSession},{icon:"📸",label:"Report Issue",action:this.callbacks.onReportIssue},{icon:"✖",label:"Close SDK",action:this.callbacks.onClose}];for(const e of t){const s=r("button",{className:"fl-debug-menu-item"},[r("span",{className:"fl-debug-menu-item-icon"},[e.icon]),e.label]);s.onclick=i=>{i.stopPropagation(),this.hide(),e.action()},this.root.appendChild(s)}this.shadowRoot.appendChild(this.root),setTimeout(()=>{this.outsideClickHandler=e=>{this.root&&!this.root.contains(e.target)&&this.hide()},document.addEventListener("click",this.outsideClickHandler,{capture:!0})},100)}hide(){var t;(t=this.root)==null||t.remove(),this.root=null,this.outsideClickHandler&&(document.removeEventListener("click",this.outsideClickHandler,{capture:!0}),this.outsideClickHandler=null)}get visible(){return this.root!==null}}const W=`
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #1a1a2e;
    line-height: 1.5;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* === Quest Overlay === */
  .fl-quest-overlay {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    pointer-events: auto;
    width: 360px;
    max-width: calc(100vw - 48px);
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    animation: fl-slide-up 0.3s ease-out;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .fl-quest-overlay.fl-minimized {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #6c5ce7;
    box-shadow: 0 4px 16px rgba(108, 92, 231, 0.4);
  }

  .fl-quest-overlay.fl-minimized .fl-quest-content {
    display: none;
  }

  .fl-quest-overlay.fl-minimized .fl-minimize-icon {
    display: block;
    color: #fff;
    font-size: 24px;
  }

  .fl-minimize-icon {
    display: none;
  }

  @keyframes fl-slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .fl-quest-header {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: #fff;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .fl-quest-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .fl-quest-badge {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    letter-spacing: 0.5px;
  }

  .fl-quest-title {
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fl-quest-minimize-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: #fff;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .fl-quest-minimize-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .fl-quest-body {
    padding: 16px;
  }

  .fl-quest-description {
    font-size: 14px;
    color: #4a4a5a;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .fl-quest-progress {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
  }

  .fl-quest-progress-dot {
    height: 4px;
    flex: 1;
    border-radius: 2px;
    background: #e0e0e0;
    transition: background 0.3s;
  }

  .fl-quest-progress-dot.fl-completed { background: #00b894; }
  .fl-quest-progress-dot.fl-failed { background: #e17055; }
  .fl-quest-progress-dot.fl-active { background: #6c5ce7; }

  .fl-quest-actions {
    display: flex;
    gap: 10px;
  }

  .fl-btn {
    flex: 1;
    padding: 10px 16px;
    border-radius: 10px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .fl-btn:active { transform: scale(0.97); }

  .fl-btn-ok {
    background: #00b894;
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 184, 148, 0.3);
  }
  .fl-btn-ok:hover { box-shadow: 0 4px 12px rgba(0, 184, 148, 0.4); }

  .fl-btn-ng {
    background: #e17055;
    color: #fff;
    box-shadow: 0 2px 8px rgba(225, 112, 85, 0.3);
  }
  .fl-btn-ng:hover { box-shadow: 0 4px 12px rgba(225, 112, 85, 0.4); }

  /* === Voice recording indicator === */
  .fl-voice-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #fff3f0;
    border-top: 1px solid rgba(225, 112, 85, 0.1);
    font-size: 12px;
    color: #e17055;
  }

  .fl-voice-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e17055;
    animation: fl-pulse 1.2s ease-in-out infinite;
  }

  @keyframes fl-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* === Annotation overlay === */
  .fl-annotation-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fl-fade-in 0.2s ease-out;
  }

  @keyframes fl-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .fl-annotation-canvas-wrap {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .fl-annotation-canvas {
    display: block;
    cursor: crosshair;
    max-width: 90vw;
    max-height: 70vh;
  }

  .fl-annotation-toolbar {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    align-items: center;
  }

  .fl-annotation-toolbar .fl-btn {
    flex: none;
    padding: 10px 20px;
  }

  .fl-annotation-comment {
    width: 300px;
    padding: 10px 14px;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 14px;
    outline: none;
    backdrop-filter: blur(4px);
    transition: border-color 0.15s;
  }

  .fl-annotation-comment::placeholder { color: rgba(255, 255, 255, 0.5); }
  .fl-annotation-comment:focus { border-color: #a29bfe; }

  .fl-color-picker { display: flex; gap: 4px; }

  .fl-color-swatch {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.1s;
  }
  .fl-color-swatch:hover { transform: scale(1.15); }
  .fl-color-swatch.fl-selected {
    border-color: #fff;
    box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.6);
  }

  /* === Watermark === */
  .fl-watermark {
    position: fixed;
    inset: 0;
    z-index: 2147483640;
    pointer-events: none;
    overflow: hidden;
    opacity: 0.03;
  }

  .fl-watermark-tile {
    position: absolute;
    font-size: 12px;
    font-family: monospace;
    color: #000;
    white-space: nowrap;
    transform: rotate(-30deg);
    user-select: none;
  }

  /* === Debug Menu === */
  .fl-debug-menu {
    position: fixed;
    bottom: 100px;
    right: 24px;
    z-index: 2147483646;
    pointer-events: auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
    padding: 8px;
    min-width: 200px;
    animation: fl-slide-up 0.2s ease-out;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .fl-debug-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #1a1a2e;
    transition: background 0.15s;
  }
  .fl-debug-menu-item:hover { background: #f0f0f8; }

  .fl-debug-menu-item-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }

  /* === Session status bar === */
  .fl-status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: #f8f8fc;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
    font-size: 11px;
    color: #888;
  }

  .fl-status-recording {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #e17055;
  }

  .fl-status-timer {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }

  /* === Completion summary === */
  .fl-summary { padding: 20px 16px; text-align: center; }
  .fl-summary-icon { font-size: 48px; margin-bottom: 12px; }
  .fl-summary-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .fl-summary-subtitle { font-size: 13px; color: #888; margin-bottom: 16px; }
  .fl-summary-stats { display: flex; justify-content: center; gap: 24px; margin-bottom: 16px; }
  .fl-stat { text-align: center; }
  .fl-stat-value { font-size: 24px; font-weight: 700; }
  .fl-stat-value.fl-ok { color: #00b894; }
  .fl-stat-value.fl-ng { color: #e17055; }
  .fl-stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }

  .fl-btn-finish {
    background: #6c5ce7;
    color: #fff;
    width: 100%;
    box-shadow: 0 2px 8px rgba(108, 92, 231, 0.3);
  }

  .fl-btn-skip {
    background: #636e72;
    color: #fff;
    box-shadow: 0 2px 8px rgba(99, 110, 114, 0.3);
  }

  /* === Feedback modal header variants === */
  .fl-quest-header-ng { background: linear-gradient(135deg, #e17055, #d63031); }
  .fl-badge-ng { background: rgba(255, 255, 255, 0.25); }

  .fl-quest-header-ok { background: linear-gradient(135deg, #00b894, #00a381); }
  .fl-badge-ok { background: rgba(255, 255, 255, 0.25); }

  .fl-quest-header-concern { background: linear-gradient(135deg, #fdcb6e, #e17055); }
  .fl-badge-concern { background: rgba(255, 255, 255, 0.25); }

  .fl-feedback-textarea {
    width: calc(100% - 32px);
    margin: 8px 16px 16px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #ddd;
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
    outline: none;
    transition: border-color 0.15s;
  }
  .fl-feedback-textarea:focus { border-color: #6c5ce7; }
  .fl-feedback-textarea-modal { width: calc(100% - 32px); margin: 16px 16px 12px; }

  /* === Concern button === */
  .fl-btn-concern {
    background: #fdcb6e;
    color: #2d3436;
    box-shadow: 0 2px 8px rgba(253, 203, 110, 0.3);
  }
  .fl-btn-concern:hover { box-shadow: 0 4px 12px rgba(253, 203, 110, 0.4); }

  /* === Memo button === */
  .fl-quest-memo-row { display: flex; margin-bottom: 10px; }
  .fl-btn-memo {
    flex: 1;
    background: #f0f0f8;
    color: #4a4a5a;
    font-size: 14px;
    padding: 10px 16px;
    box-shadow: none;
    border-radius: 10px;
    border: 1px dashed #c8c8d8;
  }
  .fl-btn-memo:hover { background: #e4e4f0; }

  /* === Feedback modal === */
  .fl-feedback-modal {
    position: absolute;
    inset: 0;
    background: #fff;
    border-radius: 16px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    animation: fl-fade-in 0.15s ease-out;
  }
  .fl-feedback-modal-actions { padding: 0 16px 16px; }
`,X=5;class V{constructor(){this.config=null,this.events=new I,this.state="idle",this.hostElement=null,this.shadowRoot=null,this.questManager=null,this.questOverlay=null,this.sessionRecorder=null,this.voiceRecorder=null,this.watermark=null,this.fieldMasker=null,this.storage=null,this.shakeReporter=null,this.debugMenu=null,this.tapTrigger=null,this.deepLinkTrigger=null,this.keyboardTrigger=null,this.sessionId=null,this.sessionStartTime=0,this.maxDurationTimer=null,this.backupTimer=null,this.isFlushing=!1}async init(t){if(this.state!=="idle"){console.warn("[FirstLook] SDK already initialized.");return}this.config=q(t),this.storage=new B,await this.storage.open(),this.createShadowHost(),this.setupTriggers(),this.fieldMasker=new z(this.config.security.maskSelectors),this.state="initialized",this.events.emit({type:"sdk:initialized"}),this.flushUploadQueue(!0)}activate(){if(this.state!=="initialized"){console.warn("[FirstLook] Cannot activate: SDK not initialized or already active.");return}this.onActivate()}async startSession(t){var s;if(this.state!=="active")throw new Error("[FirstLook] Cannot start session: SDK not active. Call activate() first.");(s=this.debugMenu)==null||s.hide(),this.sessionId=E(),this.sessionStartTime=Date.now(),this.questManager=new M(this.events),this.questManager.loadQuests(t),this.sessionRecorder=new N(this.config,this.events,this.fieldMasker.getCombinedSelector()),this.voiceRecorder=new F(this.events),this.shakeReporter=new K(this.shadowRoot,this.events),await this.shakeReporter.start(),this.sessionRecorder.start(),this.fieldMasker.start(),this.config.recording.voice&&await this.voiceRecorder.start(),this.config.security.watermark&&(this.watermark=new P(this.shadowRoot,this.config),this.watermark.show()),this.questOverlay=new L(this.shadowRoot,{onOkWithFeedback:i=>this.handleQuestOk(i),onConcern:i=>this.handleConcern(i),onNg:()=>this.handleQuestNg(),onNgWithFeedback:i=>this.handleNgFeedbackSubmit(i),onMemo:i=>this.handleMemo(i),onFinish:()=>this.endSession(),onMinimize:()=>{}}),this.questManager.startSession(this.sessionStartTime),this.renderCurrentQuest();const e=this.config.recording.maxDuration;return e>0&&(this.maxDurationTimer=setTimeout(()=>this.endSession(),e*1e3)),this.backupTimer=setInterval(()=>this.backupSession(),3e4),this.state="recording",this.events.emit({type:"session:started",sessionId:this.sessionId}),this.sessionId}async startSessionFromRemote(t){if(this.state!=="active")throw new Error("[FirstLook] Cannot start session: SDK not active. Call activate() first.");if(!this.config)throw new Error("[FirstLook] SDK not initialized.");const e=this.config.endpoint.replace(/\/ingest-session$/,""),s=await fetch(`${e}/export-quests?id=${encodeURIComponent(t)}`,{headers:{"X-API-Key":this.config.apiKey}});if(!s.ok)throw new Error(`[FirstLook] Failed to fetch quest set: ${s.status}`);const n=(await s.json()).quests;return this.startSession(n)}async endSession(){var i,n,o,l,c,d,h,p,g,f,m;if(this.state!=="recording"||!this.sessionId)return null;this.maxDurationTimer&&(clearTimeout(this.maxDurationTimer),this.maxDurationTimer=null),this.backupTimer&&(clearInterval(this.backupTimer),this.backupTimer=null),(i=this.sessionRecorder)==null||i.stop(),await((n=this.voiceRecorder)==null?void 0:n.stopAsync()),(o=this.shakeReporter)==null||o.stop(),(l=this.fieldMasker)==null||l.stop(),(c=this.watermark)==null||c.hide();const t=this.questManager.getResults();await Promise.allSettled(t.map(async b=>{if(b.voiceMemoBlob){try{b.voiceMemoBase64=await this.blobToBase64(b.voiceMemoBlob)}catch{}delete b.voiceMemoBlob}await Promise.allSettled(b.feedbacks.map(async x=>{if(x.voiceMemoBlob){try{x.voiceMemoBase64=await this.blobToBase64(x.voiceMemoBlob)}catch{}delete x.voiceMemoBlob}}))}));const e={sessionId:this.sessionId,projectId:this.config.projectId,userId:this.config.userId,role:this.config.role,deviceInfo:S(),startedAt:new Date(this.sessionStartTime).toISOString(),endedAt:new Date().toISOString(),duration:Math.floor((Date.now()-this.sessionStartTime)/1e3),quests:t,recordings:((d=this.sessionRecorder)==null?void 0:d.getSnapshots())??[]};await((h=this.storage)==null?void 0:h.saveSession(e));const s=((p=this.shakeReporter)==null?void 0:p.getAnnotations())??[];for(const b of s)await((g=this.storage)==null?void 0:g.saveAnnotation(this.sessionId,b));return await((f=this.storage)==null?void 0:f.enqueueUpload({session:e,annotations:s})),(m=this.questOverlay)==null||m.destroy(),this.questOverlay=null,this.state="finished",this.events.emit({type:"session:ended",sessionId:this.sessionId}),this.flushUploadQueue(!1),e}on(t,e){return this.events.on(t,e)}getState(){return this.state}destroy(){var t,e,s,i,n,o,l,c,d,h,p,g;this.maxDurationTimer&&(clearTimeout(this.maxDurationTimer),this.maxDurationTimer=null),this.backupTimer&&(clearInterval(this.backupTimer),this.backupTimer=null),(t=this.tapTrigger)==null||t.stop(),(e=this.deepLinkTrigger)==null||e.stop(),(s=this.keyboardTrigger)==null||s.stop(),C.clearPersisted(),(i=this.sessionRecorder)==null||i.stop(),(n=this.voiceRecorder)==null||n.stopAsync().catch(()=>{}),(o=this.shakeReporter)==null||o.stop(),(l=this.fieldMasker)==null||l.stop(),(c=this.watermark)==null||c.hide(),(d=this.questOverlay)==null||d.destroy(),(h=this.debugMenu)==null||h.hide(),(p=this.hostElement)==null||p.remove(),(g=this.storage)==null||g.close(),this.events.removeAll(),this.config=null,this.questManager=null,this.questOverlay=null,this.sessionRecorder=null,this.voiceRecorder=null,this.shakeReporter=null,this.fieldMasker=null,this.debugMenu=null,this.tapTrigger=null,this.deepLinkTrigger=null,this.keyboardTrigger=null,this.storage=null,this.hostElement=null,this.shadowRoot=null,this.sessionId=null,this.state="idle"}createShadowHost(){var e;(e=document.getElementById("firstlook-sdk-root"))==null||e.remove(),this.hostElement=document.createElement("div"),this.hostElement.id="firstlook-sdk-root",this.hostElement.style.cssText="position:fixed;inset:0;z-index:2147483647;pointer-events:none;",document.body.appendChild(this.hostElement),this.shadowRoot=this.hostElement.attachShadow({mode:"closed"});const t=document.createElement("style");t.textContent=W,this.shadowRoot.appendChild(t)}setupTriggers(){const t=this.config.triggers;this.tapTrigger=new $(t.tapCount,()=>this.onActivate()),this.tapTrigger.start(),t.deepLink&&(this.deepLinkTrigger=new C(()=>this.onActivate()),this.deepLinkTrigger.start()),t.keyboard&&(this.keyboardTrigger=new H(()=>this.onActivate()),this.keyboardTrigger.start()),t.customCheck&&t.customCheck()&&this.onActivate()}onActivate(){var t,e,s;this.state==="initialized"&&(this.state="active",(t=this.tapTrigger)==null||t.stop(),(e=this.deepLinkTrigger)==null||e.stop(),(s=this.keyboardTrigger)==null||s.stop(),this.events.emit({type:"sdk:activated"}),this.debugMenu=new _(this.shadowRoot,{onStartSession:()=>{this.events.emit({type:"sdk:activated"})},onReportIssue:()=>{var i,n;(n=(i=this.shakeReporter)==null?void 0:i.trigger)==null||n.call(i)},onClose:()=>{this.destroy()}}),this.debugMenu.show())}handleQuestOk(t){if(!this.questManager||!this.sessionRecorder)return;const e=this.sessionRecorder.getActionLogs();this.questManager.completeCurrentQuest(e,{comment:t||void 0}),this.renderCurrentQuest()}handleConcern(t){if(!this.questManager||!this.sessionRecorder)return;const e=this.sessionRecorder.getActionLogs();this.questManager.completeCurrentQuest(e,{comment:t,concern:!0}),this.renderCurrentQuest()}handleQuestNg(){if(!this.questManager||!this.questOverlay)return;const t=this.questManager.getCurrentQuest();t&&this.questOverlay.renderFeedbackModal(t.title,"ng")}handleNgFeedbackSubmit(t){if(!this.questManager||!this.sessionRecorder)return;const e=this.sessionRecorder.getActionLogs();this.questManager.failCurrentQuest(e,t||void 0),this.renderCurrentQuest()}handleMemo(t){if(!this.questManager||!t)return;const e={comment:t,timestamp:Date.now(),relativeTime:Date.now()-this.sessionStartTime};this.questManager.addFeedback(e)}renderCurrentQuest(){var s;if(!this.questManager||!this.questOverlay)return;const t=this.questManager.getStatus();if(t.isBlocked){const i=this.questManager.getCurrentQuest();this.questOverlay.renderBlocked((i==null?void 0:i.title)??"Unknown");return}if(t.isFinished){this.questOverlay.renderSummary(t.completed,t.failed,t.total);return}const e=this.questManager.getCurrentQuest();e&&this.questOverlay.renderQuest(e,this.questManager.getQuestStatuses(),((s=this.voiceRecorder)==null?void 0:s.recording)??!1)}async flushUploadQueue(t){if(!(!this.storage||!this.config||this.isFlushing)){this.isFlushing=!0;try{if(t){const s=navigator.connection;if(s&&s.type&&s.type!=="wifi"&&s.effectiveType!=="4g")return}const e=await this.storage.getPendingUploads();for(const s of e){if(s.attempts>=X){await this.storage.removeFromQueue(s.key);continue}if(s.attempts>0){const i=Math.pow(2,s.attempts)*1e3,n=s.lastAttemptAt??0;if(Date.now()-n<i)continue}try{(await fetch(this.config.endpoint,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":this.config.apiKey},body:JSON.stringify(s.payload)})).ok?await this.storage.removeFromQueue(s.key):await this.storage.incrementAttempts(s.key)}catch{await this.storage.incrementAttempts(s.key)}}}finally{this.isFlushing=!1}}}async backupSession(){var t;if(!(!this.storage||!this.sessionId||!this.config||!this.sessionRecorder))try{const e={sessionId:this.sessionId,projectId:this.config.projectId,userId:this.config.userId,role:this.config.role,deviceInfo:S(),startedAt:new Date(this.sessionStartTime).toISOString(),duration:Math.floor((Date.now()-this.sessionStartTime)/1e3),quests:((t=this.questManager)==null?void 0:t.getResults())??[],recordings:this.sessionRecorder.getSnapshots()};await this.storage.saveSession(e)}catch{}}blobToBase64(t){return new Promise((e,s)=>{const i=new FileReader;i.onloadend=()=>e(i.result),i.onerror=()=>s(i.error),i.readAsDataURL(t)})}}v.FirstLookSDK=V,Object.defineProperty(v,Symbol.toStringTag,{value:"Module"})});
//# sourceMappingURL=firstlook.umd.js.map
