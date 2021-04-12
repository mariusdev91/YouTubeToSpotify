//Options
const apiKey = "AIzaSyDYqR-PMuZVNX4y4BZCqGAYV5hQVQ-kDzY";
const CLIENT_ID = "970785099040-ibkuvcolg5jkge0t3g8nt07njptb3ikl.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly";
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'];

const authorizeButton = document.getElementById('signIn');
const signOutButton = document.getElementById('signOut');
const content = document.getElementById('content');

const channelForm = document.getElementById('my-channel-form');
const channelInput = document.getElementById('channel-input');
const videoContainer = document.getElementById('video-container');

const defaultPlaylistId = "PL2CSp66KxIgltB6BVEQhe8tVmV5WoHUzr";

//taking the playlist ID form input
channelForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let playlist = channelInput.value;
    const regex = /list=(.+)/;
    const matches = playlist.match(regex);
    if (matches) {
        let playlistId = matches[1];
        requestPlaylists(playlistId)
    }
});

//load auth2 Library
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

//connect client with Google API
function initClient() {
    gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signOutButton.onclick = handleSignOutClick;
    });
}

//update UI sign in state changes
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signOutButton.style.display = 'block';
        content.style.display = 'block';
        // requestPlaylists(defaultPlaylistId);
    } else {
        authorizeButton.style.display = 'block';
        signOutButton.style.display = 'none';
        content.style.display = 'none';
    }
}

//handle Log In
function handleAuthClick() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signIn().then(function () {
        console.log('User signed in.');
    });
}

//handle Log Out
function handleSignOutClick() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
    });
}

//display youtube channel data
function showChannelData(data) {
    const channelData = document.getElementById('my-channel-data');
    channelData.innerHTML = data;
}

//get and output playlist content
function requestPlaylists(playlistId) {
    const requestOptions = {
        part: 'snippet, contentDetails',
        playlistId: playlistId,
        maxResults: 25
    }
    const request = gapi.client.youtube.playlistItems.list(requestOptions);
    request.execute(function (response) {
        console.log("Response", response);
        const playlistItems = response.result.items;
        let titlesArray = [];
        let cnt = 0;
        playlistItems.forEach(element => {
            titlesArray[cnt++] = element;
        });
        if (playlistItems) {
            let output = '<h4 class="center-align">Playlist content</h4>'
            let counter = 1;
            //loop through playlists
            playlistItems.forEach(function (videos) {
                console.log(videos.snippet.resourceId.videoId);
                console.log(videos.snippet.title);
                console.log(videos.snippet.videoOwnerChannelTitle);
                output += `
                    <div class="row">
                        <p> ${counter++}. Numele Canalului: ${videos.snippet.videoOwnerChannelTitle}, titlul: ${videos.snippet.title}</p> <br>
                    </div>
                `;
            });
            //output videos
            videoContainer.innerHTML = output;
        } else {
            videoContainer.innerHTML = 'No videos';
        }
    });
}