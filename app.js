// ------------ Track Data -------------
const tracks = [
  {
    id: "woah",
    title: "Woah",
    mood: "Melodic / Confident",
    tagline: "Eyes glowing, feelings flashing back.",
    file: "MIX 2 Mind Control .wav",
    cover: "icon-192.png",
    lyrics:
      "Woah, when I look you in your eyes they tend to glow...\nTurn the corner, the feds there, everybody in my business.",
    behind:
      "Born from car sessions recording TikToks under streetlights while the world watched from a distance."
  },
  {
    id: "black-sheep",
    title: "Black Sheep",
    mood: "Outcast / Chosen",
    tagline: "Not meant to fit in. Meant to stand out.",
    file: "Black Sheep mix 4 .wav",
    cover: "icon-192.png",
    lyrics:
      "I was always the black sheep, they ain’t see the gold underneath...\nNow they double back when they hear the streams.",
    behind:
      "A record about being misunderstood, staying focused, and letting the numbers talk later."
  },
  {
    id: "five-am-dubtown",
    title: "5 A.M. In DubTown",
    mood: "Late Night / Reflective",
    tagline: "DubTown confessions when the city is half asleep.",
    file: "5 A.M in Dubtown FINAL.wav",
    cover: "icon-192.png",
    lyrics:
      "5 A.M. in DubTown, roads empty but my mind loud...\nWriting verses in my notes, praying that my mom proud.",
    behind:
      "Built around real 5 A.M. nights thinking about exits, next moves, and who really believes."
  },
  {
    id: "love-letter",
    title: "Love Letter",
    mood: "Soft / Vulnerable",
    tagline: "For the one you almost text at 2 A.M.",
    file: "Love Letter 1.wav",
    cover: "icon-192.png",
    lyrics:
      "This a love letter I never sent...\nTyped it all out then I hit delete instead.",
    behind:
      "A softer side of the story, written for the person that still lives between the lines."
  }
];

const STORAGE_KEYS = {
  votes: "looped_votes",
  reactions: "looped_reactions",
  user: "looped_user",
  suggestions: "looped_suggestions",
  favorites: "looped_favorites"
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Global State ------------
let state = {
  currentScreen: "splash",
  currentSongId: null,
  homeTab: "for-you",
  createMode: "auto",
  votes: loadJSON(STORAGE_KEYS.votes, {}),
  reactions: loadJSON(STORAGE_KEYS.reactions, []),
  user: loadJSON(STORAGE_KEYS.user, {
    name: "AMARII",
    handle: "@amariidoc",
    bio:
      "Melodic rap, confessions, and late-night reflection. Looped is where the unreleased stories live first.",
    avatar: null,
    notifications: false,
    joinedVault: false
  }),
  suggestions: loadJSON(STORAGE_KEYS.suggestions, []),
  favorites: loadJSON(STORAGE_KEYS.favorites, [])
};

let audioEl = null;
let audioProgressHandler = null;

// camera / mic state
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let latestRecordingUrl = null;
let isRecording = false;
let countdownInterval = null;

// ------------- Helpers --------------
function findSong(id) {
  return tracks.find((t) => t.id === id);
}

function setScreen(id) {
  state.currentScreen = id;
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.toggle("active", s.id === id);
  });

  const headerTitle = document.getElementById("header-title");
  const titles = {
    home: "Home",
    vault: "The Vault",
    song: "Song",
    create: "Create",
    profile: "Profile",
    settings: "Settings",
    splash: ""
  };
  if (headerTitle && id !== "splash") {
    headerTitle.textContent = titles[id] || "Looped";
  }

  // show chrome except during splash
  const tb = document.querySelector(".app-titlebar");
  const hdr = document.querySelector(".app-header");
  const nav = document.querySelector(".bottom-nav");
  const showShell = id !== "splash";
  tb.style.display = showShell ? "block" : "none";
  hdr.style.display = showShell ? "flex" : "none";
  nav.style.display = showShell ? "flex" : "none";

  // highlight nav
  document.querySelectorAll(".bottom-nav .nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.navTarget === id);
  });

  if (id === "home") renderHome();
  if (id === "vault") renderVault();
  if (id === "song") renderSong();
  if (id === "create") renderCreateScreen();
  if (id === "profile") renderProfile();
  if (id === "settings") renderSettings();
}

