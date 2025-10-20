<template>
  <div>
    <v-dialog :model-value="InterViewDoneDialog" width="400px" persistent>
      <v-card class="pa-6 text-center" rounded="lg">
        <div class="text-center">
          <v-icon size="80" color="green" class="mb-4">mdi-check-circle</v-icon>
        </div>

        <div class="text-h6 font-weight-medium" align="center">
          Interview Completed Successfully!
        </div>

        <p class="text-subtitle-2 text-grey-darken-1">
          Thank you for completing your interview. Your responses have been
          recorded and submitted.
        </p>

        <v-card-actions class="justify-center mt-4">
          <v-btn
            color="green"
            variant="flat"
            @click="InterViewDoneDialogEmit()"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
    InterViewDoneDialog: Boolean,
  },
  methods: {
    InterViewDoneDialogEmit() {
      this.$emit("clicked");
    },
  },
};
</script>
