<template>
  <div class="text-center">
    <v-dialog :model-value="InterViewDialog" fullscreen opacity="0.9">
      <v-toolbar color="transparent">
        <v-spacer />
        <v-btn icon variant="text" color="white" @click="InterViewDialogEmit">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <div align="center">
        <v-card
          color="white"
          class="mt-n2 elevation-0"
          width="1200px"
          rounded="lg"
        >
          <div class="d-flex ml-3 mt-3">
            <div class="fontsize20px font-weight-bold">
              {{ ActionObj.job_title }}
              <v-btn
                class="text-capitalize ml-6"
                variant="outlined"
                size="x-small"
                color="green"
                style="background-color: white"
              >
                <span class="fontsize10px">{{ ActionObj.job_code }}</span>
              </v-btn>
            </div>
          </div>
          <!-- <iframe
            ref="myIframe"
            height="300px"
            width="1200px"
            class="mt-4"
            :src="`https://nova.intervwd.com?systemprompt=${encodeURIComponent(
              ActionObj.job_description
            )}`"
            allow="microphone; camera"
          ></iframe> -->

          <iframe
            ref="myIframe"
            height="300px"
            width="1200px"
            class="mt-4"
            :src="`http://localhost:3000`"
            allow="microphone; camera"
          ></iframe>

          <v-btn @click="sendToIframe('start')">Start</v-btn>
          <v-btn @click="sendToIframe('stop')">Stop</v-btn>
        </v-card>
      </div>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
    InterViewDialog: Boolean,
    ActionObj: Object,
    InterViewDetails: Object,
  },
  data() {
    return {
      isInterviewing: false,
      chatMessages: [],
      timeRemaining: 300,
      timer: null,
      mediaRecorder: null,
      audioChunks: [],
      silenceTimer: null,
      confirmStop: false,
      recognition: null,
      liveTranscript: "",
      systemPrompt: "",
    };
  },
  computed: {
    formattedTime() {
      const m = Math.floor(this.timeRemaining / 60);
      const s = String(this.timeRemaining % 60).padStart(2, "0");
      return `${m}:${s}`;
    },
  },
  watch: {
    InterViewDialog(newVal) {
      if (newVal == true) {
        window.addEventListener("message", this.handleIframeMessage);
      }
    },
  },
  methods: {
    sendToIframe(action) {
      const iframe = this.$refs.myIframe;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ action }, "http://localhost:3000");
      }
    },
    async startInterview() {
      this.isInterviewing = true;
      this.startTimer();
      await this.startRecording();

      this.initSpeechRecognition();

      const res = await fetch(
        "https://ymyfc6k5s2.execute-api.us-east-1.amazonaws.com/Dev/InterviewManagementAPI"
      );
      const data = await res.json();
      this.addMessage("ai", data.aiText);
      this.speakText(data.aiText);
    },
    handleIframeMessage(event) {
      if (event.origin !== "https://nova.intervwd.com") return;

      console.log("Message from iframe:", event.data);

      if (event.data.action === "interviewCompleted") {
        this.SnackBarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "green",
          SnackbarText: "Interview Completed!",
        };
      }
    },
    InterViewDialogEmit() {
      this.isInterviewing = false;
      this.confirmStop = false;
      this.stopRecording();
      this.resetTimer();
      this.liveTranscript = "";
      this.$emit("clicked");
    },

    addMessage(sender, text) {
      this.chatMessages.push({ sender, text });
      this.$nextTick(() => {
        const container = this.$el.querySelector(".chat-window");
        if (container) container.scrollTop = container.scrollHeight;
      });
    },

    startTimer() {
      this.timeRemaining = 300;
      this.timer = setInterval(() => {
        if (this.timeRemaining > 0) this.timeRemaining--;
      }, 1000);
    },
    resetTimer() {
      clearInterval(this.timer);
      this.timer = null;
    },

    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            this.audioChunks.push(e.data);
            clearTimeout(this.silenceTimer);
            this.silenceTimer = setTimeout(() => {
              this.flushAudio();
            }, 3000);
          }
        };

        this.mediaRecorder.start(1000);
        console.log("Continuous recording started...");
      } catch (err) {
        console.error("Mic access error:", err);
      }
    },

    stopRecording() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      }
      clearTimeout(this.silenceTimer);
      if (this.recognition) this.recognition.stop();
    },

    async flushAudio() {
      if (!this.audioChunks.length) return;

      const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
      this.audioChunks = []; // reset for next speech

      await this.sendAudio(audioBlob);
    },

    async sendAudio(audioBlob) {
      try {
        const formData = new FormData();
        formData.append("file", audioBlob);

        const res = await fetch("http://localhost:3000/interview", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.userText) this.addMessage("user", data.userText);
        if (data.aiText) {
          this.addMessage("ai", data.aiText);
          this.speakText(data.aiText);
        }
      } catch (err) {
        console.error("Send audio error:", err);
      }
    },

    // 🔊 Convert text → speech
    speakText(text) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      synth.speak(utterance);
    },

    // 🎤 Browser speech recognition (live transcript if supported)
    initSpeechRecognition() {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.log("Speech recognition not supported in this browser");
        return;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            this.addMessage("user", res[0].transcript.trim());
            this.liveTranscript = "";
          } else {
            interim += res[0].transcript;
          }
        }
        this.liveTranscript = interim;
      };

      this.recognition.start();
    },
  },
};
</script>

<style scoped>
.white {
  background: #fff;
}
.border-top {
  border-top: 1px solid #e5e7eb;
}
.chat-window {
  max-height: 65vh;
  overflow-y: auto;
}
.ai-msg {
  background: #f0fdf4;
  border-radius: 18px;
  border-top-left-radius: 4px;
  padding: 8px 12px;
  max-width: 75%;
}
.user-msg {
  background: #dcf8c6;
  border-radius: 18px;
  border-top-right-radius: 4px;
  padding: 8px 12px;
  max-width: 75%;
  margin-left: auto;
}
</style>
