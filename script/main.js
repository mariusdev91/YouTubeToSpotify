//global variables needed for Google
const apiKey = "AIzaSyDCCsUUXqJqNBj-h3mXotgbDr217IwTD0o";
const CLIENT_ID = "970785099040-ibkuvcolg5jkge0t3g8nt07njptb3ikl.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly";
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'];

const authorizeButton = document.getElementById('signIn');
const signOutButton = document.getElementById('signOut');
const content = document.getElementById('content');

const channelForm = document.getElementById('my-channel-form');
const channelInput = document.getElementById('basic-url');
const videoContainer = document.getElementById('video-container');

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
        const loggedInMessage = document.getElementById('loggedIn');
        if (access_token !== null) {
            loggedInMessage.textContent = 'You are connected with Google and Spotify!';
        } else {
            loggedInMessage.textContent = 'You are connected to Google, but not to Spotify. Please connect to Spotify also!';
            channelInput.disabled = true;
        }
    } else {
        authorizeButton.style.display = 'block';
        signOutButton.style.display = 'none';
    }
}

//handle Log In
function handleAuthClick() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signIn().then(() => { console.log('User signed in.') });
}

//handle Log Out
function handleSignOutClick() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then( () => { console.log('User signed out.') });
}

//get and output playlist content
function requestPlaylist(playlistId) {
    return gapi.client.youtube.playlistItems.list({
        part: [
            'snippet, contentDetails'
        ],
        maxResults: 25,
        playlistId: playlistId,        
    })
    .then(function (response) {
        const items = response.result.items
        let playlistItemsModified = [];
        if (items) {
            items.forEach((e) => {
                let title = e.snippet.title.toString();
                if (title.includes('(') || title.includes('[') || title.includes('HD') || title.includes('hd') 
                    || title.includes('Featuring') || title.includes('feat.') || title.includes('feat')
                    || title.includes('featuring') || title.includes('ft.') || title.includes('Ft.')) {
                    if (title.includes('(') || title.includes('[')) {
                        if (title.includes('(')) {
                            title = title.substring(0, title.indexOf('('));
                        } else {
                            title = title.substring(0, title.indexOf('['));
                        }  
                    } 
                    if (title.includes('HD') || title.includes('hd')) {
                        if (title.includes('HD')) {
                            title = title.substring(0, title.indexOf('HD'));
                        } else {
                            title = title.substring(0, title.indexOf('hd'));
                        }
                    } 
                    if (title.includes("Featuring") || title.includes("featuring") || title.includes('feat.') 
                        || title.includes('ft.') || title.includes('Ft.') || title.includes('feat')){
                            if (title.includes("Featuring")) {
                                title = title.replace('Featuring', '');
                            } else if (title.includes('featuring')) {
                                title = title.replace('featuring', '');
                            } else if (title.includes('feat.')) {
                                title = title.replace('feat.', '');
                            } else if (title.includes('ft.')) {
                                title = title.replace('ft.', '');
                            } else if (title.includes('Ft.')) {
                                title = title.replace('Ft.', '');
                            } else if (title.includes('feat')) {
                                console.log(title);
                                title = title.replace('feat', '');
                            }
                        }
                }
                title = title.split('-');
                title = title.toString();
                title = title.trim();
                title = title.split(',')
                playlistItemsModified.push(title);
            })
        }
        return playlistItemsModified;
    },
        (err) => { console.error('Execute error', err) });
}

//global variables for Spotify
const spotifyClientID = 'ed6c80286b774dcd89c0236fbab1f39e';
const spotifyClientSecret = '3caf0467789d43b7b5e86f8b776ade90';
const spotifyRedirectURI = 'http://localhost:8000/main.html';
const AUTHORIZE = 'https://accounts.spotify.com/authorize';
const TOKEN = 'https://accounts.spotify.com/api/token';
let refresh_token = null;
let access_token = null;
let currentPlaylist = '';
var radioButtons = [];

//get authorization from Spotify 
function authorizeUser() {
    let url = AUTHORIZE;
    url += '?client_id=' + spotifyClientID;
    url += '&response_type=code';
    url += '&redirect_uri=' + encodeURI(spotifyRedirectURI);
    url += '&scope=playlist-modify-private playlist-read-private user-read-email user-read-private user-modify-playback-state user-read-playback-state';
    
    //shows Spotify's authorization screen
    window.location.href = url; 
}

