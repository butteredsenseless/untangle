import { useState, useEffect, useRef, useCallback } from "react";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const DEFAULT_AREAS = [
  { id:"work",     label:"Work & Career",            emoji:"💼", color:"#4F86C6", bg:"#EBF2FB", tags:["work","career","job","meeting","email"], custom:false },
  { id:"health",   label:"Health & Fitness",          emoji:"💪", color:"#5BAD6F", bg:"#EBF7EF", tags:["health","fitness","gym","workout","run","walk","doctor","meds"], custom:false },
  { id:"home",     label:"Home & Chores",             emoji:"🏠", color:"#E09B3D", bg:"#FDF3E3", tags:["home","chores","clean","cook","dishes","laundry","shopping","groceries"], custom:false },
  { id:"social",   label:"Social & Relationships",    emoji:"❤️", color:"#D96B8A", bg:"#FCEEF3", tags:["social","friends","family","date","call","message","relationship"], custom:false },
  { id:"finance",  label:"Finance",                   emoji:"💰", color:"#8B6FBE", bg:"#F3EFFB", tags:["finance","money","bills","budget","bank","tax","pay"], custom:false },
  { id:"hobbies",  label:"Hobbies & Fun",             emoji:"🎨", color:"#E05C3A", bg:"#FDEEE9", tags:["hobby","hobbies","fun","game","music","art","creative","play"], custom:false },
  { id:"selfcare", label:"Self-care & Mental Health", emoji:"🌿", color:"#3AABB5", bg:"#E8F7F8", tags:["selfcare","self-care","mental","meditate","journal","relax","rest","sleep","therapy"], custom:false },
  { id:"learning", label:"Learning & Growth",         emoji:"📚", color:"#C07A3A", bg:"#FBF2E8", tags:["learn","learning","study","course","book","read","skill","practice"], custom:false },
  { id:"admin",    label:"Admin",                     emoji:"📋", color:"#6B7280", bg:"#F3F4F6", tags:["admin","paperwork","form","bureaucracy","appointment"], custom:false },
];

const HORIZONS = [
  { id:"today",   label:"Today",        icon:"⚡" },
  { id:"week",    label:"This Week",    icon:"📅" },
  { id:"month",   label:"This Month",   icon:"🗓️" },
  { id:"project", label:"Big Projects", icon:"🚀" },
];
const HORIZON_TAGS = {
  today:["today","now","asap","urgent","daily"],
  week:["week","weekly","thisweek","soon"],
  month:["month","monthly","thismonth"],
  project:["project","bigpicture","longterm","someday"],
};
const ENERGY = [
  { id:"low",    label:"Low",    emoji:"🌙", color:"#8B6FBE" },
  { id:"medium", label:"Medium", emoji:"☀️", color:"#E09B3D" },
  { id:"high",   label:"High",   emoji:"⚡", color:"#5BAD6F" },
];
const RECUR_OPTIONS = [
  { id:"none",    label:"One-time" },
  { id:"daily",   label:"Daily" },
  { id:"weekday", label:"Weekdays" },
  { id:"weekly",  label:"Weekly" },
  { id:"monthly", label:"Monthly" },
];
const EVOLUTION_STAGES = [
  { id:"amoeba",         name:"Amoeba",               emoji:"🦠", minXp:0,    color:"#88bbcc", desc:"Just a single cell. Every journey starts here." },
  { id:"fish",           name:"Fish",                  emoji:"🐟", minXp:50,   color:"#4488cc", desc:"You've left the primordial soup. The sea is yours." },
  { id:"lizard",         name:"Lizard",                emoji:"🦎", minXp:150,  color:"#5baa6f", desc:"On land. Basking in the sun of your productivity." },
  { id:"primate",        name:"Primate",               emoji:"🐒", minXp:300,  color:"#c07a3a", desc:"Opposable thumbs. Big brain energy. Tasks fear you." },
  { id:"human",          name:"Human",                 emoji:"🧑", minXp:500,  color:"#4F86C6", desc:"You are the apex. For now." },
  { id:"astronaut",      name:"Astronaut",             emoji:"👨‍🚀", minXp:750,  color:"#8B6FBE", desc:"The planet can't contain you anymore." },
  { id:"interplanetary", name:"Interplanetary Being",  emoji:"🌌", minXp:1000, color:"#E05C3A", desc:"You have transcended. Tasks are but stardust." },
];
const XP_PER_TASK = { low:5, medium:10, high:15 };
const PALETTE = ["#4F86C6","#5BAD6F","#E09B3D","#D96B8A","#8B6FBE","#E05C3A","#3AABB5","#C07A3A","#6B7280","#E84393","#0EA5E9","#10B981"];
const TEMPLATE_CSV = `title,area,horizon,energy,recur,deadline,note
Call dentist #health,health,today,medium,none,Friday,
Weekly review #work,work,week,high,weekly,,Reflect on progress
Clean kitchen #home,home,today,low,weekly,,
Read 20 pages #learning,learning,week,low,daily,,
Pay rent #finance,finance,month,medium,monthly,1st of month,
Catch up with friend #social,social,week,medium,none,,
Morning walk #health,health,today,low,daily,,
Plan monthly budget #finance,finance,month,high,monthly,,`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);
const todayStr = () => new Date().toISOString().slice(0,10);
const colorBg = c => c+"22";
const hour = () => new Date().getHours();
const isEvening = () => hour() >= 19;
const isMorning = () => hour() >= 6 && hour() < 12;

function parseHashtags(title) {
  const tags = [];
  const clean = title.replace(/#(\w[-\w]*)/g,(_,t)=>{ tags.push(t.toLowerCase()); return ""; }).trim();
  return { clean, tags };
}
function inferFromTags(tags, areas) {
  let area=null, horizon=null;
  for (const tag of tags) {
    if (!area) for (const a of areas) if (a.tags?.includes(tag)||a.id===tag) { area=a.id; break; }
    if (!horizon) for (const [h,ht] of Object.entries(HORIZON_TAGS)) if (ht.includes(tag)||h===tag) { horizon=h; break; }
  }
  return { area, horizon };
}
function getStage(xp) {
  let s=EVOLUTION_STAGES[0];
  for (const st of EVOLUTION_STAGES) if (xp>=st.minXp) s=st;
  return s;
}
function getNextStage(xp) { return EVOLUTION_STAGES.find(s=>s.minXp>xp)||null; }
function shouldRecurToday(task) {
  if (!task.recur||task.recur==="none") return false;
  if (task.lastRecurDate===todayStr()) return false;
  const day=new Date().getDay();
  if (task.recur==="daily") return true;
  if (task.recur==="weekday") return day>=1&&day<=5;
  if (task.recur==="weekly") return new Date(task.createdAt).getDay()===day;
  if (task.recur==="monthly") return new Date(task.createdAt).getDate()===new Date().getDate();
  return false;
}
async function parseUploadedFile(file, areas) {
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try {
        const lines=e.target.result.split(/\r?\n/).filter(Boolean);
        const headers=lines[0].toLowerCase().split(",").map(h=>h.trim());
        const tasks=lines.slice(1).map(line=>{
          const vals=line.split(",").map(v=>v.trim());
          const obj={};
          headers.forEach((h,i)=>obj[h]=vals[i]||"");
          const {clean,tags}=parseHashtags(obj.title||"");
          const {area:ia,horizon:ih}=inferFromTags(tags,areas);
          return { id:uid(), title:clean||obj.title, area:areas.find(a=>a.id===obj.area)?.id||ia||areas[0].id, horizon:HORIZONS.find(h=>h.id===obj.horizon)?.id||ih||"week", energy:ENERGY.find(e=>e.id===obj.energy)?.id||"medium", recur:RECUR_OPTIONS.find(r=>r.id===obj.recur)?.id||"none", deadline:obj.deadline||"", note:obj.note||"", done:false, createdAt:Date.now(), subtasks:[] };
        }).filter(t=>t.title);
        resolve(tasks);
      } catch { resolve([]); }
    };
    reader.readAsText(file);
  });
}