// ------------ HOME ------------------
function renderHome() {
  const list = document.getElementById("home-feed");
  list.innerHTML = "";

  const data =
    state.homeTab === "from-amarii" ? tracks.slice().reverse() : tracks;

  data.forEach((track) => {
    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const art = document.createElement("div");
    art.className = "card-art";
    const img = document.createElement("img");
    img.src = track.cover;
    art.appendChild(img);

    const textWrap = document.createElement("div");
    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = track.title;
    const subtitle = document.createElement("div");
    subtitle.className = "card-subtitle";
    subtitle.textContent = track.mood;

    textWrap.appendChild(title);
    textWrap.appendChild(subtitle);

    header.appendChild(art);
    header.appendChild(textWrap);

    const body = document.createElement("div");
    body.className = "card-body";
    body.textContent = track.tagline;

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const iconRow = document.createElement("div");
    iconRow.className = "icon-row";

    const like = document.createElement("span");
    like.textContent = "♥";
    like.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(track.id);
    });

    const comment = document.createElement("span");
    comment.textContent = "💬";
    comment.addEventListener("click", (e) => {
      e.stopPropagation();
      state.currentSongId = track.id;
      setScreen("song");
    });

    const share = document.createElement("span");
    share.textContent = "↗";

    iconRow.appendChild(like);
    iconRow.appendChild(comment);
    iconRow.appendChild(share);

    const meta = document.createElement("div");
    meta.className = "meta-row";
    const votes = state.votes[track.id] || 0;
    const reactionsCount = state.reactions.filter(
      (r) => r.trackId === track.id
    ).length;
    meta.textContent = `${votes} vote${votes === 1 ? "" : "s"} • ${
      reactionsCount
    } reaction${reactionsCount === 1 ? "" : "s"}`;

    footer.appendChild(iconRow);
    footer.appendChild(meta);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);

    card.addEventListener("click", () => {
      state.currentSongId = track.id;
      setScreen("song");
    });

    list.appendChild(card);
  });

  const npTitle = document.getElementById("np-title");
  if (state.currentSongId) {
    const s = findSong(state.currentSongId);
    if (s) npTitle.textContent = s.title;
  } else {
    npTitle.textContent = "Nothing playing";
  }
}

// ------------ VAULT -----------------
function renderVault() {
  const list = document.getElementById("vault-list");
  const searchInput = document.getElementById("vault-search");
  const query = (searchInput.value || "").toLowerCase();

  list.innerHTML = "";

  tracks
    .filter((t) => {
      if (!query) return true;
      return (
        t.title.toLowerCase().includes(query) ||
        t.mood.toLowerCase().includes(query)
      );
    })
    .forEach((track) => {
      const row = document.createElement("div");
      row.className = "vault-item";

      const square = document.createElement("div");
      square.className = "vault-square";
      const img = document.createElement("img");
      img.src = track.cover;
      square.appendChild(img);

      const main = document.createElement("div");
      main.className = "vault-main";

      const title = document.createElement("div");
      title.className = "vault-title";
      title.textContent = track.title;

      const votesEl = document.createElement("div");
      votesEl.className = "vault-votes";
      const votes = state.votes[track.id] || 0;
      votesEl.textContent = `${votes} vote${votes === 1 ? "" : "s"}`;

      main.appendChild(title);
      main.appendChild(votesEl);

      const btn = document.createElement("button");
      btn.className = "vault-vote-btn";
      btn.innerHTML =
        '<div class="vote-label">Vote</div><div class="vote-sub">to drop</div>';

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.votes[track.id] = (state.votes[track.id] || 0) + 1;
        saveJSON(STORAGE_KEYS.votes, state.votes);
        renderVault();
        renderHome();
      });

      row.appendChild(square);
      row.appendChild(main);
      row.appendChild(btn);

      row.addEventListener("click", () => {
        state.currentSongId = track.id;
        setScreen("song");
      });

      list.appendChild(row);
    });
}

// ------------ SONG ------------------
function renderSong() {
  const song = findSong(state.currentSongId) || tracks[0];
  state.currentSongId = song.id;

  document.getElementById("song-title").textContent = song.title;
  document.getElementById("song-tagline").textContent = song.tagline;
  document.getElementById("song-lyrics").textContent = song.lyrics;
  document.getElementById("song-behind").textContent = song.behind;

  // cover art
  const artWrap = document.querySelector(".song-art");
  artWrap.innerHTML = "";
  const img = document.createElement("img");
  img.src = song.cover;
  artWrap.appendChild(img);

  if (audioEl) {
    audioEl.src = song.file;
  }

  renderSongReactions(song.id);

  const lyricsToggle = document.getElementById("lyrics-toggle");
  lyricsToggle.value = 1;

  document.querySelectorAll("[data-song-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.songTab === "lyrics");
  });
  document.getElementById("song-lyrics").classList.remove("hidden");
  document.getElementById("song-behind").classList.add("hidden");

  const playBtn = document.getElementById("song-play");
  const progressBar = document.getElementById("song-progress");
  playBtn.textContent = "▶";
  progressBar.style.width = "0%";
}

