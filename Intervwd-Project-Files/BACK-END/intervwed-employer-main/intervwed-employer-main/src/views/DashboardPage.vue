<template>
  <div>
    <v-app-bar app flat color="white" border>
      <template v-slot:prepend>
        <v-img :src="appLogoPath" cover width="200px"></v-img>
      </template>
      <v-spacer></v-spacer>
      <template v-slot:append>
        <!-- <v-avatar
          color="blue-lighten-5"
          size="50"
          class="mr-3 cursor"
          @click="showProfile()"
        >
          <v-icon color="blue" size="30">mdi-account</v-icon>
        </v-avatar> -->

        <!-- <v-avatar
          size="50"
          class="elevation-2 mr-3 cursor"
          @click="showProfile()"
        >
          <template
            v-if="
              `https://intervwd-files.s3.us-east-1.amazonaws.com/${this.$store.getters.get_currentuser_details.organization_profile_picture}`
            "
          >
            <v-img
              :src="`https://intervwd-files.s3.us-east-1.amazonaws.com/${this.$store.getters.get_currentuser_details.organization_profile_picture}`"
              alt="Profile Picture"
              cover
              contain
              :aspect-ratio="16 / 9"
              class="rounded-circle"
              style="object-fit: contain; background: white"
            />
          </template>
          <template v-else>
            <v-icon color="blue" size="30">mdi-account</v-icon>>
          </template>
        </v-avatar> -->
        <div class="d-flex flex-column align-start">
          <v-app-bar-title class="font-weight-bold">
            <span class="org-link" @click="showProfile">
              {{ $store.getters.get_currentuser_details.organization_name }}
            </span>
          </v-app-bar-title>

          <div class="text-subtitle-1 text-medium-emphasis mt-n2">
            {{ this.$store.getters.get_user_email }}
          </div>
        </div>
        <v-btn
          icon
          color="red"
          @click="logout"
          :loading="logoutloading"
          class="text-capitalize ml-16 mt-2"
          ><v-icon>mdi-power</v-icon></v-btn
        >
      </template>
    </v-app-bar>

    <v-main style="background-color: #f5f5f5">
      <v-container fluid class="pa-6">
        <v-card
          rounded="lg"
          elevation="0"
          variant="outlined"
          style="border-color: #e0e0e0"
        >
          <div class="d-flex justify-space-between align-center ma-2">
            <span
              class="text-subtitle-1 font-weight-medium text-medium-emphasis"
            >
              Credit Costs:
            </span>
            <div
              class="d-flex text-caption font-weight-medium text-medium-emphasis"
            >
              <span class="ml-6">
                <span class="font-weight-bold">{{
                  this.$store.getters.get_currentuser_details
                    .credits_per_job_opportunity_creation
                }}</span>
                credits/job
              </span>
              <span class="ml-6">
                <span class="font-weight-bold">{{
                  this.$store.getters.get_currentuser_details
                    .credits_consumed_per_minute
                }}</span>
                credits/min interview
              </span>
              <span class="ml-6">
                <span class="font-weight-bold">{{
                  this.$store.getters.get_currentuser_details
                    .credits_per_candidate_invite
                }}</span>
                credit/invitation
              </span>
            </div>
          </div>
        </v-card>
        <div
          class="d-flex flex-row flex-nowrap align-center justify-start gap-4 mb-6 mt-3 ml-1 overflow-x-auto"
          style="max-width: 100%"
        >
          <v-card
            rounded="lg"
            elevation="0"
            flat
            @click="activeJobsMethod()"
            class="statistic-card pa-4 flex-grow-0 flex-shrink-0"
            :class="{ 'card-selected': CurrentView === 'JOB_DESCRIPTION' }"
            width="230"
            max-width="230"
          >
            <div class="d-flex align-center">
              <v-avatar color="blue-lighten-5" size="30" class="mr-3">
                <v-icon color="#4E8EF6" size="20">mdi-briefcase</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">
                  {{ this.$store.getters.get_currentuser_details.active_jobs }}
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  Active Jobs
                </div>
              </div>
            </div>
          </v-card>

          <v-card
            class="statistic-card pa-4 flex-grow-0 flex-shrink-0"
            :class="{ 'card-selected': CurrentView === 'CLOSED_JOBS' }"
            rounded="lg"
            elevation="0"
            flat
            @click="closedJobsMethod()"
            width="230"
            max-width="230"
          >
            <div class="d-flex align-center">
              <v-avatar color="red-lighten-5" size="30" class="mr-3">
                <v-icon color="red" size="20">mdi-close-octagon</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">
                  {{ this.$store.getters.get_currentuser_details.closed_jobs }}
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  Closed Jobs
                </div>
              </div>
            </div>
          </v-card>
          <v-card
            class="statistic-card pa-4 flex-grow-0 flex-shrink-0"
            :class="{
              'card-selected': CurrentView === 'INTERVIEW_COMPLETED',
            }"
            rounded="lg"
            elevation="0"
            flat
            @click="InterviewCompleted()"
            width="230"
            max-width="230"
          >
            <div class="d-flex align-center">
              <v-avatar color="purple-lighten-5" size="30" class="mr-3">
                <v-icon color="purple" size="20">mdi-chart-bar</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">
                  {{
                    this.$store.getters.get_currentuser_details
                      .total_interview_conducted
                  }}
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  Interviewed
                </div>
              </div>
            </div>
          </v-card>
          <v-card
            class="statistic-card pa-4 flex-grow-0 flex-shrink-0"
            :class="{ 'card-selected': CurrentView === 'HIRING_MANAGER' }"
            rounded="lg"
            elevation="0"
            flat
            @click="hiringManagerMethod()"
            width="230"
            max-width="230"
          >
            <div class="d-flex align-center">
              <v-avatar color="green-lighten-5" size="30" class="mr-3">
                <v-icon color="green" size="20"
                  >mdi-account-multiple-outline</v-icon
                >
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">
                  {{
                    this.$store.getters.get_currentuser_details
                      .active_managers_count
                  }}
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  Hiring Managers
                </div>
              </div>
            </div>
          </v-card>

          <v-card
            class="statistic-card pa-4 flex-grow-0 flex-shrink-0"
            :class="{ 'card-selected': CurrentView === 'CREDIT_BALANCE' }"
            rounded="lg"
            elevation="0"
            flat
            @click="creditBalanceMethod"
            width="230"
            max-width="230"
          >
            <div class="d-flex align-center">
              <v-avatar color="orange-lighten-5" size="30" class="mr-3">
                <v-icon color="orange" size="20">mdi-currency-usd</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">
                  {{
                    Number(
                      this.$store.getters.get_currentuser_details
                        .organization_credits
                    ).toFixed(2)
                  }}
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  Credit Balance
                </div>
              </div>
            </div>
          </v-card>
        </div>

        <v-card rounded="lg" elevation="2">
          <v-divider></v-divider>
          <ActiveJobs v-if="CurrentView == 'JOB_DESCRIPTION'" />
          <ClosedJobs v-if="CurrentView == 'CLOSED_JOBS'" />
          <HiringManager v-if="CurrentView == 'HIRING_MANAGER'" />
          <InterviewCompleted v-if="CurrentView == 'INTERVIEW_COMPLETED'" />
          <CreditBalance v-if="CurrentView == 'CREDIT_BALANCE'" />
        </v-card>
      </v-container>
    </v-main>
    <showProfileDialog
      :showProfileDialogModel="showProfileDialogModel"
      @clicked="closeprofileEmit"
    />
  </div>
