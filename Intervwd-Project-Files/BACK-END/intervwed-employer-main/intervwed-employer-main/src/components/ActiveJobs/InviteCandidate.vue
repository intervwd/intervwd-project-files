<template>
  <v-dialog v-model="dialog" max-width="900px" persistent>
    <v-card rounded="lg" class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between">
        <div>
          <div class="text-h6 font-weight-bold">
            {{ selectedJobObject.job_title }}
          </div>
          <div class="text-body-2 text-grey-darken-1 mt-2">
            <!-- San Francisco, CA (Remote) •  -->

            Job Code: <strong> {{ selectedJobObject.job_code }}</strong>
          </div>
        </div>
        <v-btn icon variant="text" @click="close()">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Tabs -->
      <div class="d-flex align-center mt-4">
        <v-btn
          small
          :color="item.color"
          v-for="(item, idx) in buttonItems"
          @click="checkButtonItem(idx)"
          class="mr-4 rounded-lg button mt-n1"
          :key="idx"
          size="small"
        >
          <v-icon small class="mr-1">{{ item.icon }}</v-icon>
          <b>{{ item.text }}</b></v-btn
        >

        <v-spacer></v-spacer>
        <v-btn
          color="blue"
          size="small"
          @click="showInviteDialog = true"
          class="mt-n4"
          v-if="selectedTab != 0"
        >
          <v-icon left class="mr-2">mdi-email-check</v-icon>
          Invite Candidate
        </v-btn>
      </div>
      <v-tabs-items v-model="TabValue">
        <v-tab-item v-if="TabValue == 0">
          <jobDescription :selectedJobObject="selectedJobObject" />
        </v-tab-item>
        <v-tab-item v-if="TabValue == 1">
          <interviewedCompleted :selectedJobObject="selectedJobObject" />
        </v-tab-item>
        <v-tab-item v-if="TabValue == 2">
          <v-card
            class="pa-4 mb-6 mt-5"
            rounded="lg"
            elevation="0"
            variant="outlined"
            style="border-color: #e0e0e0"
          >
            <v-card-text>
              <v-row>
                <h2 class="mt-3 ml-4">Invitations</h2>
                <v-spacer></v-spacer>
              </v-row>
              <v-divider class="mt-4"></v-divider>

              <v-row class="py-4 px-3">
                <v-col cols="12">
                  <v-text-field
                    v-model="search"
                    label="Search by email, or job code..."
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
                :items="invitationData"
                :search="search"
                :loading="loading"
                item-value="interview_id"
                class="elevation-0"
              >
                <template v-slot:[`item.invited_on`]="{ item }">
                  <span>{{ formatReadableDate(item.invited_on) }}</span>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </v-dialog>
  <v-dialog v-model="showInviteDialog" max-width="700" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h5">Invite Candidate</span>
        <v-btn
          icon
          @click="showInviteDialog = false"
          variant="text"
          size="small"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pa-6">
        <div class="mb-4">
          <span class="font-weight-bold">For:</span>
          {{ selectedJobObject.job_title }}
        </div>
        <div>Candidate Email Address *</div>
        <v-form ref="form">
          <v-text-field
            placeholder="candidate@example.com"
            variant="outlined"
            density="compact"
            class="mb-4"
            :rules="emailRules"
            v-model="InvEmailID"
          ></v-text-field>
          <div>Interview URL *</div>
          <v-text-field
            v-model="InvUrl"
            variant="outlined"
            density="compact"
            readonly
            class="mb-4"
          ></v-text-field>
          <div class="text-caption text-medium-emphasis mb-6">
            This URL will be included in the invitation email
          </div>
          <div>Custom Message (Optional) *</div>
          <vue-editor v-model="customMessage" />

          <div class="text-caption text-medium-emphasis mb-6">
            Leave blank to use the default invitation message
          </div>

          <v-alert
            color="blue"
            variant="tonal"
            icon="mdi-information-outline"
            class="mb-6"
          >
            <div class="font-weight-bold">Cost: 1 Credit per invitation</div>
            <div class="text-caption">
              The interview URL will be automatically included in the invitation
              email
            </div>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 d-flex justify-end">
        <v-btn variant="text" @click="showInviteDialog = false">Cancel</v-btn>
        <v-btn
          color="blue"
          variant="flat"
          @click="validate_save()"
          :loading="loading2"
          ><v-icon class="mr-2" small>mdi-send-outline</v-icon>Send
          Invitation</v-btn
        >
      </v-card-actions>
    </v-card>
    <SnackBar
      v-model="snackbar.show"
      :snackbar-text="snackbar.text"
      :snackbar-color="snackbar.color"
      :timeout="snackbar.timeout"
    />
  </v-dialog>
</template>

