<template>
  <div>
    <SnackBar :SnackBarComponent="SnackBarComponent" />
    <Overlay :overlay="overlay" />
    <InterViewDialog
      :InterViewDialog="InterViewDialog"
      :ActionObj="ActionObj"
      @clicked="InterViewDialogEmit"
    />
    <InterViewDoneDialog
      :InterViewDoneDialog="InterViewDoneDialog"
      @clicked="InterViewDoneDialogEmit"
    />
    <v-card class="pa-4 mb-8 px-6 elevation-0" min-height="400px">
      <span v-if="$store.getters.get_backtojob_boolean == false">
        <div class="fontsize16px font-weight-bold mt-n2">
          Find Job Opportunities
        </div>
        <div class="text-grey-darken-1 fontsize15px mt-1">
          Enter the unique job code provided by the employer to view details and
          start your interview
        </div>

        <div class="d-flex">
          <v-text-field
            v-model="jobCode"
            variant="outlined"
            placeholder="ENTER JOB CODE"
            rounded="lg"
            density="comfortable"
            class="mt-4 elevation-0"
            @keydown.enter="viewJob(jobCode, true)"
          ></v-text-field>
          <v-btn
            variant="elevated"
            height="45"
            rounded="lg"
            color="GreenColorVariant1"
            class="mt-4 ml-2 text-capitalize elevation-0"
            size="large"
            :loading="loading"
            ><span class="">Search</span>
            <!-- @click="viewJob(jobCode, true)" -->
          </v-btn>
        </div>
      </span>

      <div v-if="$store.getters.get_backtojob_boolean == false">
        <v-divider horizontal />
        <v-card
          class="BorderRadius10Px cardOutline CardHover mt-4 pl-4"
          v-for="(item, i) in searchJobs(jobCode)"
          :key="i"
          variant="outlined"
          style="background-color: #fcfafc"
          @click="viewJob(item, false)"
        >
          <span class="d-flex">
            <div class="fontsize18px font-weight-bold mt-3">
              {{ item.job_title }}
            </div>
          </span>

          <div class="d-flex">
            <div
              v-if="item.company_name"
              class="text-grey-darken-1 fontsize14px"
            >
              <v-icon size="x-small" color="blue" class="mr-1 mt-n1"
                >mdi-domain</v-icon
              >{{ item.company_name }}
            </div>
            <v-divider vertical class="mx-2" />
            <div class="text-grey-darken-1 fontsize14px">
              <v-icon size="x-small" color="green" class="mt-n1"
                >mdi-map-marker</v-icon
              >{{
                item.job_location == "REMOTE"
                  ? item.job_location
                  : `${item.city},
                    ${item.country}`
              }}
            </div>
            <v-divider vertical class="mx-2" />
            <v-btn
              class="text-capitalize"
              variant="outlined"
              size="x-small"
              bg-color="grey"
              color="green"
              @click.stop="copyToClipboard(item.job_code_link)"
            >
              <span class="fontsize10px">{{ item.job_code }}</span>
              <v-icon size="12" class="ml-2 cursor-pointer" color="black">
                mdi-content-copy
              </v-icon>
            </v-btn>
          </div>

          <div class="fontsize13px FontWeight500 mt-2">
            Job Description :
            <span class="fontsize14px text-grey-darken-1">
              {{ truncate(item.job_description, 150) || "-" }}
            </span>
          </div>

          <div class="fontsize13px FontWeight500 mt-1 mb-2">
            Required Skills :
            <div class="text-grey-darken-1">
              <template v-if="item.skills_needed && item.skills_needed.length">
                <v-chip
                  v-for="(skill, index) in parsedSkills(item.skills_needed)"
                  :key="index"
                  color="black"
                  size="small"
                  class="ma-1"
                  variant="outlined"
                  rounded="xl"
                >
                  {{ skill }}
                </v-chip>
              </template>
              <span v-else>-</span>
            </div>
          </div>
        </v-card>
        <div
          v-if="!Job_Oppurtunities"
          class="text-center text-grey-darken-1 font-weight-bold mt-10"
        >
          No Jobs Found
        </div>
      </div>

      <div v-else-if="$store.getters.get_backtojob_boolean == true">
        <v-card
          v-if="selectedJob"
          class="pa-4 BorderRadius10Px cardOutline elevation-0 mt-2"
          outlined
          color="#f0fdf4"
        >
          <div class="d-flex">
            <div class="fontsize20px font-weight-bold">
              {{ selectedJob.job_title }}
              <v-btn
                class="text-capitalize ml-6"
                variant="outlined"
                size="x-small"
                color="green"
                style="background-color: white"
                @click.stop="copyToClipboard(selectedJob.job_code_link)"
              >
                <span class="fontsize10px">{{ selectedJob.job_code }}</span>
                <v-icon size="12" class="ml-2 cursor-pointer" color="black">
                  mdi-content-copy
                </v-icon>
              </v-btn>
              <div v-if="selectedJob.company_name" class="text-grey-darken-1">
                <span class="fontsize13px"
                  ><v-icon class="mr-1 mt-n1" color="blue">mdi-domain</v-icon
                  >{{ selectedJob.company_name }}</span
                >
              </div>
              <div class="mt-n2 text-grey-darken-1">
                <span class="fontsize13px"
                  ><v-icon class="mr-1" color="green">mdi-map-marker</v-icon
                  >{{
                    selectedJob.job_location == "REMOTE"
                      ? selectedJob.job_location
                      : `${selectedJob.city},
                    ${selectedJob.country}`
                  }}</span
                >
              </div>
            </div>

            <v-spacer />
            <div class="fontsize14px font-weight-bold">
              Experience Level
              <div class="text-grey-darken-1">
                <span class="fontsize12px">
                  {{ selectedJob.experience_level }}</span
                >
              </div>
            </div>

            <v-spacer />
          </div>
          <!-- v-if="InterviewStatus" -->

          <v-card
            v-if="
              !InterviewStatus &&
              InterViewError ==
                'This interview has already been completed by you and cannot be retaken.'
            "
            color="white"
            class="pa-4 mt-6 cardOutline elevation-0"
            ><div>
              <v-icon class="mr-2" color="green">mdi-information</v-icon
              >{{ InterViewError }}
            </div></v-card
          >
          <!-- v-if="InterviewStatus" -->

          <v-card
            v-if="
              InterviewStatus ||
              InterViewError !=
                'This interview has already been completed by you and cannot be retaken.'
            "
            color="white"
            class="pa-4 mt-6 cardOutline elevation-0"
          >
            <div class="d-flex align-center">
              <v-icon color="green" class="mr-2">mdi-microphone-outline</v-icon>
              <div>
                <div class="heading">Ready for your AI interview?</div>
                <div class="text-grey-darken-1 fontsize15px">
                  The interview will last up to 5 minutes. Our AI interviewer
                  will assess your skills, experience, and communication
                  abilities based on this job's requirements.
                </div>
              </div>
            </div>
            <v-btn
              color="GreenColorVariant1"
              class="mt-4 text-capitalize elevation-0"
              variant="elevated"
              rounded="lg"
              height="45"
              @click="startInterview(selectedJob)"
            >
              Start Interview
            </v-btn>
          </v-card>
          <div class="fontsize14px mt-5 pre-formatted-text font-weight-bold">
            Job Description
            <div class="text-grey-darken-1">
              <span class="fontsize13px">{{
                selectedJob.job_description || "-"
              }}</span>
            </div>
          </div>

          <div class="fontsize14px mt-2 font-weight-bold">
            Required Skills
            <div class="text-grey-darken-1 mt-2">
              <template
                v-if="
                  selectedJob.skills_needed && selectedJob.skills_needed.length
                "
              >
                <v-chip
                  v-for="(skill, index) in parsedSkills(
                    selectedJob.skills_needed
                  )"
                  :key="index"
                  color="black"
                  size="small"
                  class="ma-1"
                  variant="outlined"
                  rounded="lg"
                >
                  {{ skill }}
                </v-chip>
              </template>
              <span v-else>-</span>
            </div>
          </div>
        </v-card>
      </div>
    </v-card>
  </div>