//function that checks if the user has already authorized Spotify
function onPageLoad() {
    if (window.location.search.length > 0) {
        handleRedirect();
    } else {
        if(access_token == null) {
            document.getElementById('createPlaylist').disabled = true;
        } else {
            document.getElementById('createPlaylist').disabled = false;
        }
    }
    refreshRadioButtons();
}

//function that handle's the redirect
function handleRedirect() {
    let urlCode = getUrlCode();
    getAccessToken(urlCode);
    window.history.pushState('', '', spotifyRedirectURI);
}

//function that gets the code from the url if the 
//user is already logged in
function getUrlCode() {
    let code = null;
    let urlString = window.location.search
    if (urlString.length > 0) {
        const urlParams = new URLSearchParams(urlString)
        code = urlParams.get('code');
    }
    return code;
}

//get token from Spotify
function getAccessToken(code) {
    let body = 'grant_type=authorization_code';
    body += '&code=' + code;
    body += '&redirect_uri=' + encodeURI(spotifyRedirectURI);
    body += '&client_id' + spotifyClientID;
    body += '&client_secret=' + spotifyClientSecret;
    callAuthorizationAPI(body);
}

//get refresh token from Spotify
function refreshAccessToken() {
    refresh_token = localStorage.getItem('refresh_token');
    let body = 'grant_type=refresh_token';
    body += '&refresh_token=' + refresh_token;
    body += '&client_id' + spotifyClientID;
    callAuthorizationAPI(body);
}

//POST request to the Spotify server to get access token
async function callAuthorizationAPI(body) {
    const response = await fetch(TOKEN, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(spotifyClientID + ":" + spotifyClientSecret)
        },
        'body': body,
    })
    handleSpotifyAuthorizationResponse(response);
}

//function that handle's the POST response
async function handleSpotifyAuthorizationResponse(response) {
    if (response.status === 200) {
        let data = await response.json();
        console.log(data);
        if (data.access_token != undefined) {
            access_token = data.access_token;
            localStorage.setItem('access_token', access_token);
        }
        if (data.refresh_token != undefined) {
            refresh_token = data.refresh_token;
            localStorage.setItem('refresh_token', refresh_token);
        }
        onPageLoad();
    } else {
        console.log(response.statusText);
        alert(response.statusText);
    }
}

//function that get's the user's Spotify account id
async function getId() {
    const spotifyCurrentUserProfile = 'https://api.spotify.com/v1/me';
    const response = await fetch(spotifyCurrentUserProfile, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        },
    });
    return handleGetIdFunction(response);
}

//handle response from getId function
async function handleGetIdFunction(response) {
    if (response.status == 200) { 
        let data = await response.json();
        let userId = JSON.stringify(data.id);
        console.log(data.id)
        return userId;
    } else {
        console.log(response.statusText);
        return
    }
}

//function that get's playlistName
async function getPlaylistName() {
    const response = await createPlaylist();
    let playlistName = response.playlistName;
    console.log(playlistName);
}

//function that creates a playlist in the user's Spotify account
async function createPlaylist() {
    let playlistName = prompt('Please enter a name for your Spotify playlist:');
    if (playlistName.length === 0) {
        document.getElementById('createPlaylist').disabled = true;
        alert('Please enter a name for your new Spotify playlist');
    }
    if (playlistName.length > 0) {
        document.getElementById('createPlaylist').disabled = false;
        let result = await getId();
        let userId = result.trim();
        userId = userId.substring(1, userId.length - 1);
        const spotifyCreatePlaylistApi = `https://api.spotify.com/v1/users/${userId}/playlists`;
        const bodyData = `{\"name\":\"${playlistName}\",\"description\":\"New playlist description\",\"public\":false}`;

        const response = await fetch (spotifyCreatePlaylistApi, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
            body: bodyData
        })

        let data = await response.json();
        let playlistId = data.id;
        console.log(playlistId);
        alert('Playlist successfuly created!');
        return playlistId;
    } else {
        document.getElementById('createPlaylist').disabled = false;
        alert('Playlist was not created!')
    }
}

