import { useState, useEffect, useRef, useCallback } from "react";import OnboardingFlow from "./Onboarding.jsx";import { askAlexander } from "./alexander.js";

const DEFAULT_AREAS = [
  { id:"work",      label:"Work & Career",            emoji:"💼", color:"#4F86C6", bg:"#EBF2FB", tags:["work","career","job","meeting","email"], custom:false },
  { id:"health",    label:"Health & Fitness",          emoji:"💪", color:"#5BAD6F", bg:"#EBF7EF", tags:["health","fitness","gym","workout","run","walk","doctor","meds"], custom:false },
  { id:"home",      label:"Home & Chores",             emoji:"🏠", color:"#E09B3D", bg:"#FDF3E3", tags:["home","chores","clean","cook","dishes","laundry","shopping","groceries"], custom:false },
  { id:"social",    label:"Social & Relationships",    emoji:"❤️", color:"#D96B8A", bg:"#FCEEF3", tags:["social","friends","family","date","call","message","relationship"], custom:false },
  { id:"finance",   label:"Finance",                   emoji:"💰", color:"#8B6FBE", bg:"#F3EFFB", tags:["finance","money","bills","budget","bank","tax","pay"], custom:false },
  { id:"hobbies",   label:"Hobbies & Fun",             emoji:"🎨", color:"#E05C3A", bg:"#FDEEE9", tags:["hobby","hobbies","fun","game","music","art","creative","play"], custom:false },
  { id:"selfcare",  label:"Self-care & Mental Health", emoji:"🌿", color:"#3AABB5", bg:"#E8F7F8", tags:["selfcare","self-care","mental","meditate","journal","relax","rest","sleep","therapy"], custom:false },
  { id:"learning",  label:"Learning & Growth",         emoji:"📚", color:"#C07A3A", bg:"#FBF2E8", tags:["learn","learning","study","course","book","read","skill","practice"], custom:false },
  { id:"education", label:"Education & School",        emoji:"🎓", color:"#6366F1", bg:"#EEF2FF", tags:["school","education","homework","study","exam","essay","revision","college","uni"], custom:false },
  { id:"admin",     label:"Admin",                     emoji:"📋", color:"#6B7280", bg:"#F3F4F6", tags:["admin","paperwork","form","bureaucracy","appointment"], custom:false },
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
const DAYS_OF_WEEK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PALETTE = ["#4F86C6","#5BAD6F","#E09B3D","#D96B8A","#8B6FBE","#E05C3A","#3AABB5","#C07A3A","#6B7280","#E84393","#0EA5E9","#10B981","#6366F1","#F59E0B","#EF4444"];
const TEMPLATE_CSV = `title,area,horizon,energy,recur,deadline,note
Call dentist #health,health,today,medium,none,Friday,
Weekly review #work,work,week,high,weekly,,Reflect on progress
Clean kitchen #home,home,today,low,weekly,,
Read 20 pages #learning,learning,week,low,daily,,
Pay rent #finance,finance,month,medium,monthly,1st of month,
Catch up with friend #social,social,week,medium,none,,
Morning walk #health,health,today,low,daily,,
Plan monthly budget #finance,finance,month,high,monthly,,`;

const uid = () => Math.random().toString(36).slice(2,9);


const todayStr = () => new Date().toISOString().slice(0,10);
const colorBg = c => c+"22";

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === "complete") {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = "sine";
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.08 + 0.03);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.08 + 0.22);
        o.start(ctx.currentTime + i * 0.08); o.stop(ctx.currentTime + i * 0.08 + 0.25);
      });
    } else if (type === "timer") {
      [220, 440, 880].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = "sine";
        g.gain.setValueAtTime(0.25 - i * 0.06, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 2.5);
      });
    }
  } catch {}
};

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
function shouldRecurToday(task) {
  if (!task.recur||task.recur==="none") return false;
  if (task.lastRecurDate===todayStr()) return false;
  const day=new Date().getDay();
  if (task.recur==="daily") return true;
  if (task.recur==="weekday") return day>=1&&day<=5;
  if (task.recur==="weekly") {
    if (task.recurDays?.length) return task.recurDays.includes(day);
    return new Date(task.createdAt).getDay()===day;
  }
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
          const vals=line.split(",").map(v=>v.trim()); const obj={};
          headers.forEach((h,i)=>obj[h]=vals[i]||"");
          const {clean,tags}=parseHashtags(obj.title||"");
          const {area:ia,horizon:ih}=inferFromTags(tags,areas);
          return { id:uid(), title:clean||obj.title, area:areas.find(a=>a.id===obj.area)?.id||ia||areas[0].id, horizon:HORIZONS.find(h=>h.id===obj.horizon)?.id||ih||"week", energy:ENERGY.find(e=>e.id===obj.energy)?.id||"medium", recur:RECUR_OPTIONS.find(r=>r.id===obj.recur)?.id||"none", deadline:obj.deadline||"", note:obj.note||"", done:false, createdAt:Date.now(), subtasks:[], dailyTarget:1, dailyCount:0 };
        }).filter(t=>t.title);
        resolve(tasks);
      } catch { resolve([]); }
    };
    reader.readAsText(file);
  });
}

function UntangleLogo({ size=32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#lg2)"/>
      <path d="M10 14 Q15 14 15 20 Q15 26 22 26 Q29 26 29 20 Q29 14 24 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M13 20 Q18 20 18 26 Q18 32 25 32" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <circle cx="29" cy="20" r="2.5" fill="white"/>
      <defs><linearGradient id="lg2" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#3AABB5"/><stop offset="1" stopColor="#4F86C6"/></linearGradient></defs>
    </svg>
  );
}

