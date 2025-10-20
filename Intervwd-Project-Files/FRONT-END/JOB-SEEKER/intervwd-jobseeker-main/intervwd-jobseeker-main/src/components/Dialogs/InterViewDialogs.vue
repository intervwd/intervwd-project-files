<template>
  <div class="text-center">
    <Snackbar :SnackBarComponent="SnackBarComponent" />
    <v-dialog :model-value="InterViewDialog" fullscreen opacity="0.9">
      <TermsAndConditionsDialog
        :TermsAndConditionsDialog="TermsAndConditionsDialog"
        @clicked="termsAndConditionsEmit"
      />
      <v-toolbar color="transparent">
        <v-spacer />
        <v-btn
          v-if="InterViewStarted == false"
          icon
          variant="text"
          color="white"
          @click="InterViewDialogEmit"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <div align="center">
        <v-card
          color="white"
          class="mt-n2 elevation-0"
          width="1200px"
          min-height="600px"
          rounded="lg"
        >
          <div class="d-flex ml-3 mt-3">
            <div class="fontsize20px font-weight-bold">
              {{ ActionObj.job_title }}
              <span class="fontsize15px font-weight-medium ml-1 mt-2"
                >({{ ActionObj.company_name }})</span
              >
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

            <v-spacer />
            <div
              v-if="isInterviewing"
              class="text-h6 font-weight-bold text-green ml-2"
            >
              <v-icon size="x-small">mdi-timer-outline</v-icon>
              {{ timeRemaining }}
            </div>

            <v-spacer />
            <div class="mr-4 mb-2">
              <v-btn
                color="green"
                height="40px"
                class="text-capitalize elevation-0"
                @click="sendToIframe('start')"
                v-if="
                  !isInterviewing &&
                  InterViewDetails &&
                  Object.keys(InterViewDetails).length > 0
                "
                ><span class="fontsize14px FontWeight400"
                  >Start Interview</span
                ></v-btn
              >
              <v-btn
                color="red"
                @click="sendToIframe('stop')"
                height="40px"
                class="text-capitalize elevation-0"
                v-if="isInterviewing"
                :loading="StopLoading"
                ><span class="fontsize14px FontWeight400"
                  >Stop Interview</span
                ></v-btn
              >
            </div>
          </div>
          <v-divider class="mt-3" />
          <v-progress-linear
            v-if="isInterviewing"
            :model-value="progressPercent"
            height="8"
            color="green"
            striped
            rounded
          ></v-progress-linear>

          <!-- v-if="InterViewDetails && Object.keys(InterViewDetails).length > 0" -->
          <iframe
            v-if="InterViewDetails && Object.keys(InterViewDetails).length > 0"
            ref="myIframe"
            :height="height"
            width="1200px"
            class="mt-4"
            src="https://nova.intervwd.com/"
            allow="microphone"
          ></iframe>
          <div
            v-if="
              InterruptInterview ==
              'You do not have enough credits to attend this meeting. Please recharge your credits and try again.'
            "
            class="mt-16 align-center justify-center text-center"
          >
            <v-icon size="120" color="red">mdi-close-octagon-outline</v-icon>
            <div class="fontsize25px mx-3 mt-8 text-center">
              You do not have enough credits to attend this meeting. Please
              recharge your credits and try again.
            </div>
          </div>
        </v-card>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import { CreateInterviewFunction } from "@/Mixins/Findjobs/CreateInterView.js";
import TermsAndConditionsDialog from "@/components/Dialogs/TermsandConditions.vue";
import { UpdateInterviewAudioDetailsFunction } from "@/Mixins/InterView/UpdateInterViewDetails.js";
import { CommonUploadFile } from "@/Mixins/Extras/UploadImageUrl.js";
import { InprogressInterviewUpdateFunction } from "@/Mixins/InterView/InProgressInterview.js";
import Snackbar from "@/components/Extras/SnackBar.vue";

