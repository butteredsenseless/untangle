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
          <pre style={{margin
