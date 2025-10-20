<template>
  <div>
    <v-card
      class="pa-4 mb-6 mt-5"
      rounded="lg"
      elevation="0"
      variant="outlined"
      style="border-color: #e0e0e0"
    >
      <v-card-text>
        <v-row>
          <h2 class="mt-3 ml-4">Interviews Completed</h2>
          <v-spacer></v-spacer>
        </v-row>
        <v-divider class="mt-4"></v-divider>

        <v-row class="py-4 px-3">
          <v-col cols="12">
            <v-text-field
              v-model="search"
              label="Search by candidate name, email, job title, or job code..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
        </v-row>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="responseArray"
          :search="search"
          item-value="interview_id"
          v-model:expanded="expanded"
          class="elevation-0"
        >
          <!-- JOB -->
          <template v-slot:[`item.job_title`]="{ item }">
            <span class="font-weight-medium">{{ item.job_title }}</span>
            <div class="text-caption text-medium-emphasis">
              {{ item.job_code }}
            </div>
          </template>

          <!-- CANDIDATE -->
          <template v-slot:[`item.interviewed_user_name`]="{ item }">
            <div class="font-weight-medium">
              {{ item.interviewed_user_name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.interviewed_user_email_id }}
            </div>
          </template>

          <template v-slot:[`item.interview_duration_seconds`]="{ item }">
            <div class="py-2">
              {{ formatDuration(item.interview_duration_seconds) }}
            </div>
          </template>

          <!-- DATE -->
          <template v-slot:[`item.interview_scheduled_on`]="{ item }">
            <div class="py-2">
              <div class="text-caption text-medium-emphasis">
                {{ formatDate(item.interview_scheduled_on) }}
              </div>
            </div>
          </template>

          <!-- RATING -->
          <template v-slot:[`item.interview_ratings`]="{ item }">
            <div v-if="item.interview_ratings" class="d-flex align-center">
              <v-icon
                size="small"
                :color="
                  getRatingColor(getNumericRating(item.interview_ratings))
                "
                >mdi-star</v-icon
              >
              <span
                :class="[
                  'ml-1 font-weight-bold',
                  getRatingColorClass(getNumericRating(item.interview_ratings)),
                ]"
              >
                {{ getNumericRating(item.interview_ratings).toFixed(1) }}
              </span>
            </div>
            <div v-else>-</div>
          </template>

          <!-- ACTION -->
          <template v-slot:[`item.action`]="{ item }">
            <v-btn
              variant="outlined"
              size="x-small"
              color="primary"
              @click="toggleExpand(item)"
            >
              {{ isExpanded(item) ? "Hide Details" : "View Details" }}
            </v-btn>
          </template>

          <!-- NO DATA -->
          <template v-slot:no-data>
            <div class="pa-4 text-center text-medium-emphasis">
              No interviews have been attended for this job yet.
            </div>
          </template>

          <!-- EXPANDED ROW -->
          <template v-slot:expanded-row="{ item }">
            <tr>
              <td :colspan="headers.length" style="padding: 10; border: none">
                <v-card class="ma-4 pa-4" elevation="0" variant="flat">
                  <v-row>
                    <!-- Audio -->
                    <!-- <v-col cols="12" md="12">
                      <v-card elevation="0" class="pa-4 border">
                        <div
                          class="text-subtitle-1 font-weight-bold d-flex align-center mb-2"
                        >
                          <v-icon color="blue-grey" class="mr-2"
                            >mdi-volume-high</v-icon
                          >
                          Interview Audio Recording
                        </div>
                        <audio
                          controls
                          style="width: 100%"
                          :src="`https://intervwd-files.s3.us-east-1.amazonaws.com/${item.interview_audio}`"
                        ></audio>
                      </v-card>
                    </v-col> -->

                    <!-- Transcript -->
                    <v-col cols="12" md="12">
                      <v-card elevation="0" class="pa-4 border">
                        <div
                          class="text-subtitle-1 font-weight-bold d-flex align-center mb-2"
                        >
                          <v-icon color="blue-grey" class="mr-2"
                            >mdi-file-document-outline</v-icon
                          >
                          Interview Transcript
                        </div>

                        <div
                          v-if="
                            formatTranscript(item.transcript_text).length > 0
                          "
                          class="chat-log-container"
                        >
                          <div
                            v-for="(msg, index) in formatTranscript(
                              item.transcript_text
                            )"
                            :key="index"
                            class="chat-message-row"
                            :class="msg.role"
                          >
                            <div class="chat-bubble">
                              <div class="message-role">
                                <strong>{{
                                  msg.role.charAt(0).toUpperCase() +
                                  msg.role.slice(1)
                                }}</strong>
                              </div>
                              <p class="message-text">{{ msg.text }}</p>
                            </div>
                          </div>
                        </div>

                        <div
                          v-else
                          class="text-center text-medium-emphasis py-4"
                        >
                          No transcript found.
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ListInterviewsForTheJob } from "@/graphql/queries.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export default {
  props: { selectedJobObject: Object },
  data() {
    return {
      search: "",
      expanded: [],
      responseArray: [],
      headers: [
        { title: "JOB", key: "job_title" },
        { title: "CANDIDATE", key: "interviewed_user_name" },
        { title: "DATE", key: "interview_scheduled_on" },
        { title: "DURATION", key: "interview_duration_seconds" },
        { title: "RATING", key: "interview_ratings" },
        { title: "ACTION", key: "action" },
      ],
    };
  },
  mounted() {
    this.fetchInterviews();
  },
  methods: {
    async fetchInterviews() {
      try {
        const result = await client.graphql({
          query: ListInterviewsForTheJob,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
              jd_id: this.selectedJobObject.jd_id,
            },
          },
        });
        const response = JSON.parse(result.data.ListInterviewsForTheJob);

        // ensure each row has unique interview_id
        this.responseArray = response.data.items.map((item, index) => ({
          ...item,
          interview_id: item.interview_id || `int-${index}`,
        }));
        console.log(this.responseArray);
      } catch (error) {
        console.error("Error loading interviews", error);
      }
    },

    toggleExpand(item) {
      const id = item.interview_id;
      // toggle only this row
      this.expanded = this.expanded.includes(id) ? [] : [id];
    },

    isExpanded(item) {
      return this.expanded.includes(item.interview_id);
    },

    formatTranscript(transcript) {
      if (!Array.isArray(transcript)) return [];

      return transcript
        .filter((msg) => msg.text && msg.text.trim() !== "") // remove empty ones
        .map((msg) => ({
          role: msg.speaker.toLowerCase() === "user" ? "user" : "assistant",
          text: msg.text.replace(/{.*?}/g, "").trim(), // remove JSON-like garbage
        }));
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      const day = date.getDate();
      const suffix = (d) => {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      };
      const monthYear = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const time = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${day}${suffix(day)} ${monthYear.replace(" ", ", ")} at ${time}`;
    },

    getRatingColor(rating) {
      if (rating >= 4.0) return "green-darken-1";
      if (rating >= 3.5) return "blue-darken-1";
      return "orange-darken-1";
    },

    getNumericRating(ratingStr) {
      if (!ratingStr) return 0;
      const num = parseFloat(ratingStr.split("/")[0]); // get the number before "/"
      return isNaN(num) ? 0 : num;
    },
    getRatingColorClass(rating) {
      if (rating >= 4.0) return "text-green-darken-1";
      if (rating >= 3.5) return "text-blue-darken-1";
      return "text-orange-darken-1";
    },
    formatDuration(seconds) {
      if (!seconds || isNaN(seconds)) return "0.00 Mins";
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}.${remainingSeconds.toString().padStart(2, "0")} Mins`;
    },
  },
};
</script>

