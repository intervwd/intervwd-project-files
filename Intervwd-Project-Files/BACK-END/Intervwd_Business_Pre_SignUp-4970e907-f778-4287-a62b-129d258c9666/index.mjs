export const handler = async (event) => {
  console.log(JSON.stringify(event));
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  return event;
};
