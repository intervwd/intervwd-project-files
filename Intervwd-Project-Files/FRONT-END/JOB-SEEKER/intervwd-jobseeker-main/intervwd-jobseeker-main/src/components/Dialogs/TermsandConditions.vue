<template>
  <div>
    <v-dialog
      :model-value="TermsAndConditionsDialog"
      persistent
      max-width="600px"
      opacity="1"
    >
      <v-card rounded="lg" class="pa-6">
        <!-- Title -->
        <h2 class="text-h6 font-weight-bold mb-4">
          Instructions Before You Start the Interview
        </h2>

        <!-- Instructions List -->
        <v-list density="comfortable">
          <v-list-item
            v-for="(instruction, index) in instructions"
            :key="index"
            class="mt-n2"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              • {{ instruction }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- Action Button -->
        <div class="text-right mt-4">
          <v-btn color="primary" @click="termsAndConditionsEmit" rounded="lg">
            Got It
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
    TermsAndConditionsDialog: Boolean,
  },
  data() {
    return {
      instructions: [
        "Ensure your microphone is connected and working before starting.",
        "Find a quiet environment to avoid background noise.",
        "Speak clearly and at a natural pace for accurate transcription.",
        "Answer questions honestly and to the best of your ability.",
        "Listen carefully to the interviewer and wait until they finish speaking before responding.",
        "Do not close the window during the interview.",
        "Once started, the interview cannot be paused or restarted.",
        "Your responses will be recorded and transcribed for evaluation.",
        "Ensure your internet connection is stable throughout the interview.",
      ],
    };
  },
  methods: {
    termsAndConditionsEmit() {
      this.$emit("clicked");
    },
  },
};
</script>

<style scoped>
.v-list-item-title {
  font-size: 15px;
  line-height: 1.6;
}
</style>