</template>

<script>
import { ListJobDescriptionsFunction } from "@/Mixins/Findjobs/ListJobsDescription.js";
import InterViewDialog from "@/components/Dialogs/InterViewDialogs.vue";
import InterViewDoneDialog from "@/components/Dialogs/InterViewDone.vue";
import { ListJobByCodeFunction } from "@/Mixins/Findjobs/ListJobByCode.js";
import { CheckIfInterviewAlreadyTakenFunction } from "@/Mixins/Findjobs/CheckInterViewStatus.js";
import Overlay from "../Extras/Overlay.vue";
import SnackBar from "../Extras/SnackBar.vue";
export default {
  components: { InterViewDialog, SnackBar, Overlay, InterViewDoneDialog },
  mixins: [
    ListJobDescriptionsFunction,
    ListJobByCodeFunction,
    CheckIfInterviewAlreadyTakenFunction,
  ],
  data: () => ({
    InterViewDialog: false,
    selectedJob: null,
    Job_Oppurtunities: [],
    jobCode: "",
    searchJob: "",
    overlay: false,
    loading: false,
    SnackBarComponent: {},
    ActionObj: {},
    InterviewStatus: false,
    InterViewDoneDialog: false,
    InterViewError: "",
  }),
  watch: {
    "$store.getters.get_backtojob_boolean"(newVal) {
      if (newVal === false) {
        this.jobCode = "";
      }
    },
  },
  async mounted() {
    this.Job_Oppurtunities = await this.listJobDescriptionsMethod();
  },
  methods: {
    parsedSkills(skills) {
      if (!skills) return [];

      if (Array.isArray(skills)) {
        return skills;
      }

      if (typeof skills === "string") {
        let cleaned = skills.trim();

        if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
          cleaned = cleaned.slice(1, -1);
        }

        return cleaned.split(",").map((s) => s.trim());
      }

      return [];
    },
    copyToClipboard(text) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.SnackBarComponent = {
            SnackbarVmodel: true,
            SnackbarColor: "green",
            SnackbarText: "Copied to clipboard!",
            timeout: 3000,
          };
        })
        .catch(() => {
          this.$toast?.error("Failed to copy") || alert("Failed to copy");
        });
    },
    truncate(text, length) {
      if (!text) return "";
      return text.length > length ? text.substring(0, length) + "..." : text;
    },
    // parsedSkills(val) {
    //   if (!val) return [];
    //   if (Array.isArray(val)) {
    //     return val.map((s) => String(s).trim()).filter(Boolean);
    //   }
    //   if (typeof val === "string") {
    //     return val
    //       .split(",")
    //       .map((s) => s.trim())
    //       .filter(Boolean);
    //   }
    //   return [];
    // },
    searchJobs(query) {
      if (!query) {
        return this.Job_Oppurtunities; // return all if no search
      }

      const lowerQuery = query.toLowerCase();

      return this.Job_Oppurtunities.filter((job) => {
        const desc = job.job_description
          ? job.job_description.toLowerCase()
          : "";

        const skillsArray = Array.isArray(job.skills_needed)
          ? job.skills_needed.map((s) => s.toLowerCase())
          : [];

        // check if query is in description or any skill
        return (
          desc.includes(lowerQuery) ||
          skillsArray.some((skill) => skill.includes(lowerQuery))
        );
      });
    },

    async viewJob(job, Boolean) {
      this.selectedJob = await this.listJobbyCodeMethod(job.job_code, Boolean);
      this.InterviewStatus = await this.checkInterviewStatusMethod(job.jd_id);
    },
    async startInterview(item) {
      try {
        // await navigator.mediaDevices.getUserMedia({ audio: true });
        this.ActionObj = item;
        this.InterViewDialog = true;
      } catch (err) {
        console.error("Microphone access denied:", err);
      }
    },
    async InterViewDialogEmit(Toggle) {
      this.InterViewDialog = false;
      if (Toggle == 2) {
        this.Job_Oppurtunities = await this.listJobDescriptionsMethod();
        this.InterViewDoneDialog = true;
      }
    },

    InterViewDoneDialogEmit() {
      this.InterViewDoneDialog = false;
    },
    FindJobsCardEmit() {
      this.InterviewStatus = false;
      this.InterViewError = "";
      this.$emit("clicked");
    },
  },
};
</script>

<style>
.pre-formatted-text {
  white-space: pre-wrap !important;
}
</style>
