console.log("working");
let songs;
let currentsong = new Audio();
let currfolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getsongs(folder) {
    currfolder = folder;
    let a = await fetch(`${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
        }
    }

    // Show all songs in the playlist
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";

    for (const song of songs) {
        let cleanSong = song.replace(".mp3", ""); // Remove .mp3 extension for display
        let [songName, author] = cleanSong.split(" - "); // Split song name and author

        songUL.innerHTML += `<li onclick="playMusic('${encodeURIComponent(song)}')">
                                <img src="/${folder}/cover.jpeg" alt="">
                                <div class="info">
                                    <div class="songname">${songName || "Unknown"}</div>
                                    <div>${author || "Unknown"}</div>
                                </div>
                                <div class="playnow">
                                    <img class="invert" src="./svgs/play.svg" alt="">
                                </div>
                            </li>`;
    }
    return songs;
}

// Function to play music
const playMusic = (track, pause = false) => {
    let songPath = `/${currfolder}/${track}`;
    currentsong.src = songPath;

    if (!pause) {
        currentsong.play();
        play.src = "./svgs/pause.svg";
    }


    document.querySelector(".playbar .songinfo").innerHTML = decodeURI(track.replace(".mp3", ""));
    document.querySelector(".playbar .songtime").innerHTML = "00:00 / 00:00";
    console.log("Playing:", songPath);
}


async function displayAlbums() {
    let a = await fetch(`/songs/`);
    console.log("displaying albums");

    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0];

            let a = await fetch(`/songs/${folder}/info.json`);
            let response = await a.json();
            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <img src="./svgs/circleplay.svg" alt="">
                    </div>

                    <img src="/songs/${folder}/cover.jpeg" alt="card img">
                    <h2>${response.title}</h2>
                    <p>${response.description}</p>
                </div>`;
        }
    }

    // Load library when clicking on a card
    document.querySelectorAll(".card").forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Fetching Songs");
            songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    // Get all songs from default folder
    await getsongs("songs/ncs");
    playMusic(songs[0], true);

    // Display albums
    displayAlbums();

    // Play/Pause event listener
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "./svgs/pause.svg";
        } else {
            currentsong.pause();
            play.src = "./svgs/play.svg";
        }
    });

    // Listen for time updates
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // Seekbar event listener
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = ((currentsong.duration) * percent) / 100;
    });

    // Sidebar toggle buttons
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous button
    previous.addEventListener("click", () => {
        currentsong.pause();
        console.log("Previous clicked");
        let index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next button
    next.addEventListener("click", () => {
        currentsong.pause();
        console.log("Next clicked");
        let index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Volume control
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
        if (currentsong.volume > 0) {
            document.querySelector(".volume > img").src = "./svgs/volume.svg";
        }
    });

    // Mute 
    document.querySelector(".volume > img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = "./svgs/mute.svg";
            currentsong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "./svgs/volume.svg";
            currentsong.volume = 0.4;
            document.querySelector(".range input").value = 40;
        }
    });
}

main();
