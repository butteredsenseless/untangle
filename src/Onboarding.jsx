import { useState, useEffect, useRef } from "react";
import { askAlexander } from "./alexander.js";

const uid = () => Math.random().toString(36).slice(2, 9);

function makeTask(raw, result, areas) {
  const area = areas.find(a => a.id === result.area) || areas[0];
  return {
    id: uid(),
    title: result.title || raw,
    area: area.id,
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
    projectId: null,
    aiSorted: true
  };
}

export default function OnboardingFlow({ onComplete, onAddTasks, onSetOneThing, areas }) {
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState({ name: "", weekShape: "", scheduleNotes: "" });
  const [addedTasks, setAddedTasks] = useState([]);

  const next = () => setStep(s => s + 1);

  const handleAddTasks = (tasks) => {
    const enriched = tasks.map(t => ({
      ...t,
      areaEmoji: areas.find(a => a.id === t.area)?.emoji || ""
    }));
    setAddedTasks(prev => [...prev, ...enriched]);
    onAddTasks(tasks);
  };

  const steps = [
    <StepConversation userData={userData} setUserData={setUserData} next={next} />,
    <StepFirstTask areas={areas} onAddTasks={handleAddTasks} next={next} />,
    <StepBrainDump areas={areas} onAddTasks={handleAddTasks} next={next} />,
    <StepBuckets areas={areas} next={next} />,
    <StepTodaysKnot tasks={addedTasks} areas={areas} onSet={onSetOneThing} next={next} />,
    <StepSignOff onComplete={() => onComplete(userData)} />
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#f7f8fa",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", zIndex: 2000, padding: 24
    }}>
      <style>{`@keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {steps[step]}
    </div>
  );
}

const QUESTIONS = [
  {
    key: "name",
    ask: "Hi — what should Alexander call you?",
    type: "text",
    singleLine: true,
    placeholder: "Your name",
    response: (val) => `Ok ${val}, let's untangle this.`
  },
  {
    key: "weekShape",
    ask: "What does a typical week look like for you?",
    type: "options",
    options: ["9–5 job", "Freelance / varies", "Student", "Parent / carer", "Mix of everything"],
    response: (val) => ({
      "9–5 job": "Got it: structured days with clear boundaries.",
      "Freelance / varies": "Understood: flexibility is great, but it cuts both ways.",
      "Student": "Got it: deadlines, lectures, and a lot of context switching.",
      "Parent / carer": "Noted: your time isn't always your own.",
      "Mix of everything": "Fair enough: we'll keep things flexible."
    })[val]
  },
  {
    key: "scheduleNotes",
    ask: "Anything else I should know that'll help shape your schedule? School run, early starts, best time of day for you to get things done?",
    type: "text",
    placeholder: "e.g. school run at 8 and 3, best before noon",
    optional: true,
    response: (val) => val.trim() ? `Got it: I'll keep that in mind.` : `No worries: we can always add that later.`
  }
];

