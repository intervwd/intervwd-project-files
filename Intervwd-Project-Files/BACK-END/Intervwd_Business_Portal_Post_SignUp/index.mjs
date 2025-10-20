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


const createOrganizationAndBusinessOwner = async (event) => {
  console.log('Event', JSON.stringify(event));
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

  let createOrganizationParams = {
    TableName: "Intervwd_Organizations",
    Item: {
      organization_id: uuidv4(),
      owner_email_id: event.email.replace(/\s/g, "").toLowerCase(),
      owner_name: event["custom:user_name"],
      organization_name: event["custom:business_name"],
      organization_created_on: Date.now(),
      organization_country: event["custom:country"],
      organization_profile: event["custom:business_profile"],
      organization_status: "ACTIVE",
      organization_credits: masterBMS.Items[0].employer_sign_up_credits,
      total_interview_conducted: 0,
      active_jobs: 0,
      closed_jobs: 0,
      total_minutes_used_for_meeting: 0,
      active_managers_count: 0,
      total_credites_counsumed: 0,
      total_credits_balance_added: 0,
      paid_source: "TRAIL",
    }
  };
  await insert_dynamo(createOrganizationParams);

  let createBusinessUserParams = {
    TableName: "Intervwd_Business_Users",
    Item: {
      user_id: uuidv4(),
      organization_id: createOrganizationParams.Item.organization_id,
      organization_name: createOrganizationParams.Item.organization_name,
      user_created_on: Date.now(),
      user_email_id: event.email.replace(/\s/g, "").toLowerCase(),
      user_name: createOrganizationParams.Item.owner_name,
      user_status: "ACTIVE",
      user_role: "OWNER",
    }
  };
  await insert_dynamo(createBusinessUserParams);

  let createCreditTransactionsParams = {
    TableName: 'Intervwd_Credit_Transactions',
    Item: {
      credit_transaction_id: uuidv4(),
      transaction_initiator_user_id: createBusinessUserParams.Item.user_id,
      transaction_initiator_user_name: createBusinessUserParams.Item.user_name,
      transaction_initiator_user_email_id: createBusinessUserParams.Item.user_email_id,
      transaction_date: Date.now(),
      organization_id: createOrganizationParams.Item.organization_id,
      amount: masterBMS.Items[0].employer_sign_up_credits,
      credit_source: "SIGNUP_BONUS",
      reason: `You have received a free signup bonus of ${masterBMS.Items[0].employer_sign_up_credits} credits`
    }
  };
  await insert_dynamo(createCreditTransactionsParams);

  let updateBusinessUserInMaster = {
    TableName: "Intervwd_Master",
    Key: {
      master_id: "MASTER_ID"
    },
    UpdateExpression: "ADD total_business_users :total_business_users, total_credites :total_credites",
    ExpressionAttributeValues: {
      ":total_business_users": 1,
      ":total_credites": masterBMS.Items[0].employer_sign_up_credits,
    }
  };
  await update_dynamo(updateBusinessUserInMaster);

  let createAuditLog = {
    TableName: "Intervwd_Audit_logs",
    Item: {
      audit_log_id: uuidv4(),
      audit_acted_user_email_id: createCreditTransactionsParams.Item.transaction_initiator_user_email_id,
      audit_acted_user_id: createCreditTransactionsParams.Item.transaction_initiator_user_id,
      audit_acted_user_name: createCreditTransactionsParams.Item.transaction_initiator_user_name,
      audit_type: "BUSINESS",
      audit_source: "BUSINESS_ACCOUNT_REGISTERED",
      audit_created_on: Date.now(),
      audit_message: `Organization ${createOrganizationParams.Item.organization_name} (${createOrganizationParams.Item.organization_id}) successfully onboarded. Account created by user: ${createCreditTransactionsParams.Item.transaction_initiator_user_id}.`
    }
  };
  await insert_dynamo(createAuditLog);

  return {
    "status": "Success",
    "status_message": "Business user created successfully."
  };
};

const resetPassword = async (user_pool_id, user_email_id) => {
  const input = {
    UserPoolId: 'us-east-1_AT2QvQNmG',
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

  await createOrganizationAndBusinessOwner(event.request.userAttributes);

  return event;
};
