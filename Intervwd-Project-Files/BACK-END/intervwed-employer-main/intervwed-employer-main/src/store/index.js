import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";

export default createStore({
  state: {
    UserEmail: "",
  },
  getters: {
    get_user_email: (state) => {
      return state.UserEmail;
    },
    get_currentuser_details: (state) => {
      return state.CurrentUser_Details;
    },
  },
  mutations: {
    SET_USER_MAIL(state, email) {
      state.UserEmail = email;
    },
    SET_CURRENT_USER(state, current_user) {
      state.CurrentUser_Details = current_user;
    },
  },
  actions: {},
  modules: {},
  plugins: [createPersistedState()],
});
