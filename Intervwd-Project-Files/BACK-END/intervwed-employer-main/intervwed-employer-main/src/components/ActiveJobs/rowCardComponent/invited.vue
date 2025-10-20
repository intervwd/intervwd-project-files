<template>
  <div>
    <v-card
      flat
      class="mt-4"
      elevation="0"
      variant="outlined"
      style="border-color: #e0e0e0"
    >
      <v-table density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Email Address</th>
            <th class="text-left">Invited Date</th>
            <th class="text-left">Status</th>
            <th class="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(candidate, i) in candidates" :key="i">
            <td>
              <v-icon size="small" class="mr-1" color="grey">mdi-email</v-icon>
              {{ candidate.email }}
            </td>
            <td>{{ candidate.date }}</td>
            <td>
              <v-chip
                v-if="candidate.status === 'Opened'"
                size="small"
                color="blue"
                text-color="blue-darken-2"
              >
                {{ candidate.status }}
              </v-chip>
              <v-chip
                v-else-if="candidate.status === 'In progress'"
                size="small"
                color="green"
                text-color="green-darken-2"
              >
                {{ candidate.status }}
              </v-chip>
              <v-chip
                v-else
                size="small"
                color="grey"
                text-color="grey-darken-2"
              >
                {{ candidate.status }}
              </v-chip>
            </td>
            <td>
              <v-icon color="error" @click="removeCandidate(i)" x-small
                >mdi-delete</v-icon
              >
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
<script>
// import InterviewCompleted from "@/components/Interviewed/InterviewCompleted.vue";
import ComingSoon from "@/components/ComingSoon.vue";
import JobDescription from "./rowCardComponent/jobDescription.vue";

export default {
  props: {
    showDetailsModal: Boolean,
    selectedJob: Object,
  },
  components: {
    // InterviewCompleted,
    ComingSoon,
    JobDescription,
  },
  data() {
    return {
      dialog: false,
      showInviteDialog: false,
      TabValue: 0,
      Current_view: "",
      buttonItems: [
        {
          text: "About Job",
          color: "blue white--text",
          icon: "mdi-format-list-bulleted",
        },
        {
          text: "Interviewed",
          color: "portalPrimary black--text",
          icon: "mdi-account-multiple",
        },
        {
          text: "Invited",
          color: "portalPrimary black--text",
          icon: "mdi-certificate",
        },
      ],
      selectedJobObject: {},
      candidates: [
        {
          email: "john.doe@example.com",
          date: "Oct 9, 10:30 AM",
          status: "Not opened",
        },
        {
          email: "jane.smith@example.com",
          date: "Oct 9, 08:15 AM",
          status: "Opened",
        },
        {
          email: "alex.brown@example.com",
          date: "Oct 8, 04:45 PM",
          status: "In progress",
        },
        {
          email: "maria.garcia@example.com",
          date: "Oct 8, 02:20 PM",
          status: "Not opened",
        },
        {
          email: "robert.lee@example.com",
          date: "Oct 7, 11:00 AM",
          status: "Opened",
        },
      ],
    };
  },
  watch: {
    showDetailsModal(val) {
      this.dialog = val;

      this.selectedJobObject = this.selectedJob;
    },
  },
  methods: {
    removeCandidate(index) {
      this.candidates.splice(index, 1);
    },
    close() {
      this.$emit("close");
    },
    checkButtonItem(idx) {
      this.TabValue = idx;
      if (idx == 0) {
        this.buttonItems[0].color = "blue white--text";
        this.buttonItems[1].color = "portalPrimary black--text";
        this.buttonItems[2].color = "portalPrimary black--text";
      } else if (idx == 1) {
        this.buttonItems[1].color = "blue white--text";
        this.buttonItems[2].color = "portalPrimary black--text";
        this.buttonItems[0].color = "portalPrimary black--text";
      } else if (idx == 2) {
        // this.Current_view = "INTERVIEW_COMPLETED";
        this.buttonItems[2].color = "blue white--text";
        this.buttonItems[0].color = "portalPrimary black--text";
        this.buttonItems[1].color = "portalPrimary black--text";
      }
      this.$forceUpdate();
    },
  },
};
</script>
<style scoped>
.text-h6 {
  font-size: 18px;
}
.v-table th {
  font-weight: 600;
}
.pre-formatted-text {
  /* This directive tells the browser to:
     1. Preserve line breaks (\n).
     2. Wrap text when it reaches the edge of the container. */
  white-space: pre-wrap;
}
</style>