//add items in the playlist
async function addItemsToPlaylist() {
    let playlistId = await createPlaylist();
    let searchResultUri = await searchInSpotify();
    let uriArray = [];
    searchResultUri.forEach((e) => {
        uriArray.push(e);
        console.log(e);
    })
    const addItemEndpoint = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    let fullEndpoint = addItemEndpoint;
    fullEndpoint += `?uris=${searchResultUri}`;
    const response = await fetch(fullEndpoint, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + access_token
        }
    })
    let data = response.json();
    console.log(data);
}

//function that searches in Spotify
async function searchInSpotify(){
    let playlistId = null;
    let playlistUrl = document.getElementById('basic-url').value;

    //get the playlist URL from the input form
    if (playlistUrl.length != 0) { 
        const regex = /list=(.+)/;
        const matches = playlistUrl.match(regex);
        if (matches) {
            playlistId = matches[1];
        }
    } else {
        alert('Please enter your playlist URL!')
    }

    //pass the youtube playlist id to the function that get's the data from youtube
    let youtubeData = await requestPlaylist(playlistId);
    console.log(youtubeData)

    const endPoint = "https://api.spotify.com/v1/search";
    let finalResponse = null;
    let uri = [];
    for (let i = 0; i < youtubeData.length; ++i) {
        let currentArtist = youtubeData[i][0];
        let track = youtubeData[i][1];
        track = track.toString().trim();
        let searchUrl = endPoint;
        searchUrl += `?query=${track}`;
        searchUrl += "&type=track"
        searchUrl += "&limit=10"

        const response = await fetch (searchUrl, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            }
        })

        finalResponse = await response.json();
        handleSpotifySearchResult(finalResponse, currentArtist);
        uri.push(handleSpotifySearchResult(finalResponse, currentArtist));
        console.log(uri);
    }
    if (uri.length === youtubeData.length) {
        return uri;
    } else {
        console.log("Something went wrong!...")
    }
}

//function that print's in the console the results and returns
//the track id for every track found in Spotify
function handleSpotifySearchResult(spotifyResult, currentArtist) {
    const response = spotifyResult.tracks.items;
    const youtubeCurrentArtist = currentArtist.toLowerCase().trim();
    let currentSpotifyPopularity = 0;
    let trackUri = null;
    let trackFound = false;
    for(let i = 0; i < 10 && trackFound === false; ++i) {
        let spotifyTrackArtist = (response[i].artists[0].name).trim().toLowerCase();
        if (response[i].popularity >= currentSpotifyPopularity && youtubeCurrentArtist.includes(spotifyTrackArtist)) {
            currentSpotifyPopularity = response[i].popularity;
            trackUri = response[i].uri;
            trackFound === true;
        }
    }   
    console.log(trackUri);
    return trackUri;
}

//get current device ID
async function getUsersDevices(){
    let callUrl = "https://api.spotify.com/v1/me/player/devices";
    const response = await fetch(callUrl, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        }
    });
    handleDeviceCall(response);
}

//handle devices reponse 
async function handleDeviceCall(response){
    if(response.status === 200) {
        removeElements('devices');
        let devices = await response.json();
        console.log(devices);
        devices.devices.forEach(item => addDevices(item));
    } else if(response.text === 401) {
        refreshAccessToken();
    } else {
        alert(response.resposneText);
    }
}

//function that adds the devices in the list
async function addDevices(item){
    let node = document.createElement('option');
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById('devices').appendChild(node);
}

//get user's playlists
async function getUsersPlaylists() {
    const playlistApi = "https://api.spotify.com/v1/me/playlists";
    let response = await fetch(playlistApi, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        }
    });
    handlePlaylistGet(response);
}

//handle playlist call
async function handlePlaylistGet(response) {
    if (response.status === 200) {
        let responseData = await response.json();
        removeElements('playlists');
        responseData.items.forEach(item => addPlaylists(item)); 
    } else if (response.status === 401) {
        refreshAccessToken();
    } else {
        console.log(response.statusText);
    }
}

