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
          <v-btn icon @click="closeDialog(1)" variant="text" size="small">
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
                  <div class="text-h5 font-weight-bold mt-2 text-black">
                    {{ pkg.credits }}
                  </div>
                  <div class="text-h6 font-weight-medium mt-1 text-black">
                    Credits
                  </div>
                  <div class="text-h6 font-weight-medium mt-1 text-blue">
                    ${{ pkg.price }}
                  </div>
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
                  @click="closeDialog(1)"
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
  props: {
    openRechargeDialog: Boolean,
  },
  data() {
    return {
      loading: false,
      selectedPackage: {},
      packages: [
        { id: 1, credits: 1000, price: 10, bonus: 0, savings: 0 },
        { id: 2, credits: 5000, price: 40, bonus: 5, savings: 5 },
        { id: 3, credits: 10000, price: 60, bonus: 25, savings: 25 },
        { id: 4, credits: 50000, price: 250, bonus: 75, savings: 75 },
      ],
      PaymentLogo,
    };
  },
  methods: {
    selectPackage(pkg) {
      this.selectedPackage = pkg;
    },

    closeDialog(toggle) {
      this.$emit("clicked", toggle);
    },

    async loadRazorpayScript() {
      return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    },

    async RechargeCreditMethod() {
      if (!this.selectedPackage.id) return;

      this.loading = true;

      const isLoaded = await this.loadRazorpayScript();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Please check your connection.");
        this.loading = false;
        return;
      }

      try {
        // Step 1: Create order via existing TopUpCredit API
        const inputParams = {
          user_id: this.$store.getters.get_currentuser_details.user_id,
          organization_id:
            this.$store.getters.get_currentuser_details.organization_id,
          credits: this.selectedPackage.credits,
          amount: this.selectedPackage.price,
        };

        const result = await client.graphql({
          query: TopUpCredit,
          variables: { input: inputParams },
        });

        const ResultObj = JSON.parse(result.data.TopUpCredit);

        if (ResultObj.status !== "SUCCESS") {
          alert("❌ Failed to create order. Please try again.");
          return;
        }

        const orderDetails = ResultObj.data;

        // Step 2: Configure Razorpay Checkout
        const rzp = new window.Razorpay({
          key: "rzp_live_QQ3xX1vOimfUVW",
          amount: orderDetails.amount,
          currency: orderDetails.currency,
          order_id: orderDetails.id,
          name: "InterVWD",
          description: `${this.selectedPackage.credits} Credits`,
          image: this.PaymentLogo,
          handler: (response) => {
            if (response.razorpay_payment_id) {
              alert("✅ Payment Successful!");
              this.$emit("payment-success", response);
              this.closeDialog(2);
            } else {
              alert("❌ Payment failed!");
              this.$emit("payment-failed", response);
            }
          },
          prefill: {
            name: this.$store.getters.get_currentuser_details.user_name || "",
            email:
              this.$store.getters.get_currentuser_details.user_email_id || "",
            contact:
              this.$store.getters.get_currentuser_details.user_phone || "",
          },
          theme: { color: "#2575fc" },
          modal: {
            escape: false,
            ondismiss: () => console.log("Checkout closed"),
          },
          redirect: false,
        });

        rzp.on("payment.failed", (err) => {
          console.error("PAYMENT FAILED:", err);
          alert("❌ Payment Failed: " + err.error.description);
          this.$emit("payment-failed", err);
        });

        rzp.open();
      } catch (error) {
        console.error("PAYMENT ERROR:", error);
        alert("Something went wrong! Please try again.");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
