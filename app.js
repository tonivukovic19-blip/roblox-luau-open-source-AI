const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let files=[];
let messages=[];
const KEY="robobrain_memory_v1";

function getMemory(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function setMemory(x){localStorage.setItem(KEY,JSON.stringify(x))}
function esc(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function renderText(s){
  s=esc(s);
  s=s.replace(/```(?:lua|luau)?\n?([\s\S]*?)```/g,(_,c)=>`<pre><code>${c.trim()}</code></pre>`);
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/\n/g,"<br>");
  return s;
}
function addMessage(role,text,actions=false){
  const empty=$(".welcome"); if(empty) empty.remove();
  const row=document.createElement("div"); row.className=`msg ${role}`;
  row.innerHTML=`<div class="avatar">${role==="user"?"YOU":"RB"}</div><div class="bubble">${renderText(text)}${actions?`<div class="actions"><button class="mini save-answer">Save to memory</button><button class="mini good-answer">👍 Good</button><button class="mini bad-answer">👎 Needs fix</button></div>`:""}</div>`;
  $("#messages").appendChild(row); $("#messages").scrollTop=$("#messages").scrollHeight;
  if(actions){
    row.querySelector(".save-answer").onclick=()=>saveMemory("Useful AI answer",text);
    row.querySelector(".good-answer").onclick=()=>saveMemory("Good example",`User request: ${messages[messages.length-2]?.content||""}\nAI answer: ${text}`);
    row.querySelector(".bad-answer").onclick=()=>saveMemory("Correction needed",`User request: ${messages[messages.length-2]?.content||""}\nAI answer that needs improvement: ${text}`);
  }
}
function saveMemory(title,text){
  const m=getMemory(); m.unshift({id:Date.now(),title,text:text.slice(0,12000)}); setMemory(m.slice(0,100)); renderMemory();
}
function renderMemory(){
  const box=$("#memoryList"), m=getMemory();
  box.innerHTML=m.length?m.map(x=>`<div class="memory-card"><b>${esc(x.title)}</b><p>${esc(x.text)}</p><button data-id="${x.id}">Delete</button></div>`).join(""):`<div class="memory-card"><b>No saved memories yet.</b><p>Use “Save to memory” after a good answer, or teach the AI a lesson.</p></div>`;
  $$("#memoryList button").forEach(b=>b.onclick=()=>{setMemory(getMemory().filter(x=>x.id!=b.dataset.id));renderMemory()});
}
async function send(){
  const input=$("#input"), text=input.value.trim(); if(!text||$("#send").disabled)return;
  input.value=""; autoSize(); addMessage("user",text);
  messages.push({role:"user",content:text});
  $("#send").disabled=true; $("#send").textContent="Thinking…";
  const memory=getMemory().slice(0,20).map(x=>`[${x.title}]\n${x.text}`).join("\n\n");
  const fileText=files.map(f=>`\n--- FILE: ${f.name} ---\n${f.text}`).join("\n");
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages,memory,fileText})});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||"Request failed");
    addMessage("assistant",data.answer,true);
    messages.push({role:"assistant",content:data.answer});
  }catch(e){addMessage("assistant","I couldn't reach the AI server.\n\n"+e.message+"\n\nIf this is your first deployment, check that OPENROUTER_API_KEY is set in Vercel.");}
  $("#send").disabled=false; $("#send").textContent="Send ↗";
}
function autoSize(){const x=$("#input");x.style.height="auto";x.style.height=Math.min(x.scrollHeight,180)+"px"}
$("#input").addEventListener("input",autoSize);
$("#input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});
$("#send").onclick=send;
$("#newChat").onclick=()=>{messages=[];$("#messages").innerHTML=`<div class="welcome"><div class="welcome-icon">⌘</div><h2>Your Roblox coding AI</h2><p>Ask for Luau scripts, debugging, explanations, systems, or improvements.</p></div>`};
$("#fileInput").onchange=async e=>{
  for(const f of e.target.files){files.push({name:f.name,text:await f.text()})}
  renderFiles(); e.target.value="";
};
function renderFiles(){$("#fileChips").innerHTML=files.map((f,i)=>`<span class="file-chip">${esc(f.name)} <button data-i="${i}" style="border:0;background:none;color:#aab3c2;cursor:pointer">×</button></span>`).join("");$$("#fileChips button").forEach(b=>b.onclick=()=>{files.splice(+b.dataset.i,1);renderFiles()})}
$("#clearFiles").onclick=()=>{files=[];renderFiles()};
$$(".prompt-btn,.card-prompt").forEach(b=>b.onclick=()=>{$("#input").value=b.dataset.prompt||b.textContent.trim();autoSize();$("#input").focus()});
$$(".side-btn").forEach(b=>b.onclick=()=>{$$(".side-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".panel").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.panel+"Panel").classList.add("active");if(b.dataset.panel==="memory")renderMemory()});
$("#clearMemory").onclick=()=>{if(confirm("Clear all saved memory?")){setMemory([]);renderMemory()}};
$("#saveLesson").onclick=()=>{const n=$("#lessonName").value.trim(),t=$("#lessonText").value.trim();if(!n||!t)return alert("Add a lesson name and some content.");saveMemory(n,t);$("#lessonName").value="";$("#lessonText").value="";alert("Lesson saved.")};
renderMemory();
