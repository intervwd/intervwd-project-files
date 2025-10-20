//********************************* LAYERS *********************************
import { v4 as uuidv4 } from "uuid";
import Razorpay from 'razorpay';
//********************************* DynamoDB *********************************
import * as dynamodb from "@aws-sdk/client-dynamodb";
import * as ddb from "@aws-sdk/lib-dynamodb";
const docClient = new dynamodb.DynamoDBClient();
const ddbDocClient = ddb.DynamoDBDocumentClient.from(docClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

import { CognitoIdentityProviderClient, AdminCreateUserCommand, ListUsersCommand, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
const cognito_client = new CognitoIdentityProviderClient({
  apiVersion: "2016-04-18",
  region: "us-east-1",
});

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
const sesClient = new SESClient({ region: 'us-east-1' });

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

const createAuditLog = async (event) => {
  let createAuditLogParams = {
    TableName: "Intervwd_Audit_logs",
    Item: {
      audit_log_id: uuidv4(),
      audit_acted_user_email_id: event.user_email_id,
      audit_acted_user_id: event.user_id,
      acted_for_user_id: event.acted_for_user_id,
      audit_acted_user_name: event.user_name,
      organization_id: event.organization_id,
      audit_source: "BUSINESS",
      audit_type: event.audit_type,
      audit_created_on: event.audit_created_on,
      audit_message: event.message
    }
  };
  await insert_dynamo(createAuditLogParams);
};

function generate_random_digits(n) {
  let digits = '';
  for (let i = 0; i < n; i++) {
    digits += Math.floor(Math.random() * 10); // generates a digit from 0-9
  }
  return digits;
}

const createCognitoUser = async (event) => {
  try {

    if (!event.user_email_id) {
      throw new Error("Email is required");
    }

    const attributes = [];

    if (event.user_email_id) {
      attributes.push({ Name: "email", Value: event.user_email_id.replace(/\s/g, "").toLowerCase() }, { Name: "email_verified", Value: "true" });
    }

    const username = event.user_email_id.replace(/\s/g, "").toLowerCase();

    const temporaryPassword = await generate_random_digits(6);

    const params = {
      UserPoolId: "us-east-1_AT2QvQNmG",
      Username: username,
      UserAttributes: attributes,
      TemporaryPassword: temporaryPassword,
      DesiredDeliveryMediums: ["EMAIL"],
    };

    const command = new AdminCreateUserCommand(params);
    const response = await cognito_client.send(command);

    return { status: "Success", status_message: "" };
  }
  catch (err) {
    console.error("Error creating Cognito user:", err);
    throw new Error(err.message || "Failed to create user in Cognito");
  }
};

const sendInvitationEmail = async (email, inviterUserName, organizationName) => {
  const sendEmailCommand = new SendEmailCommand({
    Source: "no-reply@intervwd.com",
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Invitation to join Intervwd`,
      },
      Body: {
        Text: {
          Data: `
Hello ${inviterUserName},

you have been invited you to join Intervwd as a Hiring Manager for the organization ${organizationName}.

Click the link below to login to Intervwd:
https://business.intervwd.com

If you were not expecting this, please ignore this email.

— Intervwd Team
www.intervwd.com
          `,
        },
        Html: {
          Data: `
                    <!doctype html>
                    <html lang="en">
                    <head>
                      <meta charset="utf-8" />
                      <style>
                        body {
                          font-family: Arial, sans-serif;
                          background-color: #f8fafc;
                          margin: 0;
                          padding: 0;
                          color: #111827;
                        }
                        .container {
                          background-color: #ffffff;
                          max-width: 600px;
                          margin: 30px auto;
                          border-radius: 8px;
                          padding: 24px;
                          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                        }
                        .header {
                          font-size: 20px;
                          font-weight: bold;
                          margin-bottom: 12px;
                          color: #0b3558;
                        }
                        .link {
                          display: inline-block;
                          margin: 16px 0;
                          padding: 10px 16px;
                          background-color: #0ea5a0;
                          color: #ffffff !important;
                          text-decoration: none;
                          border-radius: 6px;
                          font-weight: 600;
                        }
                        .footer {
                          font-size: 13px;
                          color: #6b7280;
                          margin-top: 20px;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">Hello,</div>
                        <p><strong>You have been invited you to join <strong>Intervwd</strong> as a Hiring Manager for the organization <strong>${organizationName}</strong>.</p>
                        <p>
                          <a href="https://business.intervwd.com" class="link" target="_blank" rel="noopener noreferrer">Login to Intervwd</a>
                        </p>
                        <p>If you were not expecting this, please ignore this email.</p>
                        <p class="footer">— Intervwd Team<br />www.intervwd.com</p>
                      </div>
                    </body>
                    </html>
          `,
        },
      },
    },
  });

  try {
    await sesClient.send(sendEmailCommand);
    console.log(`Invitation email sent to ${email}`);
  }
  catch (error) {
    console.error("Error sending invitation email:", error);
  }
};

let getCurrentUserDetails = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    IndexName: "user_email_id-index",
    KeyConditionExpression: "user_email_id = :user_email_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_email_id": event.user_email_id.replace(/\s/g, "").toLowerCase(),
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfUserIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getOrganizatinDetails = {
    TableName: "Intervwd_Organizations",
    KeyConditionExpression: "organization_id = :organization_id",
    ExpressionAttributeValues: {
      ":organization_id": user.Items[0].organization_id
    }
  };
  let organization = await query_dynamo(getOrganizatinDetails);

  let getMasterBMSDetails = {
    TableName: "Intervwd_Master",
    KeyConditionExpression: "master_id = :master_id",
    ExpressionAttributeValues: {
      ":master_id": "MASTER_ID"
    }
  };
  let masterBMS = await query_dynamo(getMasterBMSDetails);

  let response = {};
  if (user.Items[0].user_role == "OWNER") {
    response.items = [{
      ...user.Items[0],
      ...organization.Items[0],
      credits_consumed_per_minute: masterBMS.Items[0].credits_consumed_per_minute,
      credits_per_candidate_invite: masterBMS.Items[0].credits_per_candidate_invite,
      credits_per_job_opportunity_creation: masterBMS.Items[0].credits_per_job_opportunity_creation,
    }];
  }
  else {
    response.items = user.Items.map(item => ({
      ...item,
      organization_name: organization.Items[0].organization_name,
      organization_credits: organization.Items[0].organization_credits,
      active_managers_count: organization.Items[0].active_managers_count,
      total_credits_balance_added: organization.Items[0].total_credits_balance_added,
      credits_consumed_per_minute: masterBMS.Items[0].credits_consumed_per_minute,
      credits_per_candidate_invite: masterBMS.Items[0].credits_per_candidate_invite,
      credits_per_job_opportunity_creation: masterBMS.Items[0].credits_per_job_opportunity_creation,
    }));
  }

  return {
    status: "Success",
    data: response
  };
};

const udpateMyDetails = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfUserIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  const date = Date.now();

  let UpdateExpression = 'set';
  let ExpressionAttributeNames = {};
  let ExpressionAttributeValues = {};

  for (const field in event) {
    if (field == "user_name" || field == "user_profile_picture" || field == "user_name") {
      UpdateExpression += ` #${field} = :${field},`;
      ExpressionAttributeNames['#' + field] = field;
      ExpressionAttributeValues[':' + field] = event[field];
    }
  }

  if (UpdateExpression != 'set') {
    UpdateExpression = UpdateExpression.slice(0, -1);
    let updateUser = {
      TableName: "Intervwd_Business_Users",
      Key: {
        user_id: event.user_id
      },
      UpdateExpression: UpdateExpression,
      ExpressionAttributeNames: ExpressionAttributeNames,
      ExpressionAttributeValues: ExpressionAttributeValues,
      ReturnValues: 'UPDATED_NEW',
    };
    await update_dynamo(updateUser);

    let createAuditLogParams = {
      TableName: "Intervwd_Audit_logs",
      Item: {
        audit_log_id: uuidv4(),
        audit_acted_user_email_id: user.Items[0].user_email_id,
        audit_acted_user_id: event.user_id,
        acted_for_user_id: event.user_id,
        audit_acted_user_name: user.Items[0].user_name,
        organization_id: user.Items[0].organization_id,
        audit_source: "BUSINESS",
        audit_type: "PROFILE_UPDATE",
        audit_created_on: date,
        audit_message: `User details for ${user.Items[0].user_email_id} updated.`
      }
    };
    await insert_dynamo(createAuditLogParams);

    return { status: 'Success', Status_Message: "Details have been successfully updated." };
  }
  else {
    throw new Error("No records were updated");
  }
};

const getUserByEmailOrPhone = async (email) => {
  try {
    let filter;
    if (email) {
      filter = `email = "${email}"`;
    }
    else {
      throw new Error("Either email is required");
    }

    const command = new ListUsersCommand({
      UserPoolId: "us-east-1_AT2QvQNmG",
      Filter: filter,
      Limit: 1,
    });

    const response = await cognito_client.send(command);
    if (response.Users && response.Users.length > 0) {
      return response.Users[0];
    }
    else {
      return null;
    }
  }
  catch (err) {
    console.error("Error fetching user:", err);
    throw err;
  }
};

const createManagerUser = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status AND user_role = :user_role",
    ExpressionAttributeValues: {
      ":user_id": event.creator_user_id,
      ":user_role": "OWNER",
      ":user_status": "ACTIVE"
    }
  };
  let creator = await query_dynamo(checkIfUserIsExists);
  if (creator.Count == 0) {
    throw new Error("Invalid user!");
  }

  let manager_email_id = event.manager_email_id.replace(/\s/g, "").toLowerCase();

  let cognitoUserExisted = false;
  let userByEmail = await getUserByEmailOrPhone(manager_email_id);
  if (userByEmail) {
    cognitoUserExisted = true;
    throw new Error(`Email with ${event.manager_email_id} already Exist`);
  }

  let checkIfManagerIsAlreadyExists = {
    TableName: "Intervwd_Business_Users",
    IndexName: "user_email_id-index",
    KeyConditionExpression: "user_email_id = :user_email_id",
    FilterExpression: "organization_id = :organization_id",
    ExpressionAttributeValues: {
      ":user_email_id": manager_email_id,
      ":organization_id": event.organization_id
    }
  };
  let managerUser = await query_dynamo(checkIfManagerIsAlreadyExists);
  if (managerUser.Count > 0) {
    throw new Error(`Email with ${event.manager_email_id} already part of this organization`);
  }

  const date = Date.now();

  let createBusinessUserParams = {
    TableName: "Intervwd_Business_Users",
    Item: {
      user_id: uuidv4(),
      organization_id: event.organization_id,
      user_created_on: date,
      user_email_id: event.manager_email_id.replace(/\s/g, "").toLowerCase(),
      user_name: event.user_name,
      user_status: "ACTIVE",
      user_role: "MANAGER",
      active_jobs: 0,
      closed_jobs: 0,
      total_interview_conducted: 0
    }
  };
  await insert_dynamo(createBusinessUserParams);

  if (!cognitoUserExisted) {
    event.user_email_id = event.manager_email_id;
    await createCognitoUser(event);
    // await sendInvitationEmail(event.user_email_id, creator.Items[0].user_name, creator.Items[0].organization_name);
    await sendInvitationEmail(event.user_email_id, event.user_name, creator.Items[0].organization_name);
  }

  let updateOrganization = {
    TableName: "Intervwd_Organizations",
    Key: {
      organization_id: event.organization_id
    },
    UpdateExpression: "ADD active_managers_count :active_managers_count",
    ExpressionAttributeValues: {
      ":active_managers_count": 1
    }
  };
  await update_dynamo(updateOrganization);

  let createAuditLogParams = {
    TableName: "Intervwd_Audit_logs",
    Item: {
      audit_log_id: uuidv4(),
      audit_acted_user_email_id: creator.Items[0].user_email_id,
      audit_acted_user_id: event.creator_user_id,
      acted_for_user_id: event.creator_user_id,
      audit_acted_user_name: creator.Items[0].user_name,
      organization_id: event.organization_id,
      audit_source: "BUSINESS",
      audit_type: "MANAGER_CREATED",
      audit_created_on: date,
      audit_message: `New Manager account created for ${manager_email_id} within Organization ${creator.Items[0].organization_name} (${creator.Items[0].organization_id}). Initiated by Owner: ${creator.Items[0].user_email_id}.`
    }
  };
  await insert_dynamo(createAuditLogParams);

  return {
    "status": "Success",
    "status_message": `Hiring Manager ${event.user_name} created successfully.`
  };
};

const listManagerUsers = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      // ":user_role": "OWNER",
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfUserIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getManagersList = {
    TableName: "Intervwd_Business_Users",
    IndexName: 'organization_id-user_role-index',
    KeyConditionExpression: "organization_id = :organization_id AND user_role = :user_role",
    ExpressionAttributeValues: {
      ":organization_id": event.organization_id,
      ":user_role": "MANAGER"
    }
  };
  let managersList = await query_dynamo(getManagersList);
  if (managersList.Count == 0) {
    throw new Error("No found");
  }

  let response = {
    items: managersList.Items
  };

  return {
    "status": "Success",
    data: response
  };
};