<style scoped>
.v-card {
  transition: transform 0.2s;
}
:deep(.v-data-table-header th) {
  font-size: 0.75rem !important;
  text-transform: uppercase !important;
  font-weight: bold !important;
}
/* Style for the detail cards to match the screenshot */
.border {
  border: 1px solid #e0e0e0;
}
.v-data-table {
  text-align: left !important;
}
.chat-log-container {
  padding: 10px;
  max-width: 800px; /* Optional: Limit width for a cleaner chat look */
  margin: 0 auto;
}

.chat-message-row {
  display: flex; /* Use flexbox to position the bubble */
  margin-bottom: 15px;
}

.chat-bubble {
  max-width: 70%; /* Limit the bubble width */
  padding: 10px 15px;
  border-radius: 18px;
  line-height: 1.4;
}

/* -------------------- ASSISTANT STYLES -------------------- */
.chat-message-row.assistant {
  justify-content: flex-start; /* Aligns assistant bubble to the left */
}

.chat-message-row.assistant .chat-bubble {
  background-color: #e5e5ea; /* Light gray bubble */
  color: #000;
  border-bottom-left-radius: 4px; /* "Tail" effect */
}

/* -------------------- USER STYLES -------------------- */
.chat-message-row.user {
  justify-content: flex-end; /* Aligns user bubble to the right */
}

.chat-message-row.user .chat-bubble {
  background-color: #007bff; /* Primary color bubble (e.g., blue) */
  color: white;
  border-bottom-right-radius: 4px; /* "Tail" effect */
}

/* Role header inside the bubble */
.message-role {
  font-size: 0.8em;
  opacity: 0.8;
  margin-bottom: 5px;
}
.chat-message-row.user .message-role {
  text-align: right;
}
</style>
