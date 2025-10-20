<template>
  <v-container class="pa-6 mx-3" fluid>
    <div class="mb-6 mt-n4">
      <h2 class="text-h6 font-weight-bold">Interview History</h2>
      <p class="text-body-2 text-medium-emphasis">
        View your completed interviews with transcripts
      </p>
    </div>

    <v-data-table
      :headers="headers"
      :items="interviews"
      item-value="interview_id"
      v-model:expanded="expanded"
      class="rounded-lg elevation-1 font-mono"
      density="comfortable"
      hide-default-footer
      :loading="TableLoading"
      items-per-page="200"
    >
      <template v-slot:[`item.action`]="{ item }">
        <v-btn
          size="small"
          color="GreenColorVariant1"
          variant="tonal"
          class="text-capitalize"
          @click="toggleExpand(item.interview_id)"
        >
          <span class="fontsize12px">View Details</span>
          <v-icon right size="small">
            {{
              expanded.includes(item.interview_id)
                ? "mdi-chevron-up"
                : "mdi-chevron-down"
            }}
          </v-icon>
        </v-btn>
      </template>

      <template v-slot:[`item.interview_started_on`]="{ item }"
        ><span class="fontsize12px">{{
          formatDate(item.interview_started_on)
        }}</span></template
      >
      <template v-slot:[`item.interview_completed_on`]="{ item }"
        ><span class="fontsize12px">{{
          formatInterviewDuration(
            item.interview_started_on,
            item.interview_completed_on
          )
        }}</span></template
      >

      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-4 bg-grey-lighten-3">
            <!-- <div class="mb-4">
              <h3 class="heading d-flex align-center mb-2">
                <v-icon class="mr-2" color="primary">mdi-volume-high</v-icon>
                Audio Recording
              </h3>
              <v-sheet class="pa-2 rounded-lg elevation-1">
                <audio controls style="width: 100%">
                  <source
                    :src="`https://intervwd-files.s3.us-east-1.amazonaws.com/${item.interview_audio}`"
                    type="audio/mp3"
                  />
                </audio>
              </v-sheet>
            </div> -->

            <div class="mt-2">
              <div class="heading d-flex align-center mb-2">
                <v-icon class="mr-2" color="green"
                  >mdi-file-document-outline</v-icon
                >
                Interview Transcript
              </div>
              <v-card
                v-if="item.transcript_text"
                outlined
                class="pa-4 rounded-lg"
              >
                <div
                  v-for="(line, idx) in mergeTranscript(item.transcript_text)"
                  :key="idx"
                  class="mb-3"
                >
                  <span class="font-weight-medium fontsize12px text-black"
                    >{{ line.speaker == "USER" ? "ME" : "INTERVIEWER" }} :
                  </span>
                  <span class="text-grey-darken-1">{{ line.text }}</span>
                </div>
              </v-card>
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import { ListMYInterviewsFunction } from "@/Mixins/InterView/ListMyInterviews.js";
export default {
  mixins: [ListMYInterviewsFunction],
  data() {
    return {
      expanded: [],
      TableLoading: false,
      headers: [
        { title: "JOB ID", value: "job_code" },
        { title: "JOB TITLE", value: "job_title" },
        { title: "COMPANY", value: "organization_name" },
        { title: "DATE", value: "interview_started_on" },
        { title: "DURATION", value: "interview_completed_on" },
        { title: "ACTION", value: "action", sortable: false },
      ],
      interviews: [],
    };
  },
  async mounted() {
    this.interviews = await this.listMYInterviewsMethod();
  },
  methods: {
    // mergeTranscript(transcript) {
    //   const merged = [];
    //   let current = null;

    //   for (const line of transcript) {
    //     if (line.text && line.text.includes('"interrupted"')) {
    //       continue;
    //     }

    //     if (current && current.speaker === line.speaker) {
    //       current.text += " " + line.text;
    //     } else {
    //       if (current) merged.push(current);
    //       current = { ...line };
    //     }
    //   }

    //   if (current) merged.push(current);
    //   return merged;
    // },
    mergeTranscript(transcript) {
      const merged = [];
      let current = null;

      for (const line of transcript) {
        if (line.text && line.text.includes('"interrupted"')) {
          continue;
        }

        if (current && current.speaker === line.speaker) {
          current.text += " " + line.text;
        } else {
          if (current) merged.push(current);
          current = { ...line };
        }
      }

      if (current) merged.push(current);

      // ❌ Remove the first item if it's USER
      if (merged.length > 0 && merged[0].speaker === "USER") {
        merged.shift();
      }

      return merged;
    },
    formatDate(dateString) {
      const date = new Date(dateString);

      const day = date.getDate();
      const getDaySuffix = (d) => {
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

      // Final format → e.g. 18th, Oct, 2025, 10:45 AM
      return `${day}${getDaySuffix(day)}, ${monthYear.replace(
        " ",
        ", "
      )}, ${time}`;
    },
    formatInterviewDuration(start, end) {
      if (!start || !end) return "00:00";

      const diffMs = end - start; // difference in milliseconds
      const totalSeconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}`;
    },
    toggleExpand(id) {
      if (this.expanded.includes(id)) {
        this.expanded = this.expanded.filter((e) => e !== id);
      } else {
        this.expanded = [id]; // only one row open at a time
      }
    },
  },
};
</script>
