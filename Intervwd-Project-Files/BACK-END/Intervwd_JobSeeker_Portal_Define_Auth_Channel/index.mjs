import { CognitoIdentityProviderClient, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";


export const handler = async (event) => {
  console.log('event', JSON.stringify(event));
  try {
    if (!event.request.userNotFound) {
      if (event.request.userAttributes.email) {
        const { userName } = event;

        const cognito = new CognitoIdentityProviderClient({ region: "us-east-1" });

        // Check if the user is disabled in Cognito
        const userParams = {
          UserPoolId: "us-east-1_LB4Jrp023",
          Username: userName
        };
        const userData = await cognito.send(new AdminGetUserCommand(userParams));
        console.log("userData by ", userData);
        if (userData.Enabled === false) {
          throw new Error("Invalid Email Address!!");
        }
        else if (event.request.session && event.request.session.find((attempt) => attempt.challengeName !== 'CUSTOM_CHALLENGE')) {
          event.response.issueTokens = false;
          event.response.failAuthentication = true;
        }
        else if (event.request.session && event.request.session.length >= 3 && event.request.session.slice(-1)[0].challengeResult === false) {
          event.response.issueTokens = false;
          event.response.failAuthentication = true;
        }
        else if (event.request.session && event.request.session.length && event.request.session.slice(-1)[0].challengeName === 'CUSTOM_CHALLENGE' && event.request.session.slice(-1)[0].challengeResult === true) {
          event.response.issueTokens = true;
          event.response.failAuthentication = false;
          event.response.challengeName = 'CUSTOM_CHALLENGE';
        }
        else {
          event.response.issueTokens = false;
          event.response.failAuthentication = false;
          event.response.challengeName = 'CUSTOM_CHALLENGE';
        }
        console.log("EVENT AFTER!!!", JSON.stringify(event));
        return event;
      }
      else {
        throw new Error("NOT_AUTHORIZED : Email ID is Invalid!!");
      }
    }
    else {
      throw new Error("NOT_AUTHORIZED : Kindly Sigup");
    }
  }
  catch (e) {
    throw new Error(e);
  }
};
