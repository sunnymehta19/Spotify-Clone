let songs = [];
let currFolder = "";
let currentSong = new Audio();
let playPause = document.querySelector(".play-pause");

/* Utility */
function secondsToMinutes(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* Load songs */
async function loadPlaylist(folder) {
    currFolder = folder;

    const res = await fetch(`public/songs/${folder}/info.json`);
    const data = await res.json();
    songs = data.songs;

    const ul = document.querySelector(".songs-container ul");
    ul.innerHTML = "";

    songs.forEach(song => {
        ul.innerHTML += `
      <li data-song="${song.name}">
        <div class="music-logo">
          <img src="All-SVG/music-logo.svg">
          <div class="info">
            <div>${song.name.replace(".mp3", "")}</div>
            <div style="font-size:11px;color:#b3b3b3">${song.artist}</div>
          </div>
          <div class="play-btn">
            <div>Play</div>
            <img src="All-SVG/playlist-play-btn.svg">
          </div>
        </div>
      </li>
    `;
    });

    document.querySelectorAll(".songs-container li").forEach(li => {
        li.addEventListener("click", () => playMusic(li.dataset.song));
    });
}



let activeTrack = null;

function updatePlayingText(track) {
    activeTrack = track;

    document.querySelectorAll(".songs-container li").forEach(li => {
        const textEl = li.querySelector(".play-btn div");
        const iconEl = li.querySelector(".play-btn img");

        if (li.dataset.song === track) {
            li.classList.add("active");
            textEl.innerText = "Playing";
            iconEl.style.display = "none";   // 🔥 HIDE SVG
        } else {
            li.classList.remove("active");
            textEl.innerText = "Play";
            iconEl.style.display = "inline"; // 🔥 SHOW SVG
        }
    });
}






/* Play song */
function playMusic(track, pause = false) {
    currentSong.src = `public/songs/${currFolder}/${track}`;
    document.querySelector(".song-info").innerText =
        decodeURIComponent(track).replace(".mp3", "");

    updatePlayingText(track); // 🔥 controls background + text + svg

    if (!pause) {
        currentSong.play();
        playPause.src = "All-SVG/pause-btn.svg";
    }
}






/* Get current index */
function getCurrentIndex() {
    const currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
    return songs.findIndex(song => song.name === currentTrack);
}

/* Playlists */
async function displayPlaylists() {
    const playlists = ["english", "hindi", "party"];
    const container = document.querySelector(".cardContainer");
    container.innerHTML = "";

    for (let folder of playlists) {
        const res = await fetch(`public/songs/${folder}/info.json`);
        const data = await res.json();

        container.innerHTML += `
      <div class="card" data-folder="${folder}">
        <div class="main-card">
          <img class="card-image" src="public/songs/${folder}/card-cover.jpg">
          <img class="hover-play" src="All-SVG/hover-play-btn.svg">
        </div>
        <div class="card-info">
          <h2>${data.title}</h2>
          <p>${data.description}</p>
        </div>
      </div>
    `;
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", () => loadPlaylist(card.dataset.folder));
    });
}






/* Play / Pause */
playPause.addEventListener("click", () => {
    if (currentSong.paused) {
        currentSong.play();
        playPause.src = "All-SVG/pause-btn.svg";
    } else {
        currentSong.pause();
        playPause.src = "All-SVG/play-btn.svg";
    }
});




/* Time update */
currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".song-time").innerText =
        `${secondsToMinutes(currentSong.currentTime)} / ${secondsToMinutes(currentSong.duration)}`;

    const percent = (currentSong.currentTime / currentSong.duration) * 100 || 0;
    document.querySelector(".circle").style.left = percent + "%";
});

/* Seekbar click */
document.querySelector(".seekbar").addEventListener("click", e => {
    const width = e.target.getBoundingClientRect().width;
    const percent = e.offsetX / width;
    currentSong.currentTime = currentSong.duration * percent;
});

/* Previous */
document.querySelector(".previous").addEventListener("click", () => {
    let index = getCurrentIndex();
    if (index > 0) playMusic(songs[index - 1].name);
});

/* Next */
document.querySelector(".next").addEventListener("click", () => {
    let index = getCurrentIndex();
    if (index < songs.length - 1) playMusic(songs[index + 1].name);
});

/* Volume + Mute */
const volumeSlider = document.querySelector(".range input");
const volumeIcon = document.querySelector(".volume-btn img");

let lastVolume = 1; // store volume before mute

// initial state
volumeSlider.value = 100;
currentSong.volume = 1;
updateVolumeUI(100);

// slider change
volumeSlider.addEventListener("input", e => {
    const value = e.target.value;
    const volume = value / 100;

    currentSong.volume = volume;
    updateVolumeUI(value);

    if (volume === 0) {
        volumeIcon.src = "All-SVG/volume-mute.svg";
    } else {
        volumeIcon.src = "All-SVG/volume-full.svg";
        lastVolume = volume;
    }
});

// mute / unmute toggle
volumeIcon.addEventListener("click", () => {
    if (currentSong.volume > 0) {
        lastVolume = currentSong.volume;
        currentSong.volume = 0;
        volumeSlider.value = 0;
        volumeIcon.src = "All-SVG/volume-mute.svg";
        updateVolumeUI(0);
    } else {
        currentSong.volume = lastVolume;
        volumeSlider.value = lastVolume * 100;
        volumeIcon.src = "All-SVG/volume-full.svg";
        updateVolumeUI(volumeSlider.value);
    }
});

// update slider fill
function updateVolumeUI(value) {
    volumeSlider.style.setProperty("--fill-percent", `${value}%`);
}


// Mobile sidebar (hamburger) 
const hamburger = document.querySelector(".hamburger");
const closeSidebar = document.querySelector(".cross");
const sidebar = document.querySelector(".left-side");

if (hamburger && sidebar) {
    hamburger.addEventListener("click", () => {
        sidebar.style.left = "0";
    });
}

if (closeSidebar && sidebar) {
    closeSidebar.addEventListener("click", () => {
        sidebar.style.left = "-100%";
    });
}


/* Init */
(async function init() {
    await displayPlaylists();
    await loadPlaylist("english");

    if (songs.length > 0) {
        playMusic(songs[0].name, true);
    }
})();
