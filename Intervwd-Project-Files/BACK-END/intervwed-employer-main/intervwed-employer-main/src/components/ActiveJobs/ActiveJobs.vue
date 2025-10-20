<template>
  <div>
    <OverlayPage :overlay="overlay" />
    <SnackBar
      v-model="snackbar.show"
      :snackbar-text="snackbar.text"
      :snackbar-color="snackbar.color"
      :timeout="snackbar.timeout"
    />
    <v-card flat>
      <v-card-text>
        <v-row>
          <div class="d-flex align-center mt-4 ml-4">
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
          </div>
          <v-spacer></v-spacer>
          <v-btn
            class="ma-2 rounded-lg ml-n4 button text-blue"
            @click="createJob"
            size="small"
            variant="outlined"
          >
            <v-icon start class="mt-n1">mdi-plus</v-icon> CREATE JOB
          </v-btn>
        </v-row>
        <v-divider class="mt-6"></v-divider>

        <v-tabs-items v-model="TabValue">
          <v-tab-item v-if="TabValue == 0">
            <v-card
              v-if="responseArray && responseArray.length == 0"
              height="100px"
              flat
            >
              <div class="mt-10">No job opportunity have been created</div>
            </v-card>
            <v-card
              :loading="loading"
              v-for="job in responseArray"
              :key="job.job_code"
              class="pa-4 mb-4 mt-6"
              rounded="lg"
              variant="outlined"
              style="border-color: #8cb1ee"
              :style="
                this.$store.getters.get_currentuser_details.user_role ==
                  'MANAGER' &&
                this.$store.getters.get_currentuser_details.user_role ===
                  job.created_user_type &&
                this.$store.getters.get_currentuser_details.user_id ===
                  job.created_by_user_id
                  ? 'background-color: #FFF8E1'
                  : ''
              "
              @click="openDetailsModal(job, TabValue)"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-h6 font-weight-bold">
                  {{ job.job_title }}
                </div>

                <div
                  v-if="
                    this.$store.getters.get_currentuser_details.user_role ==
                      'OWNER' ||
                    (this.$store.getters.get_currentuser_details.user_role ==
                      job.created_user_type &&
                      this.$store.getters.get_currentuser_details.user_id ==
                        job.created_by_user_id)
                  "
                >
                  <!-- <v-btn
                    icon
                    size="small"
                    variant="outlined"
                    color="blue"
                    @click.stop="handleEditClick(job)"
                    class="mr-2"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                  </v-btn>

                  <v-btn
                    icon
                    size="small"
                    variant="outlined"
                    color="red"
                    @click.stop="handleDeleteClick(job)"
                  >
                    <v-icon size="small">mdi-close-octagon</v-icon>
                  </v-btn> -->
                </div>
              </div>

              <div
                class="text-subtitle-2 text-medium-emphasis mb-3 ml-n1 d-flex flex-wrap"
              >
                <v-icon v-if="job.city != '-'">mdi-map-marker</v-icon>
                <span v-if="job.city != '-'"
                  >{{ job.city }} , {{ job.country }}.</span
                >
                <!-- &bull; &bull; applicants -->

                <v-chip
                  class="mr-2 mb-2"
                  color="green"
                  text-color="#1e293b"
                  x-small
                  density="compact"
                  v-if="job.make_this_job_publicly_searchable == 'PUBLIC'"
                >
                  <!-- Access the skill property inside the object -->
                  <v-icon color="green" class="mr-2" x-small>mdi-eye</v-icon>
                  Publicly Accessible
                </v-chip>
                <v-chip
                  class="mr-2 mb-2"
                  color="orange"
                  text-color="#1e293b"
                  x-small
                  density="compact"
                  v-else-if="job.make_this_job_publicly_searchable == 'PRIVATE'"
                >
                  <!-- Access the skill property inside the object -->
                  <v-icon color="orange" class="mr-2" small>mdi-lock</v-icon>
                  By Invite Only
                </v-chip>
                <!-- <span class="text-subtitle-2">
              Job Code:
              <span class="font-weight-bold">{{ job.job_code }}</span>
              <v-icon
                class="ml-2"
                x-small
                color="grey"
                @click="copyToClipBoard(job.job_code)"
                >mdi-content-copy</v-icon
              >
            </span> -->

                <v-btn
                  class="text-capitalize mt-1"
                  variant="outlined"
                  size="x-small"
                  bg-color="grey"
                  color="blue"
                  @click.stop="copyToClipBoard(job.job_code_link)"
                >
                  <span class="fontsize10px">{{ job.job_code }}</span>
                  <v-icon size="12" class="ml-2 cursor-pointer" color="black">
                    mdi-content-copy
                  </v-icon>
                </v-btn>
              </div>

              <div class="d-flex flex-wrap mb-3 mt-n2">
                <b class="mt-1"> JOB DESCRIPTION: </b>
                <span class="ml-2 mt-1" v-bind="props">
                  {{
                    job.job_description.length > 170
                      ? job.job_description.slice(0, 170) + "..."
                      : job.job_description
                  }}</span
                >
              </div>
              <div class="d-flex flex-wrap mb-3 mt-n2">
                <b class="mt-1"> POSTED BY:</b>
                <span class="mt-1 ml-2">{{ job.created_by_user_name }}</span>
              </div>
            </v-card>
          </v-tab-item>
          <v-tab-item v-if="TabValue == 1">
            <v-card
              v-if="myJObresponseArray && myJObresponseArray.length == 0"
              height="100px"
              flat
            >
              <div class="mt-10">No job opportunity have been created</div>
            </v-card>
            <v-card
              :loading="loading"
              v-for="job in myJObresponseArray"
              :key="job.job_code"
              class="pa-4 mb-4 mt-6"
              rounded="lg"
              variant="outlined"
              style="border-color: #8cb1ee"
              :style="
                this.$store.getters.get_currentuser_details.user_role ==
                  'MANAGER' &&
                this.$store.getters.get_currentuser_details.user_role ===
                  job.created_user_type &&
                this.$store.getters.get_currentuser_details.user_id ===
                  job.created_by_user_id
                  ? 'background-color: #FFF8E1'
                  : ''
              "
              @click="openDetailsModal(job, TabValue)"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-h6 font-weight-bold">
                  {{ job.job_title }}
                </div>

                <div
                  v-if="
                    this.$store.getters.get_currentuser_details.user_role ==
                      'OWNER' ||
                    (this.$store.getters.get_currentuser_details.user_role ==
                      job.created_user_type &&
                      this.$store.getters.get_currentuser_details.user_id ==
                        job.created_by_user_id)
                  "
                >
                  <v-btn
                    icon
                    size="small"
                    variant="outlined"
                    color="blue"
                    @click.stop="handleEditClick(job)"
                    class="mr-2"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                  </v-btn>

                  <v-btn
                    icon
                    size="small"
                    variant="outlined"
                    color="red"
                    @click.stop="handleDeleteClick(job)"
                  >
                    <v-icon size="small">mdi-close-octagon</v-icon>
                  </v-btn>
                </div>
              </div>

              <div
                class="text-subtitle-2 text-medium-emphasis mb-3 ml-n1 d-flex flex-wrap"
              >
                <v-icon v-if="job.city != '-'">mdi-map-marker</v-icon>
                <span v-if="job.city != '-'"
                  >{{ job.city }} , {{ job.country }}.</span
                >
                <!-- &bull; &bull; applicants -->

                <v-chip
                  class="mr-2 mb-2"
                  color="green"
                  text-color="#1e293b"
                  x-small
                  density="compact"
                  v-if="job.make_this_job_publicly_searchable == 'PUBLIC'"
                >
                  <!-- Access the skill property inside the object -->
                  <v-icon color="green" class="mr-2" x-small>mdi-eye</v-icon>
                  Publicly Accessible
                </v-chip>
                <v-chip
                  class="mr-2 mb-2"
                  color="orange"
                  text-color="#1e293b"
                  x-small
                  density="compact"
                  v-else-if="job.make_this_job_publicly_searchable == 'PRIVATE'"
                >
                  <!-- Access the skill property inside the object -->
                  <v-icon color="orange" class="mr-2" small>mdi-lock</v-icon>
                  By Invite Only
                </v-chip>
                <!-- <span class="text-subtitle-2">
              Job Code:
              <span class="font-weight-bold">{{ job.job_code }}</span>
              <v-icon
                class="ml-2"
                x-small
                color="grey"
                @click="copyToClipBoard(job.job_code)"
                >mdi-content-copy</v-icon
              >
            </span> -->

                <v-btn
                  class="text-capitalize mt-1"
                  variant="outlined"
                  size="x-small"
                  bg-color="grey"
                  color="blue"
                  @click.stop="copyToClipBoard(job.job_code_link)"
                >
                  <span class="fontsize10px">{{ job.job_code }}</span>
                  <v-icon size="12" class="ml-2 cursor-pointer" color="black">
                    mdi-content-copy
                  </v-icon>
                </v-btn>
              </div>

              <div class="d-flex flex-wrap mb-3 mt-n2">
                <b class="mt-1"> JOB DESCRIPTION: </b>
                <span class="ml-2 mt-1" v-bind="props">
                  {{
                    job.job_description.length > 170
                      ? job.job_description.slice(0, 170) + "..."
                      : job.job_description
                  }}</span
                >
              </div>
              <div class="d-flex flex-wrap mb-3 mt-n2">
                <b class="mt-1"> POSTED BY:</b>
                <span class="mt-1 ml-2">{{ job.created_by_user_name }}</span>
              </div>
            </v-card>
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
    </v-card>

    <createJObComponent
      :createJObDialog="createJObDialog"
      @clicked="emitJobDialog"
    />
    <editJObComponent
      :showEditDialog="showEditDialog"
      :selectedJobForMenu="selectedJobForMenu"
      @clicked="emitEditJobDialog"
    />
    <InviteCandidate
      :showDetailsModal="showDetailsModal"
      :selectedJob="selectedJob"
      :selectedTab="selectedTab"
      @close="close_dialog"
    />

    <v-dialog v-model="showDeleteDialog" width="500px">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pa-4 d-flex align-center">
          Close This Job Opportunity
          <v-spacer></v-spacer>
        </v-card-title>

        <v-card-text class="text-center pt-5 pb-0">
          <v-icon color="red" size="48" icon="mdi-alert-circle"></v-icon>
        </v-card-text>

        <v-card-text class="text-center pt-2 pb-5">
          <p class="text-subtitle-1 font-weight-medium mb-2">
            {{ this.selectedJobForMenu.job_title }}
          </p>
          <p class="text-body-1">
            Are you sure you want to close this job opportunity?
          </p>
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
            @click="CloseJobDescriptionMethod()"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import createJObComponent from "@/components/ActiveJobs/createJObComponent.vue";
