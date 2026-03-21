import { useState, useEffect, useRef } from "react";

export default function OnboardingFlow({ onComplete, areas }) {
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState({
    name: "",
    weekShape: "",
    scheduleNotes: "",
    planningPreference: ""
  });

  const next = () => setStep(s => s + 1);

  const steps = [
    <StepConversation userData={userData} setUserData={setUserData} next={next} />,
    <StepBuckets areas={areas} next={next} />,
    <StepFirstTask areas={areas} next={next} />,
    <StepSignOff onComplete={onComplete} />
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
    ask: "Anything else that'll help shape your schedule? School run, early starts, best time of day?",
    type: "text",
    placeholder: "e.g. school run at 8 and 3, best before noon",
    optional: true,
    response: (val) => val.trim() ? `Got it: I'll keep that in mind.` : `No worries: we can always add that later.`
  },
  {
    key: "planningPreference",
    ask: "Do you prefer to plan the night before or hit the ground running in the morning?",
    type: "options",
    options: ["Night before", "Morning", "Either works"],
    response: (val) => ({
      "Night before": "Perfect: I'll check in with you each evening.",
      "Morning": "Got it: I'll be ready when you are.",
      "Either works": "Flexible it is: I'll adapt to how you're feeling."
    })[val]
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
      {/* Chat history */}
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

      {/* Input area */}
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
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={q.placeholder}
                  autoFocus
                  rows={3}
                  style={{ flex: 1, padding: "14px 16px", borderRadius: 14, border: "2px solid #e5e5e5", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", lineHeight: 1.5 }}
                />
                <button onClick={() => handleAnswer()}
                  disabled={!input.trim() && !q.optional}
                  style={{ padding: "14px 18px", borderRadius: 14, border: "none", background: (input.trim() || q.optional) ? "linear-gradient(135deg,#3AABB5,#4F86C6)" : "#e5e5e5", color: (input.trim() || q.optional) ? "#fff" : "#aaa", fontSize: 15, fontWeight: 800, cursor: (input.trim() || q.optional) ? "pointer" : "default", alignSelf: "flex-end" }}>
                  {q.optional && !input.trim() ? "Skip" : "→"}
                </button>
              </div>
              {q.optional && <p style={{ fontSize: 12, color: "#bbb", margin: 0, paddingLeft: 4 }}>Hit Enter for each new item, then → to send</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepBuckets({ areas, next }) {
  return (
    <div style={{ maxWidth: 480, width: "100%" }}>
      <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>Here are your buckets</p>
      <p style={{ fontSize: 14, color: "#aaa", marginBottom: 20, textAlign: "center" }}>Everything you need to do lives in one of these.</p>
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

function StepFirstTask({ areas, next }) {
  return (
    <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
      <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Type your first task</p>
      <p style={{ fontSize: 14, color: "#aaa", marginBottom: 20 }}>If it repeats or has a deadline, just say so.</p>
      <button onClick={next} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#3AABB5,#4F86C6)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
        Continue →
      </button>
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