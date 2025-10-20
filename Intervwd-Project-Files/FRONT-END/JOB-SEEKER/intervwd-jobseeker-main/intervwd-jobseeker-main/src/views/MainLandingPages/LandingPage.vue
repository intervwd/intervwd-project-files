<template>
  <div>
    <Overlay :overlay="overlay" />
    <v-card class="elevation-0 MainCard pb-4" color="#f8fafc">
      <v-row align="center">
        <v-col cols="12" md="12" class="text-center" align="center">
          <v-toolbar color="white" class="elevation-0">
            <div class="text-left ml-6">
              <v-img src="@/assets/InterVWD1.png" width="180" />
            </div>
            <v-spacer />
            <div class="d-flex align-center">
              <!-- <v-icon color="#1ca54e" size="25"
                >mdi-account-circle-outline</v-icon
              > -->
              <v-avatar
                v-if="$store.getters.get_user_email"
                size="40"
                rounded="lg"
                color="#e8f5e9"
                class="mr-1"
              >
                <div class="font-weight-bold fontsize20px text-green-darken-1">
                  {{ $store.getters.get_user_email.charAt(0).toUpperCase() }}
                </div>
              </v-avatar>
              <div class="d-flex flex-column mr-2">
                <span
                  v-if="$store.getters.get_user_email"
                  class="text-grey-darken-1 fontsize15px FontWeight400"
                >
                  {{ $store.getters.get_user_email }}
                </span>
              </div>
            </div>
            <v-btn
              variant="text"
              class="text-capitalize fontsize12px FontWeight400 text-grey-darken-1"
              @click="logoutMethod()"
              :loading="loading"
            >
              <v-icon size="20" class="mr-1">mdi-logout</v-icon>
            </v-btn>
          </v-toolbar>
        </v-col>
      </v-row>

      <v-card class="elevation-1 BorderRadius10Px mx-8 mt-3">
        <v-toolbar
          v-if="!$store.getters.get_job_id"
          class="pa-4"
          flat
          color="white"
        >
          <v-btn
            v-for="tab in tabs"
            :key="tab.value"
            :variant="CurrentView === tab.value ? 'tonal' : 'text'"
            rounded="lg"
            :class="tab.value === 'FindJobsCard' ? 'ml-3' : ''"
            :color="CurrentView === tab.value ? 'green' : 'grey-darken-1'"
            @click.stop="tabsClickFunction(tab)"
          >
            <v-icon left>{{ tab.icon }}</v-icon>
            <span class="ml-1 text-caption font-weight-bold">{{
              tab.label
            }}</span>
          </v-btn>
          <v-card-actions
            v-if="$store.getters.get_backtojob_boolean == true"
            class="ml-auto mr-2"
          >
            <v-btn
              variant="elevated"
              color="black"
              size="small"
              class="text-capitalize fontsize14px elevation-0"
              @click.stop="backToJobCommit"
            >
              <v-icon>mdi-chevron-double-left</v-icon>Back to Jobs
            </v-btn></v-card-actions
          >
        </v-toolbar>

        <v-divider />

        <div v-if="!$store.getters.get_job_id" class="pa-4">
          <FindJobsCard
            v-if="CurrentView === 'FindJobsCard'"
            @clicked="FindJobsCardEmit"
          />
          <MyInterviews v-if="CurrentView === 'MyInterviews'" />
          <CreditsCard v-if="CurrentView === 'CreditsCard'" />
          <ProfileCard v-if="CurrentView === 'ProfileCard'" />
        </div>
        <div class="pa-4" v-if="$store.getters.get_job_id">
          <ExternalInterview />
        </div>
      </v-card>
    </v-card>
  </div>
</template>

<script>
import { getCurrentUserDetailsfile } from "@/Mixins/GetCurrentUser.js";
import { signOut, getCurrentUser } from "aws-amplify/auth";
import FindJobsCard from "@/components/Cards/FindJobsCard.vue";
import MyInterviews from "@/components/Cards/MyInterviews.vue";
import CreditsCard from "@/components/Cards/CreditsCard.vue";
import ProfileCard from "@/components/Cards/ProfileCard.vue";
import ExternalInterview from "@/components/Cards/ExternalInterview.vue";
import Overlay from "@/components/Extras/Overlay.vue";

export default {
  components: {
    FindJobsCard,
    MyInterviews,
    CreditsCard,
    ProfileCard,
    ExternalInterview,
    Overlay,
  },
  mixins: [getCurrentUserDetailsfile],
  data: () => ({
    loading: false,
    overlay: false,
    CurrentView: "",
    tabs: [
      { label: "Find Jobs", value: "FindJobsCard", icon: "mdi-magnify" },
      {
        label: "My Interviews",
        value: "MyInterviews",
        icon: "mdi-clock-outline",
      },
      {
        label: "Credits",
        value: "CreditsCard",
        icon: "mdi-card-account-details",
      },
      {
        label: "Profile",
        value: "ProfileCard",
        icon: "mdi-account-circle-outline",
      },
    ],
  }),
  async mounted() {
    try {
      await getCurrentUser();
      this.getCurrentUserDetailsMethod();
    } catch (error) {
      this.$router.push("/");
      this.SnackBarComponent = {
        SnackbarVmodel: true,
        SnackbarColor: "red",
        SnackbarText: "This page is already been logged out..!",
      };
    }
  },
  methods: {
    tabsClickFunction(tab) {
      this.CurrentView = tab.value;
      this.$store.commit("SET_BACK_TO_JOB", false);
    },
    backToJobCommit() {
      this.$store.commit("SET_BACK_TO_JOB", false);
    },
    async logoutMethod() {
      this.loading = true;
      await signOut({ global: true });
      this.$router.push("/");
      this.$store.commit("SET_CURRENT_USER", {});
      this.$store.commit("SET_USER_MAIL", "");
      this.$store.commit("SET_JOB_ID", "");
      this.loading = false;
    },

    FindJobsCardEmit() {
      console.log("FindJobsCardEmit");
    },
  },
};
</script>

<style scoped>
.tabs-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}
.MainCard {
  min-height: 100vh !important;
}
</style>
