# Untangle — Full Copy Inventory

All user-facing text in the app, organised by section. Last updated against codebase at commit d22fc36.

---

## 1. App Shell / Header

| Element | Current copy |
|---|---|
| App name | Untangle |
| Subtitle / task count | `{n} tasks to untangle` |
| Subtitle with streak | `{n} tasks to untangle · 🔥 {n} days` |
| Quick notes button (tooltip) | Quick notes |
| Add button | + Add |
| Brain dump button (header) | 🧠 Dump |
| Voice button (header) | 🎤 Voice |

---

## 2. Navigation Tabs

| Tab | Current copy |
|---|---|
| Today's Knot | ⚡ Today's Knot |
| Calendar | 📅 Calendar |
| By Area | 🗂️ By Area |
| Progress | 📊 Progress |

---

## 3. Today's Knot (OneThingSection)

**When not set / editing:**

| Element | Current copy |
|---|---|
| Section label | 🎯 Today's Knot |
| Prompt | What's the one thing that matters most today? |
| Update mode prompt | Update your focus for today: |

**When set:**

| Element | Current copy |
|---|---|
| Label | Today's Knot |
| Sub-label (incomplete) | Focus here first. Everything else can wait. |
| Sub-label (completed) | 🎉 You've untangled today's knot! The main thing is done. |
| Edit button | Edit |
| Clear button (×) | × |

---

## 4. Task Card

| Element | Current copy |
|---|---|
| Bucket tag (reassign prompt) | `{emoji} {area label} ✎` |
| AI nudge prefix | 💡 |
| Recur badge | 🔁 {label} (×{n} if >1) |
| Deadline badge | 📅 {deadline} |
| Recur time badge | 🕐 {time} |
| Focus timer button (tooltip) | Focus timer |
| AI Task Coach button (tooltip) | AI Task Coach |
| Edit button (tooltip) | Edit |
| Delete button | × |
| Swipe right reveal | ✓ |
| Swipe left reveal | 🗑️ |
| Subtask prefix | ↳ |

---

## 5. Task List Empty States

| Context | Current copy |
|---|---|
| Today's Knot tab — nothing queued | 🎉 Nothing queued! |
| Today's Knot tab — nothing queued CTA | + Add a task |
| Done section header | ✅ Done ({n}) |
| Done section clear button | Clear |
| Calendar view — nothing here | ✨ Nothing here |
| By Area view — nothing in bucket | Nothing here |
| Project expanded — no tasks | No tasks yet |

---

## 6. Add Task Modal (TaskModal)

| Element | Current copy |
|---|---|
| Title (new) | ✨ Add a task |
| Title (edit) | ✏️ Edit task |
| Task input placeholder | What needs doing? #work #weekly |
| Section label — Area | AREA |
| Section label — Project | PROJECT (OPTIONAL) |
| Alexander suggests badge | ✦ Alexander suggests |
| Section label — When | WHEN? |
| Horizon option | Today ⚡ / This Week 📅 / This Month 🗓️ / Big Projects 🚀 |
| Section label — Energy | ENERGY |
| Energy option | 🌙 Low / ☀️ Medium / ⚡ High |
| Section label — Daily count target | DAILY COUNT TARGET |
| Daily count helper text | For things done multiple times a day (e.g. water × 8, walk dog × 3) |
| Daily count suffix (×1) | once (standard) |
| Daily count suffix (>1) | per day |
| Section label — Repeats | REPEATS? |
| Recur options | One-time / 🔁 Daily / 🔁 Weekdays / 🔁 Weekly / 🔁 Monthly |
| Weekly days helper | Which days? |
| Weekly frequency label | Times per week: |
| Recur time label | Time (optional): |
| Deadline input placeholder | Deadline (optional) |
| Notes input placeholder | Notes (optional) |
| Save button (new) | Add it ✓ |
| Save button (edit) | Save changes ✓ |
| Cancel button | Cancel |

---

## 7. Brain Dump Modal (BrainDumpModal)

| Element | Current copy |
|---|---|
| Title | 🧠 Brain Dump |
| Subtitle | One task per line. Just type naturally — Alexander will sort them. |
| Textarea placeholder | call the dentist\npay council tax\nwalk the dog every morning |
| Sorting progress | Alexander is sorting task {n} of {total}… |
| Sort button (idle) | Let Alexander sort these ✓ |
| Sort button (loading) | Sorting… |
| Cancel button | Cancel |

