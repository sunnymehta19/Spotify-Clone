// console.log("Starting JavaScript");
let songs;
let currfolder;

function secondToMinutes(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    } 

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;

}

let currentSong = new Audio();

//Getting Songs from the folder
async function getSongs(folder) {
    let fetchingSongs = await fetch(`http://127.0.0.1:3000/${folder}/`);
    currfolder = folder;
    let response = await fetchingSongs.text();
    // console.log(response);
    let div = document.createElement("div");
    div.innerHTML = response;
    let a = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < a.length; index++) {
        const element = a[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);

        }
    }

    //Show all the songs in the playlist
    let SongUL = document.querySelector(".songs-container").getElementsByTagName("ul")[0]
    SongUL.innerHTML = "";
    for (const song of songs) {
        SongUL.innerHTML = SongUL.innerHTML + `<li>
                            <div class="music-logo">
                                <img src="All-SVG/music-logo.svg" alt="">
                                <div class="info">
                                    <div data-song="${song}">${decodeURIComponent(song).replace(".mp3", "")}</div>  
                                </div>
                                <div class="play-btn">
                                    <div>Play Now</div>
                                    <img src="All-SVG/playlist-play-btn.svg" alt="">
                                </div>
                            </div>
                         </li>`;

    }

    //Add Eventlistner to each song 
    Array.from(document.querySelector(".songs-container").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info div").dataset.song)
            // console.log(e.querySelector(".info div").dataset.song)

            // playMusic(e.querySelector(".info").firstElementChild.innerHTML)
            // console.log(e.querySelector(".info").firstElementChild.innerHTML)
        })
    });

    return songs;

}

let playPause;
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currfolder}/` + track
    if (!pause) {
        currentSong.play();
        // playPause.src = "pause-btn.svg";
        if (playPause) playPause.src = "All-SVG/pause-btn.svg";
    }

    let formattedTrackName = decodeURIComponent(track).replace(".mp3", "");
    document.querySelector(".song-info").innerHTML = formattedTrackName;

    document.querySelector(".song-time").innerHTML = "00:00 / 00:00"

}


async function displayAlbums() {
    let fetchingSongs = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await fetchingSongs.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer")
    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0];

            //Get metadata of the folder
            let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
            let response = await a.json();
            // console.log(response)
            cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                        <div class="main-card">
                            <img class="card-image" src="/songs/${folder}/card-cover.jpg" alt="">
                            <img class="hover-play" src="All-SVG/hover-play-btn.svg" alt="">
                        </div>
                        <div class="card-info">
                            <div>
                                <h2>${response.title}</h2>
                            </div>
                            <div>
                                <p>${response.description}</p>
                            </div>
                        </div>
                    </div>`
        }
    };

    //Load the songs in the card (Dynamically)
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        // console.log(e);
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
        })
    });
}

async function main() {
    await getSongs("songs/English-Songs");
    playMusic(songs[0], true);

    await displayAlbums();




    playPause = document.querySelector(".play-pause")

    playPause.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playPause.src = "All-SVG/pause-btn.svg";
        }
        else {
            currentSong.pause();
            playPause.src = "All-SVG/play-btn.svg";

        }
    })

    //Time Function
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".song-time").innerHTML = `${secondToMinutes(currentSong.currentTime)} / ${secondToMinutes(currentSong.duration)}`;

        /* for separate time stamp */
        // document.querySelector(".time-start").innerHTML = `${secondToMinutes(currentSong.currentTime)}`;
        // document.querySelector(".time-end").innerHTML = `${secondToMinutes(currentSong.duration)}`;

        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    //EvenmtListner for seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // EventListner for previos
    document.querySelector(".previous").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    })

    //EventListner for next
    document.querySelector(".next").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    })

    //Set my range bar at 100%
    const SetVolume = document.querySelector(".range input");
    SetVolume.value = 100;
    currentSong.volume = 1;
    SetVolume.style.setProperty('--fill-percent', '100%');

    //Volunme button progress bar function
    const volumeRange = document.querySelector('.volume-btn input[type="range"]');
    volumeRange.addEventListener('input', function () {
        const value = this.value;
        const min = this.min || 0;
        const max = this.max || 100;
        const percent = ((value - min) / (max - min)) * 100;

        this.style.setProperty('--fill-percent', `${percent}%`);
    });

    //Add eventlistner to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;

    })

    // Add an eventlistner to mute the song
    const volumeSlider = document.querySelector(".range input");

    document.querySelector(".volume-btn>img").addEventListener("click", e => {
        if (e.target.src.includes("volume-full.svg")) {
            e.target.src = e.target.src.replace("volume-full.svg", "volume-mute.svg");
            currentSong.volume = 0;
            volumeSlider.value = 0;
        }
        else {
            e.target.src = e.target.src.replace("volume-mute.svg", "volume-full.svg");
            currentSong.volume = 1;
            volumeSlider.value = 100;
        }

        const value = volumeSlider.value;
        const min = volumeSlider.min || 0;
        const max = volumeSlider.max || 100;
        const percent = ((value - min) / (max - min)) * 100;

        volumeSlider.style.setProperty('--fill-percent', `${percent}%`);

    });



}

main();



