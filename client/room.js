// installing socket.io client version first
// importing socket.io
import { io } from "socket.io-client"
// we import the exported function.
import DrawbleCanvas from "./DrawbleCanvas"
// the NODE_ENV is a property of process object. more explanation on server.js part.
const production = process.env.NODE_ENV === "production"
const serverUrl = production ? "realsite.com" : "http://localhost:3000"
// our front-end code is on client folder(different domain).
// so we should pass the server domain(in our case: port 3000), to our client.
const socket = io(serverUrl)

//socket is an object with some useful properties which helps us to undrestand different things like server connected or not
console.log(socket)
// we found the name and roomId using URLSearchParams object which has multiple parameters in it.
// the window.location will return the current url of the client and the searh will return anything after the "?".
const urlParams = new URLSearchParams(window.location.search)
// we got name and roomId using get method
const name = urlParams.get("name")
const roomId = urlParams.get("room-id")
// checks and return user to the main page if name or room id is empty.
if (!name || !roomId) window.location = "index.html"
// selecting everything that we should work with
const guessForm = document.querySelector("[data-guess-form]")
const guessInput = document.querySelector("[data-guess-input]")
const wordElement = document.querySelector("[data-word]")
const messagesElement = document.querySelector("[data-messages]")
const readyButton = document.querySelector("[data-ready-btn]")
const canvas = document.querySelector("[data-canvas]")
//  we define a new canvas
const drawbleCanvas = new DrawbleCanvas(canvas, socket)
// TODO
const guessTmeplate = document.querySelector("[data-guess-template]")
// with emit we can send our client data(here) to our server(server.js) which then server can access the data.
//in this case we have an object sending to the server named join-room
socket.emit("join-room", { name: name, roomId: roomId }) //the join-room is name of our event that we are sending to the server.
// these two function will change ui for both drawer and guesser for the game to start
socket.on("start-drawer", startRoundDrawer)
socket.on("start-gusser", startRoundGuesser)
// the guess that sent to the server with the "make-guess" event is now sent back to client with the "guess" event(we caught it below)
// by displaying the guess once again we now have the chat option globally.
socket.on("guess", displayGuess)
// so we have the name of the winner and the room word from our "winner" event ---> end the round(game is over)
socket.on("winner", endRound)
endRound()
// we resize the canvas dimenstions first then below, we change it on resize.
resizeCanvas()
setupHTMLEvents()
// we put the event listeners on the same function for a cleaner code
function setupHTMLEvents() {
  // hides the ready button after it got click and emits(sneds) the ready event to the server
  readyButton.addEventListener("click", () => {
    hide(readyButton)
    socket.emit("ready")
  })
  guessForm.addEventListener("submit", e => {
    e.preventDefault()
    if (guessInput.value === "") return
    socket.emit("make-guess", { guess: guessInput.value })
    displayGuess(name, guessInput.value)
    guessInput.value = ""
  })
  // if user resize the screen the canvas will be resized.
  window.addEventListener("resize", resizeCanvas)
}
// TODO
function displayGuess(guesserName, guess) {
  const guessElement = guessTmeplate.content.cloneNode(true)
  const nameElement = guessElement.querySelector("[data-name]")
  const messageElement = guessElement.querySelector("[data-text]")
  nameElement.innerText = guesserName
  messageElement.innerText = guess
  messagesElement.append(guessElement)
}
// will hide the all guess form from the drawer.

function endRound(name, word) {
  // the if statement will work if name and word are given to it.(we did this beause we called the function without the name and word once)
  if (name && word) {
    wordElement.innerText = word
    show(wordElement)
    displayGuess(null, `${name} is the winner`)
  }
  // DRAW : in the end of each round no one can draw
  drawbleCanvas.canDraw = false
  show(readyButton)
  hide(guessForm)
}
// the hide functioni will do the hiding.
function hide(element) {
  element.classList.add("hide")
}
// resizes our canvas so the propportions are correct in every screen.
function resizeCanvas() {
  // we set the widt and height to null so that when we get the dimensions it woun't be the css given dimensions
  canvas.width = null
  canvas.height = null
  // after we reset it now it'll get the width and height of that specefic screen(not the css given dimensions)
  const clientDimensions = canvas.getBoundingClientRect()
  // and we set it to that
  canvas.width = clientDimensions.width
  canvas.height = clientDimensions.height
}
// it's for drawer which will see the word to draw
function startRoundDrawer(word) {
  wordElement.innerText = word
  // when the round starts for the drawer we set it to true for the drawer.
  drawbleCanvas.canDraw = true
  // TODO
  drawbleCanvas.clearCanvas()
  messagesElement.innerHTML = ""
}
// it's for the gussers which will show them the input for chatting and guessing.
function startRoundGuesser() {
  show(guessForm)
  // TODO
  drawbleCanvas.clearCanvas()
  messagesElement.innerHTML = ""
  wordElement.innerText = ""
}
function show(element) {
  element.classList.remove("hide")
}
