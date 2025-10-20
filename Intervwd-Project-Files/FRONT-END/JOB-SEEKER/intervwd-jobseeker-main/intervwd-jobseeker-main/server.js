import express from "express";
import http from "http";
import { Server } from "socket.io";
import fetch from "node-fetch";

const app = express();

// Basic CORS headers for REST and Socket.IO polling endpoints
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("initializeConnection", async (payload, ack) => {
    try {
      const idToken = payload && payload.idToken ? payload.idToken : null;
      const res = await fetch(
        "https://ymyfc6k5s2.execute-api.us-east-1.amazonaws.com/Dev/getInterviewPrompt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: idToken } : {}),
          },
          body: JSON.stringify({
            command: "getInterviewPrompt",
            interview_id: "076a137b-2115-41d4-b1e3-ca6884201933",
          }),
        }
      );
      const data = await res.json();

      socket.emit("textOutput", { role: "ASSISTANT", content: data.prompt });
      ack({ success: true });
    } catch (e) {
      console.error(e);
      ack({ success: false, error: e.message });
    }
  });

  // Receive base64-encoded PCM16 audio from client
  socket.on("audioInput", (base64Pcm) => {
    try {
      // For now, just acknowledge receipt. In a real pipeline, forward to ASR/LLM/tts.
      // Optionally, echo a text event to show roundtrip works.
      socket.emit("textOutput", {
        role: "USER",
        content: "Audio chunk received",
      });
    } catch (e) {
      console.error("audioInput error", e);
    }
  });

  // Stop current audio on client (barge-in) or clean up server-side stream
  socket.on("stopAudio", () => {
    // Cleanup per-session resources here if needed
    socket.emit("textOutput", {
      role: "ASSISTANT",
      content: "Stopped streaming.",
    });
  });

  socket.on("disconnect", () => console.log("Client disconnected"));
});

server.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