function ConfettiPop({ x, y }) {
  const pieces=Array.from({length:16},(_,i)=>({ id:i, color:["#4F86C6","#5BAD6F","#E09B3D","#D96B8A","#3AABB5","#E05C3A","#f0d060","#6366F1"][i%8], angle:(i/16)*360, dist:50+Math.random()*40 }));
  return (
    <div style={{position:"fixed",left:x,top:y,pointerEvents:"none",zIndex:9999}}>
      {pieces.map(p=><div key={p.id} style={{position:"absolute",width:8,height:8,borderRadius:2,background:p.color,animation:"cfly1 0.7s ease-out forwards","--dx":`${Math.cos(p.angle*Math.PI/180)*p.dist}px`,"--dy":`${Math.sin(p.angle*Math.PI/180)*p.dist}px`}}/>)}
      <style>{`@keyframes cfly1{to{transform:translate(var(--dx),var(--dy)) rotate(360deg);opacity:0}}`}</style>
    </div>
  );
}
function OneThingSection({ tasks, oneThing, onSet, onClear }) {
  const [editing, setEditing] = useState(false);
  const seen = new Set();
  const todayTasks = tasks.filter(t=>!t.done&&(t.horizon==="today"||t.horizon==="week")&&!seen.has(t.id)&&seen.add(t.id));
  const isSet = oneThing && oneThing.date === todayStr();
  if (isSet && !editing) {
    return (
      <div style={{background:"linear-gradient(135deg,#0d2e1a,#0f3d22)",border:"2px solid #2d8c55",borderRadius:18,padding:"14px 16px",marginBottom:16,boxShadow:"0 0 0 4px rgba(45,140,85,0.12),0 6px 24px rgba(45,140,85,0.2)",animation:"glowPulse 3s ease-in-out infinite"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#2d8c55,#3AABB5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🎯</div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:800,color:"#4ade80",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:3,fontFamily:"'DM Sans',sans-serif"}}>Today's Knot</div>
            <div style={{fontSize:15,fontWeight:800,color:"#fff",fontFamily:"'DM Sans',sans-serif",lineHeight:1.3}}>{oneThing.text}</div>
<div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:3}}>{oneThing.completed?"🎉 You've untangled today's knot! The main thing is done.":"Focus here first. Everything else can wait."}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <button onClick={()=>setEditing(true)} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,cursor:"pointer",padding:"3px 8px",borderRadius:8,fontFamily:"'DM Sans',sans-serif"}}>Edit</button>
            <button onClick={onClear} style={{background:"none",border:"none",color:"rgba(255,255,255,0.2)",fontSize:16,cursor:"pointer",padding:"2px 4px",lineHeight:1}}>×</button>
          </div>
        </div>
        <style>{`@keyframes glowPulse{0%,100%{box-shadow:0 0 0 4px rgba(45,140,85,0.12),0 6px 24px rgba(45,140,85,0.2)}50%{box-shadow:0 0 0 6px rgba(45,140,85,0.18),0 6px 32px rgba(45,140,85,0.35)}}`}</style>
      </div>
    );
  }
  return (
    <div style={{background:"linear-gradient(135deg,#1a3a2a,#1e4d35)",border:"2px solid #2d6e4a",borderRadius:16,padding:"14px 16px",marginBottom:16,boxShadow:"0 4px 20px rgba(45,110,74,0.2)"}}>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:13,color:"#7ed9a0",marginBottom:3}}>🎯 Today's Knot</div>
      <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:10}}>{isSet?"Update your focus for today:":"What's the one thing that matters most today?"}</div>
      {todayTasks.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
          {todayTasks.map(t=>(
            <button key={t.id} onClick={()=>{onSet(t.title);setEditing(false);}} style={{padding:"4px 10px",borderRadius:20,border:"2px solid rgba(126,217,160,0.3)",background:"rgba(126,217,160,0.08)",color:"#7ed9a0",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t.title}</button>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:7}}>
      </div>
    </div>
  );
}


function TaskCard({ task, areas, onComplete, onDelete, onBreakdown, onFocus, onEdit, soundEnabled, compact=false }) {
  const area=areas.find(a=>a.id===task.area)||areas[0];
  const energy=ENERGY.find(e=>e.id===task.energy);
  const recur=RECUR_OPTIONS.find(r=>r.id===task.recur);
  const [pop,setPop]=useState(null);
  const [swipeX,setSwipeX]=useState(0);
  const [swiping,setSwiping]=useState(false);
  const cardRef=useRef(null);
  const touchStart=useRef(null);
  const handleComplete=()=>{
    if(task.done) return;
    if(task.dailyTarget>1) {
      const newCount=(task.dailyCount||0)+1;
      if(newCount>=task.dailyTarget) {
        const rect=cardRef.current?.getBoundingClientRect();
        if(rect)setPop({x:rect.left+20,y:rect.top+20});
        if(soundEnabled)playSound("complete");
        setTimeout(()=>{setPop(null);onComplete(task.id);},700);
      } else { onComplete(task.id, newCount); }
      return;
    }
    const rect=cardRef.current?.getBoundingClientRect();
    if(rect)setPop({x:rect.left+20,y:rect.top+20});
    if(soundEnabled)playSound("complete");
    setTimeout(()=>{setPop(null);onComplete(task.id);},700);
  };
  const onTouchStart=e=>{ touchStart.current=e.touches[0].clientX; setSwiping(true); };
  const onTouchMove=e=>{ if(!touchStart.current)return; const dx=e.touches[0].clientX-touchStart.current; setSwipeX(Math.max(-100,Math.min(80,dx))); };
  const onTouchEnd=()=>{ if(swipeX<-70){onDelete(task.id);}else if(swipeX>60){handleComplete();} setSwipeX(0);setSwiping(false);touchStart.current=null; };
  const isCountTask = task.dailyTarget > 1;
  const countProgress = isCountTask ? (task.dailyCount||0) / task.dailyTarget : 0;
  return (
    <div style={{position:"relative",marginBottom:8,overflow:"hidden",borderRadius:14}}>
      <div style={{position:"absolute",inset:0,background:"#5BAD6F",borderRadius:14,display:"flex",alignItems:"center",paddingLeft:16,opacity:swipeX>20?Math.min((swipeX-20)/40,1):0}}><span style={{fontSize:20}}>✓</span></div>
      <div style={{position:"absolute",inset:0,background:"#E05C3A",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:16,opacity:swipeX<-20?Math.min((-swipeX-20)/40,1):0}}><span style={{fontSize:20}}>🗑️</span></div>
      <div ref={cardRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{background:"#fff",border:`1.5px solid ${area.color}18`,borderLeft:`4px solid ${area.color}`,borderRadius:14,padding:compact?"9px 13px":"13px 16px",display:"flex",alignItems:"flex-start",gap:11,boxShadow:"0 1px 6px rgba(0,0,0,0.04)",opacity:task.done?0.4:1,transform:`translateX(${swipeX}px)`,transition:swiping?"none":"transform 0.25s cubic-bezier(.23,1,.32,1)"}}
        onMouseEnter={e=>{if(!task.done)e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)";}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,0.04)";}}>
        {pop&&<ConfettiPop x={pop.x} y={pop.y}/>}
        {isCountTask?(
          <button onClick={handleComplete} style={{width:28,height:28,minWidth:28,borderRadius:10,border:`2px solid ${area.color}`,background:colorBg(area.color),cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1,flexDirection:"column",padding:0}}>
            <span style={{fontSize:10,fontWeight:900,color:area.color,lineHeight:1}}>{task.dailyCount||0}</span>
            <span style={{fontSize:8,color:area.color,lineHeight:1}}>/{task.dailyTarget}</span>
          </button>
        ):(
          <button onClick={handleComplete} style={{width:26,height:26,minWidth:26,borderRadius:"50%",border:`2px solid ${area.color}`,background:task.done?area.color:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1,transition:"all 0.2s"}}>
            {task.done&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
          </button>
        )}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,color:"#1a1a1a",textDecoration:task.done?"line-through":"none"}}>{task.title}</span>
            {energy&&<span title={energy.label} style={{fontSize:13}}>{energy.emoji}</span>}
            {recur?.id!=="none"&&<span style={{fontSize:10,background:"#f0f0ff",color:"#8B6FBE",padding:"2px 6px",borderRadius:20,fontWeight:700}}>🔁 {recur.label}{task.recurFreq>1?` ×${task.recurFreq}`:""}</span>}
          </div>
          {isCountTask&&<div style={{marginTop:5,height:4,background:"#f0f0f0",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:`${countProgress*100}%`,background:area.color,borderRadius:20,transition:"width 0.4s"}}/></div>}
          {task.note&&<div style={{fontSize:12,color:"#aaa",marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>{task.note}</div>}
          {task.aiNudge&&<div style={{fontSize:12,color:"#8B6FBE",marginTop:4,fontFamily:"'DM Sans',sans-serif",background:"#F3EFFB",padding:"4px 8px",borderRadius:8}}>💡 {task.aiNudge}</div>}
          <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
            <span onClick={()=>onEdit&&onEdit(task,'reassign')} style={{fontSize:11,background:area.bg||colorBg(area.color),color:area.color,padding:"2px 8px",borderRadius:20,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",userSelect:"none"}}>{area.emoji} {area.label} ✎</span>
            {task.deadline&&<span style={{fontSize:11,background:"#fff3e0",color:"#E09B3D",padding:"2px 8px",borderRadius:20,fontWeight:600}}>📅 {task.deadline}</span>}
            {task.recurTime&&<span style={{fontSize:11,background:"#f0f0ff",color:"#8B6FBE",padding:"2px 8px",borderRadius:20,fontWeight:600}}>🕐 {task.recurTime}</span>}
          </div>
          {task.subtasks?.length>0&&<div style={{marginTop:6,paddingLeft:4}}>{task.subtasks.map((st,i)=><div key={i} style={{fontSize:12,color:st.done?"#bbb":"#666",textDecoration:st.done?"line-through":"none",marginBottom:2,fontFamily:"'DM Sans',sans-serif"}}>↳ {st.title}</div>)}</div>}
        </div>
        {!task.done&&!compact&&(
          <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"center"}}>
            <button onClick={()=>onFocus&&onFocus(task)} title="Focus timer" style={{width:28,height:28,borderRadius:8,background:"#fff9e6",border:"1.5px solid #f0d060",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🎯</button>
            <button onClick={()=>onBreakdown&&onBreakdown(task)} title="AI Task Coach" style={{width:28,height:28,borderRadius:8,background:"#e8f5e9",border:"1.5px solid #5BAD6F44",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🫱🍽️</button>
            <button onClick={()=>onEdit&&onEdit(task)} title="Edit" style={{width:28,height:28,borderRadius:8,background:"#f0f4ff",border:"1.5px solid #4F86C644",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✏️</button>
          </div>
        )}
        <button onClick={()=>onDelete(task.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ddd",fontSize:18,padding:"0 2px",marginTop:2}}>×</button>
      </div>
    </div>
  );
}
function VoiceDumpModal({ areas, onAddMany, onClose }) {
  const [transcript,setTranscript]=useState(""); const [listening,setListening]=useState(false); const [status,setStatus]=useState("Tap the mic and start speaking"); const [supported,setSupported]=useState(true); const recRef=useRef(null);
  useEffect(()=>{ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR){setSupported(false);return;} const rec=new SR(); rec.continuous=true; rec.interimResults=true; rec.lang="en-GB"; let final=""; rec.onresult=e=>{ let interim=""; for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)final+=t+" ";else interim=t;} setTranscript(final+interim); }; rec.onerror=e=>{setStatus("Mic error: "+e.error);setListening(false);}; rec.onend=()=>{setListening(false);setStatus("Done! Edit below or import now.");}; recRef.current=rec; return()=>{try{rec.stop();}catch{}}; },[]);
  const toggle=()=>{ if(listening){recRef.current?.stop();setListening(false);}else{recRef.current?.start();setListening(true);setStatus("Listening… speak freely!");} };
const handleImport = async () => {
  console.log("handleImport fired", transcript);
  const lines = transcript.split(/[.!?\n]/).map(l => l.trim()).filter(l => l.length > 2);
  if (!lines.length) return;
  setStatus("Alexander is sorting...");
  const tasks = [];
for (let i = 0; i < lines.length; i++) {
    try {
      const result = await askAlexander(lines[i], areas, {}, {});
      const results = Array.isArray(result) ? result : [result];
      for (const r of results) {
        tasks.push({
          id: uid(),
          title: r.title || lines[i],
          area: areas.find(a => a.id === r.area) ? r.area : areas[0].id,
          horizon: r.horizon || "week",
          energy: "medium",
          note: "",
          deadline: r.deadline || "",
          recur: r.recur || "none",
          recurFreq: 1,
          recurDays: [],
          recurTime: "",
          dailyTarget: r.dailyTarget || 1,
          dailyCount: 0,
          done: false,
          createdAt: Date.now(),
          subtasks: [],
          aiSorted: true
        });
      }
    } catch {
      tasks.push({ id: uid(), title: lines[i], area: areas[0].id, horizon: "week", energy: "medium", note: "", deadline: "", recur: "none", done: false, createdAt: Date.now(), subtasks: [] });
    }
  }
  onAddMany(tasks);
  onClose();

};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.2)"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,marginBottom:4}}>🎤 Voice Brain Dump</h2>
        <p style={{fontSize:12,color:"#aaa",marginBottom:18}}>Works in Chrome, Safari, Edge. Each sentence becomes a task.</p>
        {!supported?<div style={{background:"#fff8e1",borderRadius:12,padding:14,marginBottom:16}}><p style={{fontSize:13,color:"#b8860b",fontWeight:700,margin:0}}>⚠️ Try Chrome or Safari, or paste below.</p></div>:(
          <div style={{textAlign:"center",marginBottom:18}}>
            <button onClick={toggle} style={{width:76,height:76,borderRadius:"50%",border:"none",background:listening?"#E05C3A":"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:30,cursor:"pointer",boxShadow:listening?"0 0 0 10px rgba(224,92,58,0.2)":"0 4px 20px rgba(58,171,181,0.4)",animation:listening?"mpulse 1.5s infinite":"none"}}>{listening?"⏹":"🎤"}</button>
            <p style={{fontSize:12,color:"#aaa",marginTop:10}}>{status}</p>
          </div>
        )}
        <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Your speech appears here…" rows={6} style={{width:"100%",padding:"11px 13px",borderRadius:12,border:"2px solid #e5e5e5",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical",lineHeight:1.7}}/>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={handleImport} disabled={!transcript.trim()} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:transcript.trim()?"linear-gradient(135deg,#3AABB5,#4F86C6)":"#e5e5e5",color:transcript.trim()?"#fff":"#aaa",fontSize:14,fontWeight:800,cursor:transcript.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>Import tasks ✓</button>
          <button onClick={onClose} style={{padding:"12px 16px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
        </div>
        <style>{`@keyframes mpulse{0%,100%{box-shadow:0 0 0 10px rgba(224,92,58,0.2)}50%{box-shadow:0 0 0 18px rgba(224,92,58,0.08)}}`}</style>
      </div>
    </div>
  );
}



function BrainDumpModal({ areas, onAddMany, onClose, learned={} }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const go = async () => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    console.log("Brain dump go fired", lines)
    if (!lines.length) return;
    setLoading(true);
    setProgress(0);
    const tasks = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        const result = await askAlexander(lines[i], areas, {}, learned);
        tasks.push({
          id: uid(),
          title: result.title || lines[i],
          area: areas.find(a => a.id === result.area) ? result.area : areas[0].id,
          horizon: result.horizon || "week",
          energy: "medium",
          note: "",
          deadline: result.deadline || "",
          recur: result.recur || "none",
          recurFreq: 1,
          recurDays: [],
          recurTime: "",
          dailyTarget: result.dailyTarget || 1,
          dailyCount: 0,
          done: false,
          createdAt: Date.now(),
          subtasks: [],
          aiSorted: true
        });
      } catch {
        tasks.push({ id: uid(), title: lines[i], area: areas[0].id, horizon: "week", energy: "medium", note: "", deadline: "", recur: "none", recurFreq: 1, recurDays: [], recurTime: "", dailyTarget: 1, dailyCount: 0, done: false, createdAt: Date.now(), subtasks: [] });
      }
      setProgress(i + 1);
    }
    onAddMany(tasks);
    setLoading(false);
    onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&!loading&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,marginBottom:4}}>🧠 Brain Dump</h2>
        <p style={{fontSize:13,color:"#aaa",marginBottom:14}}>One task per line. Just type naturally — Alexander will sort them.</p>
        <textarea value={text} onChange={e=>setText(e.target.value)} autoFocus placeholder={"call the dentist\npay council tax\nwalk the dog every morning"} rows={10} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"2px solid #e5e5e5",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical",lineHeight:1.8}} disabled={loading}/>
        {loading && (
          <div style={{marginTop:10,textAlign:"center"}}>
            <div style={{fontSize:13,color:"#3AABB5",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>Alexander is sorting task {progress} of {text.split("\n").filter(l=>l.trim()).length}…</div>
            <div style={{marginTop:6,background:"#f0f0f0",borderRadius:20,height:6}}><div style={{width:`${(progress/text.split("\n").filter(l=>l.trim()).length)*100}%`,height:"100%",background:"linear-gradient(90deg,#3AABB5,#4F86C6)",borderRadius:20,transition:"width 0.4s"}}/></div>
          </div>
        )}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={go} disabled={!text.trim()||loading} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:text.trim()&&!loading?"linear-gradient(135deg,#3AABB5,#4F86C6)":"#e5e5e5",color:text.trim()&&!loading?"#fff":"#aaa",fontSize:14,fontWeight:800,cursor:text.trim()&&!loading?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>{loading?"Sorting…":"Let Alexander sort these ✓"}</button>
          <button onClick={onClose} disabled={loading} style={{padding:"12px 16px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}



function ReassignPicker({ task, areas, onPick, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:22,width:"100%",maxWidth:380,boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:15,marginBottom:4}}>Move to bucket</div>
        <div style={{fontSize:12,color:"#aaa",marginBottom:14}}>"{task.title}"</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {areas.map(a=>(
            <button key={a.id} onClick={()=>onPick(a.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,border:`2px solid ${task.area===a.id?a.color:"#e5e5e5"}`,background:task.area===a.id?(a.bg||colorBg(a.color)):"#fafafa",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              <span style={{fontSize:18}}>{a.emoji}</span>
              <span style={{fontSize:13,fontWeight:700,color:task.area===a.id?a.color:"#555"}}>{a.label}</span>
              {task.area===a.id&&<span style={{marginLeft:"auto",fontSize:11,color:a.color,fontWeight:800}}>current</span>}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:12,padding:"10px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
      </div>
    </div>
  );
}
function TaskModal({ areas, onSave, onClose, existing=null, learned={} }) {
  const isEdit=!!existing;
  const [raw,setRaw]=useState(existing?.title||""); const [area,setArea]=useState(existing?.area||areas[0]?.id); const [horizon,setHorizon]=useState(existing?.horizon||"today"); const [energy,setEnergy]=useState(existing?.energy||"medium"); const [note,setNote]=useState(existing?.note||""); const [deadline,setDeadline]=useState(existing?.deadline||""); const [recur,setRecur]=useState(existing?.recur||"none"); const [recurFreq,setRecurFreq]=useState(existing?.recurFreq||1); const [recurDays,setRecurDays]=useState(existing?.recurDays||[]); const [recurTime,setRecurTime]=useState(existing?.recurTime||""); const [dailyTarget,setDailyTarget]=useState(existing?.dailyTarget||1); const [tags,setTags]=useState([]);
  const [aiLoading, setAiLoading] = useState(false);
const go = async () => {
  if (!raw.trim()) return;
  if (isEdit) {
    onSave({ id: existing.id, title: raw.trim(), area, horizon, energy, note, deadline, recur, recurFreq, recurDays, recurTime, dailyTarget: Number(dailyTarget) || 1, dailyCount: existing?.dailyCount || 0, done: existing?.done || false, createdAt: existing?.createdAt || Date.now(), subtasks: existing?.subtasks || [] });
    onClose();
    return;
  }
  setAiLoading(true);
  try {
    const result = await askAlexander(raw, areas, {}, learned);
    onSave({
      id: uid(),
      title: result.title || raw.trim(),
      area: areas.find(a => a.id === result.area) ? result.area : areas[0].id,
      horizon: result.horizon || horizon,
      energy,
      note,
      deadline: result.deadline || deadline,
      recur: result.recur || recur,
      recurFreq, recurDays, recurTime,
      dailyTarget: Number(dailyTarget) || 1,
      dailyCount: 0,
      done: false,
      createdAt: Date.now(),
      subtasks: [],
      aiSorted: true,
      aiNudge: result.nudge || ""
    });
  } catch (e) {
    // fallback to manual if AI fails
    onSave({ id: uid(), title: raw.trim(), area, horizon, energy, note, deadline, recur, recurFreq, recurDays, recurTime, dailyTarget: Number(dailyTarget) || 1, dailyCount: 0, done: false, createdAt: Date.now(), subtasks: [] });
  }
  setAiLoading(false);
  onClose();
};
  const toggleDay=d=>setRecurDays(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:500,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",maxHeight:"92vh",overflowY:"auto"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,marginBottom:5}}>{isEdit?"✏️ Edit task":"✨ Add a task"}</h2>
        <input value={raw} onChange={e=>setRaw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} autoFocus placeholder="What needs doing? #work #weekly" style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"2px solid #e5e5e5",fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
        {tags.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{tags.map(t=><span key={t} style={{fontSize:11,background:"#e8f5e9",color:"#5BAD6F",padding:"2px 8px",borderRadius:20,fontWeight:700}}>#{t}</span>)}</div>}
        <div style={{marginBottom:12}}><label style={lbl}>Area</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{areas.map(a=><button key={a.id} onClick={()=>setArea(a.id)} style={{padding:"4px 9px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",border:`2px solid ${a.color}`,background:area===a.id?a.color:(a.bg||colorBg(a.color)),color:area===a.id?"#fff":a.color}}>{a.emoji} {a.label}</button>)}</div></div>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <div style={{flex:1}}><label style={lbl}>When?</label>{HORIZONS.map(h=><button key={h.id} onClick={()=>setHorizon(h.id)} style={{display:"block",width:"100%",textAlign:"left",marginBottom:4,padding:"6px 10px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",border:`2px solid ${horizon===h.id?"#3AABB5":"#e5e5e5"}`,background:horizon===h.id?"#E8F7F8":"#fafafa",color:horizon===h.id?"#3AABB5":"#999",fontFamily:"'DM Sans',sans-serif"}}>{h.icon} {h.label}</button>)}</div>
          <div style={{flex:1}}><label style={lbl}>Energy</label>{ENERGY.map(en=><button key={en.id} onClick={()=>setEnergy(en.id)} style={{display:"block",width:"100%",textAlign:"left",marginBottom:4,padding:"6px 10px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",border:`2px solid ${energy===en.id?en.color:"#e5e5e5"}`,background:energy===en.id?en.color+"22":"#fafafa",color:energy===en.id?en.color:"#999",fontFamily:"'DM Sans',sans-serif"}}>{en.emoji} {en.label}</button>)}</div>
        </div>
        <div style={{background:"#f8f8f8",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
          <label style={lbl}>Daily count target</label>
          <p style={{fontSize:11,color:"#aaa",margin:"0 0 8px"}}>For things done multiple times a day (e.g. water × 8, walk dog × 3)</p>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setDailyTarget(Math.max(1,dailyTarget-1))} style={{width:28,height:28,borderRadius:8,border:"2px solid #e5e5e5",background:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
            <span style={{fontSize:16,fontWeight:800,color:"#333",minWidth:24,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>{dailyTarget}</span>
            <button onClick={()=>setDailyTarget(dailyTarget+1)} style={{width:28,height:28,borderRadius:8,border:"2px solid #e5e5e5",background:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
            <span style={{fontSize:11,color:"#aaa"}}>{dailyTarget===1?"once (standard)":"per day"}</span>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={lbl}>Repeats?</label>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>{RECUR_OPTIONS.map(r=><button key={r.id} onClick={()=>setRecur(r.id)} style={{padding:"5px 10px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",border:`2px solid ${recur===r.id?"#8B6FBE":"#e5e5e5"}`,background:recur===r.id?"#F3EFFB":"#fafafa",color:recur===r.id?"#8B6FBE":"#999",fontFamily:"'DM Sans',sans-serif"}}>{r.id!=="none"?"🔁 ":""}{r.label}</button>)}</div>
          {recur==="weekly"&&(
            <div style={{background:"#f8f8f8",borderRadius:12,padding:"10px 12px",marginBottom:8}}>
              <p style={{fontSize:11,color:"#aaa",margin:"0 0 6px"}}>Which days?</p>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{DAYS_OF_WEEK.map((d,i)=><button key={i} onClick={()=>toggleDay(i)} style={{padding:"4px 8px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",border:`2px solid ${recurDays.includes(i)?"#8B6FBE":"#e5e5e5"}`,background:recurDays.includes(i)?"#F3EFFB":"#fff",color:recurDays.includes(i)?"#8B6FBE":"#aaa"}}>{d}</button>)}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:"#aaa"}}>Times per week:</span>
                <button onClick={()=>setRecurFreq(Math.max(1,recurFreq-1))} style={{width:24,height:24,borderRadius:6,border:"2px solid #e5e5e5",background:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
                <span style={{fontSize:14,fontWeight:800,color:"#333",fontFamily:"'DM Sans',sans-serif"}}>{recurFreq}</span>
                <button onClick={()=>setRecurFreq(recurFreq+1)} style={{width:24,height:24,borderRadius:6,border:"2px solid #e5e5e5",background:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
              </div>
            </div>
          )}
          {recur!=="none"&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}><span style={{fontSize:11,color:"#aaa"}}>Time (optional):</span><input type="time" value={recurTime} onChange={e=>setRecurTime(e.target.value)} style={{padding:"4px 8px",borderRadius:8,border:"2px solid #e5e5e5",fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/></div>}
        </div>
        <input value={deadline} onChange={e=>setDeadline(e.target.value)} placeholder="Deadline (optional)" style={{width:"100%",padding:"9px 13px",borderRadius:11,border:"2px solid #e5e5e5",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Notes (optional)" rows={2} style={{width:"100%",padding:"9px 13px",borderRadius:11,border:"2px solid #e5e5e5",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",resize:"none",marginBottom:16}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={go} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{isEdit?"Save changes ✓":"Add it ✓"}</button>
          <button onClick={onClose} style={{padding:"12px 16px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
function NotesModal({ notes, onSave, onClose }) {
  const [text,setText]=useState(notes||"");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&(onSave(text),onClose())}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,margin:0}}>📝 Quick Notes</h2>
          <button onClick={()=>{onSave(text);onClose();}} style={{padding:"7px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Save ✓</button>
        </div>
        <p style={{fontSize:12,color:"#aaa",margin:"0 0 12px"}}>Packing lists, random thoughts, things to look up. Not a task — just a place to think.</p>
        <textarea value={text} onChange={e=>setText(e.target.value)} autoFocus placeholder={"Packing for trip:\n- passport\n- charger\n\nThings to Google:\n- best coffee Oxford"} style={{flex:1,minHeight:280,padding:"12px 14px",borderRadius:12,border:"2px solid #e5e5e5",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",lineHeight:1.7}}/>
      </div>
    </div>
  );
}

function SettingsPanel({ appName, setAppName, appLogo, setAppLogo, areas, setAreas, soundEnabled, setSoundEnabled, onClose }) {
  const [newLabel,setNewLabel]=useState(""); const [newEmoji,setNewEmoji]=useState("⭐"); const [newColor,setNewColor]=useState("#4F86C6"); const [editId,setEditId]=useState(null); const [editLabel,setEditLabel]=useState(""); const logoRef=useRef(null);
  const addArea=()=>{ if(!newLabel.trim())return; const id=newLabel.toLowerCase().replace(/\s+/g,"_")+"_"+uid(); setAreas(p=>[...p,{id,label:newLabel.trim(),emoji:newEmoji,color:newColor,bg:colorBg(newColor),tags:[newLabel.toLowerCase()],custom:true}]); setNewLabel("");setNewEmoji("⭐");setNewColor("#4F86C6"); };
  const handleLogo=e=>{ const f=e.target.files[0];if(!f)return; const r=new FileReader();r.onload=ev=>setAppLogo(ev.target.result);r.readAsDataURL(f); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:500,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:19,fontWeight:800,margin:0}}>⚙️ Settings</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#bbb"}}>×</button>
        </div>
        <div style={{background:"#fafafa",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
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
        <div style={{background:"#fafafa",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
          <label style={lbl}>Sound effects</label>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:"#555",fontFamily:"'DM Sans',sans-serif"}}>Play sounds on completion & timer</span>
            <button onClick={()=>setSoundEnabled(!soundEnabled)} style={{width:44,height:24,borderRadius:12,border:"none",background:soundEnabled?"#3AABB5":"#ddd",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:soundEnabled?23:3,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
            </button>
          </div>
        </div>
        <label style={lbl}>Life areas</label>
        <div style={{marginBottom:14}}>
          {areas.map(a=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#fafafa",borderRadius:10,marginBottom:5,border:`2px solid ${a.color}18`}}>
              <span style={{fontSize:18}}>{a.emoji}</span>
              {editId===a.id?(<><input value={editLabel} onChange={e=>setEditLabel(e.target.value)} autoFocus style={{flex:1,padding:"4px 8px",borderRadius:8,border:"2px solid #3AABB5",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/><button onClick={()=>{setAreas(p=>p.map(x=>x.id===a.id?{...x,label:editLabel}:x));setEditId(null);}} style={{padding:"4px 10px",borderRadius:8,border:"none",background:"#3AABB5",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>Save</button></>)
              :(<><span style={{flex:1,fontSize:13,fontWeight:700,color:"#333",fontFamily:"'DM Sans',sans-serif"}}>{a.label}</span><button onClick={()=>{setEditId(a.id);setEditLabel(a.label);}} style={{padding:"3px 9px",borderRadius:8,border:"2px solid #e5e5e5",background:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",color:"#888"}}>Rename</button>{a.custom&&<button onClick={()=>setAreas(p=>p.filter(x=>x.id!==a.id))} style={{padding:"3px 9px",borderRadius:8,border:"2px solid #fee",background:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",color:"#E05C3A"}}>Delete</button>}</>)}
              <div style={{width:11,height:11,borderRadius:"50%",background:a.color,flexShrink:0}}/>
            </div>
          ))}
        </div>
        <div style={{background:"#fafafa",borderRadius:14,padding:"14px 16px",marginBottom:8}}>
          <label style={lbl}>Add custom area</label>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input value={newEmoji} onChange={e=>setNewEmoji(e.target.value)} style={{width:44,padding:"7px",borderRadius:10,border:"2px solid #e5e5e5",fontSize:18,textAlign:"center",outline:"none"}}/>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="e.g. Client A…" style={{flex:1,padding:"8px 12px",borderRadius:10,border:"2px solid #e5e5e5",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
          </div>
          <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>{PALETTE.map(c=><button key={c} onClick={()=>setNewColor(c)} style={{width:22,height:22,borderRadius:"50%",background:c,border:newColor===c?"3px solid #333":"2px solid transparent",cursor:"pointer"}}/>)}</div>
          <button onClick={addArea} disabled={!newLabel.trim()} style={{width:"100%",padding:"9px",borderRadius:11,border:"none",background:newLabel.trim()?"linear-gradient(135deg,#3AABB5,#4F86C6)":"#e5e5e5",color:newLabel.trim()?"#fff":"#aaa",fontSize:14,fontWeight:800,cursor:newLabel.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>+ Add area</button>
        </div>
        <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#888",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:6}}>Done ✓</button>
      </div>
    </div>
  );
}

function FocusTimer({ task, areas, onDone, onComplete, soundEnabled }) {
  const [secs,setSecs]=useState(25*60); const [running,setRunning]=useState(false); const [finished,setFinished]=useState(false);
  const area=areas.find(a=>a.id===task?.area)||areas[0]; const iRef=useRef(null);
  useEffect(()=>{ if(running&&secs>0){iRef.current=setInterval(()=>setSecs(s=>s-1),1000);}else if(secs===0&&!finished){setRunning(false);setFinished(true);if(soundEnabled)playSound("timer");} return()=>clearInterval(iRef.current); },[running,secs,finished]);
  const m=String(Math.floor(secs/60)).padStart(2,"0"),s=String(secs%60).padStart(2,"0");
  const prog=((25*60-secs)/(25*60))*100;
  return (
    <div style={{position:"fixed",inset:0,background:"#080e12",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center",maxWidth:340,padding:20,width:"100%"}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>FOCUS MODE</div>
        <div style={{fontSize:17,color:"#fff",fontWeight:700,marginBottom:24,lineHeight:1.3,padding:"0 20px"}}>{task?.title}</div>
        <div style={{position:"relative",width:200,height:200,margin:"0 auto 28px"}}>
          <svg width="200" height="200" viewBox="0 0 200 200" style={{transform:"rotate(-90deg)"}}>
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
            <circle cx="100" cy="100" r="88" fill="none" stroke={area.color} strokeWidth="12" strokeDasharray={`${2*Math.PI*88}`} strokeDashoffset={`${2*Math.PI*88*(1-prog/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear",filter:`drop-shadow(0 0 8px ${area.color})`}}/>
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

function AiBreakdownModal({ task, onSave, onClose }) {
  const [loading,setLoading]=useState(false); const [subtasks,setSubtasks]=useState([]); const [error,setError]=useState(null);
  useEffect(()=>{
    setLoading(true);
    fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`You are an ADHD productivity coach. Break down this task into 3-6 small concrete actionable subtasks (5-15 mins each). Task: "${task.title}". Reply ONLY with a JSON array of strings. No markdown.`}]})})
      .then(r=>r.json()).then(d=>{ const t=d.content?.map(c=>c.text||"").join("")||"[]"; setSubtasks(JSON.parse(t.replace(/```json|```/g,"").trim()).map(x=>({title:x,done:false}))); })
      .catch(()=>setError("Couldn't reach AI. Add your Anthropic API key in Vercel environment variables.")).finally(()=>setLoading(false));
  },[]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:440,boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}}>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:18,fontWeight:800,marginBottom:4}}>🫱🍽️ AI Task Coach</h2>
        <p style={{fontSize:13,color:"#aaa",marginBottom:14}}>Breaking down: <strong>{task.title}</strong></p>
        {loading&&<div style={{textAlign:"center",padding:28}}><div style={{fontSize:30,animation:"spin 1s linear infinite"}}>⚙️</div><p style={{color:"#aaa",marginTop:8,fontFamily:"'DM Sans',sans-serif"}}>Thinking…</p></div>}
        {error&&<p style={{color:"#E05C3A",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>{error}</p>}
        {!loading&&subtasks.length>0&&(<>
          {subtasks.map((st,i)=><div key={i} style={{display:"flex",gap:8,padding:"8px 10px",background:"#fafafa",borderRadius:10,marginBottom:5}}><span style={{color:"#ccc",fontSize:13}}>{i+1}.</span><span style={{fontSize:14,fontFamily:"'DM Sans',sans-serif",color:"#333"}}>{st.title}</span></div>)}
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={()=>onSave(task.id,subtasks)} style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Save subtasks ✓</button>
            <button onClick={onClose} style={{padding:"11px 14px",borderRadius:12,border:"2px solid #e5e5e5",background:"#fff",color:"#aaa",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          </div>
        </>)}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function CalendarView({ tasks, areas, onComplete, onDelete, onBreakdown, onFocus, onEdit, soundEnabled }) {
  const [mode,setMode]=useState("week"); const [offset,setOffset]=useState(0);
  const now=new Date();
  const getDateRange=()=>{ if(mode==="day"){const d=new Date(now);d.setDate(d.getDate()+offset);return{label:d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})};} if(mode==="week"){const start=new Date(now);start.setDate(start.getDate()-start.getDay()+1+(offset*7));const end=new Date(start);end.setDate(start.getDate()+6);return{label:`${start.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – ${end.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}`};} if(mode==="month"){const d=new Date(now.getFullYear(),now.getMonth()+offset,1);return{label:d.toLocaleDateString("en-GB",{month:"long",year:"numeric"})};} };
  const range=getDateRange();
  const getTasksForRange=()=>{ const horizons=[]; if(mode==="day")horizons.push("today"); if(mode==="week")horizons.push("today","week"); if(mode==="month")horizons.push("today","week","month"); return tasks.filter(t=>!t.done&&horizons.includes(t.horizon)); };
  const visibleTasks=getTasksForRange();
  return (
    <div>
      <div style={{display:"flex",gap:5,marginBottom:12}}>
        {["day","week","month"].map(m=><button key={m} onClick={()=>{setMode(m);setOffset(0);}} style={{padding:"7px 14px",borderRadius:10,border:`2px solid ${mode===m?"#3AABB5":"#e0e0e0"}`,background:mode===m?"#E8F7F8":"#fff",color:mode===m?"#3AABB5":"#999",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize"}}>{m}</button>)}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",borderRadius:14,padding:"10px 14px",marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
        <button onClick={()=>setOffset(o=>o-1)} style={{width:32,height:32,borderRadius:8,border:"2px solid #e0e0e0",background:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div style={{textAlign:"center"}}><div style={{fontWeight:800,fontSize:14,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{range.label}</div><div style={{fontSize:11,color:"#aaa"}}>{visibleTasks.length} tasks</div></div>
        <button onClick={()=>setOffset(o=>o+1)} style={{width:32,height:32,borderRadius:8,border:"2px solid #e0e0e0",background:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>→</button>
      </div>
      {offset!==0&&<button onClick={()=>setOffset(0)} style={{width:"100%",padding:"7px",borderRadius:10,border:"2px solid #e0e0e0",background:"#fff",color:"#aaa",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:12,fontFamily:"'DM Sans',sans-serif"}}>Back to current {mode}</button>}
      {["today","week","month"].filter(h=>mode==="day"?h==="today":mode==="week"?h!=="month":true).map(h=>{ const group=visibleTasks.filter(t=>t.horizon===h); if(!group.length)return null; const hor=HORIZONS.find(x=>x.id===h); return(<div key={h} style={{marginBottom:20}}><h3 style={{fontSize:11,fontWeight:800,color:"#bbb",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>{hor.icon} {hor.label} · {group.length}</h3>{group.map(task=><TaskCard key={task.id} task={task} areas={areas} onComplete={onComplete} onDelete={onDelete} onBreakdown={onBreakdown} onFocus={onFocus} onEdit={onEdit} soundEnabled={soundEnabled}/>)}</div>); })}
      {visibleTasks.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"#bbb"}}><div style={{fontSize:38}}>✨</div><p style={{fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>Nothing here</p></div>}
    </div>
  );
}

function StatsView({ tasks, areas, streak, done }) {
  const incomplete=tasks.filter(t=>!t.done);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{v:`🔥 ${streak}`,l:"Day streak",c:"#E09B3D"},{v:done.length,l:"Tasks done",c:"#5BAD6F"},{v:incomplete.length,l:"Still to do",c:"#4F86C6"},{v:incomplete.filter(t=>t.recur&&t.recur!=="none").length,l:"Recurring",c:"#8B6FBE"}].map(s=><div key={s.l} style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}><div style={{fontSize:26,fontWeight:900,color:s.c,fontFamily:"'DM Sans',sans-serif"}}>{s.v}</div><div style={{fontSize:11,color:"#aaa",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{s.l}</div></div>)}
      </div>
      <div style={{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <h3 style={{fontSize:12,fontWeight:800,margin:"0 0 12px",color:"#888",fontFamily:"'DM Sans',sans-serif"}}>By area</h3>
        {areas.map(a=>{ const n=incomplete.filter(t=>t.area===a.id).length,tot=tasks.filter(t=>t.area===a.id).length; if(!tot)return null; return <div key={a.id} style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,fontWeight:700,color:"#555",fontFamily:"'DM Sans',sans-serif"}}>{a.emoji} {a.label}</span><span style={{fontSize:11,color:"#bbb"}}>{n} left / {tot}</span></div><div style={{background:"#f0f0f0",borderRadius:20,height:6}}><div style={{width:`${Math.round(((tot-n)/tot)*100)}%`,height:"100%",background:a.color,borderRadius:20,transition:"width 0.6s"}}/></div></div>; })}
      </div>
    </div>
  );
}

const lbl={display:"block",fontSize:10,fontWeight:800,color:"#bbb",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6,fontFamily:"'DM Sans',sans-serif"};
export default function App() {
  const [tasks,setTasks]           = useState([]);
  const [areas,setAreas]           = useState(DEFAULT_AREAS);
  const [appName,setAppName]       = useState("Untangle");
  const [appLogo,setAppLogo]       = useState(null);
  const [streak,setStreak]         = useState(0);
  const [lastDoneDate,setLastDoneDate] = useState(null);
  const [oneThing,setOneThing]     = useState(null);
  const oneThingRef = useRef(null);
  const [view,setView]             = useState("brain");
  const [activeArea,setActiveArea] = useState(DEFAULT_AREAS[0].id);
  const [showAdd,setShowAdd]       = useState(false);
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem("untangle_onboarded"));
  const [showDump,setShowDump]     = useState(false);
  const [showVoice,setShowVoice]   = useState(false);
  const [showSettings,setShowSettings] = useState(false);
  const [showNotes,setShowNotes]   = useState(false);
  const [notes,setNotes]           = useState("");
  const [soundEnabled,setSoundEnabled] = useState(true);
  const [focusTask,setFocusTask]   = useState(null);
  const [breakdownTask,setBreakdownTask] = useState(null);
  const [editTask,setEditTask]     = useState(null);
  const [reassignTask,setReassignTask] = useState(null);
  const [learned, setLearned] = useState(() => { try { return JSON.parse(localStorage.getItem("ut-learned") || "{}"); } catch { return {}; } });
  const [loaded,setLoaded]         = useState(false);

  useEffect(()=>{
    try {
      const t=localStorage.getItem("ut-tasks"); const a=localStorage.getItem("ut-areas"); const n=localStorage.getItem("ut-name"); const l=localStorage.getItem("ut-logo"); const s=localStorage.getItem("ut-streak"); const d=localStorage.getItem("ut-lastdone"); const ot=localStorage.getItem("ut-onething"); const nt=localStorage.getItem("ut-notes"); const snd=localStorage.getItem("ut-sound");
      if(t)setTasks(JSON.parse(t)); if(a)setAreas(JSON.parse(a)); if(n)setAppName(n); if(l)setAppLogo(l); if(s)setStreak(Number(s)); if(d)setLastDoneDate(d); if(ot)setOneThing(JSON.parse(ot)); if(nt)setNotes(nt); if(snd!==null)setSoundEnabled(snd==="true");
    } catch {}
    setLoaded(true);
  },[]);

  useEffect(()=>{ if(!loaded)return; localStorage.setItem("ut-tasks",JSON.stringify(tasks)); },[tasks,loaded]);
  useEffect(()=>{ if(!loaded)return; localStorage.setItem("ut-areas",JSON.stringify(areas)); },[areas,loaded]);
  useEffect(()=>{ if(!loaded)return; localStorage.setItem("ut-name",appName); },[appName,loaded]);
  useEffect(()=>{ if(!loaded)return; localStorage.setItem("ut-logo",appLogo||""); },[appLogo,loaded]);
  useEffect(()=>{ if(!loaded)return; localStorage.setItem("ut-streak",String(streak)); },[streak,loaded]);
  useEffect(()=>{ if(!loaded)return; localStorage.setItem("ut-lastdone",lastDoneDate||""); },[lastDoneDate,loaded]);
  useEffect(()=>{ if(!loaded)return; localStorage.setItem("ut-onething",JSON.stringify(oneThing||null)); },[oneThing,loaded]);
  useEffect(()=>{ if(!loaded)return; localStorage.setItem("ut-notes",notes); },[notes,loaded]);
  useEffect(()=>{ if(!loaded)return; localStorage.setItem("ut-sound",String(soundEnabled)); },[soundEnabled,loaded]);

  useEffect(()=>{ if(!loaded)return; setTasks(p=>p.map(t=>t.recur&&t.recur!=="none"&&t.done&&shouldRecurToday(t)?{...t,done:false,lastRecurDate:todayStr(),dailyCount:0}:t)); },[loaded]);
  useEffect(()=>{ if(!loaded)return; const today=todayStr(); setTasks(p=>p.map(t=>t.dailyTarget>1&&t.lastCountDate&&t.lastCountDate!==today?{...t,dailyCount:0,done:false}:t)); },[loaded]);
  useEffect(()=>{ if(oneThing&&oneThing.date!==todayStr())setOneThing(null); },[oneThing]);

  const addTask=useCallback(t=>setTasks(p=>[t,...p]),[]);
  const addMany=useCallback(ts=>setTasks(p=>[...ts,...p]),[]);
  const deleteTask=useCallback(id=>setTasks(p=>p.filter(t=>t.id!==id)),[]);
  const clearDone=useCallback(()=>setTasks(p=>p.filter(t=>!t.done)),[]);
  const saveTask=useCallback(t=>setTasks(p=>p.map(x=>x.id===t.id?t:x)),[]);
  const saveSubtasks=useCallback((id,st)=>{ setTasks(p=>p.map(t=>t.id===id?{...t,subtasks:st}:t)); setBreakdownTask(null); },[]);

  const completeTask=useCallback((id,newCount=null)=>{
    const task=tasks.find(t=>t.id===id); if(!task)return;
    if(newCount!==null){setTasks(p=>p.map(t=>t.id===id?{...t,dailyCount:newCount,lastCountDate:todayStr()}:t));return;}
    const today=todayStr(); const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    const newStreak=lastDoneDate===today?streak:(lastDoneDate===yesterday?streak+1:1);
    setTasks(p=>p.map(t=>t.id===id?{...t,done:true,dailyCount:t.dailyTarget,lastCountDate:today}:t));
    setStreak(newStreak); setLastDoneDate(today);
    console.log("oneThing:", oneThing?.text, "task:", task?.title);
    if(oneThing&&oneThing.text===task?.title){setOneThing({...oneThing,completed:true});setTimeout(()=>setOneThing(null),4000);}
  },[tasks,streak,lastDoneDate, oneThing]);

const setOneThingFn=useCallback(text=>{const val={text,date:todayStr()};setOneThing(val);oneThingRef.current=val;},[]);  const incomplete=tasks.filter(t=>!t.done);
  const done=tasks.filter(t=>t.done);

  return (
    <div style={{minHeight:"100vh",background:"#F2F1EF",fontFamily:"'DM Sans',sans-serif"}}>
      {!onboarded && <OnboardingFlow areas={areas} onAddTasks={addMany} onSetOneThing={setOneThingFn} onComplete={() => { localStorage.setItem("untangle_onboarded", "1"); setOnboarded(true); }} />}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      {showAdd       && <TaskModal areas={areas} onSave={t=>{addTask(t);}} onClose={()=>setShowAdd(false)} learned={learned}/>}
      {editTask      && <TaskModal areas={areas} onSave={t=>{saveTask(t);setEditTask(null);}} onClose={()=>setEditTask(null)} existing={editTask} learned={learned}/>}
      {showDump      && <BrainDumpModal areas={areas} onAddMany={addMany} onClose={()=>setShowDump(false)}/>}
      {showVoice     && <VoiceDumpModal areas={areas} onAddMany={addMany} onClose={()=>setShowVoice(false)}/>}
      {showNotes     && <NotesModal notes={notes} onSave={setNotes} onClose={()=>setShowNotes(false)}/>}
      {showSettings  && <SettingsPanel appName={appName} setAppName={setAppName} appLogo={appLogo} setAppLogo={setAppLogo} areas={areas} setAreas={setAreas} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} onClose={()=>setShowSettings(false)}/>}
      {focusTask     && <FocusTimer task={focusTask} areas={areas} onDone={()=>setFocusTask(null)} onComplete={completeTask} soundEnabled={soundEnabled}/>}
      {reassignTask && <ReassignPicker task={reassignTask} areas={areas} onPick={(area)=>{
  saveTask({...reassignTask,area});
  setLearned(prev=>{
    const key=reassignTask.title.toLowerCase().slice(0,30);
    const updated={...prev,[key]:{from:reassignTask.area,to:area,count:(prev[key]?.count||0)+1}};
    localStorage.setItem("ut-learned",JSON.stringify(updated));
    return updated;
  });
  setReassignTask(null);
}} onClose={()=>setReassignTask(null)}/>}
      {breakdownTask && <AiBreakdownModal task={breakdownTask} onSave={saveSubtasks} onClose={()=>setBreakdownTask(null)}/>}

      <div style={{background:"linear-gradient(160deg,#0f1923 0%,#152232 60%,#1a2d3a 100%)",padding:"18px 20px 0",boxShadow:"0 4px 24px rgba(0,0,0,0.2)"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              {appLogo?<img src={appLogo} style={{width:38,height:38,borderRadius:11,objectFit:"cover",border:"2px solid rgba(255,255,255,0.15)"}}/>:<UntangleLogo size={38}/>}
              <div>
                <div style={{color:"#fff",fontSize:20,fontWeight:900,letterSpacing:"-0.5px"}}>{appName}</div>
                <div style={{color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:500}}>{incomplete.length} tasks to untangle{streak>0?` · 🔥 ${streak} days`:""}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={()=>setShowNotes(true)} title="Quick notes" style={{width:36,height:36,borderRadius:10,border:"2px solid rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.5)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>📝</button>
              <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,borderRadius:10,border:"2px solid rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.5)",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>⚙️</button>
              <button onClick={()=>setShowAdd(true)} style={{padding:"8px 16px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 3px 12px rgba(58,171,181,0.4)"}}>+ Add</button>
            </div>
          </div>
          <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
            {[{label:"🧠 Dump",action:()=>setShowDump(true)},{label:"🎤 Voice",action:()=>setShowVoice(true)},].map(b=>(
              <button key={b.label} onClick={b.action} style={{padding:"5px 12px",borderRadius:20,border:"2px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{b.label}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:2,overflowX:"auto"}}>
            {[{id:"brain",label:"⚡ Today's Knot"},{id:"calendar",label:"📅 Calendar"},{id:"area",label:"🗂️ By Area"},{id:"stats",label:"📊 Progress"}].map(v=>(
              <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"9px 14px",borderRadius:"12px 12px 0 0",fontSize:12,fontWeight:700,cursor:"pointer",border:"none",whiteSpace:"nowrap",background:view===v.id?"#F2F1EF":"transparent",color:view===v.id?"#152232":"rgba(255,255,255,0.5)",flexShrink:0}}>{v.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"20px 16px"}}>
        {view==="brain"&&(
          <div>
            <OneThingSection tasks={tasks} oneThing={oneThing} onSet={setOneThingFn} onClear={()=>setOneThing(null)}/>
  
            {incomplete.length===0?(
              <div style={{textAlign:"center",padding:"36px 20px",color:"#bbb"}}>
                <div style={{fontSize:44}}>🎉</div>
                <p style={{fontWeight:700,fontSize:15,fontFamily:"'DM Sans',sans-serif"}}>Nothing queued!</p>
                <button onClick={()=>setShowAdd(true)} style={{marginTop:10,padding:"8px 18px",borderRadius:12,border:"none",background:"#3AABB5",color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add a task</button>
              </div>
            ):incomplete.map(task=><TaskCard key={task.id} task={task} areas={areas} onComplete={completeTask} onDelete={deleteTask} onBreakdown={setBreakdownTask} onFocus={setFocusTask} onEdit={(task, mode)=>mode==='reassign'?setReassignTask(task):setEditTask(task)} soundEnabled={soundEnabled}/>)}
            {done.length>0&&(
              <div style={{marginTop:22}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <h3 style={{fontSize:11,fontWeight:800,color:"#bbb",margin:0,letterSpacing:"0.08em",textTransform:"uppercase"}}>✅ Done ({done.length})</h3>
                  <button onClick={clearDone} style={{fontSize:11,color:"#ccc",background:"none",border:"1px solid #e0e0e0",borderRadius:8,padding:"2px 8px",cursor:"pointer"}}>Clear</button>
                </div>
                {done.slice(0,4).map(task=><TaskCard key={task.id} task={task} areas={areas} onComplete={completeTask} onDelete={deleteTask} compact soundEnabled={soundEnabled}/>)}
              </div>
            )}
          </div>
        )}
        {view==="calendar"&&<CalendarView tasks={tasks} areas={areas} onComplete={completeTask} onDelete={deleteTask} onBreakdown={setBreakdownTask} onFocus={setFocusTask} onEdit={(task, mode)=>mode==='reassign'?setReassignTask(task):setEditTask(task)} soundEnabled={soundEnabled}/>}
        {view==="area"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:7,marginBottom:18}}>
              {areas.map(a=>{ const n=incomplete.filter(t=>t.area===a.id).length; return <button key={a.id} onClick={()=>setActiveArea(a.id)} style={{padding:"10px 8px",borderRadius:14,border:`2px solid ${activeArea===a.id?a.color:"#e0e0e0"}`,background:activeArea===a.id?(a.bg||colorBg(a.color)):"#fff",textAlign:"center",cursor:"pointer",boxShadow:activeArea===a.id?`0 4px 14px ${a.color}33`:"none",transition:"all 0.18s"}}><div style={{fontSize:20}}>{a.emoji}</div><div style={{fontSize:10,fontWeight:700,color:activeArea===a.id?a.color:"#aaa",marginTop:3,fontFamily:"'DM Sans',sans-serif"}}>{a.label}</div>{n>0&&<div style={{fontSize:10,color:a.color,fontWeight:800,marginTop:2}}>{n}</div>}</button>; })}
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><button onClick={()=>setShowAdd(true)} style={{padding:"7px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3AABB5,#4F86C6)",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add task</button></div>
            {tasks.filter(t=>t.area===activeArea).length===0?<div style={{textAlign:"center",padding:"36px 20px",color:"#bbb"}}><div style={{fontSize:38}}>{areas.find(a=>a.id===activeArea)?.emoji}</div><p style={{fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>Nothing here</p></div>
            :HORIZONS.map(h=>{ const group=tasks.filter(t=>t.area===activeArea&&t.horizon===h.id&&!t.done); if(!group.length)return null; return <div key={h.id} style={{marginBottom:18}}><h3 style={{fontSize:11,fontWeight:800,color:"#bbb",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7,fontFamily:"'DM Sans',sans-serif"}}>{h.icon} {h.label}</h3>{group.map(task=><TaskCard key={task.id} task={task} areas={areas} onComplete={completeTask} onDelete={deleteTask} onBreakdown={setBreakdownTask} onFocus={setFocusTask} onEdit={(task, mode)=>mode==='reassign'?setReassignTask(task):setEditTask(task)} soundEnabled={soundEnabled}/>)}</div>; })}
          </div>
        )}
        {view==="stats"&&<StatsView tasks={tasks} areas={areas} streak={streak} done={done}/>}
        {view!=="stats"&&(
          <div style={{marginTop:20,background:"#fff",borderRadius:14,padding:"10px 14px",display:"flex",gap:10,flexWrap:"wrap",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            {areas.map(a=>{ const n=incomplete.filter(t=>t.area===a.id).length; if(!n)return null; return <div key={a.id} style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:13}}>{a.emoji}</span><span style={{fontSize:12,fontWeight:800,color:a.color,fontFamily:"'DM Sans',sans-serif"}}>{n}</span></div>; })}
            {incomplete.length===0&&<span style={{fontSize:12,color:"#ccc",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>All untangled! 🌟</span>}
          </div>
        )}
      </div>
    </div>
  );
}