import editJObComponent from "@/components/ActiveJobs/editJObComponent.vue";
import InviteCandidate from "@/components/ActiveJobs/InviteCandidate.vue";
import OverlayPage from "@/components/OverlayPage.vue";
import { CloseJobDescription } from "@/graphql/mutations.js";
import { commonAPICallMethod } from "@/mixins/GetCurrentUserDetails.js";
import SnackBar from "@/components/SnackBar.vue";
import {
  ListJobDescriptions,
  ListMyJobDescriptions,
} from "@/graphql/queries.js";
import { generateClient } from "aws-amplify/api";

const client = generateClient();
export default {
  mixins: [commonAPICallMethod],
  components: {
    createJObComponent,
    editJObComponent,
    InviteCandidate,
    OverlayPage,
    SnackBar,
  },

  data() {
    return {
      TabValue: 0,
      created_user_type: "",
      showMenu: false,
      menuTarget: null,
      overlay: false,
      showEditDialog: false,
      showDeleteDialog: false,
      showInviteDialog: false,
      showJobCardModel: false,
      selectedJobForMenu: {},
      snackbar: {
        show: false,
        text: "",
        color: "success", // or "error" etc.
        timeout: 3000,
      },
      SnackBarComponent: {},
      msg: "",
      successmsg: "",
      menuItems: [
        {
          title: "Edit Job",
          prependIcon: "mdi-pencil",
          code: "edit",
        },
        { type: "divider" },
        {
          title: "Close Job",
          prependIcon: "mdi-close-octagon",
          code: "delete",
        },
      ],
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
      changetxt: "",
      drawer: false, // Controls the visibility of the navigation drawer
      tab: "jobs", // Controls the active tab
      createJObDialog: false,
      showDetailsModal: false,
      createManager: false,
      openRechargeDialog: false,
      count: 0,
      selectedTab: null,
      selectedJob: {},
      responseArray: [],
      myJObresponseArray: [],
      availableCredits: 250,
      costPerMinute: 2,
      loading: false,
      buttonItems: [
        {
          text: "Overall Active Jobs",
          color: "blue black--text",
          icon: "mdi-briefcase",
        },
        {
          text: "My Active Jobs",
          color: "portalPrimary white--text",
          icon: "mdi-briefcase",
        },
      ],
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
  watch: {
    showJobCard(val) {
      this.showJobCardModel = val;
    },
  },
  created() {
    this.ListJobDescriptionsMethod();
    this.GetCurrentUserDetailsMethod();
  },
  methods: {
    async ListJobDescriptionsMethod() {
      this.overlay = true;
      try {
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: ListJobDescriptions,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
              jd_status: "ACTIVE",
            },
          },
        });
        const response = JSON.parse(result.data.ListJobDescriptions);
        this.responseArray = response.data.items;
        this.created_user_type = this.responseArray.map(
          (item) => item.created_user_type
        );
        console.log("responseArray", this.responseArray);

        this.overlay = false;

        return response;
      } catch (error) {
        this.responseArray = [];
        this.overlay = false;
        console.log("ListJobDescriptions_error", error);
        this.SnackbarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          SnackbarText: error.errors[0].message,
        };
      }
    },
    async ListMyJobDescriptionsMethod() {
      this.overlay = true;
      try {
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: ListMyJobDescriptions,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
              jd_status: "ACTIVE",
            },
          },
        });
        const response = JSON.parse(result.data.ListMyJobDescriptions);
        this.myJObresponseArray = response.data.items;
        this.created_user_type = this.myJObresponseArray.map(
          (item) => item.created_user_type
        );
        console.log("myJObresponseArray", this.myJObresponseArray);

        this.overlay = false;

        return response;
      } catch (error) {
        this.responseArray = [];
        this.overlay = false;
        console.log("ListMyJobDescriptions", error);
        this.SnackbarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          SnackbarText: error.errors[0].message,
        };
      }
    },
    async CloseJobDescriptionMethod() {
      this.overlay = true;
      try {
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: CloseJobDescription,
          variables: {
            input: {
              updater_user_id:
                this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
              jd_id: this.selectedJobForMenu.jd_id,
            },
          },
        });
        const response = JSON.parse(result.data.CloseJobDescription);
        this.showDeleteDialog = false;

        this.ListJobDescriptionsMethod();
        this.GetCurrentUserDetailsMethod();
        this.overlay = false;
        return response;
      } catch (error) {
        this.overlay = false;
        console.log("CloseJobDescription_error", error);
        this.SnackbarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          SnackbarText: error.errors[0].message,
        };
      }
    },
    checkButtonItem(idx) {
      this.TabValue = idx;
      if (idx == 0) {
        this.buttonItems[0].color = "blue white--text";
        this.buttonItems[1].color = "portalPrimary black--text";
        this.ListJobDescriptionsMethod();
      } else if (idx == 1) {
        this.buttonItems[1].color = "blue white--text";
        this.buttonItems[0].color = "portalPrimary black--text";
        this.ListMyJobDescriptionsMethod();
      }
      this.$forceUpdate();
    },
    async show(evt, job) {
      console.log("   this.selectedJobForMenu", job);

      this.selectedJobForMenu = job;

      if (this.showMenu) {
        this.showMenu = false;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      this.menuTarget = evt.target.closest(".v-icon");
      this.showMenu = true;
    },
    handleEditClick(job) {
      console.log("Edit Action on Job Code:", job.job_code);

      this.selectedJobForMenu = job;

      this.showEditDialog = true;
    },

    handleDeleteClick(job) {
      console.log("Delete Action on Job Code:", job.job_code);

      this.selectedJobForMenu = job;

      this.showDeleteDialog = true;
    },
    handleMenuClick(event) {
      const itemCode = event.id;
      const job = this.selectedJobForMenu; // This is the selected job!

      console.log("Action on Job Code:", job.job_code);
      console.log("Action taken:", itemCode);

      this.showMenu = false;

      switch (itemCode) {
        case "edit":
          // 🚀 Use job.job_code (or job.job_id) to populate the edit form
          // e.g., this.loadJobForEdit(job.job_code);
          this.showEditDialog = true;
          break;
        case "delete":
          // ⚠️ Use job.job_code (or job.job_id) to confirm which job to close
          // You may want to store this.selectedJobForMenu for use in the delete confirmation dialog
          this.showDeleteDialog = true;
          break;
        default:
          break;
      }
    },

    getAvatarColor(initials) {
      const colors = ["#4E8EF6", "#059669", "#9D174D", "#CA8A04"];
      const index =
        (initials.charCodeAt(0) + initials.charCodeAt(1)) % colors.length;
      return colors[index];
    },
    openAddManagerModal() {
      this.count = 1;
    },
    deleteManager(managerId) {
      console.log(`Attempting to delete manager with ID: ${managerId}`);
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
    logout() {
      this.$router.push({ name: "LoginPage" });
    },
    openDetailsModal(job, tabValue) {
      this.selectedJob = job;
      this.selectedTab = tabValue; // store the tab value if needed
      this.showDetailsModal = true; // open the modal
      console.log("Selected Tab:", tabValue); // optional for debugging
    },
    openRechargeModal() {
      this.openRechargeDialog = true;
    },
    createJob() {
      this.createJObDialog = true;
    },
    emitJobDialog(Toggle) {
      if (Toggle == 1) {
        this.createJObDialog = false;
      }
      this.createJObDialog = false;
      this.TabValue = 1;
      this.ListMyJobDescriptionsMethod();
      this.GetCurrentUserDetailsMethod();
    },
    emitEditJobDialog(Toggle) {
      if (Toggle == 1) {
        this.showEditDialog = false;
      }
      this.TabValue = 1;
      this.showEditDialog = false;
      this.ListMyJobDescriptionsMethod();
    },

    // Method to close the job details view
    closeJobDetails() {
      this.selectedJob = null;
      this.showInviteDialog = false;
      this.TabValue = 1; // Reset dialog state too
    },
    // emitDialog(Toggle) {
    //   if (Toggle) this.createJObDialog = false;
    // },
    emitRechargeDialog(Toggle) {
      if (Toggle) this.openRechargeDialog = false;
    },
    close_dialog() {
      this.showDetailsModal = false;
      this.ListJobDescriptionsMethod();
      this.GetCurrentUserDetailsMethod();
    },
  },
};
</script>

<!-- http://192.168.1.21:8080/ -->
