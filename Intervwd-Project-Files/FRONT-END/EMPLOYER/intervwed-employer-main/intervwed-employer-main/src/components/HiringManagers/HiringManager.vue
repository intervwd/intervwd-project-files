<template>
  <div>
    <OverlayPage :overlay="overlay" />
    <SnackBar
      v-model="snackbar.show"
      :snackbar-text="snackbar.text"
      :snackbar-color="snackbar.color"
      :timeout="snackbar.timeout"
    />
    <v-card flat rounded="lg" variant="outlined" style="border-color: #e0e0e0">
      <v-card-text>
        <v-row>
          <h2 class="mt-3 ml-4">Hiring Managers</h2>
          <v-spacer></v-spacer>
        </v-row>
        <v-divider class="mt-4"></v-divider>

        <div class="d-flex justify-space-between align-center mb-4">
          <p class="text-subtitle-1 text-medium-emphasis">
            Manage hiring managers who can create job opportunities and review
            job seekers
          </p>
          <v-btn
            color="#4E8EF6"
            class="text-capitalize ma-2 rounded-lg"
            x-small
            dense
            @click="openAddManagerModal"
            v-if="
              this.$store.getters.get_currentuser_details.user_role ==
                'OWNER' || CurrentView == ''
            "
          >
            <v-icon start>mdi-plus</v-icon>ADD HIRING MANAGER
          </v-btn>
        </div>
        <addHiringManager
          v-if="CurrentView == 'ADD_HIRING_MANAGER'"
          @clicked="emitaddmanager"
        />
        <v-card
          v-if="responseArray && responseArray.length == 0"
          height="100px"
          flat
        >
          <div class="mt-10">No hiring manager have been created</div>
        </v-card>
        <v-list class="pa-0 mt-3">
          <v-list-item
            v-for="manager in responseArray"
            :key="manager.user_id"
            :ripple="false"
            class="px-4 mb-2"
            rounded="lg"
            variant="outlined"
            style="border-color: #e0e0e0"
          >
            <template v-slot:prepend>
              <!-- <v-avatar
                color="blue-lighten-5"
                size="40"
                class="font-weight-bold"
                :style="{ color: getAvatarColor(manager.user_name) }"
              >
                {{ manager.user_name }}
              </v-avatar> -->
              <v-list-item-title class="font-weight-medium ml-3">
                {{ manager.user_name }}
              </v-list-item-title>
              <v-divider vertical class="ml-4"></v-divider>
              <v-list-item-subtitle class="ml-4">
                <v-icon small class="ml-2">mdi-email</v-icon>
                {{ manager.user_email_id }}
              </v-list-item-subtitle>
              <v-divider vertical class="ml-4"></v-divider>
              <span class="ml-5">Jobs Created</span>
              <br />
              <div class="ml-2 mr-2 text-blue">
                <b>{{ manager.active_jobs }}</b>
              </div>
              <v-divider vertical class="ml-4"></v-divider>
              <span class="ml-5">Interviews Conducted</span>
              <br />
              <div class="ml-2 mr-2 text-blue">
                <b>{{ manager.total_interview_conducted }}</b>
              </div>
              <v-divider vertical class="ml-4"></v-divider>
              <span class="ml-5">Jobs Closed</span>
              <br />
              <div class="ml-2 mr-2 text-blue">
                <b>{{ manager.closed_jobs }}</b>
              </div>
            </template>

            <template v-slot:append>
              <div class="d-flex align-center">
                <!-- <v-chip
                  color="red"
                  text-color="red"
                  label
                  class="font-weight-bold mr-4 ml-2"
                >
                  {{ manager.jobsCreated }}
                </v-chip> -->
                <v-btn
                  icon
                  v-if="
                    this.$store.getters.get_currentuser_details.user_role ==
                      'OWNER' || CurrentView == ''
                  "
                  variant="text"
                  size="small"
                  color="red"
                  @click="showItem(manager)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    <v-dialog v-model="showDeleteDialog" width="500px">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pa-4 d-flex align-center">
          Confirm Delete Manager
          <v-spacer></v-spacer>
        </v-card-title>

        <v-card-text class="text-center pt-5 pb-0">
          <v-icon color="red" size="48" icon="mdi-alert-circle"></v-icon>
        </v-card-text>

        <v-card-text class="text-center pt-2 pb-5">
          <p class="text-subtitle-1 font-weight-medium mb-2">
            {{ this.showObject.user_name }}
          </p>
          <p class="text-body-1">Are you sure you want to delete manager?</p>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="flat"
            class="rounded-lg"
            @click="deleteManagerMethod()"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import addHiringManager from "@/components/HiringManagers/addHiringManager.vue";
