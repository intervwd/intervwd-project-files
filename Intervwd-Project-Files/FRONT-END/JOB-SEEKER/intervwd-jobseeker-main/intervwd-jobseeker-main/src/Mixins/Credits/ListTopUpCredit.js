import { ListTopUpCreditHistory } from "@/graphql/queries.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export const ListTopUpCreditFunction = {
  data: () => ({}),
  methods: {
    async listTopUpCreditMethod() {
      try {
        this.TableLoading = true;
        let result = await client.graphql({
          query: ListTopUpCreditHistory,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
            },
          },
        });
        console.log("result", result);
        let ResultObj = JSON.parse(result.data.ListTopUpCreditHistory).data
          .items;
        console.log("List Jobs", ResultObj);
        this.TableLoading = false;
        return ResultObj;
      } catch (error) {
        console.log("error", error);
        this.TableLoading = false;

        this.SnackbarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          SnackbarText: error.errors[0].message,
        };
      }
    },
  },
};