</template>

<script>
import AppLogo from "@/assets/AppLogo.png";
import showProfileDialog from "@/components/showProfileDialog.vue";
import ActiveJobs from "@/components/ActiveJobs/ActiveJobs.vue";
import ClosedJobs from "@/components/ClosedJobs/ClosedJobs.vue";
import HiringManager from "@/components/HiringManagers/HiringManager.vue";
import CreditBalance from "@/components/CreditsBalance/CreditBalance.vue";
import { commonAPICallMethod } from "@/mixins/GetCurrentUserDetails.js";
import InterviewCompleted from "@/components/Interviewed/InterviewCompleted.vue";
import { signOut } from "aws-amplify/auth";
// import CandidateListModal from "@/components/CandidateListModal.vue";
export default {
  mixins: [commonAPICallMethod],
  components: {
    ActiveJobs,
    ClosedJobs,
    HiringManager,
    CreditBalance,
    InterviewCompleted,
    showProfileDialog,
    // CandidateListModal,
  },
  data() {
    return {
      showProfileDialogModel: false,
      appLogoPath: AppLogo,
      showDetailsModal: false,
      logoutloading: false,
      CurrentView: "",
      availableCredits: 230,
    };
  },
  async mounted() {
    await this.GetCurrentUserDetailsMethod();
    setTimeout(() => {
      this.CurrentView = "JOB_DESCRIPTION";
    }, 50);
  },

  methods: {
    activeJobsMethod() {
      this.CurrentView = "JOB_DESCRIPTION";
    },
    closedJobsMethod() {
      this.CurrentView = "CLOSED_JOBS";
    },
    hiringManagerMethod() {
      this.CurrentView = "HIRING_MANAGER";
    },
    InterviewCompleted() {
      this.CurrentView = "INTERVIEW_COMPLETED";
    },
    creditBalanceMethod() {
      this.CurrentView = "CREDIT_BALANCE";
    },
    showProfile() {
      this.showProfileDialogModel = true;
    },
    closeprofileEmit(Toggle) {
      if (Toggle) this.showProfileDialogModel = false;
    },

    async logout() {
      this.logoutloading = true;
      await signOut({ global: true });
      this.$router.push({ name: "LoginPage" });
      this.$store.commit("SET_CURRENT_USER", {});
      this.$store.commit("SET_USER_MAIL", "");
      this.logoutloading = false;
    },
  },
};
</script>
<style>
/* Base style for all statistic cards */
.statistic-card {
  /* Existing styles: padding, border, box-shadow, etc. */
  border: 1px dashed #e0e0e0;
  border-radius: 0px;
  /* transition: all 0.8s ease-in-out; */
}
/* Style to apply when the card is selected */
.statistic-card.card-selected {
  /* Option 1: Stronger Border */
  background-color: #ebeff6;
  border: 2px solid #8cb1ee; /* A vibrant blue to match the icon */
}
.gap-4 > * {
  margin-right: 16px; /* Adjust spacing between cards */
  margin-bottom: 16px;
}
.gap-4 {
  margin-right: -16px; /* Offset the container margin */
}
.statistic-card {
  height: 100%;
}
.org-link {
  cursor: pointer;
  color: inherit; /* default color */
  transition: color 0.3s ease;
  margin-top: 10px;
}

.org-link:hover {
  color: #1e88e5; /* Vuetify primary blue or any blue you like */
  text-decoration: underline;
}
</style>
