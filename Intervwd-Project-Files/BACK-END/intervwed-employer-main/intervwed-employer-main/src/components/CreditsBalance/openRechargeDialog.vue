<template>
  <div>
    <v-dialog :model-value="openRechargeDialog" max-width="550" persistent>
      <v-card rounded="lg" class="pa-4">
        <v-card-title
          class="text-h6 font-weight-bold pa-0 mb-4 d-flex align-center"
        >
          <v-icon start color="blue">mdi-cash-plus</v-icon>
          Recharge Credits
          <v-spacer></v-spacer>
          <v-btn icon @click="closeDialog" variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-form ref="form">
          <v-card-text class="pa-0">
            <v-row class="mb-4">
              <v-col v-for="pkg in packages" :key="pkg.id" cols="6" sm="6">
                <v-card
                  :variant="
                    selectedPackage.id === pkg.id ? 'tonal' : 'outlined'
                  "
                  :color="selectedPackage.id === pkg.id ? 'blue' : '#e0e0e0'"
                  class="pa-3 text-center cursor-pointer"
                  rounded="lg"
                  @click="selectPackage(pkg)"
                >
                  <!-- <v-chip
                  v-if="pkg.bonus > 0"
                  size="small"
                  color="green"
                  label
                  class="float-right font-weight-bold"
                  style="margin-top: -15px; margin-right: -15px"
                >
                  +{{ pkg.bonus }} Bonus
                </v-chip> -->
                  <div class="text-h5 font-weight-bold mt-2 text-black">
                    {{ pkg.credits }}
                  </div>
                  <div class="text-h6 font-weight-medium mt-1 text-black">
                    Credits
                  </div>
                  <div class="text-h6 font-weight-medium mt-1 text-blue">
                    ${{ pkg.price }}
                  </div>
                  <!-- <div
                    v-if="pkg.savings > 0"
                    class="text-caption text-green font-weight-medium"
                  >
                    Save ${{ pkg.savings }}
                  </div>
                  <div v-else class="text-caption text-medium-emphasis">
                    Save $0
                  </div> -->
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>
          </v-card-text>

          <v-card-actions class="pa-0 mt-4">
            <v-row>
              <v-col cols="6">
                <v-btn
                  block
                  style="border-color: #e0e0e0"
                  variant="outlined"
                  class="text-capitalize mr-2"
                  @click="closeDialog((Toggle = 1))"
                >
                  Cancel
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  :disabled="Object.keys(selectedPackage).length === 0"
                  color="#4E8EF6"
                  :loading="loading"
                  class="text-capitalize rounded-lg"
                  @click="RechargeCreditMethod"
                  x-small
                  dense
                  variant="elevated"
                >
                  Complete Purchase
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import PaymentLogo from "@/assets/paymentLogo.jpeg";
import { TopUpCredit } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
export default {
  // Use a prop to control the visibility of the dialog from the parent component
  props: {
    openRechargeDialog: Boolean,
  },
  data() {
    return {
      dialog: false,
      loading: false,
      selectedPackage: {}, // Stores the currently selected package object
      packages: [
        { id: 1, credits: 1000, price: 10, bonus: 0, savings: 0 },
        { id: 2, credits: 5000, price: 40, bonus: 5, savings: 5 }, // 100 base + 5 bonus
        { id: 3, credits: 10000, price: 60, bonus: 25, savings: 25 }, // 250 base + 25 bonus
        { id: 4, credits: 50000, price: 250, bonus: 75, savings: 75 }, // 500 base + 75 bonus
      ],
      paymentData: {
        cardNumber: "",
        expiry: "",
        cvv: "",
      },
      PaymentLogo,
    };
  },
  watch: {},
  methods: {
    selectPackage(pkg) {
      this.selectedPackage = pkg;
    },

    closeDialog(toggle) {
      this.$emit("clicked", toggle);
    },

    async RechargeCreditMethod() {
      try {
        this.loading = true;
        let inputParams = {
          user_id: this.$store.getters.get_currentuser_details.user_id,
          organization_id:
            this.$store.getters.get_currentuser_details.organization_id,
          credits: this.selectedPackage.credits,
          amount: this.selectedPackage.price,
        };
        let result = await client.graphql({
          query: TopUpCredit,
          variables: { input: inputParams },
        });
        let ResultObj = JSON.parse(result.data.TopUpCredit);
        if (ResultObj.status == "SUCCESS") {
          console.log("ResultObj", ResultObj);
          var check = {
            key: "rzp_test_0G04VfoBpRiYtt",
            amount: ResultObj.amount,
            currency: ResultObj.currency,
            name: "InterVWD",
            // description: this.SelectCredits.credits,
            image:
              "https://img.freepik.com/premium-vector/alumni-icon-vector-image-can-be-used-university_120816-173929.jpg",
            order_id: ResultObj.id,
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
          if (window.Razorpay) {
            var rzp1 = new window.Razorpay(check);
            rzp1.on("payment.failed", this.razorpayResponse);
            rzp1.open();
          } else {
            console.error("Razorpay script not loaded.");
          }
          rzp1.on("payment.failed", this.razorpayResponse);
          rzp1.open();
          this.loading = false;
          this.closeDialog(2);
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
      if (Object.hasOwn(response, "error")) {
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
  },
};
</script>
