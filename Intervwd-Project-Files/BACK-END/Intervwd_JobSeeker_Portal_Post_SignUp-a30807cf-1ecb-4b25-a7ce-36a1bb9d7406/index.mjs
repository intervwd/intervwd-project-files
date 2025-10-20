//********************************* LAYERS *********************************
import { v4 as uuidv4 } from "uuid";

//********************************* COGNITO *********************************
import { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
const cognitoClient = new CognitoIdentityProviderClient({
  apiVersion: "2016-04-18",
  region: "us-east-1",
});

//********************************* DynamoDB *********************************
import * as dynamodb from "@aws-sdk/client-dynamodb";
import * as ddb from "@aws-sdk/lib-dynamodb";
const docClient = new dynamodb.DynamoDBClient();
const ddbDocClient = ddb.DynamoDBDocumentClient.from(docClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const insert_dynamo = async (params) => {
  try {
    await ddbDocClient.send(new ddb.PutCommand({ ...params, removeUndefinedValues: true }));
    return "SUCCESS";
  }
  catch (err) {
    console.log(params, err);
    throw new Error(err);
  }
};

export const query_dynamo = async (params) => {
  try {
    const results = await ddbDocClient.send(new ddb.QueryCommand(params));
    return results;
  }
  catch (err) {
    console.log(params);
    console.error(err);
  }
};

const query_all_dynamo = async params => {
  try {
    let data = { Items: [], Count: 0 };
    const query_dynamo = async table_params => {
      let table_data = await docClient.send(new ddb.QueryCommand(params));
      if (table_data.Count > 0) {

        data.Count += table_data.Count;
        data.Items = data.Items.concat(table_data.Items);

        if (table_data.LastEvaluatedKey != undefined || table_data.LastEvaluatedKey != null) {
          table_params.ExclusiveStartKey = table_data.LastEvaluatedKey;
          return await query_dynamo(table_params);
        }
        else {
          return data;
        }
      }
      else {
        return data;
      }
    };
    return await query_dynamo(params);
  }
  catch (err) {
    console.log(params, err);
    throw new Error(err);
  }
};

export const scan_dynamo = async (params) => {
  try {
    const results = await ddbDocClient.send(new ddb.ScanCommand(params));
    return results;
  }
  catch (err) {
    console.log(params);
    console.error(err);
  }
};

export const update_dynamo = async (params) => {
  try {
    const results = await ddbDocClient.send(new ddb.UpdateCommand(params));
    return results;
  }
  catch (err) {
    console.log(params, err);
    throw new Error(err);
  }
};

export const delete_dynamo = async (params) => {
  try {
    await ddbDocClient.send(new ddb.DeleteCommand(params));
    return "SUCCESS";
  }
  catch (err) {
    console.log(params, err);
    throw new Error(err);
  }
};

const createJobSeeker = async (event) => {
  console.log('createJobSeeker', JSON.stringify(event));
  if (!event.email) {
    throw new Error("Email must be provided");
  }

  let getMasterBMSDetails = {
    TableName: "Intervwd_Master",
    KeyConditionExpression: "master_id = :master_id",
    ExpressionAttributeValues: {
      ":master_id": "MASTER_ID"
    }
  };
  let masterBMS = await query_dynamo(getMasterBMSDetails);

  let isUserExistInInvitie = false;

  let user_id = uuidv4();
  let checkIfUserIsExists = {
    TableName: "Intervwd_Invited_Interviews",
    IndexName: "invitie_email_id-invited_status-index",
    KeyConditionExpression: "invitie_email_id = :invitie_email_id AND invited_status = :invited_status",
    ExpressionAttributeValues: {
      ":invitie_email_id": event.email.replace(/\s/g, "").toLowerCase(),
      ":invited_status": "INVITED"
    }
  };
  let jobSeekerUser = await query_dynamo(checkIfUserIsExists);
  if (jobSeekerUser.Count > 0) {
    isUserExistInInvitie = true;
    user_id = jobSeekerUser.Items[0].invitie_user_id;
  }

  let createJobSeekerUserParams = {
    TableName: "Intervwd_JobSeeker_Users",
    Item: {
      user_id: user_id,
      user_created_on: Date.now(),
      user_email_id: event.email.replace(/\s/g, "").toLowerCase(),
      user_name: event["custom:user_name"],
      user_country: event["custom:user_country"],
      audio_profile: event["custom:audio_profile"],
      user_city: event["custom:user_city"],
      user_status: "ACTIVE",
      paid_source: "TRAIL",
      credits: masterBMS.Items[0].job_seeker_sign_up_credits,
      total_consumed_credits: 0,
      total_interviews_attended: 0,
      total_minutes_consumed_for_attended_meeting: 0,
      total_credits_balance_added: 0
    }
  };
  await insert_dynamo(createJobSeekerUserParams);
  console.log('user created!');


  if (isUserExistInInvitie) {
    let updateJobSeeker = {
      TableName: "Intervwd_Invited_Interviews",
      Key: {
        interview_invited_id: jobSeekerUser.Items[0].interview_invited_id
      },
      UpdateExpression: "Set invited_status = :invited_status, invitie_verified_on = :invitie_verified_on",
      ExpressionAttributeValues: {
        ":invited_status": "VERIFIED",
        ":invitie_verified_on": Date.now(),
      }
    };
    await update_dynamo(updateJobSeeker);
  }

  let createCreditTransactionsParams = {
    TableName: 'Intervwd_Credit_Transactions',
    Item: {
      credit_transaction_id: uuidv4(),
      transaction_initiator_user_id: user_id,
      transaction_initiator_user_name: createJobSeekerUserParams.Item.user_name,
      transaction_initiator_user_email_id: createJobSeekerUserParams.Item.user_email_id,
      transaction_date: Date.now(),
      amount: masterBMS.Items[0].job_seeker_sign_up_credits,
      credit_source: "SIGNUP_BONUS",
      reason: `You have received a free signup bonus of ${masterBMS.Items[0].job_seeker_sign_up_credits} credits`
    }
  };
  await insert_dynamo(createCreditTransactionsParams);

  let updateBusinessUserInMaster = {
    TableName: "Intervwd_Master",
    Key: {
      master_id: "MASTER_ID"
    },
    UpdateExpression: "ADD total_job_seekers :total_job_seekers, total_credites :total_credites",
    ExpressionAttributeValues: {
      ":total_job_seekers": 1,
      ":total_credites": masterBMS.Items[0].job_seeker_sign_up_credits,
    }
  };
  await update_dynamo(updateBusinessUserInMaster);

  let createAuditLog = {
    TableName: "Intervwd_Audit_logs",
    Item: {
      audit_log_id: uuidv4(),
      audit_acted_user_email_id: createJobSeekerUserParams.Item.user_email_id,
      audit_acted_user_id: createJobSeekerUserParams.Item.user_id,
      audit_acted_user_name: createJobSeekerUserParams.Item.user_name,
      audit_source: "JOB_SEEKER",
      audit_type: "JOB_SEEKER_ACCOUNT_REGISTERED",
      audit_created_on: Date.now(),
      audit_message: `Job seeker account registered with ${event.email}`
    }
  };
  await insert_dynamo(createAuditLog);

  return {
    "status": "Success",
    "status_message": "Jobseeker user created successfully."
  };
};

const resetPassword = async (user_pool_id, user_email_id) => {
  const input = {
    UserPoolId: 'us-east-1_LB4Jrp023',
    Username: user_email_id,
    Password: "Alumni@123",
    Permanent: true,
  };
  const command = new AdminSetUserPasswordCommand(input);
  const response = await cognitoClient.send(command);
};


export const handler = async (event) => {
  console.log('EVENT ', JSON.stringify(event));
  const { userName, userPoolId } = event;
  let user_email_id = event.request.userAttributes.email;
  await resetPassword(userPoolId, user_email_id);

  await createJobSeeker(event.request.userAttributes);

  return event;
};