//function that adds the name of every playlist in the html list
function addPlaylists(item) {
    let node = document.createElement('option');
    node.value = item.id;
    node.innerHTML = item.name + " (" + item.tracks.total + ")";
    document.getElementById('playlists').appendChild(node);
}

//function that clears the list
function removeElements(elementId) {
    let node = document.getElementById(elementId);
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

//play function for player
async function play() {
    let playlist_Id = document.getElementById('playlists').value;
    let trackIndex = document.getElementById('tracks').value;
    let callBody = {};
    callBody.context_uri = 'spotify:playlist:' + playlist_Id;
    callBody.offset = {};
    callBody.offset.position = trackIndex.length > 0 ? Number(trackIndex) : 0;
    callBody.offset.position_ms = 0;

    let callUrl = `https://api.spotify.com/v1/me/player/play?device_id=${getSelectedDevice()}`;

    let response = await fetch (callUrl, {
        method: "PUT",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        },
        body: JSON.stringify(callBody)
    });
    console.log(response);
    handleSpotifyFetch(response);
}

//shuffle option for player
async function shuffle() {
    let callUrl = `https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${getSelectedDevice()}`;
    let response = await fetch(callUrl, {
        method: "PUT",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        }
    });
    handleSpotifyFetch(response);
    play();
}

//pause option
async function pause() {
    let callUrl = `https://api.spotify.com/v1/me/player/pause?device_id=${getSelectedDevice()}`;
    let response = await fetch(callUrl, {
        method: "PUT",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        }
    });
    handleSpotifyFetch(response);
}

//next option
async function next() {
    let callUrl = `https://api.spotify.com/v1/me/player/next?device_id=${getSelectedDevice()}`;
    let response = await fetch (callUrl, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        }
    })
    handleSpotifyFetch(response);
}

//previous option
async function previous() {
    let callUrl = `https://api.spotify.com/v1/me/player/previous?device_id=${getSelectedDevice()}`;
    let response = await fetch (callUrl, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        }
    })
    handleSpotifyFetch(response);
}

//function transfer track to device
async function transfer(){
    let body = {};
    body.device_ids = [];
    body.device_ids.push(getSelectedDevice());

    const callUrl = "https://api.spotify.com/v1/me/player";
    const response = await fetch (callUrl, {
        method: "PUT",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        },
        body: JSON.stringify(body)
    })
    handleSpotifyFetch(response);
}

//get selected device
function getSelectedDevice() {
    console.log(document.getElementById('devices').value);
    return document.getElementById('devices').value;
}

//handle API fetch
async function handleSpotifyFetch(response) {
    if(response.status === 200) {
        console.log(reponse);
        setTimeout(currentlyPlaying, 1000);
    } else if(response.status === 204) {
        setTimeout(currentlyPlaying, 1000);
    } else if(response.status === 401){
        refreshAccessToken();
    } else {
        alert(response.resposneText);
    }
}

//get tracks from the selected playlist
async function getTrackFromSelectedPlaylist() {
    let playlistId = document.getElementById('playlists').value;
    if (playlistId.length > 0) {
        let callUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
        console.log(playlistId);
        let response = await fetch (callUrl, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            }
        });
        handleTrackResponse(response);
    }
}

//handle reponse from get track
async function handleTrackResponse(response){
    if(response.status === 200) {
        let getResponse = await response.json();
        removeElements('tracks');
        getResponse.items.forEach((item, index) => addTrack(item, index));
    } else if (response.status === 401){
        refreshAccessToken();
    } else {
        alert(response.reponseText);
    }
}

//function that adds the tracks from the playlist
async function addTrack(item, index) {
    let node = document.createElement('option');
    node.value = index;
    node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")";
    document.getElementById('tracks').appendChild(node);
}

//function that handles the currently playing section
async function currentlyPlaying(){
    let callUrl = "https://api.spotify.com/v1/me/player/currently-playing?market=US";
    let response = await fetch(callUrl, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        }
    })
    handleCurrentlyPlaying(response);
}

