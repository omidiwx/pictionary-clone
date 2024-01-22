// the production variable in determines what kind of environment we are in.
const production = process.env.NODE_ENV === "production"
// checks if our environment dev is on Development or production
const clientUrl = production ? "realsite.com" : "http://localhost:1234"
import { Server } from "socket.io"
const io = new Server(3000, {
  //cors is an option. it functions like n-word pass, it will let different domain to connect to our server. (????????)
  cors: {
    origin: clientUrl,
  },
})
// it's okay for our user to loose room data in refresh and being able to rejoin later.
// so we make a room variable and save it on our local storage.this room is an object which each room inside of it is an object with users list and roomId
const rooms = {}
const WORDS = ["Apple", "Dog", "Banana"]
io.on("connection", socket => {
  //the  join-room in here is the name of our event with this method we sent the join-room data from room.js to here(server.js)
  socket.on("join-room", data => {
    // create a user which has id and the name from our form, and the socket(for furthur changes).
    const user = { id: socket.id, name: data.name, socket: socket }
    // create a new room,check if there is already a room with this room id.
    // basically it's targeting a room in our rooms object. so that later it could push the new user to the already availbe room.
    let room = rooms[data.roomId]
    // if there was no room found on the rooms object...(it means it's a new room (not existed before))(null)
    if (room == null) {
      room = { users: [], id: data.roomId } // create a new room which has users array(list of the users in that room) and the roomId(the new roomId)
      // our room,users,and the id are global variables because we need the users database outside of our if scope
      //----
      // after making a room, make the room with the property of our roomId equal to the newly created room.
      rooms[data.roomId] = room
    }
    //we push the user to our users database
    room.users.push(user)

    //we join our user to the room
    socket.join(room.id)
    // the emitted ready event on room js sent to server is here
    // it'll check if all users are ready and after that emits the start-drawer and start-guesser event to the client.
    socket.on("ready", () => {
      user.ready = true
      if (room.users.every(u => u.ready)) {
        room.drawer = getRandomEntry(room.users) //it will pick a random user and make it the drawer
        room.word = getRandomEntry(WORDS) // picks a random word from our WORD array(it should be array because the functin only works with arrays)
        io.to(room.drawer.id).emit("start-drawer", room.word) //io sends a message generaly(all users) but here we are emitting data only to the drawer
        room.drawer.socket.to(room.id).emit("start-gusser") // with this method we send a message from drawer to others which are gussers.(read the room.js for the events)
      }
    })
    // on each guess we show the guess to both server and client chat and also check for the correct guess with our if statement.
    socket.on("make-guess", data => {
      socket.to(room.id).emit("guess", user.name, data.guess)
      // if the guessed word that came from ou room was equal to the room word
      if (data.guess.toLowerCase().trim() === room.word.toLowerCase()) {
        // we send the winner event to client ---> it'll show the winner name and the word
        io.to(room.id).emit("winner", user.name, room.word) // we catch the name of the winner by our if statement ^ and the word ---> send it to client
        // the game is over ---> make everyone unready
        room.users.forEach(u => {
          u.ready = false
        })
      }
    })
    // DRAW step 2- after receiving draw from drawbleCanvas we emit the draw line even again with the same data.(number 1 is on DrawbleCanvas.js)
    // the data variable contains the object sent from DrawbleCanvas.js
    socket.on("draw", data => {
      // now every time we draw something both server and our canvas knows.
      socket.to(room.id).emit("draw-line", data.start, data.end)
    })
    //when the users disconnects we want to remove the user.(so we won't get duplicated users.)
    socket.on("disconnect", () => {
      room.users = room.users.filter(u => u !== user)
    })
  })
})
// the function returns a random index on the given array.
function getRandomEntry(array) {
  return array[Math.floor(Math.random() * array.length)]
}