function StepConversation({ userData, setUserData, next }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [messages, setMessages] = useState([{ type: "alex", text: QUESTIONS[0].ask }]);
  const [input, setInput] = useState("");
  const [waitingForNext, setWaitingForNext] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAnswer = (val) => {
    if (waitingForNext) return;
    const q = QUESTIONS[currentQ];
    const answer = val || input.trim();
    if (!answer && !q.optional) return;

    setUserData(u => ({ ...u, [q.key]: answer }));
    setMessages(m => [...m, { type: "user", text: answer || "Skip" }]);
    setInput("");
    setWaitingForNext(true);

    setTimeout(() => {
      const responseText = q.response(answer);
      setMessages(m => [...m, { type: "alex", text: responseText }]);

      if (currentQ + 1 < QUESTIONS.length) {
        setTimeout(() => {
          setMessages(m => [...m, { type: "alex", text: QUESTIONS[currentQ + 1].ask }]);
          setCurrentQ(q => q + 1);
          setWaitingForNext(false);
        }, 800);
      } else {
        setTimeout(next, 1200);
      }
    }, 600);
  };

  const q = QUESTIONS[currentQ];

  return (
    <div style={{ maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", height: "80vh", maxHeight: 600 }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            animation: "fadein 0.3s ease",
            display: "flex",
            justifyContent: msg.type === "user" ? "flex-end" : "flex-start"
          }}>
            {msg.type === "alex" && (
              <div style={{ fontSize: 20, marginRight: 8, alignSelf: "flex-end" }}>🧠</div>
            )}
            <div style={{
              maxWidth: "75%",
              padding: "12px 16px",
              borderRadius: msg.type === "alex" ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
              background: msg.type === "alex" ? "#fff" : "linear-gradient(135deg,#3AABB5,#4F86C6)",
              color: msg.type === "alex" ? "#333" : "#fff",
              fontSize: 15,
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              lineHeight: 1.5
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!waitingForNext && (
        <div style={{ animation: "fadein 0.3s ease" }}>
          {q.type === "options" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {q.options.map(opt => (
                <button key={opt} onClick={() => handleAnswer(opt)}
                  style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid #e5e5e5", background: "#fff", color: "#333", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {q.singleLine ? (
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAnswer(); }}
                    placeholder={q.placeholder}
                    autoFocus
                    style={{ flex: 1, padding: "14px 16px", borderRadius: 14, border: "2px solid #e5e5e5", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", lineHeight: 1.5 }}
                  />
                ) : (
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !q.optional) e.preventDefault(); }}
                    placeholder={q.placeholder}
                    autoFocus
                    rows={3}
                    style={{ flex: 1, padding: "14px 16px", borderRadius: 14, border: "2px solid #e5e5e5", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", lineHeight: 1.5 }}
                  />
                )}
                <button onClick={() => handleAnswer()}
                  disabled={!input.trim() && !q.optional}
                  style={{ padding: "14px 18px", borderRadius: 14, border: "none", background: (input.trim() || q.optional) ? "linear-gradient(135deg,#3AABB5,#4F86C6)" : "#e5e5e5", color: (input.trim() || q.optional) ? "#fff" : "#aaa", fontSize: 15, fontWeight: 800, cursor: (input.trim() || q.optional) ? "pointer" : "default", alignSelf: "flex-end" }}>
                  {q.optional && !input.trim() ? "Skip" : "→"}
                </button>
              </div>
              {q.optional && <p style={{ fontSize: 12, color: "#bbb", margin: 0, paddingLeft: 4 }}>Optional — skip if you'd rather not</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepFirstTask({ areas, onAddTasks, next }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sorted, setSorted] = useState(null);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const raw = input.trim();
    setLoading(true);
    try {
      const result = await askAlexander(raw, areas, {}, {});
      const r = Array.isArray(result) ? result[0] : result;
      const task = makeTask(raw, r, areas);
      onAddTasks([task]);
      setSorted({ title: task.title, area: areas.find(a => a.id === task.area) || areas[0] });
    } catch (e) {
      const task = makeTask(raw, {}, areas);
      onAddTasks([task]);
      setSorted({ title: raw, area: areas[0] });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 480, width: "100%" }}>
      <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Let's show you how this works</p>
      <p style={{ fontSize: 14, color: "#aaa", marginBottom: 20 }}>Type your first task below — if it has a deadline or repeats, just say so. Alexander will sort it instantly.</p>

      {!sorted && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Type a task…"
              autoFocus
              disabled={loading}
              style={{ flex: 1, padding: "14px 16px", borderRadius: 14, border: "2px solid #e5e5e5", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
            />
            <button onClick={handleSubmit} disabled={!input.trim() || loading}
              style={{ padding: "14px 18px", borderRadius: 14, border: "none", background: input.trim() && !loading ? "linear-gradient(135deg,#3AABB5,#4F86C6)" : "#e5e5e5", color: input.trim() && !loading ? "#fff" : "#aaa", fontSize: 15, fontWeight: 800, cursor: input.trim() && !loading ? "pointer" : "default" }}>
              {loading ? "…" : "→"}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#bbb", margin: 0, paddingLeft: 2 }}>Try something like: <em>walk the dog twice daily</em> or <em>book the ferry before 15th April</em></p>
        </div>
      )}

      {loading && (
        <p style={{ fontSize: 13, color: "#3AABB5", fontWeight: 700, marginBottom: 12 }}>Alexander is sorting…</p>
      )}

      {sorted && (
        <div style={{ animation: "fadein 0.3s ease" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", border: "2px solid #e5e5e5", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 26 }}>{sorted.area.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#333" }}>{sorted.title}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{sorted.area.label}</div>
            </div>
            <div style={{ fontSize: 18, color: "#4ade80" }}>✓</div>
          </div>
          <button onClick={next} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#3AABB5,#4F86C6)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

function StepBrainDump({ areas, onAddTasks, next }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sorted, setSorted] = useState([]);
  const MAX = 3;
  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading, sorted.length]);

  const handleSubmit = async () => {
    if (!input.trim() || loading || sorted.length >= MAX) return;
    const raw = input.trim();
    setInput("");
    setLoading(true);
    try {
      const result = await askAlexander(raw, areas, {}, {});
      const r = Array.isArray(result) ? result[0] : result;
      const task = makeTask(raw, r, areas);
      onAddTasks([task]);
      setSorted(s => [...s, { title: task.title, area: areas.find(a => a.id === task.area) || areas[0] }]);
    } catch {
      const task = makeTask(raw, {}, areas);
      onAddTasks([task]);
      setSorted(s => [...s, { title: raw, area: areas[0] }]);
    }
    setLoading(false);
  };

  const done = sorted.length >= MAX;

  return (
    <div style={{ maxWidth: 480, width: "100%" }}>
      <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Now try a brain dump</p>
      <p style={{ fontSize: 14, color: "#aaa", marginBottom: 20 }}>
        Add up to {MAX} tasks — one at a time. Alexander will sort each one into the right bucket as you go. No tags, no categories. Just type.{" "}
        <span style={{ color: "#3AABB5", fontWeight: 700 }}>({sorted.length}/{MAX})</span>
      </p>

      {sorted.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {sorted.map((s, i) => (
            <div key={i} style={{ animation: "fadein 0.3s ease", background: "#fff", borderRadius: 14, padding: "12px 14px", border: "2px solid #e5e5e5", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 22 }}>{s.area.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{s.area.label}</div>
              </div>
              <div style={{ fontSize: 16, color: "#4ade80", fontWeight: 700 }}>✓</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p style={{ fontSize: 13, color: "#3AABB5", fontWeight: 700, marginBottom: 12 }}>Alexander is sorting…</p>
      )}

      {!done && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
            placeholder={`Task ${sorted.length + 1} of ${MAX}…`}
            disabled={loading}
            style={{ flex: 1, padding: "14px 16px", borderRadius: 14, border: "2px solid #e5e5e5", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
          />
          <button onClick={handleSubmit} disabled={!input.trim() || loading}
            style={{ padding: "14px 18px", borderRadius: 14, border: "none", background: input.trim() && !loading ? "linear-gradient(135deg,#3AABB5,#4F86C6)" : "#e5e5e5", color: input.trim() && !loading ? "#fff" : "#aaa", fontSize: 15, fontWeight: 800, cursor: input.trim() && !loading ? "pointer" : "default" }}>
            {loading ? "…" : "→"}
          </button>
        </div>
      )}

      {done && (
        <button onClick={next} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#3AABB5,#4F86C6)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
          Continue →
        </button>
      )}

      {!done && sorted.length > 0 && (
        <button onClick={next} style={{ width: "100%", padding: 12, borderRadius: 14, border: "2px solid #e5e5e5", background: "#fff", color: "#aaa", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Skip →
        </button>
      )}
    </div>
  );
}

function StepBuckets({ areas, next }) {
  return (
    <div style={{ maxWidth: 480, width: "100%" }}>
      <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>Here are your buckets</p>
      <p style={{ fontSize: 14, color: "#aaa", marginBottom: 20, textAlign: "center" }}>These are the buckets Alexander just sorted your tasks into — you can customise them anytime.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
        {areas.map(a => (
          <div key={a.id} style={{ padding: "14px 10px", borderRadius: 14, background: "#fff", border: "2px solid #e5e5e5", textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>{a.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginTop: 4 }}>{a.label}</div>
          </div>
        ))}
      </div>
      <button onClick={next} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#3AABB5,#4F86C6)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
        Let's go →
      </button>
    </div>
  );
}

function StepTodaysKnot({ tasks, areas, onSet, next }) {
  const [selected, setSelected] = useState(null);

  const handlePick = (title) => {
    setSelected(title);
    onSet(title);
  };

  return (
    <div style={{ maxWidth: 480, width: "100%" }}>
      <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>What's your Today's Knot?</p>
      <p style={{ fontSize: 14, color: "#aaa", marginBottom: 20 }}>The one thing that matters most today. Everything else can wait.</p>

      {tasks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {tasks.map((t, i) => (
            <button key={i} onClick={() => handlePick(t.title)}
              style={{
                padding: "12px 16px", borderRadius: 14,
                border: `2px solid ${selected === t.title ? "#3AABB5" : "#e5e5e5"}`,
                background: selected === t.title ? "#e8f7f8" : "#fff",
                color: "#333", fontSize: 14, fontWeight: 700, cursor: "pointer",
                textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                fontFamily: "'DM Sans', sans-serif"
              }}>
              <span style={{ fontSize: 20 }}>{t.areaEmoji}</span>
              <span style={{ flex: 1 }}>{t.title}</span>
              {selected === t.title && <span style={{ color: "#3AABB5", fontSize: 16 }}>✓</span>}
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <button onClick={next} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#3AABB5,#4F86C6)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
          Let's go →
        </button>
      ) : (
        <button onClick={next} style={{ width: "100%", padding: 12, borderRadius: 14, border: "2px solid #e5e5e5", background: "#fff", color: "#aaa", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Skip for now →
        </button>
      )}
    </div>
  );
}

function StepSignOff({ onComplete }) {
  return (
    <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
      <p style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Your brain is a little more untangled.</p>
      <p style={{ fontSize: 15, color: "#aaa", marginBottom: 32 }}>Alexander is ready when you are.</p>
      <button onClick={onComplete} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#3AABB5,#4F86C6)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
        Let's untangle this →
      </button>
    </div>
  );
}
