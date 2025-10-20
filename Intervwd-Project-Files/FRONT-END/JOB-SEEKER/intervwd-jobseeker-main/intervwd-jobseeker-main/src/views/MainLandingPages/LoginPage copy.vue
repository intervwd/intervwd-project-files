<template>
  <div class="auth-page">
    <Snackbar :SnackBarComponent="SnackBarComponent" />
    <v-container class="login-container" fluid>
      <v-row class="full-height d-flex align-center justify-center" no-gutters>
        <v-col
          cols="12"
          :md="SignUp_Pending == true ? '6' : '4'"
          :lg="SignUp_Pending == true ? '6' : '4'"
          class="px-8"
        >
          <v-card class="elevation-6" rounded="xl">
            <div class="text-left mt-5 ml-2">
              <v-btn
                variant="plain"
                class="text-capitalize"
                @click.stop="
                  SignUp_Pending == true
                    ? (SignUp_Pending = false)
                    : routeToLanding()
                "
                ><v-icon class="mr-1">mdi-arrow-left</v-icon>Back</v-btn
              >
            </div>
            <div class="text-center mt-5">
              <v-avatar size="70" rounded="lg" color="#dcfce7"
                ><v-icon color="#1ca54e" size="40"
                  >mdi-account-outline</v-icon
                ></v-avatar
              >
              <div class="mt-5 text-3xl">Job Seeker Account</div>
              <h5 class="mt-1 text-2sm">
                {{
                  showOTP == true
                    ? "Enter the verification code sent to your email"
                    : SignUp_Pending == true
                    ? "Create your account"
                    : "Enter your email to get started - it's free!"
                }}
              </h5>
            </div>
            <div v-if="!showOTP && !SignUp_Pending" class="mx-2">
              <v-card-text>
                <div class="text-left mt-5">
                  <h4 class="mb-1 text-sm">Email Address</h4>
                </div>

                <v-form ref="EmailRef">
                  <v-text-field
                    v-model="form.email"
                    placeholder="abc@gmail.com"
                    rounded="lg"
                    density="compact"
                    prepend-inner-icon="mdi-email-outline"
                    variant="outlined"
                    :rules="[rules.required, rules.email]"
                  ></v-text-field
                ></v-form> </v-card-text
              ><v-card-actions class="mx-1"
                ><v-btn
                  variant="elevated"
                  height="50"
                  rounded="lg"
                  block
                  color="#1ca54e"
                  class="mt-n2 text-capitalize"
                  :loading="loading"
                  @click.stop="validateSignIn"
                  >Continue</v-btn
                ></v-card-actions
              >
              <div class="text-center mt-1 mb-3">
                Don't have an account?
                <v-btn
                  variant="text"
                  color="blue"
                  class="text-capitalize"
                  @click.stop="SignUp_Pending = true"
                  >Sign Up</v-btn
                >
              </div>
            </div>

            <div
              v-if="showOTP && !SignUp_Pending"
              class="text-center mt-8 text-2sm"
            >
              <div class="text-black">Code sent to {{ form.email }}</div>
              <v-otp-input
                v-model="form.password"
                class="otp-field styled-input"
                density="comfortable"
                required
              />
              <v-card-actions class="mx-3 mb-8"
                ><v-btn
                  variant="elevated"
                  height="50"
                  rounded="lg"
                  block
                  color="#1ca54e"
                  :loading="loading"
                  @click.stop="signInMethod('VERIFY_OTP')"
                  >Login</v-btn
                ></v-card-actions
              >
            </div>

            <div v-if="SignUp_Pending">
              <v-card-text>
                <v-form ref="SingUpRef">
                  <v-row>
                    <v-col cols="12" md="6" xs="12" sm="12">
                      <div class="text-left">
                        <h4 class="text-sm">Email Address *</h4>
                      </div>
                      <v-text-field
                        v-model="signUp.Email"
                        placeholder="abc@gmail.com"
                        rounded="lg"
                        density="compact"
                        prepend-inner-icon="mdi-email-outline"
                        variant="outlined"
                        :rules="[rules.required, rules.email]"
                      ></v-text-field> </v-col
                    ><v-col cols="12" md="6" xs="12" sm="12">
                      <div class="text-left">
                        <h4 class="text-sm">Name *</h4>
                      </div>
                      <v-text-field
                        v-model="signUp.Name"
                        placeholder="John Doe"
                        rounded="lg"
                        density="compact"
                        prepend-inner-icon="mdi-account-outline"
                        variant="outlined"
                        :rules="[rules.required]"
                      ></v-text-field> </v-col
                    ><v-col cols="12" md="6" xs="12" sm="12" class="mt-n8">
                      <div class="text-left">
                        <h4 class="text-sm">City *</h4>
                      </div>
                      <v-text-field
                        v-model="signUp.City"
                        placeholder="Bengaluru"
                        rounded="lg"
                        density="compact"
                        prepend-inner-icon="mdi-city"
                        variant="outlined"
                        item-title="name"
                        item-value="name"
                        :rules="[rules.required]"
                      ></v-text-field> </v-col
                    ><v-col cols="12" md="6" xs="12" sm="12" class="mt-n8">
                      <div class="text-left">
                        <h4 class="text-sm">Country *</h4>
                      </div>
                      <v-autocomplete
                        :items="CountryList"
                        v-model="signUp.Country"
                        placeholder="India"
                        rounded="lg"
                        density="compact"
                        prepend-inner-icon="mdi-navigation"
                        variant="outlined"
                        item-title="name"
                        item-value="name"
                        :rules="[rules.required]"
                      ></v-autocomplete
                    ></v-col>
                  </v-row>
                  <label class="font-weight-bold">
                    Profile Picture
                    <span class="text-grey-darken-1">(Optional)</span>
                  </label>

                  <div
                    v-if="!previewUrl"
                    class="upload-box d-flex flex-column align-center justify-center mt-2"
                    @click="triggerFileInput"
                  >
                    <v-icon size="36" color="grey">mdi-upload</v-icon>
                    <div class="mt-2 text-grey-darken-1">
                      Click to upload profile picture
                    </div>
                    <div class="text-caption text-grey">PNG, JPG up to 5MB</div>
                    <input
                      ref="fileInput"
                      type="file"
                      accept="image/png, image/jpeg"
                      class="d-none"
                      @change="handleFileUpload"
                    />
                  </div>

                  <div v-if="previewUrl" class="mt-3 text-center">
                    <img :src="previewUrl" alt="Preview" class="preview-img" />
                  </div>
                  <div class="fontsize15px mt-3">
                    Audio Profile
                    <span class="fontsize12px">(Optional, max 3 minutes)</span>
                  </div>
                  <span class="fontsize12px text-grey-darken-1"
                    >Record a short introduction about yourself to stand
                    out</span
                  >
                  <v-card color="#f8fafc" rounded="lg" class="mt-2">
                    <!-- <div v-if="!isRecording" class="text-center mt-4 mb-4">
                      <v-avatar rounded="xl" color="#dcfce7" size="70"
                        ><v-icon color="#1ea650" size="x-large"
                          >mdi-microphone-outline</v-icon
                        ></v-avatar
                      >
                      <div class="mt-2 text-grey-darken-1">
                        No audio recorded yet
                      </div>
                      <v-btn
                        rounded="lg"
                        dark
                        color="#1ea650"
                        class="mt-3"
                        @click="startRecording"
                        ><v-icon>mdi-microphone-outline</v-icon
                        ><span class="fontsize10px text-capitalize"
                          >Start Recording</span
                        ></v-btn
                      >
                    </div>
                    <div v-if="isRecording" class="text-center my-3">
                      <v-avatar rounded="lg" color="#fbedee" class="mt-3"
                        ><v-icon color="red" size="large"
                          >mdi-microphone-outline</v-icon
                        >
                      </v-avatar>

                      <div class="fontsize15px mt-3">Recording...</div>

                      <div class="mt-3 fontsize25px font-weight-bold text-red">
                        {{ formattedTime }} / 3:00
                      </div>
                      <v-btn
                        color="red"
                        @click="stopRecording"
                        class="mt-2 text-capitalize"
                        ><span class="fontsize12px">Stop Recording</span></v-btn
                      >
                    </div> -->
                    <div v-if="audioState === 'idle'" class="text-center my-4">
                      <v-avatar rounded="xl" color="#dcfce7" size="70">
                        <v-icon color="#1ea650" size="x-large"
                          >mdi-microphone-outline</v-icon
                        >
                      </v-avatar>
                      <div class="mt-2 text-grey-darken-1">
                        No audio recorded yet
                      </div>
                      <v-btn
                        rounded="lg"
                        dark
                        color="#1ea650"
                        class="mt-3"
                        @click="startRecording"
                      >
                        <v-icon>mdi-microphone-outline</v-icon>
                        <span class="fontsize10px text-capitalize"
                          >Start Recording</span
                        >
                      </v-btn>
                    </div>

                    <!-- Recording state -->
                    <div
                      v-else-if="audioState === 'recording'"
                      class="text-center my-4"
                    >
                      <v-avatar rounded="lg" color="#fbedee" size="70">
                        <v-icon color="red" size="x-large"
                          >mdi-microphone-outline</v-icon
                        >
                      </v-avatar>
                      <div class="fontsize15px mt-3">Recording...</div>
                      <div class="mt-3 fontsize25px font-weight-bold text-red">
                        {{ formattedTime }} / 3:00
                      </div>
                      <v-btn
                        color="red"
                        rounded="lg"
                        class="mt-2 text-capitalize"
                        @click="stopRecording"
                      >
                        <span class="fontsize12px">Stop Recording</span>
                      </v-btn>
                    </div>

                    <!-- Recorded state -->
                    <div v-else-if="audioState === 'recorded'" class="my-4">
                      <v-card
                        color="#f9fafb"
                        rounded="lg"
                        class="pa-4 elevation-0"
                      >
                        <!-- Header -->
                        <div class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center">
                            <v-avatar
                              rounded="lg"
                              color="#dcfce7"
                              size="45"
                              class="mr-3"
                            >
                              <v-icon color="#1ea650">mdi-microphone</v-icon>
                            </v-avatar>
                            <div>
                              <div class="font-weight-bold text-green-darken-2">
                                Audio Profile Recorded
                              </div>
                              <div class="fontsize12px text-grey-darken-1">
                                Duration: {{ formattedTime }}
                              </div>
                            </div>
                          </div>

                          <!-- Delete button -->
                          <v-btn
                            icon
                            color="error"
                            variant="flat"
                            @click="deleteRecording"
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </div>

                        <!-- Actions -->
                        <div
                          class="d-flex justify-space-between align-center mt-4"
                        >
                          <v-btn
                            color="green-darken-4"
                            class="flex-grow-1 mr-2"
                            rounded="lg"
                            @click="playAudio"
                          >
                            <v-icon left>mdi-play</v-icon>
                            Play
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
                  </v-card>

                  <v-card color="#f0fdf4" rounded="lg" class="mt-8">
                    <div class="text-left mt-4 mb-4">
                      <div class="mt-2 text-primary ml-2 font-weight-bold">
                        Welcome to Intervwd!
                      </div>
                      <div class="mt-2 mx-2 text-green-darken-1">
                        Your job seeker account is completely free. Start
                        showcasing your skills through AI-powered voice
                        interviews.
                      </div>
                    </div>
                  </v-card>
                </v-form>
              </v-card-text>

              <v-card-actions class="mx-3 mb-8"
                ><v-btn
                  variant="elevated"
                  height="50"
                  rounded="lg"
                  block
                  color="#1ca54e"
                  :loading="loading"
                  @click.stop="validateSignUp()"
                  >Sign Up</v-btn
                ></v-card-actions
              >
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import CountriesList from "@/JSONFiles/CountryDialCode.json";
import Snackbar from "@/components/Extras/SnackBar.vue";
import { signUp, signIn, confirmSignIn, signOut } from "aws-amplify/auth";
import { CommonUploadFile } from "@/Mixins/Extras/UploadImageUrl.js";

