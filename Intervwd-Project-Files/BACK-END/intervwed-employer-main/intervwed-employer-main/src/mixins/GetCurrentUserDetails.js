import { GetCurrentUserDetails } from "@/graphql/queries.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
export const commonAPICallMethod = {
  methods: {
    async GetCurrentUserDetailsMethod() {
      try {
        console.log("API_METHOD_IS_CALLING");
        const result = await client.graphql({
          query: GetCurrentUserDetails,
          variables: {
            input: {
              user_email_id: this.$store.getters.get_user_email,
            },
          },
        });
        const response = JSON.parse(result.data.GetCurrentUserDetails);
        console.log("GetCurrentUserDetails", response);
        this.$store.commit("SET_CURRENT_USER", response.data.items[0]);
        this.CurrentView = "JOB_DESCRIPTION";
      } catch (error) {
        console.log("GetCurrentUserDetails", error);
      }
    },
  },
};