const deleteManagerUser = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status AND user_role = :user_role",
    ExpressionAttributeValues: {
      ":user_id": event.updater_user_id,
      ":user_role": "OWNER",
      ":user_status": "ACTIVE"
    }
  };
  let updater = await query_dynamo(checkIfUserIsExists);
  if (updater.Count == 0) {
    throw new Error("Invalid updater!");
  }
  let checkIfManagerIsAlreadyExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    ExpressionAttributeValues: {
      ":user_id": event.manager_user_id,
    }
  };
  let managerUser = await query_dynamo(checkIfManagerIsAlreadyExists);
  if (managerUser.Count == 0) {
    throw new Error(`Manager not found`);
  }
  console.log('managerUser ', managerUser);

  let canDeleteCognitoUser = true;

  let checkIfManagerIsExistedInOtherOrganization = {
    TableName: "Intervwd_Business_Users",
    IndexName: "user_email_id-index",
    KeyConditionExpression: "user_email_id = :user_email_id",
    ExpressionAttributeValues: {
      ":user_email_id": managerUser.Items[0].user_email_id,
    }
  };
  let managerUserExistedInOtherOrga = await query_dynamo(checkIfManagerIsExistedInOtherOrganization);
  if (managerUserExistedInOtherOrga.Count > 1) {
    canDeleteCognitoUser = false;
  }

  let deleteManagerParams = {
    TableName: "Intervwd_Business_Users",
    Key: {
      user_id: event.manager_user_id
    }
  };
  await delete_dynamo(deleteManagerParams);

  let updateOrganization = {
    TableName: "Intervwd_Organizations",
    Key: {
      organization_id: event.organization_id
    },
    UpdateExpression: "ADD active_managers_count :active_managers_count",
    ExpressionAttributeValues: {
      ":active_managers_count": -1
    }
  };
  await update_dynamo(updateOrganization);

  if (canDeleteCognitoUser) {
    try {
      const deleteCognitoUserParams = {
        UserPoolId: "us-east-1_AT2QvQNmG",
        Username: managerUser.Items[0].user_email_id
      };
      const command = new AdminDeleteUserCommand(deleteCognitoUserParams);
      await cognito_client.send(command);
      console.log(`Successfully deleted Cognito user: ${managerUser.Items[0].user_email_id}`);
    }
    catch (err) {
      console.error(`Failed to delete Cognito user ${managerUser.Items[0].user_email_id}. They might not exist in Cognito or another error occurred.`, err);
    }
  }

  let createAuditLogParams = {
    TableName: "Intervwd_Audit_logs",
    Item: {
      audit_log_id: uuidv4(),
      audit_acted_user_email_id: updater.Items[0].user_email_id,
      audit_acted_user_id: event.updater_user_id,
      acted_for_user_id: event.manager_user_id,
      audit_acted_user_name: updater.Items[0].user_name,
      organization_id: event.organization_id,
      audit_source: "BUSINESS",
      audit_type: "MANAGER_DELETED",
      audit_created_on: Date.now(),
      audit_message: `Manager account for ${managerUser.Items[0].user_email_id} was permanently deleted from Organization ${updater.Items[0].organization_name} (${updater.Items[0].organization_id}). Action initiated by Owner: ${updater.Items[0].user_email_id}.`
    }
  };
  await insert_dynamo(createAuditLogParams);

  return {
    "status": "Success",
    "status_message": `Successfully deleted ${managerUser.Items[0].user_name} hiring manager.`
  };
};

