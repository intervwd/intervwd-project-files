<template>
  <div>
    <SnackBar
      v-model="snackbar.show"
      :snackbar-text="snackbar.text"
      :snackbar-color="snackbar.color"
      :timeout="snackbar.timeout"
    />
    <v-container
      fluid
      class="d-flex justify-center"
      style="background-color: #f5f5f5; min-height: 100vh; padding-top: 100px"
    >
      <div class="background-design">
        <div class="circle circle1"></div>
        <div class="circle circle2"></div>
        <div class="circle circle3"></div>
      </div>
      <v-card
        elevation="4"
        width="400"
        class="pa-8"
        rounded="lg"
        :height="step == 3 ? 'auto' : '450'"
      >
        <div class="d-flex align-center mb-6">
          <v-btn
            variant="text"
            size="small"
            class="pa-0"
            @click="goBack"
            style="min-width: 50px"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            Back
          </v-btn>
        </div>

        <div class="text-center mb-6 ml-n4">
          <v-img :src="appLogoPath" cover width="200px" class="mx-auto"></v-img>
        </div>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <div v-if="step === 1">
            <div class="text-center mb-8">
              <h2 class="text-h6 font-weight mb-1">Employer Account</h2>
              <p class="text-subtitle-1 text-medium-emphasis">
                Enter your email to get started
              </p>
            </div>

            <v-text-field
              v-model="formData.email"
              label="Email Address"
              placeholder="Employer@company.com"
              variant="outlined"
              density="comfortable"
              :rules="emailRules"
              required
              class="mb-4"
            ></v-text-field>

            <v-btn
              color="#4E8EF6"
              block
              size="large"
              type="submit"
              class="mt-4 text-capitalize"
              :loading="signinloading"
              @click="validateSignIn"
            >
              Continue
            </v-btn>
            <div justify="end" class="mt-3 cursor" @click="signUpAccount()">
              Don't have an account ?
              <span class="text-blue"><u>Sign Up</u></span>
            </div>
          </div>

          <div v-else-if="step === 2">
            <div class="text-center mb-6">
              <h2 class="text-h6 font-weight mb-1">Employer Account</h2>
              <p class="text-subtitle-1 text-medium-emphasis">
                Enter the verification code sent to your email
              </p>
            </div>

            <div class="text-center mb-8 mt-n2">
              <p class="text-subtitle-2 text-medium-emphasis">
                Code sent to
                <span class="font-weight-bold">{{ formData.email }}</span>
              </p>
            </div>

            <div class="d-flex justify-space-between mb-6 mt-n4">
              <v-otp-input
                v-show="showOtpField"
                ref="otpInput"
                v-model="OTPValue"
                :auto-focus="true"
              ></v-otp-input>
            </div>

            <div>
              <v-btn
                variant="text"
                color="#4E8EF6"
                @click="signInMethod('RESEND_OTP')"
                class="text-capitalize mt-n16"
                :loading="resendloading"
              >
                Resend Code
              </v-btn>
            </div>

            <v-btn
              color="#4E8EF6"
              block
              size="large"
              type="submit"
              class="mt-n4 text-capitalize"
              :loading="otploading"
              @click="validateSignIn()"
            >
              Login
            </v-btn>
          </div>

          <div v-else-if="step === 3">
            <div class="text-center mb-8">
              <h2 class="text-h6 font-weight mb-1">Employer Account</h2>
              <p class="text-subtitle-1 text-medium-emphasis">
                Complete your Employer profile
              </p>
            </div>
            <v-text-field
              v-model="formData.email"
              label="Email Address"
              placeholder="Employer@company.com"
              variant="outlined"
              density="comfortable"
              :rules="emailRules"
              required
              class="mb-4"
            ></v-text-field>
            <v-text-field
              v-model="formData.userName"
              label="Name"
              placeholder="Rio"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Required']"
              required
              class="mb-4"
            ></v-text-field>
            <v-text-field
              v-model="formData.businessName"
              label="Employer Name"
              placeholder="Acme Corporation"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Required']"
              required
              class="mb-4"
            ></v-text-field>

            <v-select
              v-model="formData.country"
              :items="countryListItems"
              label="Country"
              placeholder="Select country"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Required']"
              required
              class="mb-4"
              item-title="name"
              item-value="name"
            ></v-select>

            <v-textarea
              v-model="formData.businessProfile"
              label="Employer Profile"
              placeholder="Tell us about your company..."
              variant="outlined"
              density="comfortable"
              :rules="[
                (v) => !!v || 'Required',
                (v) =>
                  (v && v.length >= 10 && v.length <= 500) ||
                  'Profile must be between 10 and 500 characters',
              ]"
              required
              rows="4"
              class="mb-6"
            ></v-textarea>

            <v-btn
              color="#4E8EF6"
              block
              size="large"
              type="submit"
              :loading="signuploading"
              class="text-capitalize"
              @click.stop="validateMethod"
            >
              Submit
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import SnackBar from "@/components/SnackBar.vue";
import { signUp, signIn, signOut, confirmSignIn } from "aws-amplify/auth";
import countryList from "@/components/countryList.json";
import AppLogo from "@/assets/AppLogo.png";

