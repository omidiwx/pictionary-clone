// this function handles the drawing portion of our app
export default function DrawbleCanvas(canvas, socket) {
  // DRAW this will identifys who should draw.(currently no one can draw)
  // we used public variable here so we can access it outside htis function
  this.canDraw = false
  this.clearCanvas = function () {
    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  // 0- by default our prev position is null.(read more below)
  let prevPosition = null

  // 1- we make an eventlistener for our canvas mouse move detection
  canvas.addEventListener("pointermove", e => {
    // checks if user is drawing on canvas if not,return.
    if (e.buttons !== 1 || !this.canDraw) {
      // e.button 1 = mouse 1(right click btn)
      prevPosition = null
      return
    }
    // 2- we have new position when we draw.
    const newPosition = { x: e.layerX, y: e.layerY }
    // 4- if we have prevPosition (meaning a line has been drawn, then make a line in our canvas)
    if (prevPosition != null) {
      drawLine(prevPosition, newPosition)
      // DRAW step 1- this event will notify the server that user is drying.(the communication between server and client starts here.)
      socket.emit("draw", {
        // this object contains normalized coordinates of our canvas(number between 0 and 1)
        start: normalizeCoordinates(prevPosition),
        end: normalizeCoordinates(newPosition),
      })
    }
    // 3- we set the new poisiton as our prevposition.
    prevPosition = newPosition
  })
  // 6- this eventListener will make our prevPosition null again if the mouse left the canvas.(fixes the straight line problem)
  canvas.addEventListener("pointerleave", () => (prevPosition = null))
  // DRAW step 3- darw-line event came from server so we draw the line according to that. (no we have the drawn line is availble everywhere)
  socket.on("draw-line", (start, end) => {
    // this code converts the ratio(number betwen 0 and 1 ) to the actual canvas numbers(for eg: 576px)
    drawLine(toCanvasSpace(start), toCanvasSpace(end))
  })
  //5- our drawline function will draw the line we made.
  function drawLine(start, end) {
    // some functions which will make a line draw .
    // our canvas is 2d.
    const ctx = canvas.getContext("2d")
    // begin the path.
    ctx.beginPath()
    // the start point using our newPosition and endPosition layerX and layerY.
    ctx.moveTo(start.x, start.y)
    // the end piont.
    ctx.lineTo(end.x, end.y)
    // make a stroke between start and end.
    ctx.stroke()
  }
  // will fix the ratio between different canvas (returns a number between 0 and 1)
  function normalizeCoordinates(position) {
    return {
      x: position.x / canvas.width,
      y: position.y / canvas.height,
    }
  }
  // this function will convert the ratio to a canvas dimenstion(like:576 px)
  function toCanvasSpace(position) {
    return {
      x: position.x * canvas.width,
      y: position.y * canvas.height,
    }
  }
}