//handle currently playing response
async function handleCurrentlyPlaying(response){
    if(response.status === 200) {
        let responseData = await response.json();
        console.log(responseData);
        if (responseData.item != null) {
            document.getElementById('albumImage').src = responseData.item.album.images[0].url;
            document.getElementById('albumImage').style.height = '150px';
            document.getElementById('albumImage').style.width = '150px';
            document.getElementById('trackTitle').innerHTML = responseData.item.name;
            document.getElementById('trackArtist').innerHTML = responseData.item.artists[0].name;
        }

        if (responseData.device != null) {
            currentDevice = responseData.data.id;
            document.getElementById('devices').value = curretDevice;
        }

        if (responseData.context != null) {
            currentPlaylist = responseData.context.uri;
            currentPlaylist = currentPlaylist.substring(currentPlaylist.lastIndexOf(":") + 1, currentPlaylist.length);
            document.getElementById('playlists').value = currentPlaylist;
        }
    } else if(response.status === 401) {
        refreshAccessToken();
    } else {
        alert(response.reponseText);
    }
}

//add buttons to the players
function saveNewRadioButton (){
    let item = {};
    item.deviceId = getSelectedDevice();
    item.playlistId = document.getElementById('playlists').value;
    radioButtons.push(item);
    localStorage.setItem('radio_button', JSON.stringify(radioButtons));
    refreshRadioButtons();
}

//refresh radio button
function refreshRadioButtons(){
    let data = localStorage.getItem(radioButtons);
    if (data != null) {
        radioButtons = JSON.parse(data);
        if (Array.isArray(radioButtons)) {
            removeElements('radioButtons');
            radioButtons.forEach((item, index) => addRadioButton(item, index));            
        }
    }
}

//do something when clicking a button
async function onRadioButton (deviceId, playlistId) {
    let body = {};
    body.context_uri = "spotify:playlist" + playlistId;
    body.offset = {};
    body.offset.position = 0;
    body.offset.position_ms = 0;

    let callUrl = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;
    const response = await fetch(callUrl, {
        method:"PUT",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        },
        body: JSON.stringify(body)
    })
    handleSpotifyFetch(response);
}

//add radio button
// async function addRadioButton(item, index) {
//     let node = document.createElement('option');
//     node.className = 'btn btn-primary m-2';
//     node.innerHTML = index;
//     node.onclick = function () {
//         onRadioButton(item.deviceId, item.playlistId);
//     }
//     document.getElementById("radioButtons").appendChild(node);
// }

//function that starts when the page loads
function init() {
    const divRow = document.getElementById('buttonRows');

    const spotifyButton = document.getElementById('spotifyAuth');
    spotifyButton.title = "Press the button to connect to Spotify."
    spotifyButton.addEventListener('click', (e) => {
        e.preventDefault();
    })
    spotifyButton.addEventListener('click', () => authorizeUser());

    const searchSpotifyButton = document.createElement('button');
    searchSpotifyButton.innerHTML = `<span class="createPlaylist"></span>
                                    <span class="createPlaylistText">Create Spotify playlist and add tracks</span> `;
    searchSpotifyButton.id = 'createPlaylist';
    searchSpotifyButton.className = 'btn btn-outline-info btn-sm';
    searchSpotifyButton.addEventListener('click', () => searchInSpotify());
    searchSpotifyButton.addEventListener('click', () => addItemsToPlaylist());
    const divCol5 = document.createElement('div');
    divCol5.className = 'col-5';
    divCol5.style.width = "fit-content";
    divCol5.appendChild(searchSpotifyButton);
    divRow.append(divCol5);

    document.getElementById('refreshDevices').addEventListener('click', getUsersDevices)
    document.getElementById('refreshPlaylist').addEventListener('click', getUsersPlaylists);
    document.getElementById('getTracks').addEventListener('click', getTrackFromSelectedPlaylist);

    document.getElementById('play').addEventListener('click', play);
    document.getElementById('previous').addEventListener('click', previous);
    document.getElementById('shuffle').addEventListener('click', shuffle);
    document.getElementById('pause').addEventListener('click', pause);
    document.getElementById('next').addEventListener('click', next);

    document.getElementById('transfer').addEventListener('click', transfer);
    document.getElementById('currentlyPlaying').addEventListener('click', currentlyPlaying);

}

init();