const createJobDescription = async (event) => {
  let checkIfJDCreatorIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status AND organization_id = :organization_id",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      ":organization_id": event.organization_id,
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfJDCreatorIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getOrganizatinDetails = {
    TableName: "Intervwd_Organizations",
    KeyConditionExpression: "organization_id = :organization_id",
    ExpressionAttributeValues: {
      ":organization_id": event.organization_id
    }
  };
  let organization = await query_dynamo(getOrganizatinDetails);

  function generateUniqueCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  let job_code = await generateUniqueCode();

  let createJobDescriptionParams = {
    TableName: "Intervwd_Job_description",
    Item: {
      jd_id: uuidv4(),
      job_code: job_code,
      job_code_link: 'www.formintervwd.com/' + job_code,
      created_by_user_id: event.user_id,
      created_by_user_name: user.Items[0].user_name,
      created_by_user_email_id: user.Items[0].user_email_id,
      organization_id: event.organization_id,
      job_title: event.job_title,
      job_location: event.job_location,
      city: event.city,
      country: event.country,
      job_description: event.job_description,
      skills_needed: event.skills_needed,
      experience_level: event.experience_level,
      communication_skills_required: event.communication_skills_required,
      make_this_job_publicly_searchable: event.make_this_job_publicly_searchable,
      who_pays_for_the_interview: event.who_pays_for_the_interview,
      jd_created_on: Date.now(),
      jd_modified_on: Date.now(),
      jd_status: "ACTIVE",
      created_user_type: user.Items[0].user_role,
      company_name: organization.Items[0].organization_name,
      number_of_interviews: 0,
      number_of_interviews_allowed: event.number_of_interviews_allowed
    }
  };
  await insert_dynamo(createJobDescriptionParams);

  let getMasterBMSDetails = {
    TableName: "Intervwd_Master",
    KeyConditionExpression: "master_id = :master_id",
    ExpressionAttributeValues: {
      ":master_id": "MASTER_ID"
    }
  };
  let masterBMS = await query_dynamo(getMasterBMSDetails);

  let updateOrganization = {
    TableName: "Intervwd_Organizations",
    Key: {
      organization_id: event.organization_id
    },
    UpdateExpression: "ADD active_jobs :active_jobs, organization_credits :organization_credits, total_credites_counsumed :total_credites_counsumed",
    ExpressionAttributeValues: {
      ":active_jobs": 1,
      ":organization_credits": -masterBMS.Items[0].credits_per_job_opportunity_creation,
      ":total_credites_counsumed": masterBMS.Items[0].credits_per_job_opportunity_creation,
    }
  };
  await update_dynamo(updateOrganization);

  let updateBusinessUserInMaster = {
    TableName: "Intervwd_Master",
    Key: {
      master_id: "MASTER_ID"
    },
    UpdateExpression: "ADD total_active_jobs :total_active_jobs, total_jobs :total_jobs, till_now_used_total_credited :till_now_used_total_credited",
    ExpressionAttributeValues: {
      ":total_active_jobs": 1,
      ":total_jobs": 1,
      ":till_now_used_total_credited": masterBMS.Items[0].credits_per_job_opportunity_creation
    }
  };
  await update_dynamo(updateBusinessUserInMaster);

  const date = Date.now();

  let createAuditLogParams = {
    TableName: "Intervwd_Audit_logs",
    Item: {
      audit_log_id: uuidv4(),
      audit_acted_user_email_id: user.Items[0].user_email_id,
      audit_acted_user_id: event.user_id,
      acted_for_user_id: event.user_id,
      audit_acted_user_name: user.Items[0].user_name,
      organization_id: event.organization_id,
      audit_source: "BUSINESS",
      audit_type: "JD_CREATED",
      audit_created_on: Date.now(),
      audit_message: `New Job Description "${event.job_title}" (ID: ${job_code}) created within Organization ${organization.Items[0].organization_name}. Initiated by user: ${user.Items[0].user_email_id}.`
    }
  };
  await insert_dynamo(createAuditLogParams);

  let createCreditTransactionsParams = {
    TableName: 'Intervwd_Credit_Transactions',
    Item: {
      credit_transaction_id: uuidv4(),
      transaction_initiator_user_id: event.user_id,
      transaction_initiator_user_name: user.Items[0].user_name,
      transaction_initiator_user_email_id: user.Items[0].user_email_id,
      transaction_date: date,
      organization_id: user.Items[0].organization_id,
      amount: masterBMS.Items[0].credits_per_job_opportunity_creation,
      credit_description: `New Job Description "${event.job_title}" (ID: ${job_code}) created within Organization ${organization.Items[0].organization_name}. Initiated by user: ${user.Items[0].user_email_id}.`,
      reason: `Job ID: ${job_code} created`,
      transaction_status: "SUCCESS",
      credit_source: "DEBIT"
    }
  };
  await insert_dynamo(createCreditTransactionsParams);

  if (user.Items[0].user_role == "MANAGER") {
    let updateUser = {
      TableName: "Intervwd_Business_Users",
      Key: {
        user_id: event.user_id
      },
      UpdateExpression: "ADD active_jobs :active_jobs, consumed_credits :consumed_credits",
      ExpressionAttributeValues: {
        ":active_jobs": 1,
        ":consumed_credits": masterBMS.Items[0].credits_per_job_opportunity_creation,
      },
    };
    await update_dynamo(updateUser);
  }

  return {
    status: "Success",
    status_message: "Job opportunity created successfully with job id" + job_code
  };
};

