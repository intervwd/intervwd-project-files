<template>
  <div>
    <SnackBar
      v-model="snackbar.show"
      :snackbar-text="snackbar.text"
      :snackbar-color="snackbar.color"
      :timeout="snackbar.timeout"
    />
    <OverlayPage :overlay="overlay" />
    <v-card persistent class="rounded-lg">
      <v-card class="pa-4" color="#ebeff6">
        <v-card-title class="d-flex justify-space-between align-center">
          <div class="text-h6 font-weight-bold d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-account-plus</v-icon>
            Add New Hiring Manager
          </div>
          <v-btn icon @click="closeDialog" variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newManager.fullName"
                  label="Name *"
                  variant="outlined"
                  density="compact"
                  placeholder="John Doe"
                  :rules="[(v) => !!v || 'Name is required']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newManager.email"
                  label="Email Address *"
                  variant="outlined"
                  density="compact"
                  placeholder="john@company.com"
                  :rules="emailRules"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 d-flex justify-end">
          <v-btn variant="outlined" @click="closeDialog(1)" :disabled="loading">
            Cancel
          </v-btn>
          <v-btn
            color="#4E8EF6"
            variant="flat"
            @click="submit()"
            :loading="loading"
          >
            SUBMIT
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-card>
  </div>
</template>
<script>
import { CreateManagerUser } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
import OverlayPage from "@/components/OverlayPage.vue";
import SnackBar from "@/components/SnackBar.vue";
const client = generateClient();
export default {
  components: {
    OverlayPage,
    SnackBar,
  },
  data() {
    return {
      errorMessage: "",
      newManager: {
        fullName: "",
        email: "",
      },
      emailRules: [
        (v) => !!v || "Required",
        (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Email must be valid",
      ],
      overlay: false,
      valid: false,
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
  watch: {},
  mounted() {},
  methods: {
    closeDialog(toggle) {
      this.$emit("clicked", toggle);
    },
    submit() {
      if (this.$refs.form.validate()) {
        if (this.valid) this.CreateManagerUserMethod();
      } else {
        this.snackbar.text = "Please fill all required fields";
        this.snackbar.color = "red";
        this.snackbar.show = true;
      }
    },
    async CreateManagerUserMethod() {
      try {
        this.loading = true;
        this.overlay = true;
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: CreateManagerUser,
          variables: {
            input: {
              creator_user_id:
                this.$store.getters.get_currentuser_details.user_id,
              organization_id:
                this.$store.getters.get_currentuser_details.organization_id,
              manager_email_id: this.newManager.email,
              user_name: this.newManager.fullName,
            },
          },
        });
        const response = JSON.parse(result.data.CreateManagerUser);
        // console.log("response", response.status_message);

        this.loading = false;
        this.overlay = false;
        this.snackbar.show = true;
        this.snackbar.text = response.status_message;
        this.snackbar.color = "success";

        setTimeout(() => {
          this.closeDialog(2);
        }, 1000);
      } catch (error) {
        this.loading = false;
        this.overlay = false;
        console.log("CreateManagerUser_error", error);
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
  },
};
</script>