// ── LOGO SVG ──────────────────────────────────────────────────────────────────
function UntangleLogo({ size=32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#lg)"/>
      <path d="M10 14 Q15 14 15 20 Q15 26 22 26 Q29 26 29 20 Q29 14 24 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M13 20 Q18 20 18 26 Q18 32 25 32" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <circle cx="29" cy="20" r="2.5" fill="white"/>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#3AABB5"/><stop offset="1" stopColor="#4F86C6"/></linearGradient></defs>
    </svg>
  );
}

// ── CONFETTI ──────────────────────────────────────────────────────────────────
function ConfettiPop({ x, y }) {
  const pieces=Array.from({length:14},(_,i)=>({ id:i, color:["#4F86C6","#5BAD6F","#E09B3D","#D96B8A","#3AABB5","#E05C3A","#f0d060"][i%7], angle:(i/14)*360, dist:45+Math.random()*35 }));
  return (
    <div style={{position:"fixed",left:x,top:y,pointerEvents:"none",zIndex:9999}}>
      {pieces.map(p=><div key={p.id} style={{position:"absolute",width:8,height:8,borderRadius:2,background:p.color,animation:"cfly1 0.65s ease-out forwards","--dx":`${Math.cos(p.angle*Math.PI/180)*p.dist}px`,"--dy":`${Math.sin(p.angle*Math.PI/180)*p.dist}px`}}/>)}
      <style>{`@keyframes cfly1{to{transform:translate(var(--dx),var(--dy)) rotate(360deg);opacity:0}}`}</style>
    </div>
  );
}

// ── XP BAR ────────────────────────────────────────────────────────────────────
function XpBar({ xp }) {
  const stage=getStage(xp), next=getNextStage(xp);
  const progress=next?Math.round(((xp-stage.minXp)/(next.minXp-stage.minXp))*100):100;
  return (
    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 14px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:22}}>{stage.emoji}</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{color:"#fff",fontWeight:900,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{stage.name}</span>
            <span style={{color:"rgba(255,255,255,0.45)",fontSize:11,fontWeight:600}}>{xp} XP{next?` · ${next.minXp-xp} to ${next.emoji}`:""}</span>
          </div>
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.1)",borderRadius:20,height:6,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:20,width:`${progress}%`,background:`linear-gradient(90deg,${stage.color},${next?.color||stage.color})`,transition:"width 0.8s cubic-bezier(.23,1,.32,1)",boxShadow:`0 0 6px ${stage.color}88`}}/>
      </div>
    </div>
  );
}

// ── LEVEL UP SPLASH ───────────────────────────────────────────────────────────
function LevelUpSplash({ stage, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,3200); return()=>clearTimeout(t); },[]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onDone}>
      <div style={{textAlign:"center",animation:"splashIn 0.45s cubic-bezier(.23,1,.32,1)"}}>
        <div style={{fontSize:96,marginBottom:12,filter:"drop-shadow(0 0 40px rgba(255,255,255,0.35))"}}>{stage.emoji}</div>
        <div style={{color:"#fff",fontSize:11,letterSpacing:"0.2em",fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:0.6,marginBottom:6}}>YOU EVOLVED</div>
        <div style={{color:stage.color,fontSize:32,fontWeight:900,fontFamily:"'DM Sans',sans-serif"}}>{stage.name}</div>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:14,marginTop:10,maxWidth:260,margin:"10px auto 0",fontFamily:"'DM Sans',sans-serif"}}>{stage.desc}</div>
        <div style={{color:"rgba(255,255,255,0.25)",fontSize:11,marginTop:20}}>tap to continue</div>
      </div>
      <style>{`@keyframes splashIn{from{transform:scale(0.4) rotate(-8deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}`}</style>
    </div>
  );
}