const listJobDescriptions = async (event) => {
  let checkIfJDCreatorIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfJDCreatorIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  // if (user.Items[0].user_role == "OWNER") {
  let getCurrentUserCreatedJD = {
    TableName: "Intervwd_Job_description",
    IndexName: "organization_id-jd_status-index",
    KeyConditionExpression: "organization_id = :organization_id AND jd_status = :jd_status",
    ExpressionAttributeValues: {
      ":organization_id": event.organization_id,
      ":jd_status": event.jd_status ?? "ACTIVE"
    },
    ScanIndexForward: true
  };
  let jdLists = await query_dynamo(getCurrentUserCreatedJD);
  if (jdLists.Count == 0) {
    if (event.jd_status != undefined && event.jd_status == "CLOSED") {
      throw new Error("No closed job opportunities");
    }
    else {
      throw new Error("No job opportunity have been created");
    }
  }

  let response = {
    items: jdLists.Items.sort((a, b) => b.jd_modified_on - a.jd_modified_on)
  };

  return {
    status: "Success",
    data: response
  };
  // }
  // else {
  // let getCurrentUserCreatedJD = {
  //   TableName: "Intervwd_Job_description",
  //   IndexName: "created_by_user_id-jd_status-index",
  //   KeyConditionExpression: "created_by_user_id = :created_by_user_id AND jd_status = :jd_status",
  //   ExpressionAttributeValues: {
  //     ":created_by_user_id": event.user_id,
  //     ":jd_status": event.jd_status ?? "ACTIVE"
  //   }
  // };
  // let jdLists = await query_dynamo(getCurrentUserCreatedJD);
  // if (jdLists.Count == 0) {
  //   throw new Error("No job opportunity have been created");
  // }

  // let response = {
  //   items: jdLists.Items
  // };

  // return {
  //   status: "Success",
  //   data: response
  // };
  // }
};

const listMyJobDescriptions = async (event) => {
  let checkIfJDCreatorIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfJDCreatorIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getCurrentUserCreatedJD = {
    TableName: "Intervwd_Job_description",
    IndexName: "created_by_user_id-jd_status-index",
    KeyConditionExpression: "created_by_user_id = :created_by_user_id AND jd_status = :jd_status",
    ExpressionAttributeValues: {
      ":created_by_user_id": event.user_id,
      ":jd_status": event.jd_status ?? "ACTIVE"
    },
    ScanIndexForward: true
  };
  let jdLists = await query_dynamo(getCurrentUserCreatedJD);
  if (jdLists.Count == 0) {
    throw new Error("No job opportunity have been created");
  }

  let response = {
    items: jdLists.Items.sort((a, b) => b.jd_modified_on - a.jd_modified_on)
  };

  return {
    status: "Success",
    data: response
  };
};

const updateJobDescription = async (event) => {
  let checkIfJDCreatorIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status AND organization_id = :organization_id",
    ExpressionAttributeValues: {
      ":user_id": event.updater_user_id,
      ":organization_id": event.organization_id,
      ":user_status": "ACTIVE"
    }
  };
  let updater = await query_dynamo(checkIfJDCreatorIsExists);
  if (updater.Count == 0) {
    throw new Error("Invalid updater!");
  }

  let getJobDescription = {
    TableName: "Intervwd_Job_description",
    KeyConditionExpression: "jd_id = :jd_id",
    ExpressionAttributeValues: {
      ":jd_id": event.jd_id
    }
  };
  let jdDetails = await query_dynamo(getJobDescription);
  if (jdDetails.Count == 0) {
    throw new Error("Job description not found");
  }

  if (jdDetails.Items[0].jd_status == "CLOSED") {
    throw new Error("This job profile cannot be edited because it has already been closed.");
  }

  if (!(updater.Items[0].user_role == "OWNER" || jdDetails.Items[0].created_by_user_id == event.updater_user_id)) {
    throw new Error("You do not have permission to edit this job profile.");
  }

  let jd_history = jdDetails.Items[0].jd_history ?? [];

  let date = Date.now();

  let latestUpdatedDetails = {
    modified_on: date,
    modified_by_id: event.updater_user_id,
    modified_by_name: updater.Items[0].user_name,
    action: "Update",
    workflow_status: "user details update",
  };

  let UpdateExpression = 'set';
  let ExpressionAttributeNames = {};
  let ExpressionAttributeValues = {};

  for (const field in event) {
    if (field == "number_of_interviews_allowed" || field == "city" || field == "country" || field == "job_title" || field == "job_location" || field == "job_description" || field == "skills_needed" || field == "experience_level" || field == "communication_skills_required" || field == "make_this_job_publicly_searchable" || field == "who_pays_for_the_interview") {
      UpdateExpression += ` #${field} = :${field},`;
      ExpressionAttributeNames['#' + field] = field;
      ExpressionAttributeValues[':' + field] = event[field];

      latestUpdatedDetails["previous_" + field] = updater.Items[0][field];
      latestUpdatedDetails["updated_" + field] = event[field];

    }
  }

  jd_history.push(latestUpdatedDetails);

  if (UpdateExpression != 'set') {
    UpdateExpression = UpdateExpression.slice(0, -1);

    UpdateExpression += ", jd_history = :jd_history, jd_modified_on = :jd_modified_on";
    ExpressionAttributeValues[":jd_history"] = jd_history;
    ExpressionAttributeValues[":jd_modified_on"] = date;

    let updateUser = {
      TableName: "Intervwd_Job_description",
      Key: {
        jd_id: event.jd_id
      },
      UpdateExpression: UpdateExpression,
      ExpressionAttributeNames: ExpressionAttributeNames,
      ExpressionAttributeValues: ExpressionAttributeValues,
      ReturnValues: 'UPDATED_NEW',
    };
    await update_dynamo(updateUser);

    let getOrganizatinDetails = {
      TableName: "Intervwd_Organizations",
      KeyConditionExpression: "organization_id = :organization_id",
      ExpressionAttributeValues: {
        ":organization_id": event.organization_id
      }
    };
    let organization = await query_dynamo(getOrganizatinDetails);

    let job_title = event.job_title ?? jdDetails.Items[0].job_title;

    let createAuditLogParams = {
      TableName: "Intervwd_Audit_logs",
      Item: {
        audit_log_id: uuidv4(),
        audit_acted_user_email_id: updater.Items[0].user_email_id,
        audit_acted_user_id: event.updater_user_id,
        acted_for_user_id: event.updater_user_id,
        audit_acted_user_name: updater.Items[0].user_name,
        organization_id: event.organization_id,
        audit_source: "BUSINESS",
        audit_type: "JD_UPDATED",
        audit_created_on: Date.now(),
        audit_message: `Job Description "${job_title}" (ID: ${jdDetails.Items[0].job_code}) within Organization ${organization.Items[0].organization_name} was updated. Action by: ${updater.Items[0].user_email_id}.`
      }
    };
    await insert_dynamo(createAuditLogParams);

    return { status: 'Success', status_message: "Job profile Details have been successfully updated." };
  }
  else {
    throw new Error("No records were updated");
  }
};

