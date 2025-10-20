<template>
  <v-container class="pa-6" fluid>
    <Snackbar :SnackBarComponent="SnackBarComponent" />
    <v-alert type="success" class="mb-6 mt-n4 rounded-lg" color="#eff9fa">
      <template v-slot:prepend>
        <v-avatar rounded="lg" color="#dcfce7" size="65" class="mr-3">
          <v-icon size="50" color="#1ea650">mdi-account-outline</v-icon>
        </v-avatar>
      </template>
      <div>
        <strong class="text-black font-weight-bold text-h6"
          >Your Profile</strong
        >
        <div class="text-body-2 text-grey-darken-1">
          Complete your profile to help employers get to know you better. Add a
          voice introduction to stand out!
        </div>
      </div>
    </v-alert>

    <div class="d-flex align-center justify-center">
      <div style="position: relative; display: inline-block">
        <v-avatar size="140" class="elevation-2">
          <template v-if="form.user_profile_picture_preview">
            <v-img
              :src="form.user_profile_picture_preview"
              alt="Profile Picture"
              cover
              contain
              :aspect-ratio="16 / 9"
              class="rounded-circle"
              style="object-fit: contain; background: white"
            />
          </template>
          <template v-else>
            <v-icon size="80" color="blue">mdi-account</v-icon>
          </template>
        </v-avatar>

        <!-- Pencil Icon Overlay (centered bottom) -->
        <v-btn
          icon
          color="#1ea650"
          size="x-small"
          class="elevation-2"
          style="
            position: absolute;
            bottom: 100px;
            right: -40%;
            transform: translateX(-140%);
          "
          @click="triggerFileInput"
        >
          <v-icon size="18">mdi-pencil</v-icon>
        </v-btn>

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onFileChange"
        />
      </div>
    </div>

    <!-- Form Section -->
    <v-form ref="ProfileForm">
      <v-row class="mt-2">
        <v-col cols="12" md="6">
          <div class="text-caption">Name <span class="text-red">*</span></div>
          <v-text-field
            v-model="form.name"
            placeholder="Enter your name"
            variant="outlined"
            density="compact"
            rounded="lg"
            prepend-inner-icon="mdi-account-outline"
            hide-details="auto"
            persistent-hint
            hint="What you would like to be addressed as"
            :rules="[rules.required]"
          />
        </v-col>

        <v-col cols="12" md="6">
          <div class="text-caption">Email <span class="text-red">*</span></div>
          <v-text-field
            v-model="form.Email"
            rounded="lg"
            disabled
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-email-outline"
            hide-details="auto"
          />
        </v-col>
      </v-row>

      <v-row class="mt-n2">
        <v-col cols="12" md="6">
          <div class="text-caption">City <span class="text-red">*</span></div>
          <v-text-field
            v-model="form.city"
            rounded="lg"
            placeholder="Enter your city"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-map-marker-outline"
            hide-details="auto"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-caption">
            Country <span class="text-red">*</span>
          </div>
          <v-select
            v-model="form.country"
            :items="Countries"
            rounded="lg"
            placeholder="Select your country"
            variant="outlined"
            density="compact"
            item-title="name"
            item-value="name"
            prepend-inner-icon="mdi-earth"
            hide-details="auto"
            :rules="[rules.required]"
          />
        </v-col> </v-row
    ></v-form>

    <v-divider class="my-6" />

    <v-card color="#f8fafc" rounded="lg" class="mt-2 elevation-0 cardOutline">
      <div
        v-if="audioState === 'idle' && !Current_User.audio_profile"
        class="text-center my-4"
      >
        <h3 class="heading mb-2">Audio Profile</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Record a short introduction about yourself (max 3 minutes). Tell
          employers about your experience, skills, and what you're looking for.
        </p>

        <v-avatar rounded="xl" color="#dcfce7" size="70">
          <v-icon color="#1ea650" size="x-large">mdi-microphone-outline</v-icon>
        </v-avatar>
        <div class="mt-2 text-grey-darken-1">No audio recorded yet</div>
        <v-btn
          rounded="lg"
          dark
          color="#1ea650"
          height="50px"
          class="mt-3 elevation-0"
          @click="startRecording"
        >
          <v-icon>mdi-microphone-outline</v-icon>
          Start Recording
        </v-btn>
      </div>
      <div v-else-if="audioState === 'recording'" class="text-center my-4">
        <v-avatar rounded="lg" color="#fbedee" size="70">
          <v-icon color="red" size="x-large">mdi-microphone-outline</v-icon>
        </v-avatar>

        <div class="fontsize15px mt-3">Recording...</div>

        <div class="mt-3 fontsize25px font-weight-bold text-red">
          {{ formattedTime }} / 3:00
        </div>

        <v-btn
          color="red"
          rounded="lg"
          height="50px"
          class="mt-2 text-capitalize elevation-0"
          @click="stopRecording"
        >
          <span class="fontsize12px">Stop Recording</span>
        </v-btn>
      </div>

      <div
        v-else-if="audioState === 'recorded' || Current_User.audio_profile"
        class="my-4"
      >
        <v-card color="#f9fafb" rounded="lg" class="pa-4 mt-n3 elevation-0">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-avatar rounded="lg" color="#dcfce7" size="45" class="mr-3">
                <v-icon color="#1ea650">mdi-microphone</v-icon>
              </v-avatar>
              <div>
                <div class="font-weight-bold text-green-darken-2">
                  Audio Profile Recorded
                </div>
                <div class="fontsize12px text-grey-darken-1">
                  Duration:
                  {{ audioState === "recorded" ? formattedTime : "Uploaded" }}
                </div>
              </div>
            </div>

            <v-icon @click="deleteRecording" color="red"
              >mdi-delete-outline</v-icon
            >
          </div>

          <div class="d-flex justify-space-between align-center mt-8">
            <v-btn
              color="green-darken-4"
              class="flex-grow-1 mr-2"
              rounded="lg"
              @click="togglePlay"
            >
              <v-icon left>{{ isPlaying ? "mdi-pause" : "mdi-play" }}</v-icon>
              {{ isPlaying ? "Pause" : "Play" }}
            </v-btn>

            <v-btn
              color="green"
              class="flex-grow-1 ml-2"
              rounded="lg"
              @click="reRecord"
            >
              <v-icon left>mdi-microphone</v-icon>
              Re-record
            </v-btn>
          </div>
        </v-card>
      </div>

      <div v-if="Current_User.audio_profile">
        <v-row class="ml-3">
          <v-col cols="12">
            <audio
              ref="recordedAudio"
              :src="`https://intervwd-files.s3.us-east-1.amazonaws.com/${Current_User.audio_profile}`"
              class="mt-2"
              @play="onPlay"
              @pause="onPause"
              @ended="onPause"
              @loadedmetadata="setDuration"
            ></audio>
          </v-col>
        </v-row>
      </div>
    </v-card>

    <!-- <v-card color="#f0fdf4" rounded="lg" class="mt-8 elevation-0 cardOutline">
      <div class="text-left mt-4 mb-4">
        <div class="mt-2 text-primary ml-2 font-weight-bold">
          Welcome to Intervwd!
        </div>
        <div class="mt-2 mx-2 text-green-darken-1">
          Your job seeker account is completely free. Start showcasing your
          skills through AI-powered voice interviews.
        </div>
      </div>
    </v-card> -->

    <div class="mt-6 text-right">
      <v-btn
        color="#1ea650"
        :loading="loading"
        size="large"
        @click.stop="validateProfileMethod()"
      >
        <v-icon left class="mr-1">mdi-content-save-outline</v-icon>
        Save Profile
      </v-btn>
    </div>
    <!-- test -->
  </v-container>
