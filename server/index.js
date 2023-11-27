const express = require('express');
const cors = require('cors')
const mongoose = require('mongoose')
const userRoute = require('./Routes/userRoute')
const {Server} = require('socket.io')

require("dotenv").config()

const app = express();

const port = process.env.PORT || 5000;
const url = process.env.MONGO_URL;


app.use(express.json());
app.use(cors());
app.use('/api/users', userRoute);


app.listen(port, (req, res) => {
     console.log(`server running on port: ${port}`);
});

// connect mongobd
mongoose.connect(url, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    
  }).then(() => {
    console.log(`mongodb connection stablish`);
}).catch((error) => console.log(`mongodb connection failed`, error.message));


// creating a new signaling server
const io = new Server(8000, {
  cors: true
});


io.on("connection", (socket) => {
  console.log(`socket connected`, socket.id)
  socket.on("room:join", (data) => {
      console.log(data);
      const { room } = data;
      io.to(room).emit("user:joined", { id: socket.id});
      socket.join(room);
      io.to(socket.id).emit("room:join", room)
  });

  socket.on("user:call", ({to, offer}) => {
      io.to(to).emit("incomming:call", {from: socket.id, offer})
  });

  socket.on("call:accepted", ({to, ans}) => {
      io.to(to).emit("call:accepted", {from: socket.id, ans})
  });

  socket.on("peer:nego:needed", ({to, offer}) => {
      console.log("peer:nego:needed", offer);
      io.to(to).emit("peer:nego:needed", {from: socket.id, offer});
  });

  socket.on("peer:nego:done", ({to, ans}) => {
      console.log("peer:nego:done", ans);
      io.to(to).emit("peer:nego:final", {from: socket.id, ans});
  });

  socket.on("leave", (id) => {
      socket.leave(id);
      socket.broadcast.to(id).emit("leave")
  })

  socket.on("disconnect", (id) => {
    socket.leave(id);
    console.log(`user Disconnected`)
  })
})