const closeJobDescription = async (event) => {
  let checkIfJDCreatorIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status AND organization_id = :organization_id",
    ExpressionAttributeValues: {
      ":user_id": event.updater_user_id,
      ":organization_id": event.organization_id,
      ":user_status": "ACTIVE"
    }
  };
  let updater = await query_dynamo(checkIfJDCreatorIsExists);
  if (updater.Count == 0) {
    throw new Error("Invalid updater!");
  }

  // console.log('updater ', updater);

  let getJobDescription = {
    TableName: "Intervwd_Job_description",
    KeyConditionExpression: "jd_id = :jd_id",
    ExpressionAttributeValues: {
      ":jd_id": event.jd_id
    }
  };
  let jdDetails = await query_dynamo(getJobDescription);
  if (jdDetails.Count == 0) {
    throw new Error("Job description not found");
  }

  if (jdDetails.Items[0].jd_status == "CLOSED") {
    throw new Error("This job profile cannot be edited because it has already been closed.");
  }

  let updateUser = {
    TableName: "Intervwd_Job_description",
    Key: {
      jd_id: event.jd_id
    },
    UpdateExpression: "Set jd_status = :jd_status, jd_modified_on = :jd_modified_on, jd_closed_on = :jd_closed_on, jd_closed_by_user_id = :jd_closed_by_user_id, jd_closed_by_user_name = :jd_closed_by_user_name",
    ExpressionAttributeValues: {
      ":jd_status": "CLOSED",
      ":jd_modified_on": Date.now(),
      ":jd_closed_on": Date.now(),
      ":jd_closed_by_user_id": event.updater_user_id,
      ":jd_closed_by_user_name": updater.Items[0].user_name ?? updater.Items[0].user_email_id
    },
    ReturnValues: 'UPDATED_NEW',
  };
  await update_dynamo(updateUser);

  let updateOrganization = {
    TableName: "Intervwd_Organizations",
    Key: {
      organization_id: event.organization_id
    },
    UpdateExpression: "ADD active_jobs :active_jobs, closed_jobs :closed_jobs",
    ExpressionAttributeValues: {
      ":active_jobs": -1,
      ":closed_jobs": 1,
    }
  };
  await update_dynamo(updateOrganization);

  let updateBusinessUserInMaster = {
    TableName: "Intervwd_Master",
    Key: {
      master_id: "MASTER_ID"
    },
    UpdateExpression: "ADD total_closed_jobs :total_closed_jobs",
    ExpressionAttributeValues: {
      ":total_closed_jobs": 1,
    }
  };
  await update_dynamo(updateBusinessUserInMaster);

  let getOrganizatinDetails = {
    TableName: "Intervwd_Organizations",
    KeyConditionExpression: "organization_id = :organization_id",
    ExpressionAttributeValues: {
      ":organization_id": event.organization_id
    }
  };
  let organization = await query_dynamo(getOrganizatinDetails);

  if (jdDetails.Items[0].created_user_type == "MANAGER") {
    let updateUser = {
      TableName: "Intervwd_Business_Users",
      Key: {
        user_id: jdDetails.Items[0].created_by_user_id
      },
      UpdateExpression: "ADD active_jobs :active_jobs, closed_jobs :closed_jobs",
      ExpressionAttributeValues: {
        ":active_jobs": -1,
        ":closed_jobs": 1,
      },
    };
    await update_dynamo(updateUser);
  }

  let createAuditLogParams = {
    TableName: "Intervwd_Audit_logs",
    Item: {
      audit_log_id: uuidv4(),
      audit_acted_user_email_id: updater.Items[0].user_email_id,
      audit_acted_user_id: event.updater_user_id,
      acted_for_user_id: event.updater_user_id,
      audit_acted_user_name: updater.Items[0].user_name,
      organization_id: event.organization_id,
      audit_source: "BUSINESS",
      audit_type: "JD_CLOSED",
      audit_created_on: Date.now(),
      audit_message: `Job Description "${jdDetails.Items[0].job_title}" (ID: ${jdDetails.Items[0].job_code}) within Organization ${organization.Items[0].organization_name} was closed. Action by: ${updater.Items[0].user_email_id}.`
    }
  };
  await insert_dynamo(createAuditLogParams);

  return { status: 'Success', Status_Message: "Job profile Details have been successfully updated." };

};

const topUpCredit = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      // ":user_role": "OWNER",
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfUserIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getOrganizatinDetails = {
    TableName: "Intervwd_Organizations",
    KeyConditionExpression: "organization_id = :organization_id",
    FilterExpression: "organization_status = :organization_status",
    ExpressionAttributeValues: {
      ":organization_id": event.organization_id,
      ":organization_status": "ACTIVE"
    }
  };
  let organization = await query_dynamo(getOrganizatinDetails);
  if (organization.Count == 0) {
    throw new Error('Active organization not found');
  }

  const date = new Date();
  const ISTOffset = 330 * 60000; //======= IST offset in milliseconds ====//
  const ISTTime = new Date(date.getTime() + ISTOffset);
  const day = String(ISTTime.getDate()).padStart(2, '0');
  const month = String(ISTTime.getMonth() + 1).padStart(2, '0');
  const year = ISTTime.getFullYear();
  const current_date = `${ day }-${ month }-${ year }`;

  //================ Generate Transaction ID =============//
  const transactionCount = 1;
  const transactionId = `${ day } ${ month }${ year }${String(transactionCount).padStart(6, '0') }`;

  let instance = new Razorpay({
    key_id: "rzp_test_0G04VfoBpRiYtt",
    key_secret: "l8RErYbf0Jg1S6GAz2bHcVyl",
  });

  console.log("instance", instance);
  const options = {
    amount: event.amount * 100, // IN Paisa
    currency: "INR",
    payment_capture: 1
  };

  const order = await instance.orders.create(options);
  console.log('amount ', event.amount * 100);
  console.log('amount ', JSON.stringify(order));

  // const date = Date.now();
  // let createCreditTransactionsParams = {
  //   TableName: 'Intervwd_Credit_Transactions',
  //   Item: {
  //     credit_transaction_id: uuidv4(),
  //     razorpay_event: { ...order },
  //     order_id: order.id,
  //     transaction_initiator_user_id: event.user_id,
  //     transaction_initiator_user_name: user.Items[0].user_name,
  //     transaction_initiator_user_email_id: user.Items[0].user_email_id,
  //     transaction_date: date,
  //     organization_id: user.Items[0].organization_id,
  //     credits: event.credits,
  //     amount: event.credits,
  //     credit_source: "TOP_UP",
  //     reason: "Credits have been successfully topped up",
  //     transaction_status: "PENDING",
  //     // credit_description: `Credits have been successfully topped up for user ${user.Items[0].user_email_id} in Organization ${organization.Items[0].organization_name}. Amount credited: ${event.credits} credits.`
  //     credit_description: `Credit top-up requested: ${event.credits} credits for ${user.Items[0].user_email_id} in ${organization.Items[0].organization_name} are currently pending approval.`

  //   }
  // };
  // await insert_dynamo(createCreditTransactionsParams);

  // let updateBusinessUserInMaster = {
  //   TableName: "Intervwd_Master",
  //   Key: {
  //     master_id: "MASTER_ID"
  //   },
  //   UpdateExpression: "ADD total_credites :total_credites",
  //   ExpressionAttributeValues: {
  //     ":total_credites": event.credits,
  //   }
  // };
  // await update_dynamo(updateBusinessUserInMaster);

  let createPaymentDetails = {
    TableName: "Intervwd_Payment_Transactions",
    Item: {
      payment_id: uuidv4(),
      user_id: event.user_id,
      order_id: order.id,
      razorpay_event: { ...order },
      user_name: user.Items[0].user_name,
      user_email_id: user.Items[0].user_email_id,
      organization_id: event.organization_id,
      amount: event.amount,
      credits: event.credits,
      transaction_time: Date.now(),
      transaction_modified_on: Date.now(),
      payment_status: "PENDING",
      payment_source: "BUSINESS"
    }
  };
  await insert_dynamo(createPaymentDetails);

  let createAuditLogParams = {
    TableName: "Intervwd_Audit_logs",
    Item: {
      audit_log_id: uuidv4(),
      audit_acted_user_email_id: user.Items[0].user_email_id,
      audit_acted_user_id: event.user_id,
      acted_for_user_id: event.user_id,
      audit_acted_user_name: user.Items[0].user_name,
      organization_id: event.organization_id,
      audit_source: "BUSINESS",
      audit_type: "BUSINESS_CREDIT_TOPUP",
      audit_created_on: Date.now(),
      // audit_message: `Organization ${organization.Items[0].organization_name} (${event.organization_id}) credited with $${event.credits}. New balance is $${updatedBalance}. Initiated by: ${user.Items[0].user_email_id}.`
      audit_message: `Organization ${organization.Items[0].organization_name} (${event.organization_id}) credited with $${event.credits}. Initiated by: ${user.Items[0].user_email_id}.`
    }
  };
  await insert_dynamo(createAuditLogParams);

  return {
    status: "SUCCESS",
    data: order
  };
};