function renderSongReactions(songId) {
  const list = document.getElementById("song-reaction-list");
  list.innerHTML = "";

  const filtered = state.reactions.filter((r) => r.trackId === songId);
  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No reactions yet. Be the first from the React tab.";
    list.appendChild(empty);
    return;
  }

  filtered
    .slice()
    .reverse()
    .forEach((r) => {
      const card = document.createElement("div");
      card.className = "card";
      const body = document.createElement("div");
      body.className = "card-body";
      body.textContent = r.text || "(no caption)";

      const meta = document.createElement("div");
      meta.className = "meta-row";
      meta.textContent = `${r.name} • ${new Date(
        r.createdAt
      ).toLocaleString()}`;

      card.appendChild(body);
      card.appendChild(meta);

      if (r.videoUrl) {
        const vid = document.createElement("video");
        vid.src = r.videoUrl;
        vid.controls = true;
        vid.style.marginTop = "0.3rem";
        vid.style.width = "100%";
        card.appendChild(vid);
      }

      list.appendChild(card);
    });
}

// ------------ CREATE / REACT --------
function renderCreateScreen() {
  const select = document.getElementById("create-track");
  select.innerHTML = "";
  tracks.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.title;
    select.appendChild(opt);
  });

  if (state.currentSongId) {
    select.value = state.currentSongId;
  }

  document.querySelectorAll(".chip-row .chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.mode === state.createMode);
  });

  const textInput = document.getElementById("create-text");
  textInput.value = "";

  // reset record UI
  isRecording = false;
  const recordBtn = document.getElementById("record-btn");
  const recordStatus = document.getElementById("record-status");
  const preview = document.getElementById("record-preview");

  recordBtn.classList.remove("recording");
  recordStatus.textContent = "Ready to record";
  preview.textContent = "No recording yet.";

  // clear any countdown in progress
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  renderCreateReactions();
}

function renderCreateReactions() {
  const list = document.getElementById("create-reaction-list");
  if (!list) return;

  list.innerHTML = "";

  const mine = state.reactions.slice(-3); // last 3
  if (mine.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Your saved reactions will appear here.";
    list.appendChild(p);
    return;
  }

  mine
    .slice()
    .reverse()
    .forEach((r) => {
      const card = document.createElement("div");
      card.className = "card";

      const body = document.createElement("div");
      body.className = "card-body";
      body.textContent = r.text || "(no caption)";

      const meta = document.createElement("div");
      meta.className = "meta-row";
      meta.textContent = `${r.name} • ${new Date(
        r.createdAt
      ).toLocaleTimeString()}`;

      card.appendChild(body);
      card.appendChild(meta);

      if (r.videoUrl) {
        const vid = document.createElement("video");
        vid.controls = true;
        vid.src = r.videoUrl;
        vid.style.marginTop = "0.3rem";
        vid.style.width = "100%";
        card.appendChild(vid);
      }

      list.appendChild(card);
    });
}

// ------------ PROFILE ---------------
function renderProfile() {
  const nameEl = document.getElementById("profile-name");
  const handleEl = document.getElementById("profile-handle");
  const bioEl = document.getElementById("profile-bio");
  const avatarEl = document.getElementById("profile-avatar");

  nameEl.textContent = state.user.name || "AMARII";
  handleEl.textContent = state.user.handle || "@amariidoc";
  bioEl.textContent =
    state.user.bio ||
    "Melodic rap, confessions, and late-night reflection. Looped is where the unreleased stories live first.";

  if (state.user.avatar) {
    avatarEl.style.backgroundImage = `url(${state.user.avatar})`;
  } else {
    avatarEl.style.backgroundImage = "none";
  }

  const list = document.getElementById("profile-top-songs");
  list.innerHTML = "";
  tracks.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t.title;
    list.appendChild(li);
  });

  const joinBtn = document.getElementById("join-vault-btn");
  joinBtn.textContent = state.user.joinedVault ? "Joined The Vault" : "Join The Vault";
}

