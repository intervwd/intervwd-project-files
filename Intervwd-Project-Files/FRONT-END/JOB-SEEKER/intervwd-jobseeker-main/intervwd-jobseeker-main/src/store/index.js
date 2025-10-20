import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";

export default createStore({
  state: {
    UserEmail: "",
    BacktoJob_Bool: false,
    JOB_ID: "",
  },
  getters: {
    get_user_email: (state) => {
      return state.UserEmail;
    },
    get_currentuser_details: (state) => {
      return state.CurrentUser_Details;
    },
    get_backtojob_boolean: (state) => {
      return state.BacktoJob_Bool;
    },
    get_job_id: (state) => {
      return state.JOB_ID;
    },
  },
  mutations: {
    SET_USER_MAIL(state, email) {
      state.UserEmail = email;
    },
    SET_CURRENT_USER(state, current_user) {
      state.CurrentUser_Details = current_user;
    },
    SET_BACK_TO_JOB(state, backtojob) {
      state.BacktoJob_Bool = backtojob;
    },
    SET_JOB_ID(state, jobid) {
      state.JOB_ID = jobid;
    },
  },
  actions: {},
  modules: {},
  plugins: [createPersistedState()],
});