const listTopUpCreditHistory = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      // ":user_role": "OWNER",
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfUserIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  // if (user.Items[0].user_role == "OWNER") {
  let getCreditTransactionsParams = {
    TableName: 'Intervwd_Credit_Transactions',
    IndexName: "organization_id-index",
    KeyConditionExpression: "organization_id = :organization_id",
    ExpressionAttributeValues: {
      ":organization_id": user.Items[0].organization_id
    },
    ScanIndexForward: true
  };
  let transactionsHistories = await query_dynamo(getCreditTransactionsParams);
  if (transactionsHistories.Count == 0) {
    throw new Error("No credit transactions were found");
  }
  let response = {
    items: transactionsHistories.Items.sort((a, b) => b.transaction_date - a.transaction_date)
  };

  return {
    status: "Success",
    data: response
  };
  // }
  // else {
  //   let getCreditTransactionsParams = {
  //     TableName: 'Intervwd_Credit_Transactions',
  //     IndexName: "transaction_initiator_user_id-index",
  //     KeyConditionExpression: "transaction_initiator_user_id = :transaction_initiator_user_id",
  //     ExpressionAttributeValues: {
  //       ":transaction_initiator_user_id": event.user_id
  //     }
  //   };
  //   let transactionsHistories = await query_dynamo(getCreditTransactionsParams);
  //   if (transactionsHistories.Count == 0) {
  //     throw new Error("No credit transactions were found");
  //   }
  //   let response = {
  //     items: transactionsHistories.Items
  //   };

  //   return {
  //     status: "Success",
  //     data: response
  //   };
  // }
};

const udpateOrganizationDetails = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status AND user_role = :user_role",
    ExpressionAttributeValues: {
      ":user_id": event.updater_user_id,
      ":user_status": "ACTIVE",
      ":user_role": "OWNER",
    }
  };
  let user = await query_dynamo(checkIfUserIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getOrganizatinDetails = {
    TableName: "Intervwd_Organizations",
    KeyConditionExpression: "organization_id = :organization_id",
    FilterExpression: "organization_status = :organization_status",
    ExpressionAttributeValues: {
      ":organization_id": event.organization_id,
      ":organization_status": "ACTIVE"
    }
  };
  let organization = await query_dynamo(getOrganizatinDetails);
  if (organization.Count == 0) {
    throw new Error("Active organization not found");
  }

  const date = Date.now();

  let UpdateExpression = 'set';
  let ExpressionAttributeNames = {};
  let ExpressionAttributeValues = {};

  for (const field in event) {
    if (field == "organization_name" || field == "country" || field == "organization_profile" || field == "organization_profile_picture") {
      UpdateExpression += ` #${field} = :${field},`;
      ExpressionAttributeNames['#' + field] = field;
      ExpressionAttributeValues[':' + field] = event[field];
    }
  }

  if (UpdateExpression != 'set') {
    UpdateExpression = UpdateExpression.slice(0, -1);
    let updateOrganization = {
      TableName: "Intervwd_Organizations",
      Key: {
        organization_id: event.organization_id
      },
      UpdateExpression: UpdateExpression,
      ExpressionAttributeNames: ExpressionAttributeNames,
      ExpressionAttributeValues: ExpressionAttributeValues,
      ReturnValues: 'UPDATED_NEW',
    };
    await update_dynamo(updateOrganization);

    let createAuditLogParams = {
      TableName: "Intervwd_Audit_logs",
      Item: {
        audit_log_id: uuidv4(),
        audit_acted_user_email_id: user.Items[0].user_email_id,
        audit_acted_user_id: event.user_id,
        acted_for_user_id: event.user_id,
        audit_acted_user_name: user.Items[0].user_name,
        organization_id: user.Items[0].organization_id,
        audit_source: "BUSINESS",
        audit_type: "ORGANIZATION_PROFILE_UPDATE",
        audit_created_on: Date.now(),
        audit_message: `User details for ${user.Items[0].user_email_id} updated.`
      }
    };
    await insert_dynamo(createAuditLogParams);

    return { status: 'Success', Status_Message: "Details have been successfully updated." };
  }
  else {
    throw new Error("No records were updated");
  }
};

const listPaymentHistory = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfUserIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getCreditTransactionsParams = {
    TableName: 'Intervwd_Payment_Transactions',
    IndexName: "organization_id-index",
    KeyConditionExpression: "organization_id = :organization_id",
    ExpressionAttributeValues: {
      ":organization_id": event.organization_id
    },
    ScanIndexForward: true
  };
  let transactionsHistories = await query_dynamo(getCreditTransactionsParams);
  if (transactionsHistories.Count == 0) {
    throw new Error("No credit transactions were found");
  }
  let response = {
    items: transactionsHistories.Items.sort((a, b) => b.transaction_modified_on - a.transaction_modified_on)
  };

  return {
    status: "Success",
    data: response
  };
};

const listInterviewsForTheJob = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfUserIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getCreditTransactionsParams = {
    TableName: 'Intervwd_Interviews',
    IndexName: "organization_id-jd_id-index",
    KeyConditionExpression: "organization_id = :organization_id AND jd_id = :jd_id",
    ExpressionAttributeValues: {
      ":organization_id": event.organization_id,
      ":jd_id": event.jd_id,
    },
    ScanIndexForward: true
  };
  let transactionsHistories = await query_dynamo(getCreditTransactionsParams);
  if (transactionsHistories.Count == 0) {
    throw new Error("No interviews have been attended for this job yet.");
  }
  let response = {
    items: transactionsHistories.Items.sort((a, b) => b.transaction_modified_on - a.transaction_modified_on)
  };

  return {
    status: "Success",
    data: response
  };
};