// ------------ SETTINGS --------------
function renderSettings() {
  document.getElementById("setting-notifications").checked =
    !!state.user.notifications;
  document.getElementById("setting-name").value = state.user.name || "";
  document.getElementById("setting-handle").value = state.user.handle || "";
  document.getElementById("setting-bio").value = state.user.bio || "";
  document.getElementById("settings-favorites-count").textContent =
    state.favorites.length;
  document.getElementById("settings-reactions-count").textContent =
    state.reactions.length;
}

// ------------ Favorites -------------
function toggleFavorite(trackId) {
  const idx = state.favorites.indexOf(trackId);
  if (idx === -1) state.favorites.push(trackId);
  else state.favorites.splice(idx, 1);
  saveJSON(STORAGE_KEYS.favorites, state.favorites);
  renderSettings();
}

// --------- Camera + Mic -------------
async function startRecording() {
  try {
    if (!mediaStream) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
    }

    const preview = document.getElementById("record-preview");
    preview.innerHTML = "";

    const liveVideo = document.createElement("video");
    liveVideo.autoplay = true;
    liveVideo.muted = true;
    liveVideo.srcObject = mediaStream;
    preview.appendChild(liveVideo);

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      if (latestRecordingUrl) URL.revokeObjectURL(latestRecordingUrl);
      latestRecordingUrl = URL.createObjectURL(blob);

      preview.innerHTML = "";
      const vid = document.createElement("video");
      vid.controls = true;
      vid.src = latestRecordingUrl;
      preview.appendChild(vid);
    };

    mediaRecorder.start();
  } catch (err) {
    alert("Could not access camera/mic. Check permissions.");
    console.error(err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
}

// ------------ DOMContentLoaded -------
document.addEventListener("DOMContentLoaded", () => {
  audioEl = document.getElementById("audio-player");

  // Splash -> home
  setTimeout(() => {
    setScreen("home");
  }, 1500);

  // Bottom nav
  document.querySelectorAll(".bottom-nav .nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.navTarget;
      setScreen(target);
    });
  });

  // Back from song
  document
    .querySelector("#song .back-btn")
    .addEventListener("click", () => setScreen("home"));

  // Home tabs
  const homeTabButtons = document.querySelectorAll("[data-home-tab]");
  homeTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.homeTab = btn.dataset.homeTab;
      homeTabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderHome();
    });
  });

  // From Amarii pills
  document
    .getElementById("from-amarii-pill")
    .addEventListener("click", () => {
      state.homeTab = "from-amarii";
      homeTabButtons.forEach((b) => {
        b.classList.toggle("active", b.dataset.homeTab === "from-amarii");
      });
      renderHome();
    });

  document
    .getElementById("header-from-pill")
    .addEventListener("click", () => {
      setScreen("home");
      state.homeTab = "from-amarii";
      homeTabButtons.forEach((b) => {
        b.classList.toggle("active", b.dataset.homeTab === "from-amarii");
      });
      renderHome();
    });

  // Vault search
  document.getElementById("vault-search").addEventListener("input", () => {
    renderVault();
  });

  // Submit snippet -> React
  document
    .getElementById("vault-submit-btn")
    .addEventListener("click", () => setScreen("create"));

  // Song tabs
  document.querySelectorAll("[data-song-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.songTab;
      document
        .querySelectorAll("[data-song-tab]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document
        .getElementById("song-lyrics")
        .classList.toggle("hidden", tab !== "lyrics");
      document
        .getElementById("song-behind")
        .classList.toggle("hidden", tab !== "behind");
    });
  });

  // Song play / pause
  document.getElementById("song-play").addEventListener("click", () => {
    if (!audioEl) return;
    const btn = document.getElementById("song-play");
    const bar = document.getElementById("song-progress");

    if (audioEl.paused) {
      audioEl
        .play()
        .then(() => {
          btn.textContent = "⏸";
        })
        .catch(() => {
          alert("Audio file not found or cannot be played.");
        });
    } else {
      audioEl.pause();
      btn.textContent = "▶";
    }

    if (!audioProgressHandler) {
      audioProgressHandler = () => {
        if (!audioEl.duration || isNaN(audioEl.duration)) return;
        const pct = (audioEl.currentTime / audioEl.duration) * 100;
        bar.style.width = `${pct}%`;
      };
      audioEl.addEventListener("timeupdate", audioProgressHandler);
      audioEl.addEventListener("ended", () => {
        btn.textContent = "▶";
        bar.style.width = "0%";
      });
    }
  });

  // Song -> React
  document.getElementById("song-react-btn").addEventListener("click", () => {
    setScreen("create");
  });

  // Create mode chips
  document.querySelectorAll(".chip-row .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.createMode = chip.dataset.mode;
      document.querySelectorAll(".chip-row .chip").forEach((c) =>
        c.classList.remove("active")
      );
      chip.classList.add("active");
    });
  });

  // Save reaction
  document.getElementById("create-save").addEventListener("click", () => {
    const trackId = document.getElementById("create-track").value;
    const text = document.getElementById("create-text").value.trim();
    const nameField = document.getElementById("setting-name");
    const name = (nameField.value || "").trim() || "Anon";

    if (!text && !latestRecordingUrl) {
      alert("Add flashback text or record a reaction first.");
      return;
    }

    const reaction = {
      id: Date.now(),
      trackId,
      text,
      name,
      mode: state.createMode,
      createdAt: new Date().toISOString(),
      videoUrl: latestRecordingUrl || null
    };

    state.reactions.push(reaction);
    saveJSON(STORAGE_KEYS.reactions, state.reactions);

    state.user.name = name;
    saveJSON(STORAGE_KEYS.user, state.user);

    document.getElementById("create-text").value = "";
    renderSettings();
    renderCreateReactions();   // update list on React page
    alert("Reaction saved on this device.");
  });

  // Record button with countdown
  const recordBtn = document.getElementById("record-btn");
  const recordStatus = document.getElementById("record-status");

  recordBtn.addEventListener("click", async () => {
    // If already recording, stop immediately
    if (isRecording) {
      isRecording = false;
      recordBtn.classList.remove("recording");
      recordStatus.textContent = "Ready to record";
      stopRecording();
      return;
    }

    // If a countdown is already running, ignore extra taps
    if (countdownInterval) return;

    let remaining = 3;
    recordStatus.textContent = `Recording in ${remaining}...`;

    countdownInterval = setInterval(async () => {
      remaining -= 1;

      if (remaining > 0) {
        recordStatus.textContent = `Recording in ${remaining}...`;
      } else {
        clearInterval(countdownInterval);
        countdownInterval = null;

        // start actual recording
        recordBtn.classList.add("recording");
        recordStatus.textContent = "Recording... Tap to stop.";
        isRecording = true;
        await startRecording();
      }
    }, 1000);
  });

  // Profile actions
  document.getElementById("join-vault-btn").addEventListener("click", () => {
    state.user.joinedVault = !state.user.joinedVault;
    saveJSON(STORAGE_KEYS.user, state.user);
    renderProfile();
  });

  document.getElementById("merch-btn").addEventListener("click", () => {
    alert("Merch store coming soon.");
  });

  // Settings updates
  document
    .getElementById("setting-notifications")
    .addEventListener("change", (e) => {
      state.user.notifications = e.target.checked;
      saveJSON(STORAGE_KEYS.user, state.user);
    });

  document.getElementById("setting-name").addEventListener("blur", (e) => {
    state.user.name = e.target.value.trim();
    saveJSON(STORAGE_KEYS.user, state.user);
    renderProfile();
  });

  document.getElementById("setting-handle").addEventListener("blur", (e) => {
    state.user.handle = e.target.value.trim();
    saveJSON(STORAGE_KEYS.user, state.user);
    renderProfile();
  });

  document.getElementById("setting-bio").addEventListener("blur", (e) => {
    state.user.bio = e.target.value.trim();
    saveJSON(STORAGE_KEYS.user, state.user);
    renderProfile();
  });

  document
    .getElementById("setting-avatar")
    .addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.user.avatar = reader.result;
        saveJSON(STORAGE_KEYS.user, state.user);
        renderProfile();
      };
      reader.readAsDataURL(file);
    });

  document
    .getElementById("setting-send-suggestion")
    .addEventListener("click", () => {
      const text = document
        .getElementById("setting-suggestion")
        .value.trim();
      if (!text) {
        alert("Write a suggestion before submitting.");
        return;
      }
      state.suggestions.push({
        id: Date.now(),
        text
      });
      saveJSON(STORAGE_KEYS.suggestions, state.suggestions);
      document.getElementById("setting-suggestion").value = "";
      const status = document.getElementById("setting-suggestion-status");
      status.textContent = "Thank you. Your suggestion is saved on this device.";
    });

  // Now playing bar
  document.getElementById("np-open-song").addEventListener("click", () => {
    if (!state.currentSongId) {
      state.currentSongId = tracks[0].id;
    }
    setScreen("song");
  });
});