import OverlayPage from "@/components/OverlayPage.vue";
import { ListManagerUsers } from "@/graphql/queries.js";
import { DeleteManagerUser } from "@/graphql/mutations.js";
import SnackBar from "@/components/SnackBar.vue";
import { commonAPICallMethod } from "@/mixins/GetCurrentUserDetails.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
export default {
  mixins: [commonAPICallMethod],
  components: {
    addHiringManager,
    OverlayPage,
    SnackBar,
  },
  data() {
    return {
      newManager: {
        fullName: "",
        email: "",
      },
      showAddManagerDialog: false,
      showJobCardModel: false,
      showDeleteDialog: false,
      managerData: [
        {
          id: 1,
          name: "Sarah Johnson",
          email: "sarah@company.com",
          initials: "SJ",
          jobsCreated: 8,
        },
        {
          id: 2,
          name: "Michael Chen",
          email: "michael.c@company.com",
          initials: "MC",
          jobsCreated: 12,
        },
        {
          id: 3,
          name: "Emily Rodriguez",
          email: "emily@company.com",
          initials: "ER",
          jobsCreated: 5,
        },
        // Add more manager data here
      ],

      CurrentView: "",
      drawer: false, // Controls the visibility of the navigation drawer
      tab: "jobs", // Controls the active tab
      createJObDialog: false,
      showDetailsModal: false,
      createManager: false,
      openRechargeDialog: false,
      count: 0,
      selectedJob: {},
      responseArray: [],
      availableCredits: 250,
      costPerMinute: 2,
      overlay: false,
      snackbar: {
        show: false,
        text: "",
        color: "success", // or "error" etc.
        timeout: 3000,
      },
      msg: "",
      successmsg: "",
      showObject: {},
      transactionHistory: [
        {
          id: 1,
          type: "purchase",
          description: "Credits purchase",
          date: "01/02/2025",
          amount: 100,
        },
        {
          id: 2,
          type: "deduction",
          description: "Interview (5 min) - Senior Frontend Developer",
          date: "05/02/2025",
          amount: 10,
        },
        {
          id: 3,
          type: "deduction",
          description: "Interview (5 min) - Full Stack Engineer",
          date: "08/02/2025",
          amount: 10,
        },
        {
          id: 4,
          type: "purchase",
          description: "Credits purchase",
          date: "28/01/2025",
          amount: 150,
        },
      ].sort((a, b) => new Date(b.date) - new Date(a.date)), // Sort by date descending
    };
  },
  mounted() {
    this.ListManagerUsersInputMethod();
    this.GetCurrentUserDetailsMethod();
  },
  methods: {
    async ListManagerUsersInputMethod() {
      this.overlay = true;
      try {
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: ListManagerUsers,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
            },
          },
        });
        const response = JSON.parse(result.data.ListManagerUsers);
        this.responseArray = response.data.items;
        console.log("responseArray", this.responseArray);
        this.overlay = false;

        return response;
      } catch (error) {
        this.responseArray = [];
        this.overlay = false;
        console.log("ListManagerUsers_error", error);
        this.SnackbarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          SnackbarText: error.errors[0].message,
        };
      }
    },
    showItem(item) {
      this.showObject = item;
      this.showDeleteDialog = true;
    },
    getAvatarColor(initials) {
      // Define a set of consistent colors
      const colors = ["#4E8EF6", "#059669", "#9D174D", "#CA8A04"];

      if (!initials || initials.length === 0) {
        return colors[0]; // Default color for empty input
      }

      // Use the character code of the first letter.
      const code0 = initials.charCodeAt(0);

      // Safely use the second character code (or 0 if only one initial).
      const code1 = initials.length > 1 ? initials.charCodeAt(1) : 0;

      // Simple hash: Sum of the first two character codes, modulo the number of colors.
      const index = (code0 + code1) % colors.length;

      return colors[index];
    },
    openAddManagerModal() {
      this.CurrentView = "ADD_HIRING_MANAGER";
      // In a real app: this.$emit('openAddManagerModal');
    },
    async deleteManagerMethod() {
      try {
        this.loading = true;

        this.overlay = true;
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: DeleteManagerUser,
          variables: {
            input: {
              updater_user_id:
                this.$store.getters.get_currentuser_details.user_id,
              manager_user_id: this.showObject.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
            },
          },
        });
        const response = JSON.parse(result.data.DeleteManagerUser);
        console.log("response", response);
        this.loading = true;

        this.overlay = false;

        this.loading = false;
        this.overlay = false;
        this.showDeleteDialog = false;
        this.snackbar.show = true;
        this.snackbar.text = response.status_message;
        this.snackbar.color = "success";

        this.ListManagerUsersInputMethod();
        this.GetCurrentUserDetailsMethod();
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

    closeDialog() {
      // Reset form data
      this.newManager = { fullName: "", email: "" };
      // Close the dialog
      this.showAddManagerDialog = false;
    },

    emitaddmanager(Toggle) {
      if (Toggle) this.CurrentView = "";
      this.ListManagerUsersInputMethod();
      this.GetCurrentUserDetailsMethod();
    },
  },
};
</script>