export default {
  components: {
    SnackBar,
  },
  data() {
    return {
      SnackBarComponent: {},
      step: 1, // 1: Email, 2: OTP, 3: Profile
      loading: false,
      resendloading: false,
      signinloading: false,
      signuploading: false,
      otploading: false,
      appLogoPath: AppLogo,
      showOtpField: true,
      OTPValue: "",
      formData: {
        email: "",
        userName: "",
        businessName: "", // Pre-filled for prototype look
        country: null,
        businessProfile: "",
      },
      otpInputs: [],
      countryListItems: [],
      snackbar: {
        show: false,
        text: "",
        color: "success", // or "error" etc.
        timeout: 3000,
      },
      msg: "",
      successmsg: "",
      // Shortened email validation rules
      emailRules: [
        (v) => !!v || "Required",
        (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Email must be valid",
      ],
    };
  },
  async mounted() {
    this.countryListItems = countryList;
    this.formData.country = await this.getCurrentCountry();
  },
  methods: {
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;
    },
    signUpAccount() {
      this.step = 3;
    },

    sendOtp() {
      this.loading = true;
      console.log(`Sending OTP to ${this.formData.signupemail}`);

      setTimeout(() => {
        this.loading = false;
        this.step = 2;
        this.$nextTick(() => {
          if (this.otpInputs[0]) {
            this.otpInputs[0].focus();
          }
        });
      }, 1500);
    },

    handleOtpInput(index, event) {
      const value = event.target.value;
      if (value.length > 1) {
        this.formData.otp[index] = value.charAt(0);
      }

      if (this.formData.otp[index] && index < 5) {
        this.otpInputs[index + 1].focus();
      }

      if (this.formData.otp.every((digit) => digit.length === 1)) {
        this.verifyOtp();
      }
    },

    handleBackspace(index, event) {
      if (event.key === "Backspace" && !this.formData.otp[index] && index > 0) {
        event.preventDefault();
        this.otpInputs[index - 1].focus();
        this.formData.otp[index - 1] = "";
      }
    },

    verifyOtp() {
      const fullCode = this.formData.otp.join("");
      console.log("Verifying OTP:", fullCode);
      this.loading = true;

      // Simulate API call to verify OTP
      setTimeout(() => {
        this.loading = false;
        // On successful verification, move to the Profile step
        this.step = 3;
        console.log("OTP verified. Proceeding to profile setup.");
      }, 1500);
    },

    resendCode() {
      console.log("Resending verification code.");
      // Implement API call to resend the code
    },

    validateMethod() {
      if (
        this.formData.userName != "" &&
        this.formData.businessName != "" &&
        this.formData.businessProfile != ""
      ) {
        this.createAccount();
      } else {
        this.signuploading = false;
        this.overlay = false;
        this.snackbar.text = "Please fill all required fields";
        this.snackbar.color = "red";
        this.snackbar.show = true;
      }
    },
    // --- Step 3 Handler ---
    async createAccount() {
      this.signuploading = true;
      try {
        const response = await signUp({
          username: this.formData.email,
          password: "intervwd@123",
          options: {
            userAttributes: {
              "custom:user_name": this.formData.userName,
              "custom:business_name": this.formData.businessName,
              "custom:business_profile": this.formData.businessProfile,
              "custom:country": this.formData.country,
            },
          },
        });

        console.log("SignUp response:", response);

        if (response?.nextStep?.signUpStep === "DONE") {
          this.signuploading = false;
          this.step = 2;

          this.snackbar.show = true;
          (this.snackbar.text = `OTP sent to ${this.formData.email}`),
            (this.snackbar.color = "green"),
            await this.signInMethod("SEND_OTP");
        }
      } catch (error) {
        console.error("Error while signing up:", error);
        // Show user-friendly message

        this.snackbar.show = true;
        (this.snackbar.text =
          error?.message || "Signup failed. Please try again."),
          (this.snackbar.color = "red");
      } finally {
        this.otploading = false;
      }
    },
    checkOtpCompletion() {
      // this.SnackBarComponent = {
      //   SnackbarVmodel: true,
      //   SnackbarColor: "green",
      //   SnackbarText: "success",
      // };
      setTimeout(() => {
        this.loading = false;
        this.$router.push({ name: "DashboardPage" });
      }, 2000);
    },
    // --- Navigation ---
    goBack() {
      let nextStep = this.step; // Temporarily store the current step

      if (this.step == 2) {
        nextStep = 3;
      } else if (this.step == 3) {
        nextStep = 1;
      } else if (this.step == 1) {
        nextStep = "https://www.intervwd.com/";
      } else {
        nextStep = "https://www.intervwd.com/";
      }

      if (
        typeof nextStep === "string" &&
        (nextStep.startsWith("http://") || nextStep.startsWith("https://"))
      ) {
        // Perform the redirect
        window.location.href = nextStep;

        return;
      }

      this.step = nextStep;
    },
    async signInotp() {
      this.step = 2;
      this.showOtpField = true;
      await this.$nextTick(); // wait for DOM update
      const firstInput = this.$refs.otpInput?.$el?.querySelector("input");
      if (firstInput) firstInput.focus(); // focus the input
    },
    async signInMethod(action) {
      switch (action) {
        case "SEND_OTP":
          try {
            if (this.signinloading == false) {
              this.signinloading = true;
            }
            this.user = await signIn({
              username: this.formData.email.toLowerCase(),
              options: {
                authFlowType: "CUSTOM_WITHOUT_SRP",
              },
            });
            console.log("this.user", this.user);
            if (
              this.user.nextStep.signInStep ===
              "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE"
            ) {
              this.showOtpField = true;
              this.snackbar.show = true;
              this.snackbar.text = `Verification OTP sent to ${this.formData.email.toLowerCase()}`;
              this.snackbar.color = "green";

              setTimeout(async () => {
                this.step = 2;
                await this.$nextTick();
                const firstInput =
                  this.$refs.otpInput?.$el?.querySelector("input");
                if (firstInput) firstInput.focus();
                this.signinloading = false;
              }, 1000);
            }
          } catch (error) {
            console.log("erro", error);
            if (error.message == "There is already a signed in user.") {
              if (this.signinloading == false) {
                this.signinloading = true;
              }
              await signOut({ global: true });
              this.signInMethod("SEND_OTP");
            } else if (
              error.message ==
              "VerifyAuthChallengeResponse failed with error Incorrect OTP!!."
            ) {
              this.step = 2;
              this.signinloading = false;

              this.snackbar.show = true;
              (this.snackbar.text = error.message),
                (this.snackbar.color = "red");
            } else {
              console.log("error", error);
              this.signinloading = false;
              if (
                error.message ==
                "DefineAuthChallenge failed with error Error: NOT_AUTHORIZED : Kindly Sigup."
              ) {
                this.step = 3;

                // this.snackbar.show = true;
                // (this.snackbar.text = error.message),
                //   (this.snackbar.color = "red");
              }
            }
          }
          break;
        case "VERIFY_OTP":
          try {
            this.otploading = true;
            console.log("coming In");
            await confirmSignIn({ challengeResponse: this.OTPValue })
              .then((res) => {
                this.showOtpField = true;
                this.snackbar.show = true;
                (this.snackbar.text = "Login Successfull"),
                  (this.snackbar.color = "green");
                console.log("res", res);
                console.log("yes", this.formData.email);
                this.IsOTPFieldEnabled = false;
                // this.IsSessionLoggedOut = false;
                localStorage.setItem("IsLoggedOut", "false");
                this.$store.commit("SET_USER_MAIL", this.formData.email);
                this.otploading = false;
                setTimeout(() => {
                  this.ActivateMethod();
                }, 1000);
              })
              .catch((err) => {
                if (err) {
                  // this.counter = 0;
                  this.OTPValue = "";
                  this.step = 1;
                }
                if (
                  err.message ==
                  "VerifyAuthChallengeResponse failed with error Incorrect OTP!!."
                ) {
                  this.snackbar.show = true;
                  (this.snackbar.text = "Incorrect OTP"),
                    (this.snackbar.color = "red");
                } else {
                  this.SnackBarComponent.SnackbarVmodel = false;

                  this.snackbar.show = true;
                  (this.snackbar.text = err.message),
                    (this.snackbar.color = "red");
                }
                this.OTPErrorMessage = err.message;
                this.otploading = false;
              });
          } catch (error) {
            console.log("err", error);
            if (
              error.message ==
              "VerifyAuthChallengeResponse failed with error Incorrect OTP!!."
            ) {
              this.step = 2;
              this.otploading = false;
              this.snackbar.show = true;
              (this.snackbar.text = "Incorrect OTP"),
                (this.snackbar.color = "red");
            }
          }
          break;
        case "RESEND_OTP":
          this.resendloading = true;
          try {
            this.user = await signIn({
              username: this.formData.email.toLocaleLowerCase(),
              options: {
                authFlowType: "CUSTOM_WITHOUT_SRP",
              },
            });
            if (
              this.user.nextStep.signInStep ==
              "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE"
            ) {
              this.showOtpField = true;
              this.snackbar.show = true;
              (this.snackbar.text = `Verification OTP sent to ${this.formData.email.toLocaleLowerCase()}`),
                (this.snackbar.color = "green"),
                // this.counter = 60;
                setTimeout(() => {
                  this.resendloading = false;
                }, 1000);
              // this.startCountdown();

              this.$forceUpdate();
            }
          } catch (error) {
            console.log("erro", error);
            if (error.message == "There is already a signed in user.") {
              this.otploading = true;
              await signOut({ global: true });
              this.signInMethod("SEND_OTP");
            } else {
              this.otploading = false;

              this.snackbar.show = true;
              (this.snackbar.text = error.message),
                (this.snackbar.color = "red");
            }
          }
          break;
      }
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
    async validateSignIn() {
      const valid = await this.$refs.form.validate();
      if (valid.valid) {
        console.log("valid");
        this.showOtpField = true;
        this.signInMethod(this.step == 2 ? "VERIFY_OTP" : "SEND_OTP");
      } else {
        console.log("invalid");

        this.snackbar.show = true;
        (this.snackbar.text = "Please enter valid details"),
          (this.snackbar.color = "red");
      }
    },
    ActivateMethod() {
      setTimeout(() => {
        this.loading = false;
        this.$router.push({ name: "DashboardPage" });
      }, 2000);
    },
  },
  // Ensure references are correctly managed when the component re-renders
  updated() {
    this.otpInputs = [];
  },
};
</script>
<style>
.background-design {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.25;
  animation: float 8s ease-in-out infinite;
}

.circle1 {
  width: 300px;
  height: 300px;
  background: #c1eaf4;
  top: 10%;
  left: 10%;
}
.circle2 {
  width: 400px;
  height: 400px;
  background: #00c6ff;
  bottom: -15%;
  right: -10%;
}
.circle3 {
  width: 200px;
  height: 200px;
  background: #0072ff;
  bottom: -5%;
  left: -1%;
}
</style>
