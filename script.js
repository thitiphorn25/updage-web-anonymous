// --- สเตทและข้อมูล ---
let currentActiveAnonID = localStorage.getItem('safeTalk_anonID') || "";
let chatHistory = JSON.parse(localStorage.getItem('safeTalk_history')) || [];
let selectedMood = "";
let isAdminOnline = false;
let isHidden = false;

// --- 1. เริ่มต้นระบบ ---
window.onload = function() {
    setupInputListeners(); // ระบบกด Enter
    if (currentActiveAnonID && chatHistory.length > 0) {
        document.getElementById('main-card').style.display = 'none';
        document.getElementById('follow-up-card').style.display = 'block';
        document.getElementById('welcome-anon-name').innerText = currentActiveAnonID;
        renderUserChat();
    } else {
        typeTitle();
    }
};

// --- 2. ระบบ Panic Mask (ซ่อนด่วน) ---
function panicMode() {
    const mask = document.getElementById('privacy-mask');
    if (!isHidden) {
        mask.style.display = 'flex';
        document.title = "Google";
        isHidden = true;
    } else {
        mask.style.display = 'none';
        document.title = "SafeTalk | Anonymous Support";
        isHidden = false;
    }
}
window.addEventListener('keydown', (e) => { if(e.key === "Escape") panicMode(); });

// --- 3. ฟังก์ชันพื้นฐานผู้ใช้ ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId + '-page').classList.add('active');
}

