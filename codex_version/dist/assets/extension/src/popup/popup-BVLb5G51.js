class c{mode="page";question="";response="";streaming=!1;errorMessage="";statusLabel="";progress=0;channel;constructor(e){this.channel=e}setQuestion(e){this.question=e}setMode(e){this.mode=e}ask(){this.question.trim().length!==0&&(this.response="",this.errorMessage="",this.statusLabel="Queued",this.progress=0,this.streaming=!0,this.channel.postMessage({type:"query",question:this.question,mode:this.mode}))}handleIncoming(e){if(e.type==="token"){this.response+=e.token;return}if(e.type==="done"){this.streaming=!1,this.statusLabel="Complete",this.progress=100;return}if(e.type==="status"){this.statusLabel=e.label,this.progress=e.progress;return}e.type==="error"&&(this.streaming=!1,this.errorMessage=e.message)}}const u=document.getElementById("app");if(!u)throw new Error("Popup root element was not found.");const r=typeof chrome<"u"&&chrome.runtime?.connect?chrome.runtime.connect({name:"llm-stream"}):null,t=new c({postMessage:s=>{r?.postMessage(s)}});u.innerHTML=`
  <main class="popup-shell">
    <h1>Converse With This Site</h1>
    <div class="mode-row">
      <button id="mode-page" type="button">Page</button>
      <button id="mode-site" type="button">Site</button>
    </div>
    <label for="question-input">Ask a question</label>
    <textarea id="question-input" rows="4"></textarea>
    <button id="send-button" type="button">Send</button>
    <div class="status-row">
      <span id="status-label"></span>
      <span id="status-progress"></span>
    </div>
    <progress id="status-bar" max="100" value="0"></progress>
    <p id="error" role="alert"></p>
    <div class="response">
      <div class="response-body" id="response-body"></div>
    </div>
  </main>
`;const i=n("question-input"),a=n("send-button"),l=n("mode-page"),d=n("mode-site"),m=n("response-body"),g=n("error"),h=n("status-label"),b=n("status-progress"),f=n("status-bar");i.addEventListener("input",()=>{t.setQuestion(i.value),o()});a.addEventListener("click",()=>{t.ask(),o()});l.addEventListener("click",()=>{p("page")});d.addEventListener("click",()=>{p("site")});r&&r.onMessage.addListener(s=>{y(s)&&(t.handleIncoming(s),o())});o();function p(s){t.setMode(s),o()}function o(){i.value=t.question,a.disabled=t.streaming||t.question.trim().length===0,a.textContent=t.streaming?"Streaming…":"Send",m.textContent=t.streaming?`${t.response}▋`:t.response,g.textContent=t.errorMessage,h.textContent=t.statusLabel,b.textContent=`${t.progress}%`,f.value=t.progress,l.classList.toggle("active",t.mode==="page"),d.classList.toggle("active",t.mode==="site")}function n(s){const e=document.getElementById(s);if(!e)throw new Error(`Expected element with id "${s}"`);return e}function y(s){if(typeof s!="object"||s===null)return!1;const e=s.type;return e==="token"||e==="status"||e==="done"||e==="error"||e==="query"}
