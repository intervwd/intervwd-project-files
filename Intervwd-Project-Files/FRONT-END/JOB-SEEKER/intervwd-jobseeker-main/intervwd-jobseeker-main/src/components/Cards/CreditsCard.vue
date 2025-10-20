<template>
  <v-container class="pa-4" fluid>
    <PaymentDialog
      :PaymentDialog="PaymentDialog"
      @clicked="paymentDialogEmit"
    />
    <v-card class="pa-6 rounded-lg mx-4 elevation-0" color="#2e70f0" dark>
      <v-row>
        <v-col>
          <div class="text-h6">Available Credits</div>
          <div class="text-h3 font-weight-bold">
            {{ $store.getters.get_currentuser_details.credits }}
          </div>
        </v-col>
        <v-col class="d-flex align-center justify-end">
          <v-icon size="70">mdi-currency-usd</v-icon>
        </v-col>
      </v-row>
      <v-divider horizontal class="my-3" color="white" thickness="2" />
      <v-row>
        <v-col cols="9">
          <div class="mt-2 fontsize16px">Cost per minute</div>
          <div class="text-body-1 font-weight-bold">
            FREE
            <span class="text-caption">(Business Sponsored interviews)</span>,
            10 Credits/Minute
            <span class="text-caption">(if Job Seeker bears the cost)</span>
          </div>
        </v-col>

        <v-col cols="3" class="text-right">
          <v-btn
            color="white"
            class="elevation-0 mt-3"
            text
            @click="PaymentDialogMethod()"
          >
            <v-icon left>mdi-plus</v-icon>
            Recharge
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="mt-6 pa-4 rounded-lg mx-4" elevation="0">
      <div class="d-flex align-center mb-4">
        <v-icon class="mr-2">mdi-history</v-icon>
        <span class="heading">Transaction History</span>
      </div>

      <div>
        <v-data-table
          :headers="headers"
          :items="transactions"
          item-value="interview_id"
          class="rounded-lg elevation-1 font-mono"
          density="comfortable"
          hide-default-footer
          items-per-page="50"
          :loading="TableLoading"
        >
          <template v-slot:[`item.transaction_date`]="{ item }">
            <div v-if="item.transaction_date">
              {{ formatDate(item.transaction_date) }}
            </div></template
          ><template v-slot:[`item.credit_source`]="{ item }">
            <div v-if="item.credit_source">
              {{ item.credit_source.replace("_", " ") }}
            </div></template
          ><template v-slot:[`item.reason`]="{ item }">
            <div v-if="item.reason">
              {{ item.reason }}
            </div></template
          >
          <template v-slot:[`item.transaction_initiator_user_name`]="{ item }">
            <div v-if="item.transaction_initiator_user_name">
              {{ item.transaction_initiator_user_name }}
            </div></template
          >
          <template v-slot:[`item.amount`]="{ item }">
            <v-chip
              v-if="item.amount"
              size="large"
              rounded
              :color="item.amount > 0 ? 'green' : 'red'"
              class="mr-3 fontsize18px font-weight-bold"
            >
              {{ item.amount > 0 ? "+" : "-" }} {{ item.amount }}
            </v-chip></template
          ></v-data-table
        >
        <!-- <v-card
          v-for="(transaction, index) in transactions"
          :key="index"
          class="mb-3 pa-3 rounded-lg d-flex justify-space-between elevation-0 align-center"
          :class="transaction.amount > 0 ? 'credit-bg' : 'debit-bg'"
          style="border: 1px solid #e5e7eb"
        >
          <div class="d-flex align-center">
            <v-avatar
              size="32"
              :class="transaction.amount > 0 ? 'credit-icon' : 'debit-icon'"
              class="mr-3"
            >
              <v-icon>{{
                transaction.amount > 0 ? "mdi-plus" : "mdi-currency-usd"
              }}</v-icon>
            </v-avatar>
            <div>
              <div v-if="transaction.credit_source" class="text-body-1">
                {{ transaction.credit_source.replace("_", " ") }}
              </div>
            </div>
          </div>

          <div
            class="font-weight-bold"
            :class="transaction.amount > 0 ? 'text-success' : 'text-error'"
          >
            {{ transaction.amount > 0 ? "+" : "" }} {{ transaction.amount }}
          </div>
        </v-card> -->
      </div>
    </v-card>
  </v-container>
</template>

<script>
import PaymentDialog from "@/components/Dialogs/PaymentDialog.vue";
import { ListTopUpCreditFunction } from "@/Mixins/Credits/ListTopUpCredit.js";

export default {
  components: { PaymentDialog },
  mixins: [ListTopUpCreditFunction],
  data() {
    return {
      PaymentDialog: false,
      availableCredits: 250,
      costPerMinute: 2,
      TableLoading: false,
      transactions: [],
      headers: [
        {
          title: "Date",
          value: "transaction_date",
        },
        {
          title: "Source",
          value: "credit_source",
        },
        {
          title: "Reason",
          value: "reason",
        },
        {
          title: "Initiator",
          value: "transaction_initiator_user_name",
        },
        {
          title: "Credits",
          value: "amount",
        },
      ],
    };
  },
  async mounted() {
    this.transactions = await this.listTopUpCreditMethod();
  },
  methods: {
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

      // Month + Year
      const monthYear = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      // Time (12-hour format with AM/PM)
      const time = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Final format → e.g. 18th, Oct, 2025, 10:45 AM
      return `${day}${getDaySuffix(day)}, ${monthYear.replace(
        " ",
        " "
      )}, ${time}`;
    },
    PaymentDialogMethod() {
      this.PaymentDialog = true;
    },
    async paymentDialogEmit(Toggle) {
      this.PaymentDialog = false;
      if (Toggle == 2) {
        this.transactions = await this.listTopUpCreditMethod();
      }
    },
  },
};
</script>

<style scoped>
.text-success {
  color: #16a34a; /* Tailwind green-600 */
}
.text-error {
  color: #dc2626; /* Tailwind red-600 */
}
.credit-bg {
  background-color: #f0fdf4; /* light green */
}
.debit-bg {
  background-color: #fef2f2; /* light red */
}
.credit-icon {
  background: #bbf7d0; /* green-200 */
  color: #166534; /* green-800 */
}
.debit-icon {
  background: #fecaca; /* red-200 */
  color: #991b1b; /* red-800 */
}
</style>
