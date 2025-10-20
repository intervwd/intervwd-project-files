<template>
  <div>
    <SnackBar
      v-model="snackbar.show"
      :snackbar-text="snackbar.text"
      :snackbar-color="snackbar.color"
      :timeout="snackbar.timeout"
    />
    <OverlayPage :overlay="overlay" />
    <v-dialog :model-value="showProfileDialogModel" max-width="600" persistent>
      <v-card>
        <v-card-title class="headline primary white--text">
          <!-- <v-icon left>mdi-office-building-cog</v-icon> -->
          Update Organization Profile
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="profileForm">
            <v-container>
              <v-row>
                <v-col cols="12" class="d-flex flex-column align-center pb-6">
                  <div class="d-flex align-center justify-center">
                    <div style="position: relative; display: inline-block">
                      <v-avatar size="140" class="elevation-2">
                        <template v-if="form.user_profile_picture_preview">
                          <v-img
                            :src="form.user_profile_picture_preview"
                            alt="Profile Picture"
                            cover
                            contain
                            :aspect-ratio="16 / 9"
                            class="rounded-circle"
                            style="object-fit: contain; background: white"
                          />
                        </template>
                        <template v-else>
                          <v-icon size="80" color="blue">mdi-account</v-icon>
                        </template>
                      </v-avatar>

                      <!-- Pencil Icon Overlay (centered bottom) -->
                      <v-btn
                        icon
                        color="blue"
                        size="x-small"
                        class="elevation-2"
                        style="
                          position: absolute;
                          bottom: 100px;
                          right: -40%;
                          transform: translateX(-140%);
                        "
                        @click="triggerFileInput"
                      >
                        <v-icon size="18">mdi-pencil</v-icon>
                      </v-btn>

                      <!-- Hidden File Input -->
                      <input
                        ref="fileInput"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="onFileChange"
                      />
                    </div>
                  </div>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="form.user_name"
                    label="User Name"
                    prepend-icon="mdi-account"
                    :rules="[(v) => !!v || 'Name is required']"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="form.organization_name"
                    label="Organization Name"
                    prepend-icon="mdi-domain"
                    :rules="[(v) => !!v || 'Name is required']"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <!-- <v-col cols="12">
                  <v-text-field
                    v-model="$store.getters.get_user_email"
                    label="Email id"
                    prepend-icon="mdi-email"
                    outlined
                    disabled
                  ></v-text-field>
                </v-col> -->
                <v-col cols="12">
                  <v-textarea
                    v-model="form.organization_profile"
                    label="About Organization"
                    prepend-icon="mdi-information-outline"
                    rows="3"
                    variant="outlined"
                    density="compact"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>

        <v-card-actions
          class="mt-n10"
          v-if="
            this.$store.getters.get_currentuser_details.user_role == 'OWNER'
          "
        >
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="closeDialog(1)">Cancel</v-btn>
          <v-btn
            color="#4E8EF6"
            class="text-capitalize ma-2 rounded-lg ml-n4"
            @click="validateProfileMethod()"
            x-small
            dense
            :loading="loading"
          >
            SAVE CHANGES
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import OverlayPage from "@/components/OverlayPage.vue";
import SnackBar from "@/components/SnackBar.vue";
import { uploadData } from "aws-amplify/storage";
import { UdpateOrganizationDetails } from "@/graphql/mutations.js";
import { commonAPICallMethod } from "@/mixins/GetCurrentUserDetails.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
export default {
  mixins: [commonAPICallMethod],

  props: {
    showProfileDialogModel: Boolean,
  },
  components: {
    OverlayPage,
    SnackBar,
  },
  data() {
    return {
      overlay: false,
      valid: false,
      loading: false,
      snackbar: {
        show: false,
        text: "",
        color: "success", // or "error" etc.
        timeout: 3000,
      },
      msg: "",
      successmsg: "",
      dialog: false,
      form: {
        user_name: "",
        organization_name: "",
        organization_profile: "",
        user_profile_picture: "",
        user_profile_picture_preview: "",
      },
      UploadedPicResult: {},
    };
  },
  watch: {
    showProfileDialogModel(val) {
      if (val === true) {
        if (
          this.$store.getters.get_currentuser_details
            .organization_profile_picture
        ) {
          this.form.user_profile_picture_preview = `https://intervwd-files.s3.us-east-1.amazonaws.com/${this.$store.getters.get_currentuser_details.organization_profile_picture}`;
        }
      }
    },
  },
  mounted() {
    this.form.user_name = this.$store.getters.get_currentuser_details.user_name;
    this.form.organization_name =
      this.$store.getters.get_currentuser_details.organization_name;
    this.form.organization_profile =
      this.$store.getters.get_currentuser_details.organization_profile;
  },
  methods: {
    closeDialog(Toggle) {
      this.$emit("clicked", Toggle);
    },

    async CommonUploadFileMethod(key, file) {
      try {
        console.log("Key", key, file);
        const result = await uploadData({
          path: key,
          data: file,
        }).result;
        console.log("Result", result);
        return {
          status: "SUCCESS",
          key: key,
          url: key,
          file: file,
        };
      } catch (error) {
        console.log("Err", error);
        this.loading = false;
        this.overlay = false;
        console.log("error", error);
        if (
          error &&
          error.errors &&
          error.errors[0] &&
          error.errors[0].message
        ) {
          this.msg = error;
        }

        // Show error snackbar
        this.snackbar.text = this.msg;
        this.snackbar.color = "red";
        this.snackbar.show = true;
      }
    },
    async validateProfileMethod() {
      try {
        this.loading = true;
        let UploadedPicResult;
        if (this.form.user_profile_picture) {
          const fileExt = this.form.user_profile_picture.name.split(".").pop();
          const filePath = `ProfilePics/${new Date().getTime()}.${fileExt}`;
          UploadedPicResult = await this.CommonUploadFileMethod(
            filePath,
            this.form.user_profile_picture
          );
        }
        let inputParams = {
          updater_user_id: this.$store.getters.get_currentuser_details.user_id,
          organization_id:
            this.$store.getters.get_currentuser_details.organization_id,
          organization_name: this.form.organization_name,
          user_name: this.form.user_name,
          organization_profile: this.form.organization_profile,

          organization_profile_picture: UploadedPicResult
            ? UploadedPicResult.key
            : undefined,
        };
        let result = await client.graphql({
          query: UdpateOrganizationDetails,
          variables: { input: inputParams },
        });
        let ResultObj = JSON.parse(result.data.UdpateOrganizationDetails);
        if (ResultObj.status == "Success") {
          this.snackbar.show = true;
          this.snackbar.text = ResultObj.Status_Message;
          this.snackbar.color = "success";
          this.closeDialog(2);
          await this.GetCurrentUserDetailsMethod();
        }
        this.loading = false;
        console.log("result", result);
      } catch (error) {
        this.loading = false;
        console.log("error", error);
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.form.user_profile_picture = file;
        this.form.user_profile_picture_preview = URL.createObjectURL(file);
      }
    },
  },
};
</script>
