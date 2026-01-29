Full Project Prompt (Copy–Paste)

Role: You are a senior full-stack engineer specialized in real-time web applications.

Goal: Build a web application that allows multiple users to join rooms and watch the same movie together in perfect sync (play, pause, seek, buffering).

Tech Stack:

Frontend: React + Vite

Styling: Tailwind CSS

Realtime: WebSockets (Socket.IO)

Backend: Node.js + Express

Video: HTML5 <video> player (support local files & streaming URLs)

Core Features:

Create & join rooms using a unique room ID

Real-time synchronization:

Play / Pause

Seek (timeline sync)

Current playback time correction

Host authority system:

One user controls playback

Others auto-sync to host actions

Late join sync:

New users instantly sync to current timestamp & state

Basic chat inside the room

Display connected users list

Handle network delay & drift correction

Frontend Requirements (React + Vite):

Use functional components and hooks

useEffect for socket lifecycle

Context or Zustand for global room state

Clean folder structure

Reusable video player component

Backend Requirements:

Socket.IO room management

Store room state in memory:

isPlaying

currentTime

lastUpdated timestamp

Emit sync events efficiently

Synchronization Logic:

Host emits events on play/pause/seek

Clients calculate drift and auto-correct

Use throttling to avoid event spam

Deliverables:

Project folder structure

Backend code

Frontend code

Socket events diagram

Explanation of sync strategy

Instructions to run locally

Code Quality:

Clean, readable, production-ready

Comments explaining critical logic

Avoid unnecessary libraries

Bonus (Optional):

Room password

User nicknames

Host transfer

Fullscreen sync

🧠 Architecture Hint (Important)
Client (React)
   ↓ WebSocket
Node.js Server (Socket.IO)
   ↓ Broadcast
All Clients (Synced Video State)

Movie Embed
Endpoint

Copy
https://vidfast.pro/movie/{id}?autoPlay=true
Required Parameters
{id}Movie identifier from IMDB or TMDB
Optional Parameters
titleControls whether the media title is displayed
posterDetermines if the poster image is shown
autoPlayControls whether the media starts playing automatically
startAtStarts the video at the specified time in seconds
themeChanges the player's color (hex code format)
serverChanges the default server for the player (set to server name)
hideServerControls whether the server selector button is shown or hidden
fullscreenButtonControls whether the fullscreen button is shown or hidden
chromecastControls whether the Chromecast button is shown or hidden
subSets the default subtitle (e.g. en, es, fr)
Examples
https://vidfast.pro/movie/tt6263850

https://vidfast.pro/movie/533535?theme=16A085

TV Show Embed
Endpoint

Copy
https://vidfast.pro/tv/{id}/{season}/{episode}?autoPlay=true
Required Parameters
{id}TV show identifier from IMDB or TMDB
{season}The season number
{episode}The episode number
Optional Parameters
titleControls whether the media title is displayed
posterDetermines if the poster image is shown
autoPlayControls whether the media starts playing automatically
startAtStarts the video at the specified time in seconds
themeChanges the player's color (hex code format)
nextButtonDisplays the "Next Episode" button when 90% of the current episode has been watched
autoNextAutomatically plays the next episode when the current one ends (requires nextButton)
serverChanges the default server for the player (set to server name)
hideServerControls whether the server selector button is shown or hidden
fullscreenButtonControls whether the fullscreen button is shown or hidden
chromecastControls whether the Chromecast button is shown or hidden
subSets the default subtitle (e.g. en, es, fr)
Examples
https://vidfast.pro/tv/tt4052886/1/5

https://vidfast.pro/tv/63174/1/5?nextButton=true&autoNext=true

