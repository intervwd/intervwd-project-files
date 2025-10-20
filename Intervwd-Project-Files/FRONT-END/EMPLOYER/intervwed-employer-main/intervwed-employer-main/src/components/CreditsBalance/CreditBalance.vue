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
          <h2 class="mt-3 ml-4">Credit Balance</h2>
          <v-spacer></v-spacer>
        </v-row>
        <v-divider class="mt-4"></v-divider>
        <v-card color="blue" flat rounded="0" class="pa-6 mb-6">
          <div
            class="d-flex justify-space-between align-center text-white mb-4"
          >
            <div>
              <div class="text-subtitle-1 font-weight-bold ml-n6">
                Available Credits
              </div>
              <div class="text-h3 font-weight-black">
                {{
                  this.$store.getters.get_currentuser_details
                    .organization_credits
                }}
                <span class="text-h6 font-weight-medium">credits</span>
              </div>
            </div>
            <v-icon size="40" color="white">mdi-cash-multiple</v-icon>
          </div>
          <v-divider></v-divider>
          <div class="d-flex justify-space-between align-center mt-4">
            <div class="text-subtitle-2 text-white">
              Cost per minute:
              <span class="font-weight-bold"
                >{{
                  this.$store.getters.get_currentuser_details
                    .credits_consumed_per_minute
                }}
                credits/min</span
              >
            </div>
            <v-btn
              color="white"
              class="text-capitalize font-weight-bold"
              @click="openRechargeModal"
            >
              <v-icon start>mdi-plus</v-icon> Recharge
            </v-btn>
          </div>
        </v-card>

        <!-- <v-alert color="yellow-lighten-5" density="compact" class="mb-6 mx-4">
          <span class="font-weight-bold text-caption text-yellow-darken-3"
            >Payment Options:</span
          >
          <span class="text-caption text-yellow-darken-3"
            >You can choose to have interview costs deducted from your business
            credits or allow job seekers to use their own credits.</span
          >
        </v-alert> -->
        <div class="px-4">
          <!-- <v-row justify="left">
            <div class="text-h6 font-weight-bold mb-3 ml-3">
              Transaction History
            </div>
          </v-row> -->

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
          </div>
          <v-tabs-items v-model="TabValue">
            <v-tab-item v-if="TabValue == 0">
              <v-card
                v-if="responseArray && responseArray.length == 0"
                height="100px"
                flat
                class="mt-10"
              >
                <div class="mt-10">No credit transactions were found</div>
              </v-card>
              <v-card
                flat
                class="mt-7"
                elevation="0"
                variant="outlined"
                style="border-color: #e0e0e0"
              >
                <v-table density="comfortable">
                  <thead></thead>
                  <tbody>
                    <tr
                      v-for="transaction in responseArray"
                      :key="transaction.credit_transaction_id"
                      class="px-0 py-3"
                      :class="{
                        'border-b':
                          transaction.credit_transaction_id !==
                          responseArray.length,
                      }"
                    >
                      <td class="text-left column-divider">
                        {{ formatDate(transaction.transaction_date) }}
                      </td>
                      <td
                        v-if="transaction.credit_source"
                        class="text-left column-divider"
                        :class="{
                          'text-green':
                            transaction.credit_source === 'CREDIT' ||
                            transaction.credit_source === 'TOP_UP' ||
                            transaction.credit_source === 'SIGNUP_BONUS',
                          'text-red':
                            transaction.credit_source !== 'CREDIT' &&
                            transaction.credit_source !== 'TOP_UP' &&
                            transaction.credit_source !== 'SIGNUP_BONUS',
                        }"
                      >
                        <b>
                          {{ transaction.credit_source.replace("_", " ") }}</b
                        >
                      </td>
                      <td class="text-left column-divider">
                        {{ transaction.reason }}
                      </td>
                      <td class="text-left column-divider">
                        By :
                        {{ transaction.transaction_initiator_user_name }}
                      </td>
                      <td class="text-left">
                        <v-chip
                          label
                          small
                          :color="
                            transaction.credit_source === 'CREDIT' ||
                            transaction.credit_source === 'TOP_UP' ||
                            transaction.credit_source === 'SIGNUP_BONUS'
                              ? 'green'
                              : 'red'
                          "
                          class="font-weight-bold"
                        >
                          {{
                            transaction.credit_source === "CREDIT" ||
                            transaction.credit_source === "TOP_UP" ||
                            transaction.credit_source === "SIGNUP_BONUS"
                              ? "+"
                              : "-"
                          }}{{ transaction.amount }}
                        </v-chip>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </v-tab-item>
            <v-tab-item v-if="TabValue == 1">
              <v-card
                v-if="
                  responseArrayPayments && responseArrayPayments.length == 0
                "
                height="100px"
                flat
                class="mt-10"
              >
                <div class="mt-10">No credit transactions were found</div>
              </v-card>
              <v-card
                flat
                class="mt-7"
                elevation="0"
                variant="outlined"
                style="border-color: #e0e0e0"
              >
                <v-table density="comfortable">
                  <thead></thead>
                  <tbody>
                    <tr
                      v-for="transaction in responseArrayPayments"
                      :key="transaction.credit_transaction_id"
                      class="px-0 py-3"
                      :class="{
                        'border-b':
                          transaction.credit_transaction_id !==
                          responseArrayPayments.length,
                      }"
                    >
                      <td class="text-left column-divider">
                        {{ formatDate(transaction.transaction_time) }}
                      </td>
                      <td class="text-left column-divider">
                        Order ID :
                        {{ transaction.order_id }}
                      </td>
                      <td class="text-left column-divider">
                        By :
                        {{ transaction.user_email_id }}
                      </td>
                      <td class="text-left">
                        <v-chip
                          label
                          small
                          :color="
                            transaction.payment_status === 'PENDING'
                              ? 'red'
                              : 'green'
                          "
                          class="font-weight-bold"
                        >
                          {{ transaction.payment_status }}
                        </v-chip>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </v-tab-item>
          </v-tabs-items>
        </div>
      </v-card-text>
    </v-card>
  </div>
  <openRechargeDialog
    :openRechargeDialog="openRechargeDialog"
    @clicked="emitRechargeDialog"
  />
