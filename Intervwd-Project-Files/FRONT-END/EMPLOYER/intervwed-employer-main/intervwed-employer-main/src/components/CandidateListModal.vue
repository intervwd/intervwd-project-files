<template>
  <v-dialog :model-value="showDetailsModal" max-width="800">
    <v-card rounded="lg">
      <v-card-title
        class="text-h6 font-weight-bold pa-4 d-flex justify-space-between align-center"
      >
        <span class="text-h5">{{ jobTitle }}</span>
        <v-btn icon @click="closeDialog" variant="text">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-4">
        <div class="text-subtitle-1 text-medium-emphasis mb-4">
          {{ jobLocation }} &bull; Job Code:
          <span class="font-weight-bold">{{ jobCode }}</span> &bull;
          {{ candidates.length }} interviews completed
        </div>

        <v-card
          v-for="candidate in candidates"
          :key="candidate.id"
          class="mb-4 pa-4"
          outlined
          rounded="lg"
        >
          <div class="d-flex justify-space-between align-center mb-3">
            <div class="text-h6 font-weight-bold">
              {{ candidate.name }}

              <v-chip
                :color="getRatingColor(candidate.overallRating)"
                label
                class="font-weight-medium rounded-lg"
              >
                <v-icon start size="small">mdi-star</v-icon>
                {{ candidate.overallRating.toFixed(1) }}
              </v-chip>
            </div>
          </div>

          <div class="text-subtitle-2 text-medium-emphasis mb-4">
            {{ candidate.email }} &bull; {{ candidate.country }} &bull;
            {{ candidate.time }} &bull; {{ candidate.date }}
          </div>

          <v-row dense class="mb-3">
            <v-col
              cols="12"
              md="3"
              v-for="(score, skill) in candidate.scores"
              :key="skill"
            >
              <v-card
                flat
                style="border-color: #e0e0e0"
                rounded="lg"
                variant="outlined"
              >
                <v-card-text class="ma-2">
                  <div
                    class="text-subtitle-2 font-weight-medium mb-1 text-capitalize"
                  >
                    {{ skill.replace(/([A-Z])/g, " $1").trim() }}
                  </div>
                  <!-- <v-progress-linear
                :model-value="(score / 5) * 100"
                height="8"
                rounded
                color="blue"
                class="mb-1"
              ></v-progress-linear> -->
                  <div class="text-caption font-weight-bold">
                    {{ score.toFixed(1) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div class="d-flex pt-2 mb-4">
            <v-btn
              color="blue"
              variant="flat"
              class="text-capitalize mr-3"
              @click="toggleTranscript(candidate)"
            >
              <v-icon start>{{
                candidate.showTranscript
                  ? "mdi-eye-off-outline"
                  : "mdi-file-document-outline"
              }}</v-icon>
              {{
                candidate.showTranscript ? "Hide Transcript" : "View Transcript"
              }}
            </v-btn>
            <v-btn
              color="blue"
              variant="outlined"
              class="text-capitalize"
              @click="downloadReport(candidate.id)"
            >
              <v-icon start>mdi-download</v-icon> Download
            </v-btn>
          </div>
          <v-divder></v-divder>
          <v-slide-y-transition>
            <div v-if="candidate.showTranscript">
              <div class="font-weight-medium mb-2">Interview Transcript</div>
              <v-card
                flat
                style="border-color: #e0e0e0"
                rounded="lg"
                variant="outlined"
                ><v-card-text classs="caption"
                  >[AI]: Hello! I'm your AI interviewer today. Let's start by
                  having you introduce yourself and tell me about your
                  background. [CANDIDATE]: Hi! My name is Sarah Johnson, and I'm
                  a senior frontend developer with 7 years of
                  experience..</v-card-text
                ></v-card
              >
            </div>
          </v-slide-y-transition>
        </v-card>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  // Prop to control visibility, passed from the parent dashboard component
  props: {
    showDetailsModal: Boolean,
    // Example props to pass job-specific data
    jobTitle: {
      type: String,
      default: "Senior Frontend Developer",
    },
    jobLocation: {
      type: String,
      default: "San Francisco, CA (Remote)",
    },
    jobCode: {
      type: String,
      default: "A7K9M2X5",
    },
  },
  data() {
    return {
      dialog: false,
      showTranscript: false,
      candidates: [
        {
          id: 1,
          name: "Sarah Johnson",
          email: "sarah@email.com",
          country: "United States",
          date: "Oct 8, 2025",
          time: "02:30 PM",
          overallRating: 4.8,
          scores: {
            technicalSkills: 5.0,
            communication: 5.0,
            problemSolving: 4.0,
            cultureFit: 5.0,
          },
        },
        {
          id: 2,
          name: "Michael Chen",
          email: "mchen@email.com",
          country: "Canada",
          date: "Oct 8, 2025",
          time: "11:15 AM",
          overallRating: 4.5,
          scores: {
            technicalSkills: 5.0,
            communication: 4.0,
            problemSolving: 5.0,
            cultureFit: 4.0,
          },
        },
        {
          id: 3,
          name: "Emily Rodriguez",
          email: "emily@email.com",
          country: "Mexico",
          date: "Oct 7, 2025",
          time: "04:45 PM",
          overallRating: 4.2,
          scores: {
            technicalSkills: 4.0,
            communication: 4.0,
            problemSolving: 4.0,
            cultureFit: 5.0,
          },
        },
        // Add more candidates here
      ],
    };
  },
  watch: {
    // showDetailsModal(newVal) {
    //   this.dialog = newVal;
    // },
    dialog(newVal) {
      if (!newVal) {
        this.$emit("close");
      }
    },
  },
  methods: {
    toggleTranscript(candidate) {
      // Toggle the state for the clicked candidate
      candidate.showTranscript = !candidate.showTranscript;

      // OPTIONAL UX: Hide transcripts for all other candidates
      this.candidates.forEach((c) => {
        if (c.id !== candidate.id) {
          c.showTranscript = false;
        }
      });
    },
    closeDialog() {
      this.dialog = false;
    },
    viewTranscript(candidateId) {
      console.log(`Viewing transcript for candidate ID: ${candidateId}`);
      // Implement logic to open the transcript view
    },
    downloadReport(candidateId) {
      console.log(`Downloading report for candidate ID: ${candidateId}`);
      // Implement logic to trigger file download
    },
    getRatingColor(rating) {
      if (rating >= 4.5) return "green";
      if (rating >= 4.0) return "light-green";
      return "orange";
    },
  },
};
</script>