const listOrganizationOverAllInterviews = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfUserIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getCreditTransactionsParams = {
    TableName: 'Intervwd_Interviews',
    IndexName: "organization_id-jd_id-index",
    KeyConditionExpression: "organization_id = :organization_id",
    FilterExpression: "interview_status = :interview_status",
    ExpressionAttributeValues: {
      ":organization_id": event.organization_id,
      ":interview_status": "COMPLETED"
    },
    ScanIndexForward: true
  };
  let transactionsHistories = await query_dynamo(getCreditTransactionsParams);
  if (transactionsHistories.Count == 0) {
    throw new Error("No interviews have been attended for this job yet.");
  }
  let response = {
    items: transactionsHistories.Items.sort((a, b) => b.transaction_modified_on - a.transaction_modified_on)
  };

  return {
    status: "Success",
    data: response
  };
};

function generateUniqueInterviewCode(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const inviteInverviewToCandidate = async (event) => {
  let checkIfJDCreatorIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfJDCreatorIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getCurrentUserCreatedJD = {
    TableName: "Intervwd_Job_description",
    KeyConditionExpression: "jd_id = :jd_id",
    ExpressionAttributeValues: {
      ":jd_id": event.jd_id
    }
  };
  let jdLists = await query_dynamo(getCurrentUserCreatedJD);
  if (jdLists.Count == 0) {
    throw new Error("Job description not found");
  }
  const required_skills = jdLists.Items[0].skills_needed.join(", ");
  const job_title = jdLists.Items[0].job_title;

  let getMasterBMSDetails = {
    TableName: "Intervwd_Master",
    KeyConditionExpression: "master_id = :master_id",
    ExpressionAttributeValues: {
      ":master_id": "MASTER_ID"
    }
  };
  let masterBMS = await query_dynamo(getMasterBMSDetails);

  let prompt = `You are an interviewer for ${jdLists.Items[0].company_name}. You are interviewing ${user.Items[0].user_name}. The position is ${job_title}. The skills needed for the job are - ${required_skills}. When a job seeker responds, go to the next question, without being too chatty about the job seeker's response to the question.`;
  let interview_code = await generateUniqueInterviewCode();

  const date = Date.now();
  let totalCreditsConsuming = masterBMS.Items[0].credits_per_candidate_invite;

  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
    IndexName: "user_email_id-index",
    KeyConditionExpression: "user_email_id = :user_email_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_email_id": event.invitie_email_id.replace(/\s/g, "").toLowerCase(),
      ":user_status": "ACTIVE"
    }
  };
  let jobSeekerUser = await query_dynamo(checkIfUserIsExists);
  if (jobSeekerUser.Count == 0) {
    let invitie_user_id = uuidv4();
    let interview_id = uuidv4();
    let createInviteRecordParams = {
      TableName: "Intervwd_Invited_Interviews",
      Item: {
        interview_invited_id: uuidv4(),
        jd_id: event.jd_id,
        job_code: jdLists.Items[0].job_code,
        interview_code: interview_code,
        interview_id: interview_id,
        job_title: job_title,
        required_skills: jdLists.Items[0].skills_needed,
        invitie_user_id: invitie_user_id,
        invitie_email_id: event.invitie_email_id.replace(/\s/g, "").toLowerCase(),
        invitie_user_name: event.invitie_user_name,
        inviter_user_id: event.user_id,
        inviter_user_name: user.Items[0].user_name,
        inviter_user_email_id: user.Items[0].user_email_id,
        invited_on: Date.now(),
        invited_status: "INVITED",
        email_body: event.email_body,
        email_subject: event.email_subject,
        interview_url: event.interview_url,
        organization_id: jdLists.Items[0].organization_id,
        organization_name: jdLists.Items[0].company_name,
      }
    };
    await insert_dynamo(createInviteRecordParams);

    let createInterviewParams = {
      TableName: "Intervwd_Interviews",
      Item: {
        interview_id: interview_id,
        interviewed_user_id: invitie_user_id,
        interviewed_user_name: event.invitie_email_id.replace(/\s/g, "").toLowerCase(),
        interviewed_user_email_id: event.invitie_user_name,
        interviewed_user_city: user.Items[0].user_city,
        interviewed_user_country: user.Items[0].user_city,
        interview_created_on: Date.now(),
        interview_scheduled_on: Date.now(),
        organization_id: jdLists.Items[0].organization_id,
        organization_name: jdLists.Items[0].company_name,
        jd_id: event.jd_id,
        job_code: jdLists.Items[0].job_code,
        job_title: job_title,
        required_skills: jdLists.Items[0].skills_needed,
        interview_status: "SCHEDULED",
        prompt: prompt,
        interview_code: interview_code,
        manager_id: event.user_id,
        manager_name: user.Items[0].user_name,
        manager_email_id: user.Items[0].user_email_id,
        invitie_user_id: invitie_user_id,
        is_this_invited_interview: true,
        interview_url: event.interview_url,
      }
    };
    if (user.Items[0].audio_profile) {
      createInterviewParams.Item.interviewed_user_profile_audio = user.Items[0].audio_profile;
    }
    await insert_dynamo(createInterviewParams);

    let updateBusinessUserInMaster = {
      TableName: "Intervwd_Master",
      Key: {
        master_id: "MASTER_ID"
      },
      UpdateExpression: "ADD total_interview_conducted :total_interview_conducted, till_now_used_total_credited :till_now_used_total_credited",
      ExpressionAttributeValues: {
        ":total_interview_conducted": 1,
        ":till_now_used_total_credited": totalCreditsConsuming,
      }
    };
    await update_dynamo(updateBusinessUserInMaster);

    let updateOrganization = {
      TableName: "Intervwd_Organizations",
      Key: {
        organization_id: jdLists.Items[0].organization_id
      },
      UpdateExpression: "Set total_interview_conducted = :total_interview_conducted ADD organization_credits :organization_credits",
      ExpressionAttributeValues: {
        ":total_interview_conducted": 1,
        ":organization_credits": -totalCreditsConsuming,
      }
    };
    await update_dynamo(updateOrganization);

    let createCreditTransactionsParams = {
      TableName: 'Intervwd_Credit_Transactions',
      Item: {
        credit_transaction_id: uuidv4(),
        transaction_initiator_user_id: event.user_id,
        transaction_initiator_user_name: user.Items[0].user_name,
        transaction_initiator_user_email_id: user.Items[0].user_email_id,
        transaction_date: date,
        organization_id: user.Items[0].organization_id,
        credits: totalCreditsConsuming,
        amount: totalCreditsConsuming,
        credit_source: "DEBIT",
        reason: `Interview invitation send to ${event.invitie_email_id} for JOB ID: ${jdLists.Items[0].job_code}`,
        transaction_status: "SUCCESS",
        credit_description: `Invitation credits used: ${totalCreditsConsuming} credits have been deducted from ${jdLists.Items[0].company_name} for sending invitations in ${event.invitie_email_id}.`
      }
    };
    await insert_dynamo(createCreditTransactionsParams);

    return {
      status: "Success",
      status_message: `${event.invitie_email_id} invited successfully`
    };

  }
  else {
    let checkIfInterviewAlreadyExist = {
      TableName: "Intervwd_Interviews",
      IndexName: "interviewed_user_id-jd_id-index",
      KeyConditionExpression: "interviewed_user_id = :interviewed_user_id AND jd_id = :jd_id",
      ExpressionAttributeValues: {
        ":interviewed_user_id": jobSeekerUser.Items[0].user_id,
        ":jd_id": event.jd_id,
      },
    };
    let interview = await query_dynamo(checkIfInterviewAlreadyExist);
    if (interview.Count > 0) {
      if (interview.Items[0].interview_status === "SCHEDULED" || interview.Items[0].interview_status == "INPROGRESS") {
        throw new Error("This interview has already scheduled to this candidate");
      }
      else {
        throw new Error("This interview has already been completed by you and cannot be retaken.");
      }
    }

    let createInviteRecordParams = {
      TableName: "Intervwd_Invited_Interviews",
      Item: {
        interview_invited_id: uuidv4(),
        jd_id: event.jd_id,
        job_code: jdLists.Items[0].job_code,
        interview_code: interview_code,
        job_title: job_title,
        required_skills: jdLists.Items[0].skills_needed,
        invitie_user_id: jobSeekerUser.Items[0].user_id,
        invitie_email_id: jobSeekerUser.Items[0].user_email_id.replace(/\s/g, "").toLowerCase(),
        invitie_user_name: jobSeekerUser.Items[0].user_name,
        inviter_user_id: event.user_id,
        inviter_user_name: user.Items[0].user_name,
        inviter_user_email_id: user.Items[0].user_email_id,
        invited_on: Date.now(),
        invited_status: "INVITED",
        email_body: event.email_body,
        email_subject: event.email_subject,
        interview_url: event.interview_url,
        organization_id: jdLists.Items[0].organization_id,
        organization_name: jdLists.Items[0].company_name,
      }
    };
    await insert_dynamo(createInviteRecordParams);

    let createInterviewParams = {
      TableName: "Intervwd_Interviews",
      Item: {
        interview_id: uuidv4(),
        interviewed_user_id: jobSeekerUser.Items[0].user_id,
        interviewed_user_name: jobSeekerUser.Items[0].user_name ?? undefined,
        interviewed_user_email_id: jobSeekerUser.Items[0].user_email_id ?? undefined,
        interviewed_user_city: jobSeekerUser.Items[0].user_city,
        interviewed_user_country: jobSeekerUser.Items[0].user_city,
        interview_created_on: Date.now(),
        interview_scheduled_on: Date.now(),
        organization_id: jdLists.Items[0].organization_id,
        organization_name: jdLists.Items[0].company_name,
        jd_id: event.jd_id,
        job_code: jdLists.Items[0].job_code,
        job_title: job_title,
        required_skills: jdLists.Items[0].skills_needed,
        interview_status: "SCHEDULED",
        prompt: prompt,
        interview_code: interview_code,
        manager_id: jdLists.Items[0].created_by_user_id,
        manager_name: jdLists.Items[0].created_by_user_name,
        manager_email_id: jdLists.Items[0].created_by_user_email_id,
        interview_url: event.interview_url,
      }
    };
    if (user.Items[0].audio_profile) {
      createInterviewParams.Item.interviewed_user_profile_audio = user.Items[0].audio_profile;
    }
    await insert_dynamo(createInterviewParams);

    let updateBusinessUserInMaster = {
      TableName: "Intervwd_Master",
      Key: {
        master_id: "MASTER_ID"
      },
      UpdateExpression: "ADD total_interview_conducted :total_interview_conducted, till_now_used_total_credited :till_now_used_total_credited",
      ExpressionAttributeValues: {
        ":total_interview_conducted": 1,
        ":till_now_used_total_credited": totalCreditsConsuming,
      }
    };
    await update_dynamo(updateBusinessUserInMaster);

    let updateOrganization = {
      TableName: "Intervwd_Organizations",
      Key: {
        organization_id: jdLists.Items[0].organization_id
      },
      UpdateExpression: "Set total_interview_conducted = :total_interview_conducted ADD organization_credits :organization_credits",
      ExpressionAttributeValues: {
        ":total_interview_conducted": 1,
        ":organization_credits": -totalCreditsConsuming,
      }
    };
    await update_dynamo(updateOrganization);

    let createCreditTransactionsParams = {
      TableName: 'Intervwd_Credit_Transactions',
      Item: {
        credit_transaction_id: uuidv4(),
        transaction_initiator_user_id: event.user_id,
        transaction_initiator_user_name: user.Items[0].user_name,
        transaction_initiator_user_email_id: user.Items[0].user_email_id,
        transaction_date: date,
        organization_id: user.Items[0].organization_id,
        credits: totalCreditsConsuming,
        amount: totalCreditsConsuming,
        credit_source: "TOP_UP",
        reason: `Invitation send to ${event.invitie_email_id}`,
        transaction_status: "PENDING",
        credit_description: `Invitation credits used: ${totalCreditsConsuming} credits have been deducted from ${jdLists.Items[0].company_name} for sending invitations in ${event.invitie_email_id}.`
      }
    };
    await insert_dynamo(createCreditTransactionsParams);

    return {
      status: "Success",
      status_message: `${event.invitie_email_id} invited successfully`
    };
  }
};

