import { ListInterviews } from "@/graphql/queries.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export const ListMYInterviewsFunction = {
  data: () => ({}),
  methods: {
    async listMYInterviewsMethod() {
      try {
        this.TableLoading = true;
        let result = await client.graphql({
          query: ListInterviews,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
            },
          },
        });
        console.log("result", result);
        let ResultObj = JSON.parse(result.data.ListInterviews).data.items;
        console.log("List Jobs", ResultObj);
        this.TableLoading = false;
        return ResultObj;
      } catch (error) {
        this.TableLoading = false;
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