export default {
  props: {
    InterViewDialog: Boolean,
    ActionObj: Object,
  },
  components: {
    Snackbar,
    TermsAndConditionsDialog,
  },

  mixins: [
    CreateInterviewFunction,
    UpdateInterviewAudioDetailsFunction,
    CommonUploadFile,
    InprogressInterviewUpdateFunction,
  ],
  data() {
    return {
      isInterviewing: false,
      chatMessages: [],
      timeRemaining: 300, // 5 minutes
      timer: null,
      micStream: null,
      mediaRecorder: null,
      audioChunks: [],
      silenceTimer: null,
      confirmStop: false,
      StopLoading: false,
      TermsAndConditionsDialog: false,
      recognition: null,
      recordedBlob: null,
      recordedUrl: null,
      recordedFile: null,
      recordingTime: 0,
      recordingInterval: null,
      liveTranscript: "",
      systemPrompt: "",
      InterViewDetails: {},
      height: 0,
      recordedAudio: null,
      SnackBarComponent: {},
      InterViewStarted: false,
      InterruptInterview: "",
    };
  },
  computed: {
    progressPercent() {
      return ((300 - this.timeRemaining) / 300) * 100;
    },
  },
  watch: {
    async InterViewDialog(newVal) {
      if (newVal == true) {
        this.TermsAndConditionsDialog = true;
        this.height = window.innerHeight - 230;
        window.addEventListener("message", this.handleIframeMessage);
        await this.getPromptsdetails();
      }
    },
  },
  methods: {
    async getPromptsdetails() {
      this.InterViewDetails = await this.CreateInterviewMethod(
        this.ActionObj.jd_id
      );
    },
    async sendToIframe(action) {
      const iframe = this.$refs.myIframe;
      if (iframe && iframe.contentWindow) {
        // Send a clean copy of interview details to the iframe
        const cleanDetails = JSON.parse(JSON.stringify(this.InterViewDetails));
        iframe.contentWindow.postMessage(
          { action, data: cleanDetails },
          "https://nova.intervwd.com/"
        );
      }

      if (action === "start") {
        // ✅ Check if microphone is available
        const micOn = await this.checkMicrophoneAccess();
        if (!micOn) {
          this.SnackBarComponent = {
            SnackbarVmodel: true,
            SnackbarColor: "red",
            SnackbarText:
              "Microphone is disabled. Please enable mic access to start.",
          };
          return;
        }

        this.isInterviewing = true;
        this.startTimer();
        await this.startRecording();
        await this.InprogressInterviewUpdateMethod(
          this.InterViewDetails.interview_id
        );
      } else if (action === "stop") {
        // Stop timer immediately on button click
        this.stopTimer();
        // Set UI state immediately
        this.stopRecording(); // This will trigger the recording to save and upload
      }
    },

    startTimer() {
      this.timeRemaining = 300;
      this.timer = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
        } else {
          // Time's up, automatically stop recording
          this.stopTimer();
          this.sendToIframe("stop"); // Trigger the stop sequence
        }
      }, 1000);
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    // --- Recording Management ---
    async startRecording() {
      this.cleanupAudio(); // reset any previous audio
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch (e) {
        alert("Microphone permission denied.");
        return;
      }

      this.mediaRecorder = new MediaRecorder(this.micStream);
      this.audioChunks = []; // Use audioChunks for consistency in naming with old code

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size) this.audioChunks.push(e.data); // Use audioChunks
      };

      this.mediaRecorder.onstop = () => {
        this.recordedBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || "audio/webm",
        });

        if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
        this.recordedUrl = URL.createObjectURL(this.recordedBlob);

        this.recordedFile = new File(
          [this.recordedBlob],
          `interview_${Date.now()}.webm`,
          {
            type: this.recordedBlob.type,
          }
        );

        // Stop mic tracks cleanly
        this.stopMicTracks();

        console.log("✅ Audio ready, initiating upload...");
        this.endInterview();
      };

      // Start recording and interval for time tracking
      this.mediaRecorder.start();

      this.recordingTime = 0;
      if (this.recordingInterval) clearInterval(this.recordingInterval);
      this.recordingInterval = setInterval(() => {
        this.recordingTime += 1;
      }, 1000);

      console.log("🎙️ Recording started...");
    },

    stopRecording() {
      try {
        this.StopLoading = true;
        if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
          this.mediaRecorder.stop();
        }

        if (this.recognition) {
          this.recognition.stop();
        }

        if (this.recordingInterval) {
          clearInterval(this.recordingInterval);
          this.recordingInterval = null;
        }

        this.StopLoading = false;
        console.log("🛑 Recording process initiated stop...");
      } catch (error) {
        this.StopLoading = false;
        console.log(error);
      }
    },

    // --- Interview Completion (API calls) ---
    async endInterview() {
      this.StopLoading = true;
      if (!this.recordedFile) {
        console.error("No audio file to upload.");
        return;
      }

      console.log("Uploading audio file:", this.recordedFile);

      const fileExt = this.recordedFile.name.split(".").pop();
      const filePath = `interview_audio_files/${this.ActionObj.organization_id}/${this.$store.getters.get_currentuser_details.user_id}.${fileExt}`;

      try {
        const UploadedResult = await this.CommonUploadFileMethod(
          filePath,
          this.recordedFile
        );

        const timeTaken = this.recordingTime;
        await this.UpdateInterviewAudioDetailsMethod(
          this.InterViewDetails.interview_id,
          timeTaken,
          UploadedResult.key
        );

        console.log("✅ Interview ended and uploaded:", UploadedResult);
        this.SnackBarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "green",
          SnackbarText: "Interview Completed and results submitted!",
        };
        this.StopLoading = false;
      } catch (error) {
        this.StopLoading = false;
        console.error("Error during interview upload/update:", error);
      }
    },

    async checkMicrophoneAccess() {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({
            name: "microphone",
          });
          if (result.state === "granted") return true;
          if (result.state === "denied") return false;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop()); // close immediately
        return true;
      } catch (err) {
        console.error("Microphone access error:", err);
        this.SnackBarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          SnackbarText:
            "Microphone is disabled. Please enable mic access to start.",
        };
        return false;
      }
    },

    // --- Cleanup Methods ---
    stopMicTracks() {
      if (this.micStream) {
        this.micStream.getTracks().forEach((track) => track.stop());
        this.micStream = null;
      }
    },
    cleanupAudio() {
      if (this.recordedUrl) {
        URL.revokeObjectURL(this.recordedUrl);
        this.recordedUrl = null;
      }
      this.audioChunks = [];
      this.recordedBlob = null;
      this.recordedFile = null;
    },

    handleIframeMessage(event) {
      if (event.origin !== "https://nova.intervwd.com") return;

      console.log("Message from iframe:", event.data);

      if (event.data.action === "interviewCompleted") {
        this.sendToIframe("stop");
        this.SnackBarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "green",
          SnackbarText: "Interview Completed!",
        };
      }
    },
    InterViewDialogEmit(Toggle) {
      this.stopTimer();
      this.stopRecording();
      this.isInterviewing = false;
      this.confirmStop = false;
      this.liveTranscript = "";
      this.InterViewStarted = false;
      this.InterruptInterview = "";
      this.$emit("clicked", Toggle);
    },
    addMessage(sender, text) {
      this.chatMessages.push({ sender, text });
      this.$nextTick(() => {
        const container = this.$el.querySelector(".chat-window");
        if (container) container.scrollTop = container.scrollHeight;
      });
    },
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
      // Only start recognition if the interview starts via 'start' button
      // this.recognition.start();
    },
    termsAndConditionsEmit() {
      this.TermsAndConditionsDialog = false;
    },
  },
};
</script>
