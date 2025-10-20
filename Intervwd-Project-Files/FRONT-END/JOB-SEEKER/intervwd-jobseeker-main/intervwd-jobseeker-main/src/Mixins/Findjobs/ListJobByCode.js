import { ListSearchJobDescriptionByJobCode } from "@/graphql/queries.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export const ListJobByCodeFunction = {
  data: () => ({}),
  methods: {
    async listJobbyCodeMethod(JOBCODE, Boolean) {
      if (Boolean == true) {
        this.loading = true;
      }
      try {
        let result = await client.graphql({
          query: ListSearchJobDescriptionByJobCode,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              job_code: JOBCODE,
            },
          },
        });
        console.log("result", result);
        let ResultObj = JSON.parse(
          result.data.ListSearchJobDescriptionByJobCode
        ).data.items[0];
        this.$store.commit("SET_BACK_TO_JOB", true);
        console.log("List Jobs", ResultObj);
        this.loading = false;
        return ResultObj;
      } catch (error) {
        this.loading = false;
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
