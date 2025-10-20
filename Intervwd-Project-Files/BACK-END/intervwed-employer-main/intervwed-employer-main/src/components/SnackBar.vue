<template>
  <div>
    <v-snackbar
      v-model="internalShow"
      :color="snackbarColor"
      location="top"
      :timeout="timeout"
      transition="scroll-y-transition"
      :class="$route.path !== '/login' ? 'mt-5' : 'mt-n10'"
    >
      <div class="text-center">{{ snackbarText }}</div>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  name: "SnackBar",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    snackbarColor: {
      type: String,
      default: "",
    },
    snackbarText: {
      type: String,
      default: "",
    },
    timeout: {
      type: Number,
      default: 3000,
    },
  },
  computed: {
    internalShow: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
  },
};
</script>
