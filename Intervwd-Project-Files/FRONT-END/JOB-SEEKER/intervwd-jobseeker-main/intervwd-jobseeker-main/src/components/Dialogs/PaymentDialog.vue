<template>
  <div>
    <v-dialog :model-value="PaymentDialog" max-width="600px" persistent>
      <v-card rounded="xl" class="pa-6">
        <!-- Title -->
        <div class="d-flex align-center mb-6">
          <v-icon color="primary" class="mr-2">mdi-credit-card-outline</v-icon>
          <h3 class="text-h6 font-weight-bold">Recharge Credits</h3>
        </div>

        <!-- Credit Packs -->
        <v-row dense>
          <v-col
            v-for="(pack, i) in creditPacks"
            :key="i"
            cols="6"
            class="mb-4"
          >
            <v-card
              variant="outlined"
              rounded="lg"
              class="d-flex flex-column align-center justify-center pa-6 text-center hover-card"
              :class="{ 'selected-card': selectedPack?.id === pack.id }"
              @click.stop="selectPack(pack)"
            >
              <!-- Bonus Badge -->
              <!-- <div v-if="pack.bonus" class="bonus-badge">
                +{{ pack.bonus }} Bonus
              </div> -->

              <div class="font-weight-bold text-h6 mt-2">
                {{ pack.credits }}
              </div>
              <div class="text-caption text-grey-darken-1">credits</div>
              <div class="text-h6 text-BlueColorVariant2 mt-2">
                {{ pack.price }}
              </div>
              <!-- <div v-if="pack.save" class="mt-1 text-caption text-success">
                Save {{ pack.save }}
              </div> -->
            </v-card>
          </v-col>
        </v-row>

        <!-- Actions -->
        <div class="d-flex justify-end mt-6">
          <v-btn
            variant="text"
            color="grey"
            class="mr-2"
            @click="paymentDialogEmit(1)"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            class="px-6"
            :loading="loading"
            :disabled="!selectedPack"
            @click="RechargeCreditMethod()"
          >
            Complete Purchase
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
// import confetti from "canvas-confetti";

import { TopUpCredit } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export default {
  props: {
    PaymentDialog: Boolean,
  },
  data() {
    return {
      loading: false,
      selectedPack: null,
      creditPacks: [
        { id: 1, credits: 1000, price: "$10", bonus: 5 },
        { id: 2, credits: 5000, price: "$40", save: "$5" },
        { id: 3, credits: 10000, price: "$60", bonus: 25, save: "$25" },
        { id: 4, credits: 50000, price: "$250", bonus: 75, save: "$75" },
      ],
      payment: {
        card: "",
        expiry: "",
        cvv: "",
      },
    };
  },
  methods: {
    async RechargeCreditMethod() {
      try {
        console.log("selectedPack", this.selectedPack);
        this.loading = true;
        let inputParams = {
          user_id: this.$store.getters.get_currentuser_details.user_id,
          amount: Number(this.selectedPack.price.replace(/[^0-9.]/g, "")),
          credits: Number(this.selectedPack.credits),
        };
        let result = await client.graphql({
          query: TopUpCredit,
          variables: { input: inputParams },
        });
        let ResultObj = JSON.parse(result.data.TopUpCredit);
        console.log("ResultObj", ResultObj.data);
        if (ResultObj.status == "SUCCESS") {
          var check = {
            key: "rzp_test_0G04VfoBpRiYtt",
            amount: ResultObj.data.amount,
            currency: ResultObj.data.currency,
            name: "InterVWD",
            // description: this.SelectCredits.credits,
            image:
              "https://img.freepik.com/premium-vector/alumni-icon-vector-image-can-be-used-university_120816-173929.jpg",
            order_id: ResultObj.data.id,
            handler: this.razorpayResponse,
            prefill: {
              name: "",
              // email:
              //   this.$store.getters.get_current_user_details.user_email_id,
              contact: "",
            },
            notes: {
              address: "",
            },
            theme: {
              color: "#023ca6",
            },
            modal: {
              escape: false,
              ondismiss: () => {
                console.log("Checkout form closed by user");
              },
              confirm_close: true,
            },
            redirect: false,
          };
          var rzp1 = new Razorpay(check);
          rzp1.on("payment.failed", this.razorpayResponse);
          rzp1.open();
          this.loading = false;
          this.paymentDialogEmit(2);
        }
        this.loading = false;
      } catch (error) {
        this.loading = false;
        console.log("error", error);
        this.SnackBarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          timeout: 2000,
          SnackbarText: error.errors[0].message,
        };
        console.log("Err", error);
      }
    },

    async razorpayResponse(response) {
      if (response.hasOwnProperty("error")) {
        this.SnackBarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          timeout: 2000,
          SnackbarText: `Payment Unsuccessful`,
        };
      } else {
        this.SnackBarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "green",
          timeout: 2000,
          SnackbarText: `Payment Successful`,
        };
      }
    },

    selectPack(pack) {
      console.log("pack", pack);
      this.selectedPack = { ...pack };
    },
    paymentDialogEmit(Toggle) {
      this.$emit("clicked", Toggle);
    },
  },
};
</script>

<style scoped>
.hover-card {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.hover-card:hover {
  background-color: #f9fafb;
}
.selected-card {
  border: 2px solid #1976d2;
  background-color: #eaf3ff;
}
.bonus-badge {
  position: absolute;
  top: 8px;
  right: 12px;
  background-color: #22c55e;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 12px;
}
</style>
