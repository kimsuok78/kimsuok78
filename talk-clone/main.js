// --- Simple KakaoTalk-like local chat clone (no server) ---
const $ = (q) => document.querySelector(q);
const chatEl = $("#chat");
const inputEl = $("#input");
const sendBtn = $("#send");
const clearBtn = $("#clear");
const toggleBtn = $("#toggleSide");
const avatarEl = $("#avatar");
const roomTitleEl = $("#roomTitle");
const subTitleEl = $("#subTitle");
const toastEl = $("#toast");

const STORAGE_KEY = "talk_clone_messages_v1";

// "me" / "their" sending side toggle (for demo)
let currentSide = "me"; // default sender
const profiles = {
  me:   { name: "나",    avatar: "나".slice(0,1), status: "온라인" },
  their:{ name: "상대",  avatar: "상".slice(0,1), status: "온라인" },
};

/** message: { id, side, text, ts, readByOther } */
let messages = loadMessages();

function loadMessages(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch(e){
    return [];
  }
}
function saveMessages(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function pad2(n){ return String(n).padStart(2,"0"); }
function formatTime(ts){
  const d = new Date(ts);
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${hh}:${mm}`;
}
function formatDay(ts){
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = pad2(d.getMonth()+1);
  const day = pad2(d.getDate());
  return `${y}.${m}.${day}`;
}
function sameDay(aTs,bTs){
  const a = new Date(aTs), b = new Date(bTs);
  return a.getFullYear()===b.getFullYear() &&
         a.getMonth()===b.getMonth() &&
         a.getDate()===b.getDate();
}

function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(()=>toastEl.classList.remove("show"), 900);
}

function render(){
  chatEl.innerHTML = "";

  // Render day separators
  let prevTs = null;
  for(const m of messages){
    if(prevTs === null || !sameDay(prevTs, m.ts)){
      const day = document.createElement("div");
      day.className = "day";
      day.textContent = formatDay(m.ts);
      chatEl.appendChild(day);
    }
    prevTs = m.ts;

    const row = document.createElement("div");
    row.className = `row ${m.side}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = m.text;

    const meta = document.createElement("div");
    meta.className = "meta";

    // In KakaoTalk, "1" read marker often appears near message when unread by other.
    const read = document.createElement("div");
    read.className = "read";
    read.textContent = m.readByOther ? "" : "1";

    const time = document.createElement("div");
    time.textContent = formatTime(m.ts);

    meta.appendChild(read);
    meta.appendChild(time);

    if(m.side === "their"){
      // their: bubble then meta (like left)
      row.appendChild(bubble);
      row.appendChild(meta);
    }else{
      // me: meta then bubble (like right)
      row.appendChild(meta);
      row.appendChild(bubble);
    }

    chatEl.appendChild(row);
  }

  // scroll to bottom
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setSide(side){
  currentSide = side;
  const p = profiles[side];
  avatarEl.textContent = p.avatar;
  roomTitleEl.textContent = (side === "me") ? "상대와의 대화" : "나와의 대화(상대 시점)";
  subTitleEl.textContent = p.status + " · 발신자: " + p.name;
  toast(`발신자 전환: ${p.name}`);
}

function autosize(){
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
}

function canSend(){
  return inputEl.value.trim().length > 0;
}

function updateSendState(){
  sendBtn.disabled = !canSend();
}

function send(){
  const text = inputEl.value.trim();
  if(!text) return;

  const msg = {
    id: crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2),
    side: currentSide,
    text,
    ts: Date.now(),
    // simple read logic:
    // - if I send as "me": other hasn't read yet => false
    // - if I send as "their": I haven't read yet => false
    readByOther: false
  };

  // Mark previous messages as "read" from the opposite perspective
  // When sender is "me", assume "their" sees my last messages when they reply (and vice versa).
  const opposite = currentSide === "me" ? "their" : "me";
  for(let i = messages.length - 1; i >= 0; i--){
    if(messages[i].side === opposite && !messages[i].readByOther){
      // When I send now, I am "reading" opposite messages
      messages[i].readByOther = true;
    }else if(messages[i].side === opposite){
      break;
    }
  }

  messages.push(msg);
  saveMessages();
  inputEl.value = "";
  autosize();
  updateSendState();
  render();
}

// Events
inputEl.addEventListener("input", () => { autosize(); updateSendState(); });

inputEl.addEventListener("keydown", (e) => {
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    send();
  }
});

sendBtn.addEventListener("click", send);

clearBtn.addEventListener("click", () => {
  messages = [];
  saveMessages();
  render();
  toast("대화를 삭제했어요");
});

toggleBtn.addEventListener("click", () => {
  setSide(currentSide === "me" ? "their" : "me");
});

// init
setSide("me");
render();
autosize();
updateSendState();