function setMood(mood, el) {
    selectedMood = mood;
    document.querySelectorAll('.mood-icon').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

function submitWithAnon() {
    const msg = document.getElementById('user-msg').value;
    const pin = document.getElementById('user-pin').value;
    if(!msg || pin.length < 4 || !selectedMood) return alert("กรุณาเลือกอารมณ์และกรอกข้อมูลให้ครบครับ");

    const id = "คุณ" + ["แมว", "นกฮูก", "กระต่าย"][Math.floor(Math.random()*3)] + ["ที่สดใส", "ผู้กล้าหาญ"][Math.floor(Math.random()*2)] + " #" + Math.floor(1000+Math.random()*9000);
    currentActiveAnonID = id;
    chatHistory = [{ sender: 'ai', text: `สวัสดีครับ ${id} แอดมินได้รับเรื่องแล้ว ระหว่างนี้ปรึกษา AI ได้ครับ` }, { sender: 'user', text: msg }];
    
    localStorage.setItem('safeTalk_anonID', id);
    localStorage.setItem('safeTalk_history', JSON.stringify(chatHistory));
    
    let cases = JSON.parse(localStorage.getItem('safeTalk_adminCases')) || [];
    cases.push({ id: id, firstMsg: msg, mood: selectedMood, history: chatHistory });
    localStorage.setItem('safeTalk_adminCases', JSON.stringify(cases));

    location.reload();
}

// --- 4. ระบบแชท Hybrid (AI + Admin) ---
function toggleChat() {
    const win = document.getElementById('chat-window');
    win.style.display = (win.style.display === 'flex') ? 'none' : 'flex';
}

function userSendMessage() {
    const input = document.getElementById('chat-in');
    if(!input.value.trim()) return;
    saveAndRender({ sender: 'user', text: input.value.trim() });
    if(!isAdminOnline) aiReply(input.value);
    input.value = "";
}

function aiReply(text) {
    let reply = "ผมรับฟังคุณอยู่นะครับ...";
    const t = text.toLowerCase();
    if(t.includes("เครียด")) reply = "เข้าใจเลยครับ... ลองหายใจลึกๆ นะ แอดมินกำลังรีบมาช่วยเหลือครับ";
    setTimeout(() => saveAndRender({ sender: 'ai', text: "🤖 AI: " + reply }), 1500);
}

function saveAndRender(msg) {
    chatHistory.push(msg);
    localStorage.setItem('safeTalk_history', JSON.stringify(chatHistory));
    renderUserChat();
    let cases = JSON.parse(localStorage.getItem('safeTalk_adminCases')) || [];
    const idx = cases.findIndex(c => c.id === currentActiveAnonID);
    if(idx !== -1) { cases[idx].history.push(msg); localStorage.setItem('safeTalk_adminCases', JSON.stringify(cases)); }
}

function renderUserChat() {
    const box = document.getElementById('user-chat-box');
    box.innerHTML = chatHistory.map(m => `<div class="msg ${m.sender === 'user' ? 'user' : 'ai'}">${m.text}</div>`).join('');
    box.scrollTop = box.scrollHeight;
}

// --- 5. ระบบแอดมิน (admin / 1234) ---
function adminLogin() {
    const u = document.getElementById('admin-user').value;
    const p = document.getElementById('admin-pass').value;
    if(u === "admin" && p === "1234") {
        document.getElementById('admin-login-card').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        renderAdminList();
    } else { alert("รหัสผ่านไม่ถูกต้อง (admin / 1234)"); }
}

function renderAdminList() {
    const list = document.getElementById('admin-case-list');
    const cases = JSON.parse(localStorage.getItem('safeTalk_adminCases')) || [];
    list.innerHTML = cases.reverse().map((c, i) => `
        <div style="background:#f9f9f9; padding:15px; margin-bottom:10px; border-radius:10px; border-left:5px solid #0084ff; text-align:left;">
            <strong>${c.id}</strong> (อารมณ์: ${c.mood})<br><small>${c.firstMsg.substring(0,50)}...</small><br>
            <button onclick="openAdminChat(${cases.length-1-i})" style="cursor:pointer; margin-top:5px; padding:5px 10px; background:var(--primary-blue); color:white; border:none; border-radius:5px;">ตอบแชท</button>
        </div>
    `).join('');
}

function openAdminChat(idx) {
    const cases = JSON.parse(localStorage.getItem('safeTalk_adminCases'));
    currentActiveAnonID = cases[idx].id;
    isAdminOnline = true;
    saveAndRender({ sender: 'ai', text: "🔔 เจ้าหน้าที่เข้าสู่แชทแล้ว" });
    document.getElementById('admin-chat-modal').style.display = 'flex';
    document.getElementById('admin-chat-title').innerText = "คุยกับ: " + currentActiveAnonID;
    renderAdminChatBox(cases[idx].history);
}

function adminSendMessage() {
    const input = document.getElementById('admin-reply-in');
    if(!input.value.trim()) return;
    saveAndRender({ sender: 'admin', text: input.value });
    const cases = JSON.parse(localStorage.getItem('safeTalk_adminCases'));
    renderAdminChatBox(cases.find(c => c.id === currentActiveAnonID).history);
    input.value = "";
}

function renderAdminChatBox(h) {
    document.getElementById('admin-chat-box').innerHTML = h.map(m => `<div><b>${m.sender}:</b> ${m.text}</div>`).join('');
    document.getElementById('admin-chat-box').scrollTop = 9999;
}

function closeAdminChat() {
    isAdminOnline = false;
    saveAndRender({ sender: 'ai', text: "🔔 เจ้าหน้าที่ออกจากแชทแล้ว" });
    document.getElementById('admin-chat-modal').style.display = 'none';
}

// --- 6. ระบบ Enter Key ---
function setupInputListeners() {
    document.getElementById('chat-in').addEventListener('keypress', (e) => { if (e.key === 'Enter') userSendMessage(); });
    document.getElementById('admin-reply-in').addEventListener('keypress', (e) => { if (e.key === 'Enter') adminSendMessage(); });
    document.getElementById('admin-pass').addEventListener('keypress', (e) => { if (e.key === 'Enter') adminLogin(); });
}

// --- 7. Utilities ---
function clearSession() { if(confirm("ล้างข้อมูลและเริ่มเรื่องใหม่?")) { localStorage.clear(); location.reload(); } }
function confirmMood(s) { saveAndRender({sender:'user', text:`[อัปเดต: ${s}]`}); alert("บันทึกแล้วครับ"); }
function typeTitle() {
    const t = "ระบายความในใจ..."; let i = 0;
    const el = document.getElementById('typing-title');
    function type() { if(el && i < t.length) { el.innerHTML += t.charAt(i); i++; setTimeout(type, 100); } }
    type();
}
function exportChat() {
    let t = `SafeTalk Log - ${currentActiveAnonID}\n`;
    chatHistory.forEach(m => t += `[${m.sender}] : ${m.text}\n`);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], {type:'text/plain'})); a.download = `ChatLog.txt`; a.click();
}