---

## 8. Voice Dump Modal (VoiceDumpModal)

| Element | Current copy |
|---|---|
| Title | 🎤 Voice Brain Dump |
| Subtitle | Works in Chrome, Safari, Edge. Each sentence becomes a task. |
| No speech recognition warning | ⚠️ Try Chrome or Safari, or paste below. |
| Initial mic status | Tap the mic and start speaking |
| Active listening status | Listening… speak freely! |
| Post-recording status | Done! Edit below or import now. |
| Sorting status | Alexander is sorting... |
| Mic button (idle) | 🎤 |
| Mic button (active) | ⏹ |
| Textarea placeholder | Your speech appears here… |
| Import button | Import tasks ✓ |
| Cancel button | Cancel |

---

## 9. Reassign Bucket Picker (ReassignPicker)

| Element | Current copy |
|---|---|
| Title | Move to bucket |
| Task name echo | "{task.title}" |
| Current bucket label | current |
| Cancel button | Cancel |

---

## 10. AI Task Coach / Breakdown Modal (AiBreakdownModal)

| Element | Current copy |
|---|---|
| Title | 🫱🍽️ AI Task Coach |
| Subtitle | Breaking down: **{task title}** |
| Loading spinner | ⚙️ Thinking… |
| Error message | Couldn't reach AI. Add your Anthropic API key in Vercel environment variables. |
| Save button | Save subtasks ✓ |
| Cancel button | Cancel |
| AI prompt (sent to Claude) | You are an ADHD productivity coach. Break down this task into 3-6 small concrete actionable subtasks (5-15 mins each). Task: "{title}". Reply ONLY with a JSON array of strings. No markdown. |

---

## 11. Focus Timer (FocusTimer)

| Element | Current copy |
|---|---|
| Header label | FOCUS MODE |
| Start button | ▶ Start |
| Pause button | ⏸ Pause |
| Exit button | Exit |
| Mark done button | ✓ Mark done! |
| Not done button | Not done yet |

---

## 12. Quick Notes Modal (NotesModal)

| Element | Current copy |
|---|---|
| Title | 📝 Quick Notes |
| Description | Packing lists, random thoughts, things to look up. Not a task — just a place to think. |
| Textarea placeholder | Packing for trip:\n- passport\n- charger\n\nThings to Google:\n- best coffee Oxford |
| Save button | Save ✓ |

---

## 13. Settings Panel (SettingsPanel)

| Element | Current copy |
|---|---|
| Title | ⚙️ Settings |
| Close button | × |
| Label — App name | APP NAME |
| Label — App logo | APP LOGO |
| Upload logo button | Upload logo |
| Remove logo button | Remove |
| Label — Sound effects | SOUND EFFECTS |
| Sound effects description | Play sounds on completion & timer |
| Label — Life areas | LIFE AREAS |
| Area rename button | Rename |
| Area delete button | Delete |
| Area rename save button | Save |
| Label — Add custom area | ADD CUSTOM AREA |
| Custom area placeholder | e.g. Client A… |
| Add area button | + Add area |
| Done button | Done ✓ |

---

## 14. Project Modal (ProjectModal)

| Element | Current copy |
|---|---|
| Title (new) | New Project |
| Title (edit) | Edit Project |
| Name input placeholder | Project name |
| Bucket section label | BUCKET |
| Save button (new) | Create Project |
| Save button (edit) | Save changes |
| Cancel button | Cancel |
| Delete button (edit only) | Delete project |

---

## 15. By Area View

| Element | Current copy |
|---|---|
| New project button | ＋ New Project |
| Add task button | + Add task |
| Project task count | {n} task / {n} tasks |
| Project empty state | No tasks yet |

---

## 16. Progress / Stats View (StatsView)

| Stat label | Current copy |
|---|---|
| Streak | 🔥 {n} (Day streak) |
| Done | Tasks done |
| Remaining | Still to do |
| Recurring | Recurring |
| Section heading | By area |
| Area stat | {n} left / {total} |

---

## 17. Calendar View (CalendarView)

| Element | Current copy |
|---|---|
| Mode tabs | day / week / month |
| Back to current | Back to current {mode} |
| Task count sub-label | {n} tasks |
| Empty state | ✨ Nothing here |