export default {
  components: {
    Snackbar,
  },
  mixins: [CommonUploadFile],
  data: () => ({
    showOTP: false,
    loading: false,
    StopLoading: false,
    SignUp_Pending: false,
    selectedFile: null,
    previewUrl: null,
    CountryList: [],
    SnackBarComponent: {},
    form: {
      email: "",
      password: "",
    },
    signUp: {
      Email: "",
      Name: "",
      City: "",
      Country: "",
    },
    rules: {
      required: (v) => !!v || "",
      email: (v) => /.+@.+\..+/.test(v) || "Please enter a valid email address",
    },
    audioState: "idle", // idle | recording | recorded
    recordingTime: 0,
    formattedTime: "0:00",
    recordingInterval: null,
    mediaRecorder: null,
    micStream: null,
    recordedChunks: [],
    recordedBlob: null,
    recordedUrl: null,
    audioPlayer: null,
  }),
  async mounted() {
    this.CountryList = CountriesList;
    this.signUp.Country = await this.getCurrentCountry();
  },
  beforeUnmount() {
    this.cleanupAudio();
    if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
  },
  methods: {
    routeToLanding() {
      window.location.href = "https://ai-interview-ui-prot-2u8q.bolt.host/";
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

        // ✅ Store as File in signUp.audioProfile
        this.signUp.audioProfile = new File([this.recordedBlob], "intro.webm", {
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
      this.signUp.audioProfile = null;
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

    async validateSignIn() {
      const valid = await this.$refs.EmailRef.validate();
      if (valid.valid) {
        console.log("valid");
        this.signInMethod(this.showOTP ? "VERIFY_OTP" : "SEND_OTP");
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

    async validateSignUp() {
      const { valid } = await this.$refs.SingUpRef.validate();
      if (valid) {
        this.signUpMethod();
      } else {
        this.SnackBarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          timeout: 2000,
          SnackbarText: `Please fill mandatory fields`,
        };
      }
    },

    async signInMethod(action) {
      switch (action) {
        case "SEND_OTP":
          try {
            if (this.StopLoading == false) {
              this.loading = true;
            }
            this.user = await signIn({
              username: this.form.email.toLowerCase(),
              options: {
                authFlowType: "CUSTOM_WITHOUT_SRP",
              },
            });
            console.log("this.user", this.user);
            if (
              this.user.nextStep.signInStep ==
                "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE" &&
              this.StopLoading == false
            ) {
              this.SnackBarComponent = {
                SnackbarVmodel: true,
                SnackbarColor: "green",
                timeout: 2000,
                SnackbarText: `Verification OTP sent to ${this.form.email.toLocaleLowerCase()}`,
              };

              // this.counter = 60;
              setTimeout(() => {
                this.showOTP = true;
                this.loading = false;
                // this.StopLoading = false;
                // this.startCountdown();
              }, 1000);
              this.$forceUpdate();
            }
          } catch (error) {
            console.log("erro", error);
            if (error.message == "There is already a signed in user.") {
              if (this.StopLoading == false) {
                this.loading = true;
              }
              await signOut({ global: true });
              this.signInMethod("SEND_OTP");
            } else if (
              error.message ==
              "VerifyAuthChallengeResponse failed with error Incorrect OTP!!."
            ) {
              this.showOTP = false;
              this.loading = false;
              this.SnackBarComponent = {
                SnackbarVmodel: true,
                SnackbarColor: "red",
                timeout: 2000,
                SnackbarText: error.message,
              };
            } else {
              console.log("error", error);
              this.loading = false;
              if (
                error.message ==
                "DefineAuthChallenge failed with error Error: NOT_AUTHORIZED : Kindly Sigup."
              ) {
                // this.signUpMethod();
                this.SignUp_Pending = true;
                this.SnackBarComponent = {
                  SnackbarVmodel: true,
                  SnackbarColor: "red",
                  timeout: 2000,
                  SnackbarText: "User does not exist, Kindly Sign Up",
                };
              } else {
                this.SnackBarComponent = {
                  SnackbarVmodel: true,
                  SnackbarColor: "red",
                  timeout: 2000,
                  SnackbarText: error.message,
                };
              }
            }
          }
          break;
        case "VERIFY_OTP":
          try {
            this.loading = true;
            console.log("coming In");
            await confirmSignIn({ challengeResponse: this.form.password })
              .then((res) => {
                this.SnackBarComponent = {
                  SnackbarVmodel: true,
                  SnackbarColor: "green",
                  SnackbarText: "Login Successfull",
                };
                console.log("res", res);
                console.log("yes", this.form.email);
                this.IsOTPFieldEnabled = false;
                // this.IsSessionLoggedOut = false;
                localStorage.setItem("IsLoggedOut", "false");
                this.$store.commit("SET_USER_MAIL", this.form.email);
                this.loading = false;
                setTimeout(() => {
                  this.ActivateMethod();
                }, 1000);
              })
              .catch((err) => {
                if (err) {
                  // this.counter = 0;
                  this.form.password = "";
                  this.showOTP = false;
                }
                if (
                  err.message ==
                  "VerifyAuthChallengeResponse failed with error Incorrect OTP!!."
                ) {
                  this.SnackBarComponent = {
                    SnackbarVmodel: true,
                    SnackbarColor: "red",
                    SnackbarText: "Incorrect OTP",
                  };
                } else {
                  this.SnackBarComponent.SnackbarVmodel = false;
                  this.SnackBarComponent = {
                    SnackbarVmodel: true,
                    SnackbarColor: "red",
                    SnackbarText: err.message,
                  };
                }
                this.OTPErrorMessage = err.message;
                this.loading = false;
              });
          } catch (error) {
            console.log("err", error);
            if (
              error.message ==
              "VerifyAuthChallengeResponse failed with error Incorrect OTP!!."
            ) {
              this.showOTP = false;
              this.loading = false;
              this.SnackBarComponent = {
                SnackbarVmodel: true,
                SnackbarColor: "red",
                timeout: 2000,
                SnackbarText: "Incorrect OTP",
              };
            }
          }
          break;
        case "RESEND_OTP":
          try {
            this.user = await signIn({
              username: this.Login.email_id.toLocaleLowerCase(),
              options: {
                authFlowType: "CUSTOM_WITHOUT_SRP",
              },
            });
            if (
              this.user.nextStep.signInStep ==
              "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE"
            ) {
              this.SnackBarComponent = {
                SnackbarVmodel: true,
                SnackbarColor: "green",
                timeout: 2000,
                SnackbarText: `Verification OTP sent to ${this.Login.email_id.toLocaleLowerCase()}`,
              };

              // this.counter = 60;
              setTimeout(() => {
                this.showOTP = true;
                this.loading = false;
              }, 1000);
              // this.startCountdown();

              this.$forceUpdate();
            }
          } catch (error) {
            console.log("erro", error);
            if (error.message == "There is already a signed in user.") {
              this.loading = true;
              await signOut({ global: true });
              this.signInMethod("SEND_OTP");
            } else {
              this.loading = false;
              this.SnackBarComponent = {
                SnackbarVmodel: true,
                SnackbarColor: "red",
                timeout: 2000,
                SnackbarText: error.message,
              };
            }
          }
          break;
      }
    },

    async signUpMethod() {
      try {
        this.loading = true;
        // let UploadedResult;

        // if (this.signUp.audioProfile) {
        //   console.log("Uploading audio file:", this.signUp.audioProfile);

        //   const fileExt = this.signUp.audioProfile.name.split(".").pop();
        //   const filePath = `ProfileAudio/${new Date().getTime()}.${fileExt}`;

        //   UploadedResult = await this.CommonUploadFileMethod(
        //     filePath,
        //     this.signUp.audioProfile // send File instead of recordedUrl
        //   );

        //   console.log("Uploaded audio result:", UploadedResult);
        // }
        let response = await signUp({
          username: this.signUp.Email.replace(/\s/g, "").toLowerCase(),
          password: "intervwd@123",
          options: {
            userAttributes: {
              "custom:user_name": this.signUp.Name,
              "custom:user_city": this.signUp.City,
              "custom:user_country": this.signUp.Country,
            },
          },
        });
        console.log("response", response);
        if (response.nextStep.signUpStep == "DONE") {
          this.StopLoading = true;
          this.showOTP = true;
          this.SnackBarComponent = {
            SnackbarVmodel: true,
            SnackbarColor: "green",
            SnackbarText: "OTP sent to " + this.signUp.Email,
          };
          this.form.email = this.signUp.Email;
          this.SignUp_Pending = false;
          await this.signInMethod("SEND_OTP");
        }
        this.loading = false;
      } catch (error) {
        console.log("error while Signing Up", error);
        this.loading = false;
      }
    },
    ActivateMethod() {
      setTimeout(() => {
        this.$router.push("/LandingPage");
      }, 1000);
    },
    async getCurrentCountry() {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        return data.country_name;
      } catch (error) {
        console.error("Error fetching country:", error);
        return null;
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file && file.size <= 5 * 1024 * 1024) {
        this.selectedFile = file;
        this.previewUrl = URL.createObjectURL(file);
      } else {
        alert("File must be PNG or JPG and under 5MB");
      }
    },
  },
};
</script>

<style scoped>
.upload-box {
  border: 2px dashed #cbd5e1; /* light grey */
  border-radius: 8px;
  height: 180px;
  cursor: pointer;
  background-color: #fafafa;
  text-align: center;
}
.preview-img {
  max-width: 200px;
  border-radius: 8px;
}
</style>