</template>

<script>
import { CommonUploadFile } from "@/Mixins/Extras/UploadImageUrl.js";
import { ListTopUpCreditFunction } from "@/Mixins/Credits/ListTopUpCredit.js";
import Snackbar from "@/components/Extras/SnackBar.vue";
import CountriesList from "@/JSONFiles/CountryDialCode.json";
import { getCurrentUserDetailsfile } from "@/Mixins/GetCurrentUser.js";
import { UdpateMyDetails } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export default {
  components: {
    Snackbar,
  },
  mixins: [
    CommonUploadFile,
    ListTopUpCreditFunction,
    getCurrentUserDetailsfile,
  ],
  data() {
    return {
      form: {
        name: "",
        Email: "",
        city: "",
        country: "",
        audio: null,
        user_profile_picture: null,
      },
      Countries: [],
      audioState: "idle",
      recordingTime: 0,
      formattedTime: "0:00",
      recordingInterval: null,
      mediaRecorder: null,
      micStream: null,
      recordedChunks: [],
      recordedBlob: null,
      recordedUrl: null,
      audioPlayer: null,
      Current_User: {},
      loading: false,
      SnackBarComponent: {},
      rules: {
        required: (v) => !!v || "",
        email: (v) =>
          /.+@.+\..+/.test(v) || "Please enter a valid email address",
      },
      isPlaying: false,
    };
  },
  mounted() {
    this.Countries = CountriesList;
    this.Current_User = this.$store.getters.get_currentuser_details;

    this.form.name = this.Current_User.user_name;
    this.form.Email = this.Current_User.user_email_id;
    this.form.city = this.Current_User.user_city;
    this.form.country = this.Current_User.user_country;
    if (this.Current_User.user_profile_picture) {
      this.form.user_profile_picture_preview = `https://intervwd-files.s3.us-east-1.amazonaws.com/${this.Current_User.user_profile_picture}`;
    }
    if (this.Current_User.audio_profile) {
      this.audioState = "recorded";
    }
  },
  methods: {
    setDuration(event) {
      const duration = event.target.duration; // in seconds
      if (!isNaN(duration)) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60)
          .toString()
          .padStart(2, "0");
        this.formattedTime = `${minutes}:${seconds}`;
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.form.user_profile_picture = file;
        this.form.user_profile_picture_preview = URL.createObjectURL(file);
      }
    },
    togglePlay() {
      // if already playing, pause it
      if (this.isPlaying && this.audioPlayer) {
        this.audioPlayer.pause();
        this.isPlaying = false;
        return;
      }

      // determine source
      let src = null;
      if (this.recordedUrl) {
        src = this.recordedUrl; // new recording
      } else if (this.Current_User.audio_profile) {
        src = `https://intervwd-files.s3.us-east-1.amazonaws.com/${this.Current_User.audio_profile}`;
      }

      if (!src) return;

      // create player if not exists
      if (!this.audioPlayer) {
        this.audioPlayer = new Audio(src);
        this.audioPlayer.addEventListener("ended", () => {
          this.isPlaying = false;
        });
        this.audioPlayer.addEventListener("pause", () => {
          this.isPlaying = false;
        });
        this.audioPlayer.addEventListener("play", () => {
          this.isPlaying = true;
        });
      } else {
        // reset src if changed
        if (this.audioPlayer.src !== src) {
          this.audioPlayer.pause();
          this.audioPlayer.currentTime = 0;
          this.audioPlayer = new Audio(src);
        }
      }

      this.audioPlayer.play();
      this.isPlaying = true;
    },
    onPlay() {
      this.isPlaying = true;
    },
    onPause() {
      this.isPlaying = false;
    },
    reRecord() {
      this.$refs.audioPlayer.pause();
      this.isPlaying = false;
    },
    async validateProfiledetails() {
      const valid = await this.$refs.ProfileForm.validate();
      if (valid.valid) {
        this.validateProfileMethod();
      } else {
        console.log("invalid");
        this.SnackBarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          timeout: 2000,
          SnackbarText: "Please enter valid details",
        };
      }
    },

    async validateProfileMethod() {
      try {
        this.loading = true;
        let UploadedResult, UploadedPicResult;

        if (this.form.audio) {
          console.log("Uploading audio file:", this.form.audio);

          const fileExt = this.form.audio.name.split(".").pop();
          const filePath = `ProfileAudio/${new Date().getTime()}.${fileExt}`;

          UploadedResult = await this.CommonUploadFileMethod(
            filePath,
            this.form.audio
          );

          console.log("Uploaded audio result:", UploadedResult);
        }

        if (this.form.user_profile_picture) {
          const fileExt = this.form.user_profile_picture.name.split(".").pop();
          const filePath = `ProfilePics/${new Date().getTime()}.${fileExt}`;
          UploadedPicResult = await this.CommonUploadFileMethod(
            filePath,
            this.form.user_profile_picture
          );
        }
        let inputParams = {
          user_id: this.Current_User.user_id,
          user_name: this.form.name,
          user_city: this.form.city,
          user_country: this.form.country,
          audio_profile: UploadedResult ? UploadedResult.key : undefined,
          user_profile_picture: UploadedPicResult
            ? UploadedPicResult.key
            : undefined,
        };
        let result = await client.graphql({
          query: UdpateMyDetails,
          variables: { input: inputParams },
        });
        let ResultObj = JSON.parse(result.data.UdpateMyDetails);
        if (ResultObj.status == "Success") {
          this.SnackBarComponent = {
            SnackbarVmodel: true,
            SnackbarColor: "green",
            SnackbarText: "Profile Updated Successfully",
          };
          this.getCurrentUserDetailsMethod();
        }
        this.loading = false;
        console.log("result", result);
      } catch (error) {
        this.loading = false;
        console.log("error", error);
      }
    },
    async startRecording() {
      this.cleanupAudio();
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch (e) {
        alert("Microphone permission denied.");
        return;
      }

      this.mediaRecorder = new MediaRecorder(this.micStream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        this.recordedBlob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || "audio/webm",
        });
        if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
        this.recordedUrl = URL.createObjectURL(this.recordedBlob);

        this.form.audio = new File([this.recordedBlob], "intro.webm", {
          type: this.recordedBlob.type,
        });
      };

      this.recordingTime = 0;
      this.updateFormattedTime();
      this.audioState = "recording";
      this.mediaRecorder.start();

      this.recordingInterval = setInterval(() => {
        if (this.recordingTime >= 180) {
          this.stopRecording();
          return;
        }
        this.recordingTime += 1;
        this.updateFormattedTime();
      }, 1000);
    },

    stopRecording() {
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      this.stopMicTracks();
      this.audioState = "recorded";
    },

    playAudio() {
      if (!this.recordedUrl) return;
      if (!this.audioPlayer) this.audioPlayer = new Audio(this.recordedUrl);
      else {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.audioPlayer.src = this.recordedUrl;
      }
      this.audioPlayer.play();
    },

    reRecord() {
      if (this.audioPlayer) {
        this.audioPlayer.pause();
        this.audioPlayer = null;
      }
      this.audioState = "idle";
      this.recordingTime = 0;
      this.updateFormattedTime();
      this.form.audio = null;
      this.Current_User.audio_profile = null;
    },

    deleteRecording() {
      this.reRecord();
      this.recordedChunks = [];
      this.recordedBlob = null;
      if (this.recordedUrl) {
        URL.revokeObjectURL(this.recordedUrl);
        this.recordedUrl = null;
      }
    },

    updateFormattedTime() {
      const s = Math.max(0, Number(this.recordingTime) || 0);
      const m = Math.floor(s / 60);
      const sec = String(s % 60).padStart(2, "0");
      this.formattedTime = `${m}:${sec}`;
    },

    stopMicTracks() {
      if (this.micStream) {
        this.micStream.getTracks().forEach((t) => t.stop());
        this.micStream = null;
      }
    },

    cleanupAudio() {
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      this.stopMicTracks();
      if (this.audioPlayer) {
        this.audioPlayer.pause();
        this.audioPlayer = null;
      }
    },
    playAudioFile() {
      if (this.form.audio && this.recordedUrl) {
        if (!this.audioPlayer) this.audioPlayer = new Audio(this.recordedUrl);
        else {
          this.audioPlayer.pause();
          this.audioPlayer.currentTime = 0;
          this.audioPlayer.src = this.recordedUrl;
        }
        this.audioPlayer.play();
      } else if (this.Current_User.audio_profile) {
        const existingAudio = new Audio(
          `https://intervwd-files.s3.us-east-1.amazonaws.com/${this.Current_User.audio_profile}`
        );
        existingAudio.play();
      }
    },
  },
};
</script>

<style scoped>
.red--text {
  color: #dc2626 !important;
}
.gap-4 {
  gap: 16px;
}
</style>