</template>
<script>
import OverlayPage from "@/components/OverlayPage.vue";
import openRechargeDialog from "@/components/CreditsBalance/openRechargeDialog.vue";
import SnackBar from "@/components/SnackBar.vue";
import {
  ListTopUpCreditHistory,
  ListPaymentHistory,
} from "@/graphql/queries.js";

import { generateClient } from "aws-amplify/api";
const client = generateClient();
import { commonAPICallMethod } from "@/mixins/GetCurrentUserDetails.js";

export default {
  mixins: [commonAPICallMethod],
  components: {
    openRechargeDialog,
    OverlayPage,
    SnackBar,
  },
  data() {
    return {
      TabValue: 0,
      showJobCardModel: false,
      drawer: false, // Controls the visibility of the navigation drawer
      tab: "jobs", // Controls the active tab
      createJObDialog: false,
      showDetailsModal: false,
      createManager: false,
      openRechargeDialog: false,
      count: 0,
      selectedJob: {},
      responseArray: [],
      snackbar: {
        show: false,
        text: "",
        color: "success", // or "error" etc.
        timeout: 3000,
      },
      msg: "",
      successmsg: "",
      responseArrayPayments: [],
      availableCredits: 250,
      costPerMinute: 2,
      overlay: false,
      buttonItems: [
        {
          text: "Transaction History",
          color: "blue white--text",
          icon: "mdi-format-list-bulleted",
        },
        {
          text: "Payments",
          color: "portalPrimary black--text",
          icon: "mdi-cash-multiple",
        },
      ],
    };
  },
  mounted() {
    this.ListTopUpCreditHistoryMethod();
    this.GetCurrentUserDetailsMethod();
  },
  methods: {
    async ListTopUpCreditHistoryMethod() {
      this.overlay = true;
      try {
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: ListTopUpCreditHistory,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
            },
          },
        });
        const response = JSON.parse(result.data.ListTopUpCreditHistory);
        this.responseArray = response.data.items;
        console.log("responseArray", this.responseArray);
        this.overlay = false;

        return response;
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
    async listPaymentHistoryMethod() {
      this.overlay = true;
      try {
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: ListPaymentHistory,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
            },
          },
        });
        const response = JSON.parse(result.data.ListPaymentHistory);
        console.log("response", response);
        this.responseArrayPayments = response.data.items;
        console.log("responseArrayPayments", this.responseArrayPayments);
        this.overlay = false;

        return response;
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
    checkButtonItem(idx) {
      this.TabValue = idx;
      if (idx == 0) {
        this.buttonItems[0].color = "blue white--text";
        this.buttonItems[1].color = "portalPrimary black--text";
        this.ListTopUpCreditHistoryMethod();
      } else if (idx == 1) {
        this.buttonItems[1].color = "blue white--text";
        this.buttonItems[0].color = "portalPrimary black--text";
        this.listPaymentHistoryMethod();
      }
      this.$forceUpdate();
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = date.getDate();

      // Suffix logic (st, nd, rd, th)
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

      // Get month and year (e.g., "Oct 2025")
      const monthYear = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      // Get the time (e.g., "10:38 AM")
      const time = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true, // Ensures AM/PM format
      });

      // Combine and format: "17th Oct, 2025 at 10:38 AM"
      // The unused variable 'monthYearTime' has been removed from this block.
      return `${day}${getDaySuffix(day)} ${monthYear.replace(
        " ",
        ", "
      )} at ${time}`;
    },

    openRechargeModal() {
      this.openRechargeDialog = true;
    },
    emitRechargeDialog(Toggle) {
      if (Toggle) this.openRechargeDialog = false;
    },
  },
};
</script>
<style>
.column-divider {
  /* You can adjust the width, style, and color as needed */
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
