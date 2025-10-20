<template>
  <div>
    <SnackBar
      v-model="snackbar.show"
      :snackbar-text="snackbar.text"
      :snackbar-color="snackbar.color"
      :timeout="snackbar.timeout"
    />

    <v-dialog :model-value="Dialog" max-width="600" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-h6 font-weight-bold pa-4 d-flex align-center">
          Edit a job Opportunity
          <v-spacer></v-spacer>
          <v-btn icon @click="emitclose(1)" variant="text">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-form ref="form" v-model="valid">
          <v-card-text class="py-6">
            <div class="ml-1">Job Title *</div>
            <v-text-field
              v-model="selectedJobForMenuObject.job_title"
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
                  'Job Title must be 50 characters or less',
              ]"
              required
            ></v-text-field>
            <div class="ml-2">Location Type *</div>
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
            <div class="ml-2 mt-n2" v-if="showCity == true">Area/City *</div>
            <v-text-field
              v-if="showCity == true"
              v-model="selectedJobForMenuObject.city"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Description is required']"
              required
              rows="3"
              class="mb-2"
            ></v-text-field>
            <div class="ml-2 mt-n2">Country *</div>

            <v-select
              v-model="selectedJobForMenuObject.country"
              :items="countryListItems"
              placeholder="Select country"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Required']"
              required
              class="mb-2"
              item-title="name"
              item-value="name"
            ></v-select>
            <div class="ml-2 mt-n2">Job Description *</div>

            <v-textarea
              v-model="selectedJobForMenuObject.job_description"
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
              class="mb-3"
            ></v-textarea>
            <!-- <div class="ml-2 mt-n2">Skills Needed *</div>
            <v-textarea
              v-model="selectedJobForMenuObject.skills_needed"
              placeholder="React, TypeScript, Node.js......."
              variant="outlined"
              density="comfortable"
              class="mb-2"
              :rules="[(v) => !!v || 'Skills are required']"
              required
              rows="3"
            ></v-textarea> -->
            <div class="ml-2">Experience Level *</div>

            <v-select
              v-model="selectedJobForMenuObject.experience_level"
              :items="experienceLevels"
              placeholder="Select experience level"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Experience Level is required']"
              required
              class="mb-2"
            ></v-select>
            <!-- <div class="ml-2">Communication Skills Required *</div>

            <v-select
              v-model="selectedJobForMenuObject.communication_skills_required"
              :items="communicationSkills"
              placeholder="Select level"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Communication Skill level is required']"
              required
              class="mb-4"
              filled
            ></v-select> -->

            <v-card
              rounded="lg"
              variant="outlined"
              style="border-color: #e0e0e0"
              class="mt-3"
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
                  Submit
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { UpdateJobDescription } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
import countryList from "@/components/countryList.json";
import SnackBar from "@/components/SnackBar.vue";

const client = generateClient();
export default {
  // Use a prop to control the visibility of the dialog from the parent component
  props: {
    showEditDialog: Boolean,
    selectedJobForMenu: Object,
  },
  components: {
    SnackBar,
  },
  data() {
    return {
      // Internal state for the dialog, linked to the prop

      snackbar: {
        show: false,
        text: "",
        color: "success", // or "error" etc.
        timeout: 3000,
      },
      msg: "",
      successmsg: "",
      Dialog: false,
      loading: false,
      checkLimit: true,
      LimitInterview: "",
      LimitInterviewItems: ["5", "10", "25", "50", "100", "250", "500", "1000"],
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
      showCity: false,
      valid: false,
      communicationSkills: ["Basic", "Intermediate", "Advanced"],
      selectedJobForMenuObject: {
        job_title: "",
        city: "",
        country: "",
        job_description: "",
        skills_needed: "",
        experience_level: "",
        communication_skills_required: "",
      },
    };
  },
  mounted() {
    this.countryListItems = countryList;
  },
  watch: {
    showEditDialog(val) {
      this.Dialog = val;
      this.selectedJobForMenuObject = this.selectedJobForMenu;
      this.formData.locationType = this.selectedJobForMenuObject.job_location;
      this.formData.isPublic =
        this.selectedJobForMenuObject.make_this_job_publicly_searchable ==
        "PUBLIC"
          ? true
          : false;
      this.formData.isInvite =
        this.selectedJobForMenuObject.make_this_job_publicly_searchable ==
        "PRIVATE"
          ? true
          : false;
      this.formData.paymentMethod =
        this.selectedJobForMenuObject.who_pays_for_the_interview;
      this.LimitInterview =
        this.selectedJobForMenuObject.number_of_interviews_allowed;
    },
    "formData.locationType"(val) {
      if (val == "PHYSICAL") {
        this.showCity = true;
      }
      if (val == "REMOTE") {
        this.showCity = false;
        this.selectedJobForMenuObject.city = "";
      }
    },
  },

  methods: {
    emitclose(Toggle) {
      this.$emit("clicked", Toggle);
    },

    async submitMethod() {
      const form = this.$refs.form;
      let isValid;
      if (form.validate) {
        const { valid } = await form.validate();
        isValid = valid;
      }
      if (isValid) {
        this.UpdateJobDescriptionMethod();
      }
    },
    // Handles form submission
    async UpdateJobDescriptionMethod() {
      try {
        this.loading = true;

        this.overlay = true;
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: UpdateJobDescription,
          variables: {
            input: {
              jd_id: this.selectedJobForMenuObject.jd_id,
              updater_user_id:
                this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
              job_title: this.selectedJobForMenuObject.job_title,
              job_location: this.formData.locationType,
              city:
                this.formData.locationType == "PHYSICAL"
                  ? this.selectedJobForMenuObject.city
                  : "-",
              country: this.selectedJobForMenuObject.country,

              job_description: this.selectedJobForMenuObject.job_description,
              skills_needed: this.selectedJobForMenuObject.skills_needed,
              experience_level: this.selectedJobForMenuObject.experience_level,
              communication_skills_required:
                this.selectedJobForMenuObject.communication_skills_required,
              make_this_job_publicly_searchable: this.formData.inviteMethod,
              who_pays_for_the_interview: this.formData.paymentMethod,
              number_of_interviews_allowed: this.LimitInterview,
            },
          },
        });
        const response = JSON.parse(result.data.UpdateJobDescription);
        console.log("response", response);

        this.loading = false;
        this.overlay = false;
        this.snackbar.show = true;
        this.snackbar.text = response.status_message;
        this.snackbar.color = "success";

        setTimeout(() => {
          this.emitclose(2);
        }, 1000);
      } catch (error) {
        this.overlay = false;
        this.loading = false;
        console.log("UpdateJobDescription", error);
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
