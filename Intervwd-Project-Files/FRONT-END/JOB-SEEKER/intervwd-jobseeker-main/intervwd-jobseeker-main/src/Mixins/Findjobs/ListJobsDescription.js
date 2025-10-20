import { ListJobDescriptions } from "@/graphql/queries.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export const ListJobDescriptionsFunction = {
  data: () => ({}),
  methods: {
    async listJobDescriptionsMethod() {
      try {
        this.overlay = true;
        let result = await client.graphql({
          query: ListJobDescriptions,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
            },
          },
        });
        console.log("result", result);
        let ResultObj = JSON.parse(result.data.ListJobDescriptions).data.items;
        console.log("List Jobs", ResultObj);
        this.$store.commit("SET_BACK_TO_JOB", false);

        this.overlay = false;

        return ResultObj;
      } catch (error) {
        this.overlay = false;
        console.log("error", error);
        this.SnackbarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          SnackbarText: error.errors[0].message,
        };
      }
    },
  },
};