// ── ONE THING PROMPT BANNER ───────────────────────────────────────────────────
function OneThingBanner({ tasks, onSet, onDismiss }) {
  const h=hour();
  const isEve=h>=19, isMorn=h>=6&&h<12;
  if (!isEve&&!isMorn) return null;
  const msg = isEve
    ? { title:"🌙 Before you close up…", body:"What's your One Thing for tomorrow?", cta:"Set it now" }
    : { title:"☀️ Good morning!", body:"Don't forget to set your One Thing for today.", cta:"Set it" };
  const todayTasks = tasks.filter(t=>!t.done&&(t.horizon==="today"||t.horizon==="week"));
  return (
    <div style={{background:"linear-gradient(135deg,#1a3a2a,#1e4d35)",border:"2px solid #2d6e4a",borderRadius:16,padding:"14px 16px",marginBottom:16,position:"relative",boxShadow:"0 4px 20px rgba(45,110,74,0.25)"}}>
      <button onClick={onDismiss} style={{position:"absolute",top:10,right:12,background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:14,color:"#7ed9a0",marginBottom:3}}>{msg.title}</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.65)",marginBottom:12}}>{msg.body}</div>
      {todayTasks.length>0?(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7}}>Pick from your tasks or type one:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
            {todayTasks.slice(0,5).map(t=>(
              <button key={t.id} onClick={()=>onSet(t.title)} style={{padding:"5px 10px",borderRadius:20,border:"2px solid rgba(126,217,160,0.3)",background:"rgba(126,217,160,0.08)",color:"#7ed9a0",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}>{t.title}</button>
            ))}
          </div>
          <CustomOneThingInput onSet={onSet}/>
        </div>
      ):(
        <CustomOneThingInput onSet={onSet} autoFocus/>
      )}
    </div>
  );
}
function CustomOneThingInput({ onSet, autoFocus=false }) {
  const [val,setVal]=useState("");
  return (
    <div style={{display:"flex",gap:7}}>
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&val.trim()&&onSet(val.trim())} autoFocus={autoFocus}
        placeholder="Or type your own…"
        style={{flex:1,padding:"8px 12px",borderRadius:10,border:"2px solid rgba(126,217,160,0.3)",background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
      <button onClick={()=>val.trim()&&onSet(val.trim())} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"#3AABB5",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Set ✓</button>
    </div>
  );
}

// ── THE ONE THING CARD ────────────────────────────────────────────────────────
function OneThingCard({ oneThing, onClear }) {
  return (
    <div style={{background:"linear-gradient(135deg,#0d2e1a,#0f3d22)",border:"2px solid #2d8c55",borderRadius:18,padding:"16px 18px",marginBottom:16,position:"relative",boxShadow:"0 0 0 4px rgba(45,140,85,0.12),0 6px 24px rgba(45,140,85,0.2)",animation:"glowPulse 3s ease-in-out infinite"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#2d8c55,#3AABB5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🎯</div>
        <div style={{flex:1}}>
          <div style={{fontSize:10,fontWeight:800,color:"#4ade80",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>The One Thing</div>
          <div style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:"'DM Sans',sans-serif",lineHeight:1.3}}>{oneThing}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4}}>Focus here first. Everything else can wait.</div>
        </div>
        <button onClick={onClear} title="Clear" style={{background:"none",border:"none",color:"rgba(255,255,255,0.2)",fontSize:16,cursor:"pointer",padding:"2px 4px"}}>×</button>
      </div>
      <style>{`@keyframes glowPulse{0%,100%{box-shadow:0 0 0 4px rgba(45,140,85,0.12),0 6px 24px rgba(45,140,85,0.2)}50%{box-shadow:0 0 0 6px rgba(45,140,85,0.18),0 6px 32px rgba(45,140,85,0.35)}}`}</style>
    </div>
  );
}

// ── TASK CARD ─────────────────────────────────────────────────────────────────
function TaskCard({ task, areas, onComplete, onDelete, onBreakdown, onFocus, compact=false }) {
  const area=areas.find(a=>a.id===task.area)||areas[0];
  const energy=ENERGY.find(e=>e.id===task.energy);
  const recur=RECUR_OPTIONS.find(r=>r.id===task.recur);
  const [pop,setPop]=useState(null);
  const cardRef=useRef(null);
  const handleComplete=()=>{
    if(task.done)return;
    const rect=cardRef.current?.getBoundingClientRect();
    if(rect)setPop({x:rect.left+20,y:rect.top+20});
    setTimeout(()=>{setPop(null);onComplete(task.id);},650);
  };
  return (
    <div ref={cardRef} style={{background:"#fff",border:`1.5px solid ${area.color}18`,borderLeft:`4px solid ${area.color}`,borderRadius:14,padding:compact?"9px 13px":"13px 16px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:11,boxShadow:"0 1px 6px rgba(0,0,0,0.04)",opacity:task.done?0.4:1,transition:"transform 0.15s,box-shadow 0.15s"}}
      onMouseEnter={e=>{if(!task.done){e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)";}}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,0.04)";}}>
      {pop&&<ConfettiPop x={pop.x} y={pop.y}/>}
      <button onClick={handleComplete} style={{width:24,height:24,minWidth:24,borderRadius:"50%",border:`2px solid ${area.color}`,background:task.done?area.color:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1,transition:"all 0.2s"}}>
        {task.done&&<span style={{color:"#fff",fontSize:11}}>✓</span>}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,color:"#1a1a1a",textDecoration:task.done?"line-through":"none"}}>{task.title}</span>
          {energy&&<span title={energy.label} style={{fontSize:13}}>{energy.emoji}</span>}
          {recur?.id!=="none"&&<span style={{fontSize:10,background:"#f0f0ff",color:"#8B6FBE",padding:"2px 6px",borderRadius:20,fontWeight:700}}>🔁 {recur.label}</span>}
        </div>
        {task.note&&<div style={{fontSize:12,color:"#aaa",marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>{task.note}</div>}
        <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
          <span style={{fontSize:11,background:area.bg||colorBg(area.color),color:area.color,padding:"2px 8px",borderRadius:20,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{area.emoji} {area.label}</span>
          {task.deadline&&<span style={{fontSize:11,background:"#fff3e0",color:"#E09B3D",padding:"2px 8px",borderRadius:20,fontWeight:600}}>📅 {task.deadline}</span>}
        </div>
        {task.subtasks?.length>0&&<div style={{marginTop:7,paddingLeft:4}}>{task.subtasks.map((st,i)=><div key={i} style={{fontSize:12,color:st.done?"#bbb":"#666",textDecoration:st.done?"line-through":"none",marginBottom:2,fontFamily:"'DM Sans',sans-serif"}}>↳ {st.title}</div>)}</div>}
      </div>
      {!task.done&&(
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {onFocus&&<button onClick={()=>onFocus(task)} title="Focus" style={{background:"none",border:"none",cursor:"pointer",fontSize:13,opacity:0.35,padding:0}}>🎯</button>}
          {onBreakdown&&<button onClick={()=>onBreakdown(task)} title="AI break down" style={{background:"none",border:"none",cursor:"pointer",fontSize:13,opacity:0.35,padding:0}}>🤖</button>}
        </div>
      )}
      <button onClick={()=>onDelete(task.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ddd",fontSize:16,padding:"0 2px"}}>×</button>
    </div>
  );
}

// ── VOICE DUMP ────────────────────────────────────────────────────────────────
function VoiceDumpModal({ areas, onAddMany, onClose }) {
  const [transcript,setTranscript]=useState("");
  const [listening,setListening]=useState(false);
  const [status,setStatus]=useState("Tap the mic and start speaking");
  const [supported,setSupported]=useState(true);
  const recRef=useRef(null);

  useEffect(()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setSupported(false);return;}
    const rec=new SR();
    rec.continuous=true; rec.interimResults=true; rec.lang="en-GB";
    let final="";
    rec.onresult=e=>{
      let interim="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const t=e.results[i][0].transcript;
        if(e.results[i].isFinal)final+=t+" ";
        else interim=t;
      }
      setTranscript(final+interim);
    };
    rec.onerror=e=>{setStatus("Mic error: "+e.error);setListening(false);};
    rec.onend=()=>{setListening(false);setStatus("Done! Edit below or import now.");};
    recRef.current=rec;
    return()=>{try{rec.stop();}catch{}};
  },[]);

  const toggle=()=>{
    if(listening){recRef.current?.stop();setListening(false);}
    else{recRef.current?.start();setListening(true);setStatus("Listening… speak freely!");}
  };

  const handleImport=()=>{
    const lines=transcript.split(/[.!?\n]/).map(l=>l.trim()).filter(l=>l.length>2);
    const tasks=lines.map(line=>{
      const{clean,tags}=parseHashtags(line);
      const{area,horizon}=inferFromTags(tags,areas);
      return{id:uid(),title:clean||line,area:area||areas[0].id,horizon:horizon||"week",energy:"medium",note:"",deadline:"",recur:"none",done:false,createdAt:Date.now(),subtasks:[]};
    });
    onAddMany(tasks);onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.2)"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,marginBottom:4}}>🎤 Voice Brain Dump</h2>
        <p style={{fontSize:12,color:"#aaa",marginBottom:18}}>Works in Chrome, Safari, Edge. Speak freely — each sentence becomes a task.</p>
        {!supported?(
          <div style={{background:"#fff8e1",borderRadius:12,padding:14,marginBottom:16}}>
            <p style={{fontSize:13,color:"#b8860b",fontWeight:700,margin:0}}>⚠️ Voice not supported in this browser</p>
            <p style={{fontSize:12,color:"#b8860b",margin:"6px 0 0"}}>Try Chrome or Safari. Or paste a transcript from your Voice Memos app below!</p>
          </div>
        ):(
          <div style={{textAlign:"center",marginBottom:18}}>
            <button onClick={toggle} style={{width:76,height:76,borderRadius:"50%",border:"none",background:listening?"#E05C3A":"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:30,cursor:"pointer",boxShadow:listening?"0 0 0 10px rgba(224,92,58,0.2)":"0 4px 20px rgba(58,171,181,0.4)",transition:"all 0.3s",animation:listening?"mpulse 1.5s infinite":"none"}}>
              {listening?"⏹":"🎤"}
            </button>
            <p style={{fontSize:12,color:"#aaa",marginTop:10}}>{status}</p>
          </div>
        )}
        <textarea value={transcript} onChange={e=>setTranscript(e.target.value)}
          placeholder={supported?"Your speech appears here…":"Paste your Voice Memo transcript here…"}
          rows={6} style={{width:"100%",padding:"11px 13px",borderRadius:12,border:"2px solid #e5e5e5",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical",lineHeight:1.7}}/>
        <p style={{fontSize:11,color:"#ccc",margin:"4px 0 14px"}}>Each sentence → one task. Edit freely before importing.</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleImport} disabled={!transcript.trim()} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:transcript.trim()?"linear-gradient(135deg,#3AABB5,#4F86C6)":"#e5e5e5",color:transcript.trim()?"#fff":"#aaa",fontSize:14,fontWeight:800,cursor:transcript.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>Import tasks ✓</button>
          <button onClick={onClose} style={{padding:"12px 16px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
        </div>
        <style>{`@keyframes mpulse{0%,100%{box-shadow:0 0 0 10px rgba(224,92,58,0.2)}50%{box-shadow:0 0 0 18px rgba(224,92,58,0.08)}}`}</style>
      </div>
    </div>
  );
}

// ── TEMPLATE MODAL ────────────────────────────────────────────────────────────
function TemplateModal({ onClose }) {
  const [copied,setCopied]=useState(false);
  const copy=()=>{ navigator.clipboard.writeText(TEMPLATE_CSV).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:560,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",maxHeight:"85vh",overflowY:"auto"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,marginBottom:4}}>📥 CSV Import Template</h2>
        <p style={{fontSize:13,color:"#aaa",marginBottom:14}}>Copy this template into a spreadsheet app, fill in your tasks, export as CSV, then import into Untangle.</p>
        <div style={{background:"#1a1a2e",borderRadius:14,padding:"14px 16px",marginBottom:14,overflowX:"auto"}}>
          <pre style={{margin:0,fontSize:12,color:"#a0cfff",fontFamily:"'Courier New',monospace",lineHeight:1.7,whiteSpace:"pre"}}>{TEMPLATE_CSV}</pre>
        </div>
        <div style={{background:"#f8f8f8",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
          <p style={{fontSize:12,fontWeight:700,color:"#666",margin:"0 0 6px"}}>Column guide:</p>
          {[["title","Task name. Add #hashtags to auto-sort"],["area","work · health · home · social · finance · hobbies · selfcare · learning · admin"],["horizon","today · week · month · project"],["energy","low · medium · high"],["recur","none · daily · weekday · weekly · monthly"],["deadline","Any text e.g. 'Friday'"],["note","Optional notes"]].map(([col,desc])=>(
            <div key={col} style={{display:"flex",gap:8,marginBottom:4}}>
              <span style={{fontSize:11,fontWeight:800,color:"#3AABB5",minWidth:70,fontFamily:"'Courier New',monospace"}}>{col}</span>
              <span style={{fontSize:11,color:"#888"}}>{desc}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={copy} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:copied?"#5BAD6F":"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"background 0.3s"}}>
            {copied?"✓ Copied!":"Copy to clipboard"}
          </button>
          <button onClick={onClose} style={{padding:"12px 16px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── BRAIN DUMP ────────────────────────────────────────────────────────────────
function BrainDumpModal({ areas, onAddMany, onClose }) {
  const [text,setText]=useState("");
  const go=()=>{
    const tasks=text.split("\n").map(l=>l.trim()).filter(Boolean).map(line=>{
      const{clean,tags}=parseHashtags(line);
      const{area,horizon}=inferFromTags(tags,areas);
      return{id:uid(),title:clean||line,area:area||areas[0].id,horizon:horizon||"week",energy:"medium",note:"",deadline:"",recur:"none",done:false,createdAt:Date.now(),subtasks:[]};
    });
    onAddMany(tasks);onClose();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,marginBottom:4}}>🧠 Brain Dump</h2>
        <p style={{fontSize:13,color:"#aaa",marginBottom:14}}>One task per line. Use #tags to auto-sort. Just get it out.</p>
        <textarea value={text} onChange={e=>setText(e.target.value)} autoFocus
          placeholder={"Call dentist #health #today\nFinish report #work #week\nClean bathroom #home\nRead chapter 5 #learning #daily"}
          rows={10} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"2px solid #e5e5e5",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical",lineHeight:1.8}}/>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={go} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Import all ✓</button>
          <button onClick={onClose} style={{padding:"12px 16px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── UPLOAD MODAL ──────────────────────────────────────────────────────────────
function UploadModal({ areas, onAddMany, onClose }) {
  const [preview,setPreview]=useState(null);
  const [parsed,setParsed]=useState([]);
  const [dragging,setDragging]=useState(false);
  const fileRef=useRef(null);
  const handleFile=async f=>{
    const tasks=await parseUploadedFile(f,areas);
    setParsed(tasks);setPreview({name:f.name,count:tasks.length});
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,marginBottom:4}}>📎 Import Tasks</h2>
        <p style={{fontSize:12,color:"#aaa",marginBottom:16}}>Upload a CSV or TXT file. Use the Template button to get the right format.</p>
        {!preview?(
          <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
            onClick={()=>fileRef.current?.click()}
            style={{border:`2px dashed ${dragging?"#3AABB5":"#ddd"}`,borderRadius:16,padding:"36px 20px",textAlign:"center",cursor:"pointer",background:dragging?"#E8F7F8":"#fafafa",transition:"all 0.2s"}}>
            <div style={{fontSize:40,marginBottom:8}}>📂</div>
            <p style={{fontWeight:700,color:"#888",margin:0,fontFamily:"'DM Sans',sans-serif"}}>Drop a CSV / TXT here</p>
            <p style={{fontSize:12,color:"#bbb",margin:"4px 0 0"}}>or tap to browse</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={e=>{if(e.target.files[0])handleFile(e.target.files[0]);}}/>
          </div>
        ):(
          <div>
            <div style={{background:"#e8f5e9",borderRadius:14,padding:"12px 14px",marginBottom:14}}>
              <p style={{margin:0,fontWeight:800,color:"#5BAD6F",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>✓ {preview.name}</p>
              <p style={{margin:"3px 0 0",fontSize:13,color:"#5BAD6F"}}>{preview.count} tasks ready to import</p>
            </div>
            <div style={{maxHeight:180,overflowY:"auto",marginBottom:12}}>
              {parsed.map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"#fafafa",borderRadius:10,marginBottom:4}}>
                  <span style={{fontSize:12,color:"#ccc"}}>{i+1}.</span>
                  <span style={{fontSize:13,flex:1,color:"#333",fontFamily:"'DM Sans',sans-serif"}}>{t.title}</span>
                  <span style={{fontSize:13}}>{areas.find(a=>a.id===t.area)?.emoji}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          {preview&&<button onClick={()=>{onAddMany(parsed);onClose();}} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Import {parsed.length} tasks ✓</button>}
          <button onClick={onClose} style={{padding:"12px 16px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          {preview&&<button onClick={()=>{setPreview(null);setParsed([]);}} style={{padding:"12px 14px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Re-upload</button>}
        </div>
      </div>
    </div>
  );
}

// ── ADD TASK MODAL ────────────────────────────────────────────────────────────
function AddTaskModal({ areas, onAdd, onClose }) {
  const [raw,setRaw]=useState("");
  const [area,setArea]=useState(areas[0]?.id);
  const [horizon,setHorizon]=useState("today");
  const [energy,setEnergy]=useState("medium");
  const [note,setNote]=useState("");
  const [deadline,setDeadline]=useState("");
  const [recur,setRecur]=useState("none");
  const [tags,setTags]=useState([]);
  useEffect(()=>{
    const{tags:t}=parseHashtags(raw);
    const{area:a,horizon:h}=inferFromTags(t,areas);
    setTags(t);if(a)setArea(a);if(h)setHorizon(h);
  },[raw]);
  const go=()=>{
    if(!raw.trim())return;
    const{clean}=parseHashtags(raw);
    onAdd({id:uid(),title:clean||raw.trim(),area,horizon,energy,note,deadline,recur,done:false,createdAt:Date.now(),subtasks:[]});
    onClose();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",maxHeight:"90vh",overflowY:"auto"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,marginBottom:5}}>✨ Add a task</h2>
        <p style={{fontSize:12,color:"#aaa",marginBottom:14}}>Use #tags to auto-sort — e.g. <em>#home #today #daily</em></p>
        <input value={raw} onChange={e=>setRaw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} autoFocus
          placeholder="What needs doing? #work #weekly"
          style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"2px solid #e5e5e5",fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
        {tags.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{tags.map(t=><span key={t} style={{fontSize:11,background:"#e8f5e9",color:"#5BAD6F",padding:"2px 8px",borderRadius:20,fontWeight:700}}>#{t}</span>)}</div>}
        <div style={{marginBottom:12}}>
          <label style={lbl}>Area</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{areas.map(a=><button key={a.id} onClick={()=>setArea(a.id)} style={{padding:"4px 9px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",border:`2px solid ${a.color}`,background:area===a.id?a.color:(a.bg||colorBg(a.color)),color:area===a.id?"#fff":a.color}}>{a.emoji} {a.label}</button>)}</div>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <div style={{flex:1}}>
            <label style={lbl}>When?</label>
            {HORIZONS.map(h=><button key={h.id} onClick={()=>setHorizon(h.id)} style={{display:"block",width:"100%",textAlign:"left",marginBottom:4,padding:"6px 10px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",border:`2px solid ${horizon===h.id?"#3AABB5":"#e5e5e5"}`,background:horizon===h.id?"#E8F7F8":"#fafafa",color:horizon===h.id?"#3AABB5":"#999",fontFamily:"'DM Sans',sans-serif"}}>{h.icon} {h.label}</button>)}
          </div>
          <div style={{flex:1}}>
            <label style={lbl}>Energy</label>
            {ENERGY.map(en=><button key={en.id} onClick={()=>setEnergy(en.id)} style={{display:"block",width:"100%",textAlign:"left",marginBottom:4,padding:"6px 10px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",border:`2px solid ${energy===en.id?en.color:"#e5e5e5"}`,background:energy===en.id?en.color+"22":"#fafafa",color:energy===en.id?en.color:"#999",fontFamily:"'DM Sans',sans-serif"}}>{en.emoji} {en.label}</button>)}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={lbl}>Repeats?</label>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{RECUR_OPTIONS.map(r=><button key={r.id} onClick={()=>setRecur(r.id)} style={{padding:"5px 10px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",border:`2px solid ${recur===r.id?"#8B6FBE":"#e5e5e5"}`,background:recur===r.id?"#F3EFFB":"#fafafa",color:recur===r.id?"#8B6FBE":"#999",fontFamily:"'DM Sans',sans-serif"}}>{r.id!=="none"?"🔁 ":""}{r.label}</button>)}</div>
        </div>
        <input value={deadline} onChange={e=>setDeadline(e.target.value)} placeholder="Deadline (optional)"
          style={{width:"100%",padding:"9px 13px",borderRadius:11,border:"2px solid #e5e5e5",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Notes (optional)" rows={2}
          style={{width:"100%",padding:"9px 13px",borderRadius:11,border:"2px solid #e5e5e5",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",resize:"none",marginBottom:16}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={go} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Add it ✓</button>
          <button onClick={onClose} style={{padding:"12px 16px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsPanel({ appName, setAppName, appLogo, setAppLogo, areas, setAreas, onClose }) {
  const [newLabel,setNewLabel]=useState("");
  const [newEmoji,setNewEmoji]=useState("⭐");
  const [newColor,setNewColor]=useState("#4F86C6");
  const [editId,setEditId]=useState(null);
  const [editLabel,setEditLabel]=useState("");
  const logoRef=useRef(null);
  const addArea=()=>{
    if(!newLabel.trim())return;
    const id=newLabel.toLowerCase().replace(/\s+/g,"_")+"_"+uid();
    setAreas(p=>[...p,{id,label:newLabel.trim(),emoji:newEmoji,color:newColor,bg:colorBg(newColor),tags:[newLabel.toLowerCase()],custom:true}]);
    setNewLabel("");setNewEmoji("⭐");setNewColor("#4F86C6");
  };
  const handleLogo=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=ev=>setAppLogo(ev.target.result);r.readAsDataURL(f);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:500,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,margin:0}}>⚙️ Settings</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#bbb"}}>×</button>
        </div>
        <div style={{background:"#fafafa",borderRadius:14,padding:"14px 16px",marginBottom:20}}>
          <label style={lbl}>App name</label>
          <input value={appName} onChange={e=>setAppName(e.target.value)} style={{width:"100%",padding:"9px 13px",borderRadius:11,border:"2px solid #e5e5e5",fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:800,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
          <label style={lbl}>App logo</label>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {appLogo?<img src={appLogo} style={{width:48,height:48,borderRadius:12,objectFit:"cover",border:"2px solid #e5e5e5"}}/>:<div style={{width:48,height:48,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><UntangleLogo size={48}/></div>}
            <button onClick={()=>logoRef.current?.click()} style={{padding:"8px 14px",borderRadius:11,border:"2px solid #e5e5e5",background:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#555"}}>Upload logo</button>
            {appLogo&&<button onClick={()=>setAppLogo(null)} style={{padding:"8px 10px",borderRadius:11,border:"2px solid #fee",background:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",color:"#E05C3A"}}>Remove</button>}
            <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogo}/>
          </div>
        </div>
        <label style={lbl}>Life areas</label>
        <div style={{marginBottom:14}}>
          {areas.map(a=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#fafafa",borderRadius:10,marginBottom:5,border:`2px solid ${a.color}18`}}>
              <span style={{fontSize:18}}>{a.emoji}</span>
              {editId===a.id?(
                <><input value={editLabel} onChange={e=>setEditLabel(e.target.value)} autoFocus style={{flex:1,padding:"4px 8px",borderRadius:8,border:"2px solid #3AABB5",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
                <button onClick={()=>{setAreas(p=>p.map(x=>x.id===a.id?{...x,label:editLabel}:x));setEditId(null);}} style={{padding:"4px 10px",borderRadius:8,border:"none",background:"#3AABB5",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>Save</button></>
              ):(
                <><span style={{flex:1,fontSize:13,fontWeight:700,color:"#333",fontFamily:"'DM Sans',sans-serif"}}>{a.label}</span>
                <button onClick={()=>{setEditId(a.id);setEditLabel(a.label);}} style={{padding:"3px 9px",borderRadius:8,border:"2px solid #e5e5e5",background:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",color:"#888"}}>Rename</button>
                {a.custom&&<button onClick={()=>setAreas(p=>p.filter(x=>x.id!==a.id))} style={{padding:"3px 9px",borderRadius:8,border:"2px solid #fee",background:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",color:"#E05C3A"}}>Delete</button>}</>
              )}
              <div style={{width:11,height:11,borderRadius:"50%",background:a.color,flexShrink:0}}/>
            </div>
          ))}
        </div>
        <div style={{background:"#fafafa",borderRadius:14,padding:"14px 16px",marginBottom:8}}>
          <label style={lbl}>Add custom area</label>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input value={newEmoji} onChange={e=>setNewEmoji(e.target.value)} style={{width:44,padding:"7px",borderRadius:10,border:"2px solid #e5e5e5",fontSize:18,textAlign:"center",outline:"none"}}/>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="e.g. Client A, Side Project…" style={{flex:1,padding:"8px 12px",borderRadius:10,border:"2px solid #e5e5e5",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
          </div>
          <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
            {PALETTE.map(c=><button key={c} onClick={()=>setNewColor(c)} style={{width:22,height:22,borderRadius:"50%",background:c,border:newColor===c?"3px solid #333":"2px solid transparent",cursor:"pointer"}}/>)}
          </div>
          <button onClick={addArea} disabled={!newLabel.trim()} style={{width:"100%",padding:"9px",borderRadius:11,border:"none",background:newLabel.trim()?"linear-gradient(135deg,#3AABB5,#4F86C6)":"#e5e5e5",color:newLabel.trim()?"#fff":"#aaa",fontSize:14,fontWeight:800,cursor:newLabel.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>+ Add area</button>
        </div>
        <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#888",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:6}}>Done ✓</button>
      </div>
    </div>
  );
}

// ── FOCUS TIMER ───────────────────────────────────────────────────────────────
function FocusTimer({ task, areas, onDone, onComplete }) {
  const [secs,setSecs]=useState(25*60);
  const [running,setRunning]=useState(false);
  const [finished,setFinished]=useState(false);
  const area=areas.find(a=>a.id===task?.area)||areas[0];
  const iRef=useRef(null);
  useEffect(()=>{
    if(running&&secs>0){iRef.current=setInterval(()=>setSecs(s=>s-1),1000);}
    else if(secs===0){setRunning(false);setFinished(true);}
    return()=>clearInterval(iRef.current);
  },[running,secs]);
  const m=String(Math.floor(secs/60)).padStart(2,"0"),s=String(secs%60).padStart(2,"0");
  const prog=((25*60-secs)/(25*60))*100;
  return (
    <div style={{position:"fixed",inset:0,background:"#080e12",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center",maxWidth:340,padding:20}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>FOCUS MODE</div>
        <div style={{fontSize:17,color:"#fff",fontWeight:700,marginBottom:24,lineHeight:1.3}}>{task?.title}</div>
        <div style={{position:"relative",width:200,height:200,margin:"0 auto 28px"}}>
          <svg viewBox="0 0 200 200" style={{transform:"rotate(-90deg)"}}>
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
            <circle cx="100" cy="100" r="88" fill="none" stroke={area.color} strokeWidth="12"
              strokeDasharray={`${2*Math.PI*88}`} strokeDashoffset={`${2*Math.PI*88*(1-prog/100)}`}
              strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear",filter:`drop-shadow(0 0 8px ${area.color})`}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:44,fontWeight:900,color:finished?"#5BAD6F":"#fff",letterSpacing:"-2px"}}>{finished?"✓":`${m}:${s}`}</span>
          </div>
        </div>
        {!finished?(
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={()=>setRunning(r=>!r)} style={{padding:"12px 28px",borderRadius:14,border:"none",background:area.color,color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer"}}>{running?"⏸ Pause":"▶ Start"}</button>
            <button onClick={onDone} style={{padding:"12px 16px",borderRadius:14,border:"2px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:14,fontWeight:700,cursor:"pointer"}}>Exit</button>
          </div>
        ):(
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={()=>{onComplete(task.id);onDone();}} style={{padding:"12px 22px",borderRadius:14,border:"none",background:"#5BAD6F",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>✓ Mark done!</button>
            <button onClick={onDone} style={{padding:"12px 16px",borderRadius:14,border:"2px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:14,fontWeight:700,cursor:"pointer"}}>Not done yet</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI BREAKDOWN ──────────────────────────────────────────────────────────────
function AiBreakdownModal({ task, onSave, onClose }) {
  const [loading,setLoading]=useState(false);
  const [subtasks,setSubtasks]=useState([]);
  const [error,setError]=useState(null);
  useEffect(()=>{
    setLoading(true);
    fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`You are an ADHD productivity coach. Break down this task into 3-6 small concrete actionable subtasks (5-15 mins each). Task: "${task.title}". Reply ONLY with a JSON array of strings. No markdown.`}]})})
      .then(r=>r.json()).then(d=>{
        const t=d.content?.map(c=>c.text||"").join("")||"[]";
        setSubtasks(JSON.parse(t.replace(/```json|```/g,"").trim()).map(x=>({title:x,done:false})));
      }).catch(()=>setError("Couldn't reach AI — try again!")).finally(()=>setLoading(false));
  },[]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:440,boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:18,fontWeight:800,marginBottom:4}}>🤖 AI Task Coach</h2>
        <p style={{fontSize:13,color:"#aaa",marginBottom:14}}>Breaking down: <strong>{task.title}</strong></p>
        {loading&&<div style={{textAlign:"center",padding:28}}><div style={{fontSize:30,animation:"spin 1s linear infinite"}}>⚙️</div><p style={{color:"#aaa",marginTop:8,fontFamily:"'DM Sans',sans-serif"}}>Thinking…</p></div>}
        {error&&<p style={{color:"#E05C3A",fontFamily:"'DM Sans',sans-serif"}}>{error}</p>}
        {!loading&&subtasks.length>0&&(
          <>
            {subtasks.map((st,i)=><div key={i} style={{display:"flex",gap:8,padding:"8px 10px",background:"#fafafa",borderRadius:10,marginBottom:5}}><span style={{color:"#ccc",fontSize:13}}>{i+1}.</span><span style={{fontSize:14,fontFamily:"'DM Sans',sans-serif",color:"#333"}}>{st.title}</span></div>)}
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button onClick={()=>onSave(task.id,subtasks)} style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Save subtasks ✓</button>
              <button onClick={onClose} style={{padding:"11px 14px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
            </div>
          </>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

const lbl={display:"block",fontSize:10,fontWeight:800,color:"#bbb",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6,fontFamily:"'DM Sans',sans-serif"};

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks,setTasks]           = useState([]);
  const [areas,setAreas]           = useState(DEFAULT_AREAS);
  const [appName,setAppName]       = useState("Untangle");
  const [appLogo,setAppLogo]       = useState(null);
  const [xp,setXp]                 = useState(0);
  const [streak,setStreak]         = useState(0);
  const [lastDoneDate,setLastDoneDate] = useState(null);
  const [oneThing,setOneThing]     = useState(null);
  const [oneThingDismissed,setOneThingDismissed] = useState(false);
  const [view,setView]             = useState("brain");
  const [activeHorizon,setActiveHorizon] = useState("today");
  const [activeArea,setActiveArea] = useState(DEFAULT_AREAS[0].id);
  const [showAdd,setShowAdd]       = useState(false);
  const [showDump,setShowDump]     = useState(false);
  const [showVoice,setShowVoice]   = useState(false);
  const [showUpload,setShowUpload] = useState(false);
  const [showTemplate,setShowTemplate] = useState(false);
  const [showSettings,setShowSettings] = useState(false);
  const [filterEnergy,setFilterEnergy] = useState(null);
  const [brainLimit,setBrainLimit] = useState(3);
  const [focusTask,setFocusTask]   = useState(null);
  const [breakdownTask,setBreakdownTask] = useState(null);
  const [levelUpStage,setLevelUpStage] = useState(null);
  const [loaded,setLoaded]         = useState(false);

  useEffect(()=>{
    (async()=>{
      try {
        const keys=["ut-tasks","ut-areas","ut-name","ut-logo","ut-xp","ut-streak","ut-lastdone","ut-onething"];
        const res=await Promise.all(keys.map(k=>window.storage.get(k).catch(()=>null)));
        const [t,a,n,l,x,s,d,ot]=res;
        if(t?.value)setTasks(JSON.parse(t.value));
        if(a?.value)setAreas(JSON.parse(a.value));
        if(n?.value)setAppName(n.value);
        if(l?.value)setAppLogo(l.value);
        if(x?.value)setXp(Number(x.value));
        if(s?.value)setStreak(Number(s.value));
        if(d?.value)setLastDoneDate(d.value);
        if(ot?.value)setOneThing(JSON.parse(ot.value));
      } catch {}
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{ if(!loaded)return; window.storage.set("ut-tasks",JSON.stringify(tasks)).catch(()=>{}); },[tasks,loaded]);
  useEffect(()=>{ if(!loaded)return; window.storage.set("ut-areas",JSON.stringify(areas)).catch(()=>{}); },[areas,loaded]);
  useEffect(()=>{ if(!loaded)return; window.storage.set("ut-name",appName).catch(()=>{}); },[appName,loaded]);
  useEffect(()=>{ if(!loaded)return; window.storage.set("ut-logo",appLogo||"").catch(()=>{}); },[appLogo,loaded]);
  useEffect(()=>{ if(!loaded)return; window.storage.set("ut-xp",String(xp)).catch(()=>{}); },[xp,loaded]);
  useEffect(()=>{ if(!loaded)return; window.storage.set("ut-streak",String(streak)).catch(()=>{}); },[streak,loaded]);
  useEffect(()=>{ if(!loaded)return; window.storage.set("ut-lastdone",lastDoneDate||"").catch(()=>{}); },[lastDoneDate,loaded]);
  useEffect(()=>{ if(!loaded)return; window.storage.set("ut-onething",JSON.stringify(oneThing||null)).catch(()=>{}); },[oneThing,loaded]);

  useEffect(()=>{ if(!loaded)return; setTasks(p=>p.map(t=>t.recur&&t.recur!=="none"&&t.done&&shouldRecurToday(t)?{...t,done:false,lastRecurDate:todayStr()}:t)); },[loaded]);
  useEffect(()=>{ if(oneThing&&oneThing.date!==todayStr()&&!isEvening()) setOneThing(null); },[oneThing]);

  const addTask=useCallback(t=>setTasks(p=>[t,...p]),[]);
  const addMany=useCallback(ts=>setTasks(p=>[...ts,...p]),[]);
  const deleteTask=useCallback(id=>setTasks(p=>p.filter(t=>t.id!==id)),[]);
  const clearDone=useCallback(()=>setTasks(p=>p.filter(t=>!t.done)),[]);
  const saveSubtasks=useCallback((id,st)=>{ setTasks(p=>p.map(t=>t.id===id?{...t,subtasks:st}:t)); setBreakdownTask(null); },[]);

  const completeTask=useCallback(id=>{
    const task=tasks.find(t=>t.id===id);
    const earned=XP_PER_TASK[task?.energy||"medium"];
    const today=todayStr();
    const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    const newStreak=lastDoneDate===today?streak:(lastDoneDate===yesterday?streak+1:1);
    const newXp=xp+earned+(newStreak>1?5:0);
    const oldStage=getStage(xp),newStage=getStage(newXp);
    if(newStage.id!==oldStage.id)setLevelUpStage(newStage);
    setTasks(p=>p.map(t=>t.id===id?{...t,done:true}:t));
    setXp(newXp);setStreak(newStreak);setLastDoneDate(today);
  },[tasks,xp,streak,lastDoneDate]);

  const setOneThingFn=useCallback(text=>{ setOneThing({text,date:todayStr()}); setOneThingDismissed(false); },[]);

  const incomplete=tasks.filter(t=>!t.done);
  const done=tasks.filter(t=>t.done);
  const brainPool=(filterEnergy?incomplete.filter(t=>t.energy===filterEnergy):incomplete).filter(t=>t.horizon==="today"||t.horizon==="week");
  const brainTasks=brainPool.slice(0,brainLimit);
  const showBanner=!oneThingDismissed&&(!oneThing||oneThing.date!==todayStr())&&(isEvening()||isMorning());

  return (
    <div style={{minHeight:"100vh",background:"#F2F1EF",fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>

      {showAdd       && <AddTaskModal areas={areas} onAdd={addTask} onClose={()=>setShowAdd(false)}/>}
      {showDump      && <BrainDumpModal areas={areas} onAddMany={addMany} onClose={()=>setShowDump(false)}/>}
      {showVoice     && <VoiceDumpModal areas={areas} onAddMany={addMany} onClose={()=>setShowVoice(false)}/>}
      {showUpload    && <UploadModal areas={areas} onAddMany={addMany} onClose={()=>setShowUpload(false)}/>}
      {showTemplate  && <TemplateModal onClose={()=>setShowTemplate(false)}/>}
      {showSettings  && <SettingsPanel appName={appName} setAppName={setAppName} appLogo={appLogo} setAppLogo={setAppLogo} areas={areas} setAreas={setAreas} onClose={()=>setShowSettings(false)}/>}
      {focusTask     && <FocusTimer task={focusTask} areas={areas} onDone={()=>setFocusTask(null)} onComplete={completeTask}/>}
      {breakdownTask && <AiBreakdownModal task={breakdownTask} onSave={saveSubtasks} onClose={()=>setBreakdownTask(null)}/>}
      {levelUpStage  && <LevelUpSplash stage={levelUpStage} onDone={()=>setLevelUpStage(null)}/>}

      <div style={{background:"linear-gradient(160deg,#0f1923 0%,#152232 60%,#1a2d3a 100%)",padding:"18px 20px 0",boxShadow:"0 4px 24px rgba(0,0,0,0.2)"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <XpBar xp={xp}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              {appLogo?<img src={appLogo} style={{width:38,height:38,borderRadius:11,objectFit:"cover",border:"2px solid rgba(255,255,255,0.15)"}}/>:<UntangleLogo size={38}/>}
              <div>
                <div style={{color:"#fff",fontSize:20,fontWeight:900,letterSpacing:"-0.5px"}}>{appName}</div>
                <div style={{color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:500}}>{incomplete.length} tasks to untangle{streak>0?` · 🔥 ${streak} days`:""}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,borderRadius:10,border:"2px solid rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.5)",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>⚙️</button>
              <button onClick={()=>setShowAdd(true)} style={{padding:"8px 16px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 3px 12px rgba(58,171,181,0.4)"}}>+ Add</button>
            </div>
          </div>
          <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap"}}>
            {[{label:"🧠 Dump",action:()=>setShowDump(true)},{label:"🎤 Voice",action:()=>setShowVoice(true)},{label:"📎 Import",action:()=>setShowUpload(true)},{label:"📥 Template",action:()=>setShowTemplate(true)}].map(b=>(
              <button key={b.label} onClick={b.action} style={{padding:"5px 12px",borderRadius:20,border:"2px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{b.label}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:2}}>
            {[{id:"brain",label:"⚡ Today Brain"},{id:"horizon",label:"📅 By Time"},{id:"area",label:"🗂️ By Area"},{id:"stats",label:"📊 Progress"}].map(v=>(
              <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"9px 15px",borderRadius:"12px 12px 0 0",fontSize:12,fontWeight:700,cursor:"pointer",border:"none",whiteSpace:"nowrap",background:view===v.id?"#F2F1EF":"transparent",color:view===v.id?"#152232":"rgba(255,255,255,0.5)"}}>{v.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"20px 16px"}}>
        {view==="brain"&&(
          <div>
            {showBanner&&<OneThingBanner tasks={tasks} onSet={setOneThingFn} onDismiss={()=>setOneThingDismissed(true)}/>}
            {oneThing&&oneThing.date===todayStr()&&<OneThingCard oneThing={oneThing.text} onClear={()=>setOneThing(null)}/>}
            <div style={{background:"linear-gradient(135deg,#fff9e6,#fff5d0)",borderRadius:18,padding:"14px 16px",marginBottom:16,border:"1.5px solid #f0d060"}}>
              <h2 style={{fontSize:14,fontWeight:800,color:"#9a7200",margin:"0 0 3px",fontFamily:"'DM Sans',sans-serif"}}>⚡ Your Brain Right Now</h2>
              <p style={{fontSize:12,color:"rgba(154,114,0,0.6)",margin:"0 0 11px"}}>Only these exist right now. Everything else can wait.</p>
              <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:700,color:"#9a7200"}}>Energy:</span>
                <button onClick={()=>setFilterEnergy(null)} style={{padding:"3px 9px",borderRadius:20,border:`2px solid ${!filterEnergy?"#9a7200":"#e5c830"}`,background:!filterEnergy?"#9a7200":"transparent",color:!filterEnergy?"#fff":"#9a7200",fontSize:11,fontWeight:700,cursor:"pointer"}}>All</button>
                {ENERGY.map(en=><button key={en.id} onClick={()=>setFilterEnergy(en.id===filterEnergy?null:en.id)} style={{padding:"3px 9px",borderRadius:20,border:`2px solid ${filterEnergy===en.id?en.color:"#e5c830"}`,background:filterEnergy===en.id?en.color+"22":"transparent",color:filterEnergy===en.id?en.color:"#9a7200",fontSize:11,fontWeight:700,cursor:"pointer"}}>{en.emoji} {en.label}</button>)}
              </div>
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:700,color:"#9a7200"}}>Show:</span>
                {[3,5,7].map(n=><button key={n} onClick={()=>setBrainLimit(n)} style={{padding:"3px 9px",borderRadius:20,border:`2px solid ${brainLimit===n?"#9a7200":"#e5c830"}`,background:brainLimit===n?"#9a7200":"transparent",color:brainLimit===n?"#fff":"#9a7200",fontSize:11,fontWeight:700,cursor:"pointer"}}>{n}</button>)}
              </div>
            </div>
            {brainTasks.length===0?(
              <div style={{textAlign:"center",padding:"36px 20px",color:"#bbb"}}>
                <div style={{fontSize:44}}>🎉</div>
                <p style={{fontWeight:700,fontSize:15,fontFamily:"'DM Sans',sans-serif"}}>Nothing queued!</p>
                <button onClick={()=>setShowAdd(true)} style={{marginTop:10,padding:"8px 18px",borderRadius:12,border:"none",background:"#3AABB5",color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add a task</button>
              </div>
            ):brainTasks.map(task=><TaskCard key={task.id} task={task} areas={areas} onComplete={completeTask} onDelete={deleteTask} onBreakdown={setBreakdownTask} onFocus={setFocusTask}/>)}
            {incomplete.length>brainLimit&&<p style={{textAlign:"center",fontSize:12,color:"#bbb",marginTop:6}}>+{incomplete.length-brainLimit} more hiding away. You'll get there. 🙂</p>}
            {done.length>0&&(
              <div style={{marginTop:22}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <h3 style={{fontSize:11,fontWeight:800,color:"#bbb",margin:0,letterSpacing:"0.08em",textTransform:"uppercase"}}>✅ Done ({done.length})</h3>
                  <button onClick={clearDone} style={{fontSize:11,color:"#ccc",background:"none",border:"1px solid #e0e0e0",borderRadius:8,padding:"2px 8px",cursor:"pointer"}}>Clear</button>
                </div>
                {done.slice(0,4).map(task=><TaskCard key={task.id} task={task} areas={areas} onComplete={completeTask} onDelete={deleteTask} compact/>)}
              </div>
            )}
          </div>
        )}
        {view==="horizon"&&(
          <div>
            <div style={{display:"flex",gap:7,marginBottom:18,flexWrap:"wrap"}}>
              {HORIZONS.map(h=>{ const n=incomplete.filter(t=>t.horizon===h.id).length; return <button key={h.id} onClick={()=>setActiveHorizon(h.id)} style={{padding:"9px 15px",borderRadius:13,border:`2px solid ${activeHorizon===h.id?"#3AABB5":"#e0e0e0"}`,background:activeHorizon===h.id?"#E8F7F8":"#fff",color:activeHorizon===h.id?"#3AABB5":"#999",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{h.icon} {h.label}{n>0&&<span style={{marginLeft:5,background:activeHorizon===h.id?"#3AABB5":"#eee",color:activeHorizon===h.id?"#fff":"#aaa",borderRadius:20,padding:"0 5px",fontSize:11,fontWeight:700}}>{n}</span>}</button>; })}
            </div>
            {incomplete.filter(t=>t.horizon===activeHorizon).length===0?<div style={{textAlign:"center",padding:"36px 20px",color:"#bbb"}}><div style={{fontSize:38}}>✨</div><p style={{fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>Nothing here</p><button onClick={()=>setShowAdd(true)} style={{marginTop:8,padding:"8px 18px",borderRadius:12,border:"none",background:"#3AABB5",color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add</button></div>
            :incomplete.filter(t=>t.horizon===activeHorizon).map(task=><TaskCard key={task.id} task={task} areas={areas} onComplete={completeTask} onDelete={deleteTask} onBreakdown={setBreakdownTask} onFocus={setFocusTask}/>)}
          </div>
        )}
        {view==="area"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:7,marginBottom:18}}>
              {areas.map(a=>{ const n=incomplete.filter(t=>t.area===a.id).length; return <button key={a.id} onClick={()=>setActiveArea(a.id)} style={{padding:"10px 8px",borderRadius:14,border:`2px solid ${activeArea===a.id?a.color:"#e0e0e0"}`,background:activeArea===a.id?(a.bg||colorBg(a.color)):"#fff",textAlign:"center",cursor:"pointer",boxShadow:activeArea===a.id?`0 4px 14px ${a.color}33`:"none",transition:"all 0.18s"}}><div style={{fontSize:20}}>{a.emoji}</div><div style={{fontSize:10,fontWeight:700,color:activeArea===a.id?a.color:"#aaa",marginTop:3,fontFamily:"'DM Sans',sans-serif"}}>{a.label}</div>{n>0&&<div style={{fontSize:10,color:a.color,fontWeight:800,marginTop:2}}>{n}</div>}</button>; })}
            </div>
            {tasks.filter(t=>t.area===activeArea).length===0?<div style={{textAlign:"center",padding:"36px 20px",color:"#bbb"}}><div style={{fontSize:38}}>{areas.find(a=>a.id===activeArea)?.emoji}</div><p style={{fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>Nothing here</p><button onClick={()=>setShowAdd(true)} style={{marginTop:8,padding:"8px 18px",borderRadius:12,border:"none",background:"#3AABB5",color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add</button></div>
            :HORIZONS.map(h=>{ const group=tasks.filter(t=>t.area===activeArea&&t.horizon===h.id); if(!group.length)return null; return <div key={h.id} style={{marginBottom:18}}><h3 style={{fontSize:11,fontWeight:800,color:"#bbb",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7,fontFamily:"'DM Sans',sans-serif"}}>{h.icon} {h.label}</h3>{group.map(task=><TaskCard key={task.id} task={task} areas={areas} onComplete={completeTask} onDelete={deleteTask} onBreakdown={setBreakdownTask} onFocus={setFocusTask}/>)}</div>; })}
          </div>
        )}
        {view==="stats"&&(
          <div>
            <div style={{background:"#fff",borderRadius:18,padding:"18px 20px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
              <h2 style={{fontSize:15,fontWeight:800,margin:"0 0 14px",fontFamily:"'DM Sans',sans-serif"}}>🦠 Evolution Progress</h2>
              {EVOLUTION_STAGES.map(s=>{ const u=xp>=s.minXp,cur=getStage(xp).id===s.id; return <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:cur?s.color+"18":u?"#fafafa":"#fcfcfc",border:`2px solid ${cur?s.color:u?"#eee":"#f0f0f0"}`,marginBottom:5}}><span style={{fontSize:22,filter:u?"none":"grayscale(1) opacity(0.3)"}}>{s.emoji}</span><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:u?"#1a1a1a":"#ccc",fontFamily:"'DM Sans',sans-serif"}}>{s.name}</div><div style={{fontSize:11,color:"#bbb"}}>{s.minXp} XP</div></div>{cur&&<span style={{fontSize:10,fontWeight:800,color:s.color,background:s.color+"22",padding:"2px 7px",borderRadius:20}}>YOU ARE HERE</span>}{u&&!cur&&<span style={{fontSize:13}}>✓</span>}{!u&&<span style={{fontSize:11,color:"#ddd"}}>{s.minXp-xp} XP away</span>}</div>; })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{v:xp,l:"Total XP",c:"#3AABB5"},{v:`🔥 ${streak}`,l:"Day streak",c:"#E09B3D"},{v:done.length,l:"Tasks done",c:"#5BAD6F"},{v:incomplete.filter(t=>t.recur&&t.recur!=="none").length,l:"Recurring",c:"#8B6FBE"}].map(s=><div key={s.l} style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}><div style={{fontSize:26,fontWeight:900,color:s.c,fontFamily:"'DM Sans',sans-serif"}}>{s.v}</div><div style={{fontSize:11,color:"#aaa",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{s.l}</div></div>)}
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
              <h3 style={{fontSize:12,fontWeight:800,margin:"0 0 12px",color:"#888",fontFamily:"'DM Sans',sans-serif"}}>By area</h3>
              {areas.map(a=>{ const n=incomplete.filter(t=>t.area===a.id).length,tot=tasks.filter(t=>t.area===a.id).length; if(!tot)return null; return <div key={a.id} style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,fontWeight:700,color:"#555",fontFamily:"'DM Sans',sans-serif"}}>{a.emoji} {a.label}</span><span style={{fontSize:11,color:"#bbb"}}>{n} left / {tot}</span></div><div style={{background:"#f0f0f0",borderRadius:20,height:6}}><div style={{width:`${Math.round(((tot-n)/tot)*100)}%`,height:"100%",background:a.color,borderRadius:20,transition:"width 0.6s"}}/></div></div>; })}
            </div>
          </div>
        )}
        {view!=="stats"&&(
          <div style={{marginTop:20,background:"#fff",borderRadius:14,padding:"10px 14px",display:"flex",gap:10,flexWrap:"wrap",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            {areas.map(a=>{ const n=incomplete.filter(t=>t.area===a.id).length; if(!n)return null; return <div key={a.id} style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:13}}>{a.emoji}</span><span style={{fontSize:12,fontWeight:800,color:a.color,fontFamily:"'DM Sans',sans-serif"}}>{n}</span></div>; })}
            {incomplete.length===0&&<span style={{fontSize:12,color:"#ccc",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>All untangled! 🌟 Add some tasks to get started.</span>}
          </div>
        )}
      </div>
    </div>
  );
}