<script>
// import InterviewCompleted from "@/components/Interviewed/InterviewCompleted.vue";
// import invited from "@/components/ActiveJobs/rowCardComponent/invited.vue";
import interviewedCompleted from "@/components/ActiveJobs/rowCardComponent/interviewedCompleted.vue";
import JobDescription from "./rowCardComponent/jobDescription.vue";
import { VueEditor } from "vue3-editor";
import SnackBar from "@/components/SnackBar.vue";
import { InviteInverviewToCandidate } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
import { ListInvitedInverviewsForJD } from "@/graphql/queries.js";
export default {
  props: {
    showDetailsModal: Boolean,
    selectedJob: Object,
    selectedTab: Number,
  },
  components: {
    // InterviewCompleted,
    JobDescription,
    interviewedCompleted,
    SnackBar,
    VueEditor,
    // invited
  },
  data() {
    return {
      dialog: false,
      showInviteDialog: false,
      TabValue: 0,
      customMessage: "",
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
      invitationData: [],
      headers: [
        { title: "JOB", key: "job_title" },
        { title: "Job Id", key: "job_code" },
        { title: "Invitie", key: "invitie_email_id" },
        { title: "Invited By", key: "inviter_user_email_id" },
        { title: "Invited On", key: "invited_on" },
      ],
      search: "",
      InvUrl: "",
      InvEmailID: "",
      emailRules: [
        (v) => !!v || "Email is required",
        (v) => /.+@.+\..+/.test(v) || "Email must be valid",
      ],
      loading2: false,
      loading: false,
      snackbar: {
        show: false,
        text: "",
        color: "success", // or "error" etc.
        timeout: 3000,
      },
      msg: "",
      successmsg: "",
    };
  },
  watch: {
    showDetailsModal(val) {
      this.dialog = val;

      this.selectedJobObject = this.selectedJob;
      console.log("selectedJobObject", this.selectedJobObject);
      this.InvUrl = this.selectedJobObject.job_code_link;
      this.customMessage = `You have been invited to interview for the <strong>${this.selectedJobObject.job_title}</strong> position. This is an AI-powered voice interview that will assess your skills and experience. <br><br>Start your interview at: <a href="${this.selectedJobObject.job_code_link}" target="_blank">${this.selectedJobObject.job_code_link}</a>`;
    },
    TabValue(newVal) {
      if (newVal === 2) {
        // Call the API when user switches to "Invited" tab
        this.ListInvitationsMethod();
      }
    },
  },
  methods: {
    removeCandidate(index) {
      this.candidates.splice(index, 1);
    },
    close() {
      this.$emit("close");
      this.InvEmailID = "";
      this.InvUrl = this.selectedJobObject.job_code_link;
      this.customMessage = `You have been invited to interview for the <strong>${this.selectedJobObject.job_title}</strong> position. This is an AI-powered voice interview that will assess your skills and experience. <br><br>Start your interview at: <a href="${this.selectedJobObject.job_code_link}" target="_blank">${this.selectedJobObject.job_code_link}</a>`;
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
    async validate_save() {
      const { valid } = await this.$refs.form.validate();
      if (valid) this.sendInvite();
    },
    async sendInvite() {
      this.loading2 = true;
      try {
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: InviteInverviewToCandidate,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              jd_id: this.selectedJobObject.jd_id,
              invitie_email_id: this.InvEmailID,
              email_body: this.customMessage,
              interview_url: this.InvUrl,
            },
          },
        });
        const response = JSON.parse(result.data.InviteInverviewToCandidate);
        if (response.status === "Success") {
          this.showInviteDialog = false;
          this.snackbar.text = response.status_message;
          this.snackbar.color = "green";
          this.snackbar.show = true;
          this.ListInvitationsMethod();
        }
      } catch (err) {
        const errorMsg = err?.errors?.[0]?.message || "Something went wrong!";
        this.$emit("errorMsg", errorMsg);
        this.snackbar.text = errorMsg;
        this.snackbar.color = "red";
        this.snackbar.show = true;
      } finally {
        this.loading2 = false;
      }
    },
    async ListInvitationsMethod() {
      this.loading = true;
      try {
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: ListInvitedInverviewsForJD,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
              jd_id: this.selectedJobObject.jd_id,
            },
          },
        });
        const response = JSON.parse(result.data.ListInvitedInverviewsForJD);
        console.log("response", response);
        this.invitationData = response.data.items;
        console.log("responseArrayPayments", this.responseArrayPayments);
        this.loading = false;
        return response;
      } catch (error) {
        this.loading = false;
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
      } finally {
        this.loading = false;
      }
    },
    formatReadableDate(timestamp) {
      if (!timestamp) return "";
      const date = new Date(Number(timestamp));
      const options = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
      return date.toLocaleString("en-US", options);
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
