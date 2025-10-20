<template>
  <div>
    <SnackBar
      v-model="snackbar.show"
      :snackbar-text="snackbar.text"
      :snackbar-color="snackbar.color"
      :timeout="snackbar.timeout"
    />

    <v-dialog :model-value="createJObDialogModel" max-width="600" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-h6 font-weight-bold pa-4 d-flex align-center">
          Create a job Opportunity
          <v-spacer></v-spacer>
          <v-btn icon @click="emitclose(1)" variant="text">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-form ref="form">
          <v-card-text class="py-6">
            <div class="ml-1">Job Title *</div>
            <v-text-field
              v-model="formData.jobTitle"
              placeholder="Senior Software Engineer"
              variant="outlined"
              density="comfortable"
              class="text-caption"
              counter="100"
              :rules="[
                (v) => !!v || 'Please fill out this field',
                (v) =>
                  (v && v.length >= 10) ||
                  'Job Title must be at least 10 characters',
                (v) =>
                  (v && v.length <= 100) ||
                  'Job Title must be 100 characters or less',
              ]"
              required
            ></v-text-field>

            <div class="ml-2 mt-2">Location Type *</div>
            <v-radio-group
              v-model="formData.locationType"
              mandatory
              class="mt-0"
              inline
            >
              <v-radio value="REMOTE" color="#4E8EF6" label="Remote"> </v-radio>
              <v-radio
                value="PHYSICAL"
                color="#4E8EF6"
                label="Physical Location"
              >
              </v-radio>
            </v-radio-group>
            <div class="ml-2 mt-n2" v-if="formData.locationType == 'PHYSICAL'">
              Area/City *
            </div>
            <v-text-field
              v-if="formData.locationType == 'PHYSICAL'"
              v-model="formData.City"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Description is required']"
              required
              rows="3"
              class="mb-2"
            ></v-text-field>
            <div class="ml-2 mt-n2">Country *</div>

            <v-select
              v-model="formData.Country"
              :items="countryListItems"
              placeholder="Select country"
              variant="outlined"
              density="comfortable"
              required
              class="mb-2"
              item-title="name"
              item-value="name"
            ></v-select>
            <div class="ml-2 mt-n2">Job Description *</div>

            <v-textarea
              v-model="formData.jobDescription"
              placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
              variant="outlined"
              density="comfortable"
              counter="1000"
              :rules="[
                (v) => !!v || 'Please fill out this field',
                (v) =>
                  (v && v.length >= 100) ||
                  'Job Description must be at least 100 characters',
                (v) =>
                  (v && v.length <= 1000) ||
                  'Job Description must be 1000 characters or less',
              ]"
              required
              class="mb-2 pre-formatted-text"
            ></v-textarea>
            <!-- <div class="ml-2 mt-n2">Skills Needed *</div>
            <v-textarea
              v-model="formData.skills"
              placeholder="React, TypeScript, Node.js......."
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Skills are required']"
              required
              rows="3"
              class="mb-3"
            ></v-textarea> -->
            <div class="ml-2 mt-n2">Experience Level *</div>

            <v-select
              v-model="formData.experienceLevel"
              :items="experienceLevels"
              placeholder="Select experience level"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Experience Level is required']"
              required
              class="mb-2"
            ></v-select>

            <v-card
              rounded="lg"
              variant="outlined"
              style="border-color: #e0e0e0"
              class="mt-1"
            >
              <div class="font-weight-medium mb-2 ml-2 mt-2">
                Who pays for the interview?
              </div>
              <v-radio-group
                v-model="formData.paymentMethod"
                mandatory
                class="mt-0"
                inline
              >
                <v-row>
                  <v-col cols="6">
                    <v-radio
                      label="Business Pays"
                      value="BUSINESS"
                      color="#4E8EF6"
                    ></v-radio>

                    <div class="text-caption text-medium-emphasis ml-2 mt-n2">
                      Credits will be deducted from your business account at 10
                      credits/minute
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <v-radio
                      label="Job Seeker Pays"
                      value="JOB_SEEKER"
                      color="#4E8EF6"
                    ></v-radio>
                    <div class="text-caption text-medium-emphasis ml-2 mt-n2">
                      Credits will be deducted from the job seeker's account at
                      10 credits/minute
                    </div>
                  </v-col>
                </v-row>
              </v-radio-group>
            </v-card>
            <v-card
              rounded="lg"
              variant="outlined"
              style="border-color: #e0e0e0"
              class="mt-2 mb-2"
              v-if="formData.paymentMethod == 'BUSINESS'"
            >
              <div>
                <v-checkbox
                  v-model="checkLimit"
                  color="blue"
                  label="Limit number of interviews"
                  class="mt-2"
                ></v-checkbox>
                <!-- <v-switch
                  v-model="checkLimit"
                  label="Limit number of interviews"
                  color="blue"
                  class="ml-2 mt-2"
                ></v-switch> -->
              </div>
              <div>
                <v-select
                  v-if="checkLimit == true"
                  v-model="LimitInterview"
                  :items="LimitInterviewItems"
                  placeholder="Select Limit"
                  label=" Limited to"
                  variant="outlined"
                  density="compact"
                  required
                  class="mb-2 ml-2 mr-4 mt-n4"
                ></v-select>
              </div>
            </v-card>
            <v-card
              rounded="lg"
              variant="outlined"
              style="border-color: #e0e0e0"
              class=""
            >
              <v-radio-group
                v-model="formData.inviteMethod"
                mandatory
                class="mt-2"
                inline
              >
                <v-row>
                  <v-col cols="6">
                    <v-radio
                      label="Publicly Accessible"
                      value="PUBLIC"
                      color="#4E8EF6"
                    ></v-radio>

                    <div class="text-caption text-medium-emphasis ml-2 mt-n2">
                      If enabled, job seekers can discover this job in the job
                      search panel. Otherwise, it's only accessible via the
                      unique job code.
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <v-radio
                      label="By Invite Only"
                      value="PRIVATE"
                      color="#4E8EF6"
                    ></v-radio>
                    <div class="text-caption text-medium-emphasis ml-2 mt-n2">
                      Only candidates who receive an email invitation can apply.
                      This job will not be publicly searchable.
                    </div>
                  </v-col>
                </v-row>
              </v-radio-group>
            </v-card>
            <v-card
              rounded="lg"
              variant="outlined"
              style="border-color: #eff6ff; background-color: #e1f5fe"
              class="mt-2"
              color="blue"
            >
              <div
                class="text-primary text-medium-emphasis mb-4 ma-4 text-caption"
              >
                Once created, job seekers will be able to apply using a unique
                job code. The AI interviewer will assess job seekers based on
                these criteria. Platform fee is 10 credits per minute,
                pro-rated.
              </div>
            </v-card>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-4">
            <v-row>
              <v-col cols="6">
                <v-btn
                  block
                  style="border-color: #e0e0e0"
                  variant="outlined"
                  class="text-capitalize mr-2"
                  @click="emitclose(1)"
                >
                  Cancel
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  color="#4E8EF6"
                  :loading="loading"
                  class="text-capitalize rounded-lg"
                  @click="submitMethod()"
                  x-small
                  dense
                  variant="elevated"
                >
                  Create Job
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card class="pa-4 text-center">
        <!-- <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
          class="float-right"
        ></v-btn> -->

        <v-card-title class="text-h5 font-weight-bold pt-4 pb-1">
          Job Opportunity Created Successfully
        </v-card-title>

        <div class="my-5">
          <v-icon color="success" size="72" icon="mdi-check-circle"></v-icon>

          <!-- <p class="text-subtitle-1 text-medium-emphasis">
            Job opportunity created successfully
          </p> -->
        </div>

        <v-card
          variant="outlined"
          class="pa-4 mb-4"
          style="border-color: #e0e0e0"
          rounded="lg"
        >
          <p class="text-subtitle-1 font-weight-medium text-left mb-3">
            Share this unique job code with job seekers:
          </p>

          <div class="d-flex align-center">
            <div class="flex-grow-1 mr-3">
              <v-text-field
                v-model="jobId"
                variant="outlined"
                readonly
                hide-details
                class="code-input"
              ></v-text-field>
            </div>

            <v-btn
              color="#4E8EF6"
              icon="mdi-content-copy"
              size="large"
              @click.stop="copyToClipBoard(jobId)"
            ></v-btn>
          </div>
        </v-card>

        <v-list density="compact" class="text-left">
          <v-list-item
            v-for="(item, index) in features"
            :key="index"
            :title="item"
            prepend-icon="mdi-check"
          >
          </v-list-item>
        </v-list>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            size="large"
            block
            class="text-uppercase"
            @click="closeDialog"
          >
            Done
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { CreateJobDescription } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
import countryList from "@/components/countryList.json";
import SnackBar from "@/components/SnackBar.vue";
const client = generateClient();
export default {
  // Use a prop to control the visibility of the dialog from the parent component
  props: {
    createJObDialog: Boolean,
  },
  components: {
    SnackBar,
  },
  data() {
    return {
      // Internal state for the dialog, linked to the prop

      dialog: false,
      loading: false,
      features: [
        "Job seekers can apply using this code",
        "AI interviewer configured with job requirements",
        "You'll receive notifications when job seekers complete interviews",
      ],
      checkLimit: true,
      LimitInterview: "100",
      LimitInterviewItems: ["5", "10", "25", "50", "100", "250", "500", "1000"],
      jobId: "",
      createJObDialogModel: false,
      snackbar: {
        show: false,
        text: "",
        color: "success", // or "error" etc.
        timeout: 3000,
      },
      msg: "",
      successmsg: "",
      formData: {
        jobTitle: "",
        locationType: "REMOTE",
        City: "",
        Country: "", // Pre-filled for the prototype look
        jobDescription: "",
        skills: "", // Pre-filled
        experienceLevel: null,
        communicationSkills: null,
        isInvite: false,
        isPublic: true,
        inviteMethod: "PUBLIC",
        paymentMethod: "BUSINESS", // Default to 'Business pays'
      },
      countryListItems: [],
      experienceLevels: [
        "Entry Level (0-2 years)",
        "Mid Level (3-5 years)",
        "Senior Level (6+ years)",
        "Lead/Principal (10+ years)",
      ],
      communicationSkills: ["Basic", "Intermediate", "Advanced"],
    };
  },
  async mounted() {
    this.countryListItems = countryList;
    this.formData.Country = await this.getCurrentCountry();
  },
  watch: {
    createJObDialog(val) {
      this.createJObDialogModel = val;
    },
    // "formData.isInvite"(val) {
    //   if (val == true) {
    //     this.formData.isPublic = false;
    //   }
    // },
    // "formData.isPublic"(val) {
    //   if (val == true) {
    //     this.formData.isInvite = false;
    //   }
    // },
  },

  methods: {
    // Closes the dialog and resets the form
    emitclose(Toggle) {
      this.$emit("clicked", Toggle);
    },
    closeDialog() {
      // Hides the dialog

      this.dialog = false;

      this.emitclose(2);

      console.log("User acknowledged job creation success.");
      // Add any parent component logic here, e.g., redirecting the user
    },
    copyToClipBoard(text) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.snackbar.show = true;
          (this.snackbar.text = "Copied to clipboard!"),
            (this.snackbar.color = "success");
        })
        .catch(() => {
          this.$toast?.error("Failed to copy") || alert("Failed to copy");
        });
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

    async submitMethod() {
      const form = this.$refs.form;
      let isValid;
      if (form.validate) {
        const { valid } = await form.validate();
        isValid = valid;
      }
      if (isValid) {
        this.CreateJobDescriptionMethod();
      }
    },

    async CreateJobDescriptionMethod() {
      try {
        this.loading = true;
        this.overlay = true;
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: CreateJobDescription,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
              job_title: this.formData.jobTitle,
              job_location: this.formData.locationType,

              city:
                this.formData.locationType == "PHYSICAL"
                  ? this.formData.City
                  : "-",
              country: this.formData.Country,
              job_description: `${this.formData.jobDescription}`,
              skills_needed: this.formData.skills,
              experience_level: this.formData.experienceLevel,
              communication_skills_required: this.formData.communicationSkills,
              make_this_job_publicly_searchable: this.formData.inviteMethod,
              who_pays_for_the_interview: this.formData.paymentMethod,
              number_of_interviews_allowed: this.LimitInterview,
            },
          },
        });
        const response = JSON.parse(result.data.CreateJobDescription);
        console.log("response", response.status_message);
        const parts = response.status_message.split("job id");

        this.jobId = "www.jobs.intervwd.com/" + parts[1];
        this.loading = false;

        this.overlay = false;
        this.createJObDialogModel = false;
        this.$refs.form.reset();
        this.$refs.form.resetValidation();
        this.formData.locationType = "REMOTE";
        this.formData.isPublic = true;
        this.formData.paymentMethod = "BUSINESS";
        this.formData.Country = await this.getCurrentCountry();
        this.dialog = true;
        return response;
      } catch (error) {
        this.loading = false;
        this.overlay = false;
        console.log("error", error);
        if (
          error &&
          error.errors &&
          error.errors[0] &&
          error.errors[0].message
        ) {
          this.msg = error.errors[0].message;
        }

        // Show error snackbar
        this.snackbar.text = this.msg;
        this.snackbar.color = "red";
        this.snackbar.show = true;
      }
    },
  },
};
</script>
<style scoped>
.pre-formatted-text {
  /* This is the key property */
  white-space: pre-wrap;
  /* 'pre-wrap' preserves spaces and line breaks, and wraps text when necessary. */
}
</style>
