console.log("working");
let songs = [];
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
    try {
        let response = await fetch(`${folder}/`);
        if (!response.ok) {
            console.error(`Error fetching folder: ${folder}`);
            return [];
        }

        let htmlText = await response.text();
        let div = document.createElement("div");
        div.innerHTML = htmlText;
        let as = div.getElementsByTagName("a");

        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }

        // Show all songs in the playlist
        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = "";

        if (songs.length === 0) {
            console.warn("No songs found in folder:", folder);
            songUL.innerHTML = "<li>No songs available</li>";
            return songs;
        }

        for (const song of songs) {
            let cleanSong = song.replace(".mp3", "");
            let [songName, author] = cleanSong.split(" - ");
            songUL.innerHTML += `<li onclick="playMusic('${encodeURIComponent(song)}')">
                                    <img src="/${folder}/cover.jpeg" alt="Cover">
                                    <div class="info">
                                        <div class="songname">${songName || "Unknown"}</div>
                                        <div>${author || "Unknown"}</div>
                                    </div>
                                    <div class="playnow">
                                        <img class="invert" src="./svgs/play.svg" alt="Play">
                                    </div>
                                </li>`;
        }
    } catch (error) {
        console.error("Error loading songs:", error);
    }
    return songs;
}

// Function to play music
const playMusic = (track, pause = false) => {
    if (!track) {
        console.warn("No track selected");
        return;
    }

    let songPath = `/${currfolder}/${track}`;
    currentsong.src = songPath;

    if (!pause) {
        currentsong.play().catch(error => console.error("Playback error:", error));
        document.querySelector("#play").src = "./svgs/pause.svg";
    }

    document.querySelector(".playbar .songinfo").innerHTML = decodeURI(track.replace(".mp3", ""));
    document.querySelector(".playbar .songtime").innerHTML = "00:00 / 00:00";
    console.log("Playing:", songPath);
}

async function displayAlbums() {
    try {
        let response = await fetch(`/songs/`);
        if (!response.ok) {
            console.error("Error fetching albums");
            return;
        }

        let htmlText = await response.text();
        let div = document.createElement("div");
        div.innerHTML = htmlText;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = "";

        for (let e of anchors) {
            if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/").slice(-2)[0];

                let albumInfo;
                try {
                    let albumResponse = await fetch(`/songs/${folder}/info.json`);
                    albumInfo = await albumResponse.json();
                } catch {
                    albumInfo = { title: "Unknown Album", description: "No description available" };
                }

                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <img src="./svgs/circleplay.svg" alt="Play">
                        </div>
                        <img src="/songs/${folder}/cover.jpeg" alt="Cover">
                        <h2>${albumInfo.title}</h2>
                        <p>${albumInfo.description}</p>
                    </div>`;
            }
        }

        // Load library when clicking on a card
        document.querySelectorAll(".card").forEach(e => {
            e.addEventListener("click", async item => {
                console.log("Fetching Songs");
                songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
                if (songs.length > 0) {
                    playMusic(songs[0]);
                }
            });
        });

    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

async function main() {
    songs = await getsongs("songs/ncs");

    if (songs.length > 0) {
        playMusic(songs[0], true);
    }

    displayAlbums();

    // Play/Pause event listener
    document.querySelector("#play").addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play().catch(error => console.error("Playback error:", error));
            document.querySelector("#play").src = "./svgs/pause.svg";
        } else {
            currentsong.pause();
            document.querySelector("#play").src = "./svgs/play.svg";
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
    document.querySelector("#previous").addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next button
    document.querySelector("#next").addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Volume control
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
        document.querySelector(".volume img").src = currentsong.volume > 0 ? "./svgs/volume.svg" : "./svgs/mute.svg";
    });

    // Mute 
    document.querySelector(".volume img").addEventListener("click", (e) => {
        if (currentsong.volume > 0) {
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