const listInvitedInverviewsForJD = async (event) => {
  let checkIfJDCreatorIsExists = {
    TableName: "Intervwd_Business_Users",
    KeyConditionExpression: "user_id = :user_id",
    FilterExpression: "user_status = :user_status",
    ExpressionAttributeValues: {
      ":user_id": event.user_id,
      ":user_status": "ACTIVE"
    }
  };
  let user = await query_dynamo(checkIfJDCreatorIsExists);
  if (user.Count == 0) {
    throw new Error("Invalid user!");
  }

  let getCurrentUserCreatedJD = {
    TableName: "Intervwd_Invited_Interviews",
    IndexName: "jd_id-index",
    KeyConditionExpression: "jd_id = :jd_id",
    ExpressionAttributeValues: {
      ":jd_id": event.jd_id
    }
  };
  let jdLists = await query_dynamo(getCurrentUserCreatedJD);
  if (jdLists.Count == 0) {
    throw new Error("No invited interviews found");
  }

  let response = {
    items: jdLists.Items.sort((a, b) => b.transaction_modified_on - a.transaction_modified_on)
  };

  return {
    status: "Success",
    data: response
  };
};

export const handler = async (event) => {
  console.log("EVENT ", JSON.stringify(event));
  switch (event.command) {
    case "getCurrentUserDetails":
      return await getCurrentUserDetails(event);

    case "udpateMyDetails":
      return await udpateMyDetails(event);

    case "createManagerUser":
      return await createManagerUser(event);

    case "listManagerUsers":
      return await listManagerUsers(event);

    case "deleteManagerUser":
      return await deleteManagerUser(event);

    case "createJobDescription":
      return await createJobDescription(event);

    case "listJobDescriptions":
      return await listJobDescriptions(event);

    case "listMyJobDescriptions":
      return await listMyJobDescriptions(event);

    case "updateJobDescription":
      return await updateJobDescription(event);

    case "closeJobDescription":
      return await closeJobDescription(event);

    case "topUpCredit":
      return await topUpCredit(event);

    case "listTopUpCreditHistory":
      return await listTopUpCreditHistory(event);

    case "udpateOrganizationDetails":
      return await udpateOrganizationDetails(event);

    case "listPaymentHistory":
      return await listPaymentHistory(event);

    case "listInterviewsForTheJob":
      return await listInterviewsForTheJob(event);

    case "listOrganizationOverAllInterviews":
      return await listOrganizationOverAllInterviews(event);

    case "inviteInverviewToCandidate":
      return await inviteInverviewToCandidate(event);

    case "listInvitedInverviewsForJD":
      return await listInvitedInverviewsForJD(event);

    default:
      throw new Error("Invalid Command");
  }
};
