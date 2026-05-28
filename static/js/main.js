/* ============================================================
   BlindSpot Navigator
   Camera · Auto-Scan · Obstacle Detection · Voice Alerts
   ============================================================ */
(function () {
  "use strict";

  // ── DOM ──
  const videoFeed      = document.getElementById("videoFeed");
  const captureCanvas  = document.getElementById("captureCanvas");
  const camPlaceholder = document.getElementById("camPlaceholder");
  const previewImg     = document.getElementById("previewImg");
  const hudOverlay     = document.getElementById("hudOverlay");
  const hudScanBar     = document.getElementById("hudScanBar");
  const btnCamera      = document.getElementById("btnCamera");
  const btnScan        = document.getElementById("btnScan");
  const btnAuto        = document.getElementById("btnAuto");
  const btnRepeat      = document.getElementById("btnRepeat");
  const btnMute        = document.getElementById("btnMute");
  const fileInput      = document.getElementById("fileInput");
  const selectInterval = document.getElementById("selectInterval");
  const statusDot      = document.getElementById("statusDot");
  const statusText     = document.getElementById("statusText");
  const statusClock    = document.getElementById("statusClock");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const dangerPanel    = document.getElementById("dangerPanel");
  const dlIcon         = document.getElementById("dlIcon");
  const dlLabel        = document.getElementById("dlLabel");
  const dlSub          = document.getElementById("dlSub");
  const alertBox       = document.getElementById("alertBox");
  const abIcon         = document.getElementById("abIcon");
  const abText         = document.getElementById("abText");
  const compassArrow   = document.getElementById("compassArrow");
  const compassLabel   = document.getElementById("compassLabel");
  const obstacleList   = document.getElementById("obstacleList");
  const adviceText     = document.getElementById("adviceText");
  const historyList    = document.getElementById("historyList");
  const scanIndicator  = document.querySelector(".scan-indicator");
  const autoIcon       = document.getElementById("autoIcon");

  // ── State ──
  let stream       = null;
  let isCameraOn   = false;
  let uploadedData = null;
  let autoInterval = null;
  let isAutoOn     = false;
  let isMuted      = false;
  let selectedLang = "en";
  let lastAlert    = "";

  const DANGER_META = {
    safe:    { icon: "◎", label: "ALL CLEAR",  sub: "Path is safe to proceed",     color: "safe",    emoji: "✅", arrow: "▲" },
    caution: { icon: "⬡", label: "CAUTION",    sub: "Obstacles detected nearby",   color: "caution", emoji: "⚠️", arrow: "▲" },
    danger:  { icon: "⛔", label: "DANGER",     sub: "STOP — Immediate hazard!",    color: "danger",  emoji: "🚨", arrow: "⬛" },
  };

  const DIRECTION_ANGLES = {
    "ahead": 0, "সামনে": 0,
    "right": 90, "ডানে": 90,
    "left": -90, "বামে": -90,
    "all around": 0, "চারদিকে": 0,
    "clear": 0, "পরিষ্কার": 0,
  };

  // ── Clock ──
  function updateClock() {
    statusClock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ── Language ──
  window.setLang = function (lang) {
    selectedLang = lang;
    document.getElementById("btnEN").classList.toggle("active", lang === "en");
    document.getElementById("btnBN").classList.toggle("active", lang === "bn");
    setStatus(lang === "en" ? "Language: English 🇬🇧" : "ভাষা: বাংলা 🇧🇩");
  };

  // ── Status ──
  function setStatus(text, type = "idle") {
    statusText.textContent = text;
    statusDot.className = "status-dot" + (type !== "idle" ? " " + type : "");
  }

  function showLoading() { loadingOverlay.classList.add("active"); }
  function hideLoading() { loadingOverlay.classList.remove("active"); }

  // ── Camera ──
  btnCamera.addEventListener("click", async () => {
    if (isCameraOn) stopCamera(); else await startCamera();
  });

  async function startCamera() {
    try {
      setStatus("Requesting camera access…", "loading");
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      videoFeed.srcObject = stream;
      videoFeed.style.display    = "block";
      previewImg.style.display   = "none";
      camPlaceholder.style.display = "none";
      hudOverlay.style.display   = "block";
      isCameraOn = true;
      btnCamera.innerHTML = "✕ Stop Camera";
      btnScan.disabled  = false;
      btnAuto.disabled  = false;
      uploadedData = null;
      setStatus("Camera active — ready to scan", "safe");
    } catch (err) {
      setStatus("Camera access denied: " + err.message, "danger");
      speak("Camera access denied. Please allow camera permission.");
    }
  }

  function stopCamera() {
    stopAutoScan();
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    videoFeed.style.display      = "none";
    hudOverlay.style.display     = "none";
    camPlaceholder.style.display = "flex";
    isCameraOn   = false;
    btnCamera.innerHTML = "◎ Activate Camera";
    btnScan.disabled = true;
    btnAuto.disabled = true;
    setStatus("Camera stopped");
  }

  // ── File Upload ──
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    stopAutoScan();
    const reader = new FileReader();
    reader.onload = (ev) => {
      uploadedData = ev.target.result;
      previewImg.src            = uploadedData;
      previewImg.style.display  = "block";
      camPlaceholder.style.display = "none";
      videoFeed.style.display   = "none";
      hudOverlay.style.display  = "block";
      btnScan.disabled  = false;
      btnAuto.disabled  = true;
      setStatus("Image uploaded — click Scan Once", "safe");
    };
    reader.readAsDataURL(file);
  });

  // ── Capture Frame ──
  function captureFrame() {
    if (uploadedData) return uploadedData;
    if (!isCameraOn) return null;
    captureCanvas.width  = videoFeed.videoWidth  || 640;
    captureCanvas.height = videoFeed.videoHeight || 480;
    captureCanvas.getContext("2d").drawImage(videoFeed, 0, 0);
    return captureCanvas.toDataURL("image/jpeg", 0.75);
  }

  // ── Scan Once ──
  btnScan.addEventListener("click", () => {
    const frame = captureFrame();
    if (frame) scanFrame(frame);
  });

  // ── Auto Scan ──
  btnAuto.addEventListener("click", () => {
    if (isAutoOn) stopAutoScan(); else startAutoScan();
  });

  function startAutoScan() {
    isAutoOn = true;
    btnAuto.classList.add("active");
    autoIcon.textContent = "■";
    scanIndicator.classList.add("active");
    scanIndicator.innerHTML = '<span class="si-dot"></span> SCANNING';
    hudScanBar.classList.add("active");
    setStatus("Auto-scan active — scanning every " + (parseInt(selectInterval.value)/1000) + "s", "loading");
    const frame = captureFrame();
    if (frame) scanFrame(frame);
    autoInterval = setInterval(() => {
      const f = captureFrame();
      if (f) scanFrame(f);
    }, parseInt(selectInterval.value));
  }

  function stopAutoScan() {
    isAutoOn = false;
    clearInterval(autoInterval);
    autoInterval = null;
    btnAuto.classList.remove("active");
    autoIcon.textContent = "▶";
    scanIndicator.classList.remove("active");
    scanIndicator.innerHTML = '<span class="si-dot"></span> IDLE';
    hudScanBar.classList.remove("active");
    setStatus("Auto-scan stopped");
  }

  // ── Scan Frame ──
  async function scanFrame(imageData) {
    try {
      const res = await fetch("/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, lang: selectedLang }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setStatus("Error: " + (data.error || "Unknown"), "danger");
        return;
      }

      applyResult(data);

    } catch (err) {
      setStatus("Scan failed: " + err.message, "danger");
    }
  }

  // ── Apply Result ──
  function applyResult(data) {
    const { danger_level, alert, obstacles, direction, advice } = data;
    const meta = DANGER_META[danger_level] || DANGER_META.caution;

    // Danger panel
    dangerPanel.className = `danger-panel ${meta.color}`;
    dlIcon.textContent    = meta.icon;
    dlLabel.textContent   = meta.label;
    dlSub.textContent     = meta.sub;

    // Alert box
    alertBox.className    = `alert-box ${meta.color}`;
    abIcon.textContent    = meta.emoji;
    abText.textContent    = alert;

    // Compass direction
    const dirKey = Object.keys(DIRECTION_ANGLES).find(k =>
      direction?.toLowerCase().includes(k)
    ) || "ahead";
    const angle = DIRECTION_ANGLES[dirKey] || 0;
    compassArrow.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    compassLabel.textContent     = direction || "—";

    // Obstacles
    if (obstacles && obstacles.length > 0) {
      obstacleList.innerHTML = obstacles.map(o =>
        `<span class="obstacle-tag">${o}</span>`
      ).join("");
    } else {
      obstacleList.innerHTML = `<p class="muted-text">No obstacles detected.</p>`;
    }

    // Advice
    adviceText.textContent = advice || "Proceed carefully.";

    // Status
    const statusType = danger_level === "danger" ? "danger" : danger_level === "safe" ? "safe" : "loading";
    setStatus(`${meta.label} — ${alert}`, statusType);

    // Voice
    lastAlert = alert;
    btnRepeat.disabled = false;
    if (!isMuted) speak(alert);

    // History
    addToHistory(danger_level, alert);
  }

  // ── TTS ──
  function speak(text) {
    if (!("speechSynthesis" in window) || isMuted) return;
    window.speechSynthesis.cancel();
    const utt   = new SpeechSynthesisUtterance(text);
    utt.lang    = selectedLang === "bn" ? "bn-BD" : "en-US";
    utt.rate    = 0.95;
    utt.pitch   = 1;
    utt.volume  = 1;
    window.speechSynthesis.speak(utt);
  }

  btnRepeat.addEventListener("click", () => { if (lastAlert) speak(lastAlert); });

  window.toggleMute = function () {
    isMuted = !isMuted;
    btnMute.textContent = isMuted ? "🔇 Sound OFF" : "🔔 Sound ON";
    btnMute.classList.toggle("muted", isMuted);
    if (!isMuted && lastAlert) speak(lastAlert);
  };

  // ── History ──
  function addToHistory(level, alert) {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    if (historyList.querySelector(".muted-text")) historyList.innerHTML = "";

    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div class="hi-level ${level}"></div>
      <span class="hi-alert">${alert}</span>
      <span class="hi-time">${time}</span>
    `;
    historyList.prepend(item);
    while (historyList.children.length > 20) historyList.removeChild(historyList.lastChild);
  }

  window.clearHistory = function () {
    historyList.innerHTML = `<p class="muted-text">Scan history will appear here.</p>`;
  };

  // ── Interval change ──
  selectInterval.addEventListener("change", () => {
    if (isAutoOn) { stopAutoScan(); startAutoScan(); }
  });

  // ── Upload label keyboard ──
  document.querySelector(".btn-upload").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });

  // ── Init ──
  setStatus("System ready — activate camera to begin");
  speak("BlindSpot Navigator ready. Activate camera to begin obstacle detection.");
})();