---

## 18. Default Life Areas (bucket labels)

| ID | Label |
|---|---|
| work | Work & Career |
| health | Health & Fitness |
| home | Home & Chores |
| social | Social & Relationships |
| finance | Finance |
| hobbies | Hobbies & Fun |
| selfcare | Self-care & Mental Health |
| learning | Learning & Growth |
| education | Education & School |
| admin | Admin |

---

## 19. Horizon Labels

| ID | Label |
|---|---|
| today | Today |
| week | This Week |
| month | This Month |
| project | Big Projects |

---

## 20. Onboarding — Chat Thread (StepConversation)

**Questions Alexander asks (in order):**

1. "Hi — what should Alexander call you?"
   - Input type: single-line text
   - Placeholder: Your name
   - Alexander response: "Ok {name}, let's untangle this."

2. "What does a typical week look like for you?"
   - Input type: option buttons
   - Options:
     - 9–5 job → "Got it: structured days with clear boundaries."
     - Freelance / varies → "Understood: flexibility is great, but it cuts both ways."
     - Student → "Got it: deadlines, lectures, and a lot of context switching."
     - Parent / carer → "Noted: your time isn't always your own."
     - Mix of everything → "Fair enough: we'll keep things flexible."

3. "Anything else I should know that'll help shape your schedule? School run, early starts, best time of day for you to get things done?"
   - Input type: textarea
   - Placeholder: e.g. school run at 8 and 3, best before noon
   - Optional marker: Optional — skip if you'd rather not
   - Skip button: Skip
   - Send button: →
   - Alexander response (with answer): "Got it: I'll keep that in mind."
   - Alexander response (skipped): "No worries: we can always add that later."

---

## 21. Onboarding — First Task Step (StepFirstTask)

| Element | Current copy |
|---|---|
| Heading | Let's show you how this works |
| Subtext | Type your first task below — if it has a deadline or repeats, just say so. Alexander will sort it instantly. |
| Input placeholder | Type a task… |
| Hint text | Try something like: *walk the dog twice daily* or *book the ferry before 15th April* |
| Submit button | → |
| Loading state | … |
| Sorting indicator | Alexander is sorting… |
| Continue button (after sort) | Continue → |

---

## 22. Onboarding — Brain Dump Step (StepBrainDump)

| Element | Current copy |
|---|---|
| Heading | Now try a brain dump |
| Subtext | Add up to 3 tasks — one at a time. Alexander will sort each one into the right bucket as you go. No tags, no categories. Just type. |
| Counter | ({n}/3) |
| Input placeholder | Task {n} of 3… |
| Submit button | → |
| Loading state | … |
| Sorting indicator | Alexander is sorting… |
| Continue button (after 3 tasks) | Continue → |
| Skip button (after at least 1) | Skip → |

---

## 23. Onboarding — Buckets Step (StepBuckets)

| Element | Current copy |
|---|---|
| Heading | Here are your buckets |
| Subtext | These are the buckets Alexander just sorted your tasks into — you can customise them anytime. |
| Continue button | Let's go → |

---

## 24. Onboarding — Today's Knot Step (StepTodaysKnot)

| Element | Current copy |
|---|---|
| Heading | What's your Today's Knot? |
| Subtext | The one thing that matters most today. Everything else can wait. |
| Continue button (after selection) | Let's go → |
| Skip button (no selection) | Skip for now → |

---

## 25. Onboarding — Sign-off Step (StepSignOff)

| Element | Current copy |
|---|---|
| Icon | 🧠 |
| Heading | Your brain is a little more untangled. |
| Subtext | Alexander is ready when you are. |
| CTA button | Let's untangle this → |

---

## 26. Alexander — Sorting Prompt (alexander.js)

The full system prompt sent to `claude-haiku-4-5-20251001` for every task sort:

```
You are Alexander, an AI assistant for Untangle — an ADHD life management app.

The user has typed: "{input}"

Available buckets:
{bucketList}

[Optional: Learned corrections section if corrections exist]

Analyse the input and respond with ONLY a JSON object, no markdown:
{
  "title": "keep the user's original wording, only fix typos or remove hashtags — never rewrite or interpret",
  "area": "bucket id from the list above",
  "type": "task|recurring|deadline|goal|project",
  "recur": "none|daily|weekday|weekly|monthly",
  "dailyTarget": 1,
  "deadline": "natural language deadline or empty string",
  "horizon": "today|week|month|project",
  "confidence": "high|medium|low",
  "nudge": "optional short message if this looks like a project or goal, otherwise empty string"
}

Rules:
- NEVER rewrite the task title. Keep the user's own words.
- If the task mentions a frequency like "twice a day" or "3 times daily", set dailyTarget to that number and recur to "daily" — do NOT create multiple tasks.
- If the input sounds like a goal (e.g. "lose weight", "be happier"), set nudge to a gentle message.
- If the input sounds like a project (multiple steps implied), set nudge to a gentle message.
```

---

---

## NOTES — Copy Items Flagged for Rewrite

### 1. Remove "Dump" throughout

The word "dump" feels clinical and slightly off-brand. Leading replacement: **"Empty your mind"** as the concept. Specific replacements needed:

| Current | Proposed replacement |
|---|---|
| 🧠 Dump (header button) | 🧠 Empty Mind *(or: Clear Head / Mind Dump)* |
| 🎤 Voice Brain Dump (modal title) | 🎤 Voice Dump *(or: Speak it out)* |
| 🧠 Brain Dump (modal title) | 🧠 Empty Your Mind |
| Brain Dump modal subtitle | *(needs rewrite — see below)* |
| StepBrainDump heading (onboarding) | Now try a brain dump → **Now empty your mind** |
| StepBrainDump subtext | *(needs rewrite — see below)* |

**Proposed Brain Dump modal subtitle (replacing "One task per line. Just type naturally — Alexander will sort them."):**
> Empty your mind. Everything in there, just type it out — one thing per line. Alexander will sort the rest.

**Proposed StepBrainDump subtext (replacing current onboarding copy):**
> Empty your mind — one thing at a time. No tags, no categories. Just type. Alexander will sort each one into the right bucket as you go.

---

### 2. Buckets step copy after brain dump

The current buckets step copy ("These are the buckets Alexander just sorted your tasks into — you can customise them anytime.") is functional but thin. Proposed replacement that teaches the correction mechanic:

> I've sorted everything into buckets for you. If I've put something in the wrong place, just tap the bucket tag on the task card to change it — and I'll learn from that for next time.

This copy should replace or supplement the current StepBuckets subtext.

---

### 3. Overwhelm escape hatch (Daily Planning Loop — not yet built)

When the planning loop runs and the user indicates they're overwhelmed, there should be a gentler mode. Copy needs writing for:

- The trigger question / detection (e.g. "Feeling overwhelmed?" or detected from user's tone)
- Alexander's acknowledgement message
- The escape hatch action (e.g. "Let's just pick one thing" or "Shrink today down")
- The reduced view it transitions to (possibly just Today's Knot with a calmer prompt)

Placeholder copy direction:
> "That's a lot. Let's not look at all of it — what's the one thing that would make today feel okay if you got it done?"

---

### 4. Planning Loop greeting — adapts to time of day / preference

The planning loop greeting should differ based on whether the user prefers morning or evening planning (captured in onboarding `scheduleNotes`, or eventually a dedicated preference). Copy needed for:

**Morning variant:**
> Good morning, {name}. Let's figure out today.

**Evening variant (planning tomorrow):**
> Evening, {name}. Let's set tomorrow up properly so you can switch off tonight.

**Neutral / default:**
> Hey {name}. Ready to untangle today?

These should tie into the `weekShape` and `scheduleNotes` data already collected in onboarding.

---

### 5. Other copy improvements to consider (not flagged — lower priority)

- "Nothing queued!" (empty state on Today's Knot tab) — could be warmer: *"All clear! Nothing waiting."* or *"Clean slate. Add something when you're ready."*
- "Your brain is a little more untangled." (onboarding sign-off) — solid, keep.
- "Alexander is ready when you are." (onboarding sign-off sub) — solid, keep.
- "Focus here first. Everything else can wait." (Today's Knot active state) — solid, keep.
- "🎉 You've untangled today's knot! The main thing is done." (Today's Knot completed) — solid, keep.
- AI Task Coach name ("🫱🍽️ AI Task Coach") — emoji combination is unusual; consider 🧩 or 🪄 or just 🤖.
- "Big Projects" (horizon label) — consider "Long game" or "One day" for ADHD context.
