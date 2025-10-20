<template>
  <div>
    <SnackBar :SnackBarComponent="SnackBarComponent" />
    <v-card
      v-if="selectedJob"
      class="pa-4 BorderRadius10Px cardOutline elevation-0 mt-2"
      outlined
      color="#f0fdf4"
    >
      <div class="d-flex">
        <div class="fontsize20px font-weight-bold">
          {{ selectedJob.job_title }}

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
              The interview will last up to 5 minutes. Our AI interviewer will
              assess your skills, experience, and communication abilities based
              on this job's requirements.
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
            v-if="selectedJob.skills_needed && selectedJob.skills_needed.length"
          >
            <v-chip
              v-for="(skill, index) in parsedSkills(selectedJob.skills_needed)"
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

    <div v-else class="fontsize20px text-center">
      You Are Not Allowed to take this Interview
    </div>
  </div>
</template>

<script>
import { ListJobByCodeFunction } from "@/Mixins/Findjobs/ListJobByCode.js";
import SnackBar from "../Extras/SnackBar.vue";

export default {
  components: { SnackBar },
  mixins: [ListJobByCodeFunction],
  data: () => ({
    SnackBarComponent: {},
    selectedJob: {},
    InterviewStatus: false,
    InterViewError: "",
  }),
  async mounted() {
    this.selectedJob = await this.listJobbyCodeMethod(
      this.$store.getters.get_job_id
    );
  },
  methods: {
    parsedSkills(skills) {
      if (!skills) return [];

      // ✅ Already an array
      if (Array.isArray(skills)) {
        return skills;
      }

      // ✅ String that looks like an array "[...]" → clean and split
      if (typeof skills === "string") {
        let cleaned = skills.trim();

        // remove leading [ and trailing ]
        if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
          cleaned = cleaned.slice(1, -1);
        }

        // split by comma and trim spaces
        return cleaned.split(",").map((s) => s.trim());
      }

      return [];
    },
  },
};
</script>

<style></style>
