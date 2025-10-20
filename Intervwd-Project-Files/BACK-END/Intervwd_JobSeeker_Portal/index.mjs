//********************************* LAYERS *********************************
import { v4 as uuidv4 } from "uuid";
import Razorpay from 'razorpay';

import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";
const sesClient = new SESClient({ region: 'us-east-1' });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: "us-east-1" });

import PDFDocument from 'pdfkit';
import fs from 'fs';
import os from "os";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({ SES: sesClient });

import axios from 'axios';

//********************************* DynamoDB *********************************
import * as dynamodb from "@aws-sdk/client-dynamodb";
import * as ddb from "@aws-sdk/lib-dynamodb";
const docClient = new dynamodb.DynamoDBClient();
const ddbDocClient = ddb.DynamoDBDocumentClient.from(docClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

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

const sendInterviewCompletionEmailToUserOrManager = async (email, UserName, jobTitle, InterviewID, organizationName) => {
  const sendEmailCommand = new SendEmailCommand({
    Source: "no-reply@intervwd.com",
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Interview completed`,
      },
      Body: {
        Html: {
          Data: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Your AI Interview is Complete</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            h2 {
              color: #2E86C1;
            }
            p {
              margin: 10px 0;
            }
            ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            a {
              color: #2E86C1;
              text-decoration: none;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #777777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Hello ${UserName},</h2>
            <p>We’re pleased to inform you that your interview for the position of <strong>${jobTitle}</strong> at <strong>${organizationName}</strong> has been successfully completed.</p>
            
            <p>Here’s what you need to know:</p>
            <ul>
              <li><strong>Interview ID / Reference: </strong>${InterviewID}</li>
            </ul>
            
            <p>Your interview responses have been submitted for review. You will hear from the hiring manager regarding the next steps in due course.</p>
            
            <p>Thank you for using Intervwd, and we wish you the best in your application process!</p>
            
            <p>Best regards,<br>
            Team Intervwd<br>
            <a href="https://intervwd.com">https://intervwd.com</a></p>
            
            <div class="footer">
              &copy; 2025 Intervwd. All rights reserved.
            </div>
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
    console.log(`Email sent to ${email}`);
  }
  catch (error) {
    console.error("Error sending invitation email:", error);
  }
};

let getCurrentUserDetails = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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

  let response = {
    items: user.Items
  };

  return {
    status: "Success",
    data: response
  };
};

const udpateMyDetails = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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

  let UpdateExpression = 'set';
  let ExpressionAttributeNames = {};
  let ExpressionAttributeValues = {};

  for (const field in event) {
    if (field == "user_name" || field == "user_profile_picture" || field == "audio_profile" || field == "user_country" || field == "user_city") {
      UpdateExpression += ` #${field} = :${field},`;
      ExpressionAttributeNames['#' + field] = field;
      ExpressionAttributeValues[':' + field] = event[field];
    }
  }

  if (UpdateExpression != 'set') {
    UpdateExpression = UpdateExpression.slice(0, -1);
    let updateUser = {
      TableName: "Intervwd_JobSeeker_Users",
      Key: {
        user_id: event.user_id
      },
      UpdateExpression: UpdateExpression,
      ExpressionAttributeNames: ExpressionAttributeNames,
      ExpressionAttributeValues: ExpressionAttributeValues,
      ReturnValues: 'UPDATED_NEW',
    };
    await update_dynamo(updateUser);

    const date = Date.now();

    let createAuditLogParams = {
      TableName: "Intervwd_Audit_logs",
      Item: {
        audit_log_id: uuidv4(),
        audit_acted_user_email_id: user.Items[0].user_email_id,
        audit_acted_user_id: event.user_id,
        acted_for_user_id: event.user_id,
        audit_acted_user_name: user.Items[0].user_name,
        audit_type: "JOB_SEEKER_PROFILE_UPDATE",
        audit_source: "JOB_SEEKER",
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

const listJobDescriptions = async (event) => {
  let checkIfJDCreatorIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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
    IndexName: "jd_status-make_this_job_publicly_searchable-index",
    KeyConditionExpression: "jd_status = :jd_status AND make_this_job_publicly_searchable = :make_this_job_publicly_searchable",
    ExpressionAttributeValues: {
      ":jd_status": "ACTIVE",
      ":make_this_job_publicly_searchable": "PUBLIC"
    }
  };
  let jdLists = await query_dynamo(getCurrentUserCreatedJD);
  if (jdLists.Count == 0) {
    throw new Error("No data found");
  }

  let response = {
    items: jdLists.Items.sort((a, b) => b.jd_modified_on - a.jd_modified_on)
  };

  return {
    status: "Success",
    data: response
  };
};

const listSearchJobDescriptionByJobCode = async (event) => {
  let checkIfJDCreatorIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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
    IndexName: "job_code-index",
    KeyConditionExpression: "job_code = :job_code",
    ExpressionAttributeValues: {
      ":job_code": event.job_code
    }
  };
  let jdLists = await query_dynamo(getCurrentUserCreatedJD);
  if (jdLists.Count == 0) {
    throw new Error("No data found");
  }

  let response = {
    items: jdLists.Items
  };

  return {
    status: "Success",
    data: response
  };
};

const topUpCredit = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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

  let instance = new Razorpay({
    key_id: "xxxxxxxxxxxxxxxxxxx",
    key_secret: "xxxxxxxxxxxxxxxx",
  });

  console.log("instance", instance);
  const options = {
    amount: event.credits * 100, // IN Paisa
    currency: "INR",
  };

  const order = await instance.orders.create(options);

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
      payment_source: "JOB_SEEKER"
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
      audit_type: "JOB_SEEKER_PROFILE_UPDATE",
      audit_source: "JOB_SEEKER_CREDIT_TOPUP",
      audit_created_on: Date.now(),
      audit_message: `Credit top-up requested: ${event.credits} credits for Job seeker ${user.Items[0].user_email_id} are currently pending approval.`
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
    TableName: "Intervwd_JobSeeker_Users",
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
    TableName: 'Intervwd_Credit_Transactions',
    IndexName: "transaction_initiator_user_id-index",
    KeyConditionExpression: "transaction_initiator_user_id = :transaction_initiator_user_id",
    ExpressionAttributeValues: {
      ":transaction_initiator_user_id": event.user_id
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
};

const checkIfInterviewAlreadyTaken = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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

  let checkIfInterviewAlreadyExist = {
    TableName: "Intervwd_Interviews",
    IndexName: "interviewed_user_id-jd_id-index",
    KeyConditionExpression: "interviewed_user_id = :interviewed_user_id AND jd_id = :jd_id",
    ExpressionAttributeValues: {
      ":interviewed_user_id": event.user_id,
      ":jd_id": event.jd_id,
    },
  };
  let interview = await query_dynamo(checkIfInterviewAlreadyExist);
  if (interview.Count > 0) {
    if (interview.Items[0].interview_status === "SCHEDULED" || interview.Items[0].interview_status === "INPROGRESS") {}
    else {
      throw new Error("This interview has already been completed by you and cannot be retaken.");
    }
  }
  return {
    status: "Success",
    status_message: "Allow to create interview"
  };
};

const createInterview = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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

  if (jdLists.Items[0].who_pays_for_the_interview === "JOB_SEEKER") {
    let getMasterBMSDetails = {
      TableName: "Intervwd_Master",
      KeyConditionExpression: "master_id = :master_id",
      ExpressionAttributeValues: {
        ":master_id": "MASTER_ID"
      }
    };
    let masterBMS = await query_dynamo(getMasterBMSDetails);

    let creditsRequiredToAttendThisMeeting = masterBMS.Items[0].credits_consumed_per_minute * 5;
    if (creditsRequiredToAttendThisMeeting > user.Items[0].credits) {
      throw new Error("You do not have enough credits to attend this meeting. Please recharge your credits and try again.");
    }
  }

  let checkIfInterviewAlreadyExist = {
    TableName: "Intervwd_Interviews",
    IndexName: "interviewed_user_id-jd_id-index",
    KeyConditionExpression: "interviewed_user_id = :interviewed_user_id AND jd_id = :jd_id",
    ExpressionAttributeValues: {
      ":interviewed_user_id": event.user_id,
      ":jd_id": event.jd_id,
    },
  };
  let interview = await query_dynamo(checkIfInterviewAlreadyExist);
  if (interview.Count > 0) {
    if (interview.Items[0].interview_status === "SCHEDULED" || interview.Items[0].interview_status == "INPROGRESS") {
      return {
        prompt: interview.Items[0].prompt,
        interview_id: interview.Items[0].interview_id,
        user_id: event.user_id,
      };
    }
    else {
      throw new Error("This interview has already been completed by you and cannot be retaken.");
    }
  }

  function generateUniqueCode(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  let interview_code = await generateUniqueCode();

  const required_skills = jdLists.Items[0].skills_needed.join(", ");
  const job_title = jdLists.Items[0].job_title;

  let prompt = `You are an interviewer for ${jdLists.Items[0].company_name}. You are interviewing ${user.Items[0].user_name}. The position is ${job_title}. The skills needed for the job are - ${required_skills}. When a job seeker responds, go to the next question, without being too chatty about the job seeker's response to the question.`;

  let createInterviewParams = {
    TableName: "Intervwd_Interviews",
    Item: {
      interview_id: uuidv4(),
      interviewed_user_id: event.user_id,
      interviewed_user_name: user.Items[0].user_name ?? undefined,
      interviewed_user_email_id: user.Items[0].user_email_id ?? undefined,
      interviewed_user_city: user.Items[0].user_city,
      interviewed_user_country: user.Items[0].user_city,
      interview_created_on: Date.now(),
      interview_scheduled_on: Date.now(),
      interview_modified_on: Date.now(),
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
      who_pays_for_the_interview: jdLists.Items[0].who_pays_for_the_interview
    }
  };
  if (user.Items[0].audio_profile) {
    createInterviewParams.Item.interviewed_user_profile_audio = user.Items[0].audio_profile;
  }
  await insert_dynamo(createInterviewParams);

  return {
    prompt: createInterviewParams.Item.prompt,
    interview_id: createInterviewParams.Item.interview_id,
    user_id: event.user_id,
  };
};

const updateInterviewDetails = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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

  let checkIfInterviewAlreadyExist = {
    TableName: "Intervwd_Interviews",
    KeyConditionExpression: "interview_id = :interview_id",
    ExpressionAttributeValues: {
      ":interview_id": event.interview_id,
    },
  };
  let interview = await query_dynamo(checkIfInterviewAlreadyExist);
  if (interview.Count == 0) {
    throw new Error("This interview has already been completed by you and cannot be retaken.");
  }

  const mergedTranscript = [];

  for (const entry of event.transcript_text) {
    if (entry.text.includes('"interrupted"')) continue;

    const last = mergedTranscript[mergedTranscript.length - 1];

    if (last && last.speaker === entry.speaker) {
      last.text += " " + entry.text;
    }
    else {
      mergedTranscript.push({ ...entry });
    }
  }

  let updateInterviewDetailsParams = {
    TableName: "Intervwd_Interviews",
    Key: {
      interview_id: event.interview_id
    },
    UpdateExpression: "Set interview_status = :interview_status, transcript_text = :transcript_text, original_transcript_text = :original_transcript_text, interview_modified_on = :interview_modified_on",
    ExpressionAttributeValues: {
      ":interview_status": "COMPLETED",
      ":transcript_text": mergedTranscript,
      ":original_transcript_text": event.transcript_text,
      ":interview_modified_on": Date.now()
    }
  };
  await update_dynamo(updateInterviewDetailsParams);

  let userEmailId = interview.Items[0].interviewed_user_email_id;
  let userName = interview.Items[0].interviewed_user_name;
  let jobTitle = interview.Items[0].job_title;
  let InterviewID = interview.Items[0].interview_code;
  let organizationName = interview.Items[0].organization_name;
  let eventObj = {
    ...event
  };

  await generateCombinedInterviewPDF(eventObj);

  await sendInterviewCompletionEmailToUserOrManager(userEmailId, userName, jobTitle, InterviewID, organizationName);

  return {
    status: "Success",
    status_message: "Interview details updated successfully"
  };
};

const updateInterviewDetailsAsInprogress = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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

  let checkIfInterviewAlreadyExist = {
    TableName: "Intervwd_Interviews",
    KeyConditionExpression: "interview_id = :interview_id",
    ExpressionAttributeValues: {
      ":interview_id": event.interview_id,
    },
  };
  let interview = await query_dynamo(checkIfInterviewAlreadyExist);
  if (interview.Count == 0) {
    throw new Error("This interview has already been completed by you and cannot be retaken.");
  }

  let updateInterviewDetailsParams = {
    TableName: "Intervwd_Interviews",
    Key: {
      interview_id: event.interview_id
    },
    UpdateExpression: "Set interview_status = :interview_status, interview_started_on = :interview_started_on, interview_modified_on = :interview_modified_on",
    ExpressionAttributeValues: {
      ":interview_status": "INPROGRESS",
      ":interview_started_on": Date.now(),
      ":interview_modified_on": Date.now(),
    }
  };
  await update_dynamo(updateInterviewDetailsParams);

  return {
    status: "Success",
    status_message: "Interview details updated successfully"
  };
};

const updateInterviewAudioDetails = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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

  let checkIfInterviewAlreadyExist = {
    TableName: "Intervwd_Interviews",
    KeyConditionExpression: "interview_id = :interview_id",
    ExpressionAttributeValues: {
      ":interview_id": event.interview_id,
    },
  };
  let interview = await query_dynamo(checkIfInterviewAlreadyExist);
  if (interview.Count == 0) {
    throw new Error("This interview has already been completed by you and cannot be retaken.");
  }

  let updateInterviewDetailsParams = {
    TableName: "Intervwd_Interviews",
    Key: {
      interview_id: event.interview_id
    },
    UpdateExpression: "Set interview_status = :interview_status, interview_duration_seconds = :interview_duration_seconds, interview_audio = :interview_audio, interview_completed_on = :interview_completed_on, interview_modified_on = :interview_modified_on",
    ExpressionAttributeValues: {
      ":interview_status": "COMPLETED",
      ":interview_duration_seconds": event.interview_duration_seconds,
      ":interview_audio": event.interview_audio,
      ":interview_completed_on": Date.now(),
      ":interview_modified_on": Date.now(),
    }
  };
  await update_dynamo(updateInterviewDetailsParams);

  let getMasterBMSDetails = {
    TableName: "Intervwd_Master",
    KeyConditionExpression: "master_id = :master_id",
    ExpressionAttributeValues: {
      ":master_id": "MASTER_ID"
    }
  };
  let masterBMS = await query_dynamo(getMasterBMSDetails);

  let meetingDurationTimeInMinutes = 0.5;
  let creditsConsumedForThisMeeting = masterBMS.Items[0].credits_consumed_per_minute / 2;

  if (event.interview_duration_seconds < 30) {
    creditsConsumedForThisMeeting = masterBMS.Items[0].credits_consumed_per_minute / 2;
  }
  else if (event.interview_duration_seconds < 60) {
    creditsConsumedForThisMeeting = masterBMS.Items[0].credits_consumed_per_minute;
    meetingDurationTimeInMinutes = 1;
  }
  else if (event.interview_duration_seconds < 90) {
    creditsConsumedForThisMeeting = masterBMS.Items[0].credits_consumed_per_minute + (masterBMS.Items[0].credits_consumed_per_minute / 2);
    meetingDurationTimeInMinutes = 1.5;
  }
  else if (event.interview_duration_seconds < 120) {
    creditsConsumedForThisMeeting = masterBMS.Items[0].credits_consumed_per_minute * 2;
    meetingDurationTimeInMinutes = 2;
  }
  else if (event.interview_duration_seconds < 150) {
    creditsConsumedForThisMeeting = (masterBMS.Items[0].credits_consumed_per_minute * 2) + (masterBMS.Items[0].credits_consumed_per_minute / 2);
    meetingDurationTimeInMinutes = 2.5;
  }
  else if (event.interview_duration_seconds < 180) {
    creditsConsumedForThisMeeting = masterBMS.Items[0].credits_consumed_per_minute * 3;
    meetingDurationTimeInMinutes = 3;
  }
  else if (event.interview_duration_seconds < 210) {
    creditsConsumedForThisMeeting = (masterBMS.Items[0].credits_consumed_per_minute * 3) + (masterBMS.Items[0].credits_consumed_per_minute / 2);
    meetingDurationTimeInMinutes = 3.5;
  }
  else if (event.interview_duration_seconds < 240) {
    creditsConsumedForThisMeeting = masterBMS.Items[0].credits_consumed_per_minute * 4;
    meetingDurationTimeInMinutes = 4;
  }
  else if (event.interview_duration_seconds < 270) {
    creditsConsumedForThisMeeting = (masterBMS.Items[0].credits_consumed_per_minute * 4) + (masterBMS.Items[0].credits_consumed_per_minute / 2);
    meetingDurationTimeInMinutes = 4.5;
  }
  else {
    creditsConsumedForThisMeeting = masterBMS.Items[0].credits_consumed_per_minute * 5;
    meetingDurationTimeInMinutes = 5;
  }

  let updateBusinessUserInMaster = {
    TableName: "Intervwd_Master",
    Key: {
      master_id: "MASTER_ID"
    },
    UpdateExpression: "ADD total_minutes_consumed_for_conducted_interviews :total_minutes_consumed_for_conducted_interviews, till_now_used_total_credited :till_now_used_total_credited, total_interview_conducted :total_interview_conducted",
    ExpressionAttributeValues: {
      ":total_minutes_consumed_for_conducted_interviews": meetingDurationTimeInMinutes,
      ":till_now_used_total_credited": creditsConsumedForThisMeeting,
      ":total_interview_conducted": 1,
    }
  };
  await update_dynamo(updateBusinessUserInMaster);

  if (interview.Items[0].who_pays_for_the_interview != undefined && interview.Items[0].who_pays_for_the_interview === "JOB_SEEKER") {

    let updateOrganization = {
      TableName: "Intervwd_Organizations",
      Key: {
        organization_id: interview.Items[0].organization_id
      },
      UpdateExpression: "ADD total_interview_conducted :total_interview_conducted",
      ExpressionAttributeValues: {
        ":total_interview_conducted": 1
      }
    };
    await update_dynamo(updateOrganization);

    let updateCreditsInUser = {
      TableName: "Intervwd_JobSeeker_Users",
      Key: {
        user_id: event.user_id
      },
      UpdateExpression: "ADD credits  :credits",
      ExpressionAttributeValues: {
        ":credits": -creditsConsumedForThisMeeting
      }
    };
    await update_dynamo(updateCreditsInUser);

    let createCreditTransactionsParams = {
      TableName: 'Intervwd_Credit_Transactions',
      Item: {
        credit_transaction_id: uuidv4(),
        transaction_initiator_user_id: event.user_id,
        transaction_initiator_user_name: user.Items[0].user_name,
        transaction_initiator_user_email_id: user.Items[0].user_email_id,
        transaction_date: Date.now(),
        amount: creditsConsumedForThisMeeting,
        credits: creditsConsumedForThisMeeting,
        credit_description: `You have successfully attended the interview (ID: ${interview.Items[0].interview_code}).`,
        reason: `You have successfully attended the interview (ID: ${interview.Items[0].interview_code}).`,
        transaction_status: "SUCCESS",
        credit_source: "DEBIT"
      }
    };
    await insert_dynamo(createCreditTransactionsParams);
  }
  else {
    let updateOrganization = {
      TableName: "Intervwd_Organizations",
      Key: {
        organization_id: interview.Items[0].organization_id
      },
      UpdateExpression: "ADD organization_credits :organization_credits, total_credites_counsumed :total_credites_counsumed, total_interview_conducted :total_interview_conducted",
      ExpressionAttributeValues: {
        ":organization_credits": -creditsConsumedForThisMeeting,
        ":total_credites_counsumed": creditsConsumedForThisMeeting,
        ":total_interview_conducted": 1
      }
    };
    await update_dynamo(updateOrganization);

    let createCreditTransactionsParams = {
      TableName: 'Intervwd_Credit_Transactions',
      Item: {
        credit_transaction_id: uuidv4(),
        transaction_initiator_user_id: interview.Items[0].manager_id,
        transaction_initiator_user_name: interview.Items[0].manager_name,
        transaction_initiator_user_email_id: interview.Items[0].manager_email_id,
        transaction_date: Date.now(),
        organization_id: user.Items[0].organization_id,
        amount: creditsConsumedForThisMeeting,
        credits: creditsConsumedForThisMeeting,
        credit_description: `Interview with ID ${interview.Items[0].interview_code} was attended by ${user.Items[0].user_name}.`,
        reason: `Interview with ID ${interview.Items[0].interview_code} was attended by ${user.Items[0].user_name}.`,
        transaction_status: "SUCCESS",
        credit_source: "DEBIT"
      }
    };
    await insert_dynamo(createCreditTransactionsParams);
  }

  let createAuditLogParams = {
    TableName: "Intervwd_Audit_logs",
    Item: {
      audit_log_id: uuidv4(),
      audit_acted_user_email_id: user.Items[0].user_email_id,
      audit_acted_user_id: event.user_id,
      acted_for_user_id: event.user_id,
      audit_acted_user_name: user.Items[0].user_name,
      audit_type: "JOB_SEEKER_INTERVIEW_ATTENDED",
      audit_source: "JOB_SEEKER_INTERVIEW_ATTENDED",
      audit_created_on: Date.now(),
      audit_message: `Interview with ID ${interview.Items[0].interview_code} was attended by ${user.Items[0].user_name} for organization ${interview.Items[0].organization_name}.`
    }
  };
  await insert_dynamo(createAuditLogParams);

  return {
    status: "Success",
    status_message: "Interview details updated successfully"
  };
};

const listInterviews = async (event) => {
  let checkIfUserIsExists = {
    TableName: "Intervwd_JobSeeker_Users",
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

  let checkIfInterviewAlreadyExist = {
    TableName: "Intervwd_Interviews",
    IndexName: "interviewed_user_id-jd_id-index",
    KeyConditionExpression: "interviewed_user_id = :interviewed_user_id",
    FilterExpression: "interview_status = :interview_status",
    ExpressionAttributeValues: {
      ":interviewed_user_id": event.user_id,
      ":interview_status": "COMPLETED"
    },
  };
  let interview = await query_dynamo(checkIfInterviewAlreadyExist);
  if (interview.Count == 0) {
    throw new Error("No interviews have been attended for any job yet.");
  }

  let response = {
    items: interview.Items
  };

  return {
    "status": "Success",
    data: response
  };
};

const generateCombinedInterviewPDF = async (event) => {
  console.log('generateCombinedInterviewPDF', JSON.stringify(event));
  let checkIfInterviewAlreadyExist = {
    TableName: "Intervwd_Interviews",
    KeyConditionExpression: "interview_id = :interview_id",
    ExpressionAttributeValues: {
      ":interview_id": event.interview_id,
    },
  };
  let interview = await query_dynamo(checkIfInterviewAlreadyExist);

  let candidateName = interview.Items[0].interviewed_user_name;
  let jobTitle = interview.Items[0].job_title;
  let interviewId = interview.Items[0].interview_code;
  let ManagerName = interview.Items[0].manager_name;
  let managerEmail = interview.Items[0].manager_email_id;
  let organization_id = interview.Items[0].organization_id;
  let interviewed_user_id = interview.Items[0].interviewed_user_id;

  const fileName = `${candidateName}_${jobTitle}.pdf`;
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const bucketName = "intervwd-files";
  const s3Key = `interview_audio_pdf_reports/${organization_id}/${interviewed_user_id}/${fileName}`;

  try {
    let getTranscriptText = await getTranscriptEvaluation(event);
    let evaluations = getTranscriptText.data.evaluation;
    let overAllInterpretation = getTranscriptText.data.overall_interpretation;
    let overAllScore = getTranscriptText.data.overallScore;

    await generatePDF(tempFilePath, candidateName, evaluations, event.transcript_text, jobTitle, interviewId, overAllInterpretation);

    const fileData = fs.readFileSync(tempFilePath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileData,
        ContentType: "application/pdf",
      })
    );

    let updateInterviewDetailsParams = {
      TableName: "Intervwd_Interviews",
      Key: {
        interview_id: event.interview_id
      },
      UpdateExpression: "Set audio_text_s3_key = :audio_text_s3_key",
      ExpressionAttributeValues: {
        ":audio_text_s3_key": `https://intervwd-files.s3.us-east-1.amazonaws.com/${s3Key}`,
      }
    };
    if (overAllScore) {
      updateInterviewDetailsParams.UpdateExpression += ", interview_ratings = :interview_ratings";
      updateInterviewDetailsParams.ExpressionAttributeValues[":interview_ratings"] = overAllScore;
    }
    await update_dynamo(updateInterviewDetailsParams);

    const emailBody = generateHTMLBody(candidateName, ManagerName, jobTitle, interviewId, overAllScore);

    const rawEmail = [
      `From: "Intervwd" <no-reply@intervwd.com>`,
      `To: ${managerEmail}`,
      `Subject: ${event.subject || "AI Interview Report"}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="NextPart"`,
      ``,
      `--NextPart`,
      `Content-Type: text/html; charset="UTF-8"`,
      ``,
      emailBody,
      ``,
      `--NextPart`,
      `Content-Type: application/pdf`,
      `Content-Disposition: attachment; filename="${fileName}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      fileData.toString("base64"),
      `--NextPart--`
    ].join("\r\n");

    await sesClient.send(
      new SendRawEmailCommand({
        RawMessage: { Data: Buffer.from(rawEmail) },
      })
    );
    console.log("email sent successfully");

    fs.unlinkSync(tempFilePath);

    return { status: "success", s3Key };
  }
  catch (err) {
    console.error("Error", err);
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    return { status: "failure", error: err.message };
  }
};

const getTranscriptEvaluation = async (event) => {
  try {
    let data = event.transcript_text;

    const filterData = data.filter((msg, index, arr) =>
      msg.text !== '{ "interrupted" : true }' &&
      !(msg.speaker === "ASSISTANT" && arr.slice(0, index).some(prev => prev.text === msg.text))
    );

    const userPrompt = filterData.map(msg => ({
      role: msg.speaker.toLowerCase() === 'user' ? 'user' : 'assistant',
      content: [{ type: 'text', text: msg.text }]
    }));

    const threadResponse = await axios.post(
      'https://api.openai.com/v1/threads', {}, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json'
        }
      }
    );

    const threadId = threadResponse.data.id;

    for (const msg of userPrompt) {
      await axios.post(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        msg, {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const runResponse = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`, { assistant_id: ASSISTANT_ID }, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json'
        }
      }
    );

    const runId = runResponse.data.id;

    let runStatus = 'queued';
    let runData;
    while (runStatus === 'queued' || runStatus === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json'
          }
        }
      );

      runData = statusResponse.data;
      runStatus = runData.status;
    }

    const messagesResponse = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json'
        }
      }
    );

    const messages = messagesResponse.data.data;

    const assistantMessageRaw = messages
      .filter(msg => msg.role === 'assistant')
      .map(msg => msg.content
        .filter(c => c.type === 'text')
        .map(c => c.text.value)
        .join('\n')
      )
      .join('\n');

    let assistantReply;
    try {
      const jsonMatch = assistantMessageRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        assistantReply = JSON.parse(jsonMatch[0]);
      }
      else {
        assistantReply = { error: "No JSON evaluation found", raw: assistantMessageRaw };
      }
    }
    catch (err) {
      assistantReply = { error: "Failed to parse assistant JSON", raw: assistantMessageRaw };
    }

    console.log('assistantReply ', assistantReply);
    return assistantReply;

  }
  catch (error) {
    console.error('Error calling OpenAI Assistant API:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong calling OpenAI Assistant API.' })
    };
  }
};

const generatePDF = async (filePath, candidateName, evaluationsData, transcriptionText, jobTitle, interviewId, overAllInterpretation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const pageInnerWidth = () => doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const ensureSpace = (needed = 50) => {
        if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
        }
      };

      // -------------------- Page 1: Header + Candidate Info --------------------
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#000")
        .text("AI Interview Evaluation Report", { align: "center" });

      doc.moveDown(0.6);

      // Candidate Details Section
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Job Seeker Name : ", { continued: true });
      doc.font("Helvetica").fontSize(10).text(candidateName);
      doc.moveDown(0.5);

      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Job Title : ", { continued: true });
      doc.font("Helvetica").fontSize(10).text(jobTitle);
      doc.moveDown(0.5);

      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Interview ID : ", { continued: true });
      doc.font("Helvetica").fontSize(10).text(interviewId);

      doc.moveDown(1.8);


      // -------------------- Evaluation Table --------------------
      const leftX = doc.page.margins.left;
      const col1X = leftX; // Parameter
      const col2X = leftX + 220; // Score
      const col3X = leftX + 280; // Notes
      const notesWidth = pageInnerWidth() - (col3X - leftX);

      // Set font and color for headers
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#000");

      // Save the current Y position
      const headerY = doc.y;

      // Draw all headers at the same Y position
      doc.text("Parameter", col1X, headerY);
      doc.text("Score", col2X, headerY);
      doc.text("Notes / Justification", col3X, headerY, { width: notesWidth });

      // Add some space below headers
      doc.moveDown(0.5);

      // Draw header underline
      doc.strokeColor("#000").lineWidth(1)
        .moveTo(leftX, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();

      doc.moveDown(1);

      // Set font for table rows
      doc.font("Helvetica").fontSize(10).fillColor("#000");

      for (const item of evaluationsData) {
        const estimatedHeight = 14 + Math.ceil((item.notes?.length || 0) / 80) * 12;
        ensureSpace(estimatedHeight);

        // Save Y position before writing text in this row
        const rowY = doc.y;

        // Parameter (column 1)
        doc.text(item.parameter || "", col1X, rowY, {
          width: col2X - col1X - 8,
        });

        // Score (column 2)
        doc.text(String(item.score ?? ""), col2X, rowY, {
          width: col3X - col2X - 8,
        });

        // Notes / Justification (column 3)
        doc.text(item.notes || "", col3X, rowY, {
          width: notesWidth,
          lineGap: 3,
        });

        // Determine the tallest text block in this row and move Y accordingly
        const maxY = Math.max(
          doc.y, // after last text
          rowY + 18 // minimum height for short rows
        );
        doc.y = maxY + 15; // add some padding for next row
      }

      doc.moveDown(2.5);

      // -------------------- Page 2: Interpretation + Transcription --------------------
      doc.x = doc.page.margins.left;

      const interpLines = overAllInterpretation.split("\n").length;
      const interpHeight = 16 + interpLines * 12; // 16 = header, 12 per line

      // // Ensure there is space; add page only if needed
      ensureSpace(interpHeight + 25);

      doc.font("Helvetica-Bold").fontSize(16).fillColor("#000")
        .text("Overall Interpretation", { align: "left" });

      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(10).fillColor("#000")
        .text(overAllInterpretation, { align: "left", width: pageInnerWidth(), lineGap: 3 });

      doc.moveDown(2.5);

      doc.font("Helvetica-Bold").fontSize(16).fillColor("#000")
        .text("Interview Transcription", { align: "left" });

      doc.moveDown(0.2);

      // Convert transcription array to readable text
      let transcription = "(No transcription provided)";
      if (Array.isArray(transcriptionText)) {
        for (const entry of transcriptionText) {
          ensureSpace(18); // check space for line

          if (entry.speaker && entry.text) {
            const label = entry.speaker === "USER" ? "Candidate: " : "Assistant: ";

            // bold label (size 12)
            doc.font("Helvetica-Bold").fontSize(12).text(label, { continued: true });

            // normal text (size 10)
            doc.font("Helvetica").fontSize(10).text(entry.text, { continued: false });

            doc.moveDown(1);
          }
        }
      }
      else if (typeof transcriptionText === "string") {
        doc.font("Helvetica").fontSize(10).text(transcriptionText, { align: "left" });
      }

      ensureSpace(10);
      doc.font("Helvetica").fontSize(10).fillColor("#000")
        .text(transcription, { align: "left", width: pageInnerWidth(), lineGap: 5 });

      // -------------------- Finish PDF --------------------
      doc.end();
      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", (err) => reject(err));

    }
    catch (err) {
      reject(err);
    }
  });
};

const generateHTMLBody = (candidateName, ManagerName, jobTitle, InterviewID, overAllScore) => {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>AI Interview Report</title>
  <style>
    /* Basic reset */
    body,table,td,a{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table,td{ mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img{ -ms-interpolation-mode:bicubic; display:block; border:0; outline:none; text-decoration:none; }
    body{ margin:0; padding:0; width:100% !important; height:100% !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color:#f4f6f8; color:#333333; }

    /* Container */
    .email-wrapper{ width:100%; background-color:#f4f6f8; padding:20px 0; }
    .email-content{ width:100%; max-width:660px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.06); }

    /* Header */
    .email-header{ padding:20px 28px; background: linear-gradient(90deg,#0b6efd,#4b9cff); color:#ffffff; }
    .brand{ font-weight:700; font-size:18px; letter-spacing:0.2px; text-decoration:none; color:#ffffff; }
    .preheader{ font-size:12px; opacity:0.95; margin-top:6px; color:rgba(255,255,255,0.92); }

    /* Body */
    .email-body{ padding:24px 28px; }
    .greeting{ font-size:16px; margin-bottom:8px; }
    .lead{ margin:0 0 16px 0; color:#555555; font-size:14px; line-height:1.5; }

    .summary{ background:#f8fafc; border:1px solid #eef2f6; padding:16px; border-radius:6px; margin:16px 0; font-size:14px; }
    .summary p{ margin:6px 0; }
    .summary .label{ font-weight:600; color:#222; }
    .score{ font-weight:700; font-size:20px; color:#0b6efd; }

    .note{ font-size:13px; color:#666; margin-top:10px; }

    /* Footer */
    .email-footer{ padding:18px 28px; background:#ffffff; border-top:1px solid #edf0f3; font-size:13px; color:#666666; }
    .cta{ display:inline-block; margin-top:12px; padding:10px 16px; background:#0b6efd; color:#fff; text-decoration:none; border-radius:6px; font-weight:600; }
    .small{ font-size:12px; color:#9aa3ad; margin-top:8px; }

    /* Mobile */
    @media only screen and (max-width:480px){
      .email-content{ border-radius:0; margin:0 0; }
      .email-header, .email-body, .email-footer{ padding-left:16px; padding-right:16px; }
    }
  </style>
</head>
<body>
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table class="email-content" cellpadding="0" cellspacing="0" role="presentation">
          <!-- Header -->
          <tr>
            <td class="email-header" align="left">
              <a href="https://intervwd.com" class="brand">Intervwd</a>
              <div class="preheader">AI Interview Report — Detailed evaluation attached</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body">
              <p class="greeting">Hello <strong>${ManagerName}</strong>,</p>
              <p class="lead">The interview for <strong>${candidateName}</strong> applying for the position of <strong>[Job Title]</strong> has been successfully completed. Please find a summary of the evaluation below — the detailed report is attached as a PDF.</p>

              <div class="summary" role="article" aria-label="Interview summary">
                <p><span class="label">Candidate Name:</span> <span>${candidateName}</span></p>
                <p><span class="label">Job Title:</span> <span>${jobTitle}</span></p>
                <p><span class="label">Interview ID:</span> <span>${InterviewID}</span></p>
                <p><span class="label">Overall Score:</span> <span class="score">${overAllScore}</span></p>
                <p style="margin-top:8px;"><em>Interpretation:</em> [Candidate lacks the technical and professional experience required for the Backend Developer role. Not recommended for the next stage.]</p>
              </div>

              <p class="lead">You can view the detailed evaluation report in the attached PDF, which includes:</p>
              <ul style="margin:0 0 12px 20px; color:#444;">
                <li>Full transcript of the AI interview</li>
                <li>Detailed parameter-wise scoring</li>
              </ul>

              <p class="note">If you'd like to view the candidate profile or interview recordings online, click the button below (requires your Intervwd account access):</p>

              <p>
                <a href="https://intervwd.com/login" class="cta" target="_blank" rel="noopener">View on Intervwd</a>
              </p>

              <p class="small">If you believe this report requires review or you would like a re-evaluation, reply to this email or visit your dashboard.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" align="left">
              <div style="font-weight:600; color:#222;">Best regards,</div>
              <div>Team Intervwd</div>
              <div style="margin-top:8px;"><a href="https://intervwd.com" target="_blank" rel="noopener">https://intervwd.com</a></div>

              <div style="margin-top:12px;" class="small">
                This message was sent from <code>no-reply@intervwd.com</code>. Please do not reply to this address.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

export const handler = async (event) => {
  console.log('EVENT ', JSON.stringify(event));
  switch (event.command) {
    case "getCurrentUserDetails":
      return await getCurrentUserDetails(event);

    case "udpateMyDetails":
      return await udpateMyDetails(event);

    case "listJobDescriptions":
      return await listJobDescriptions(event);

    case "listSearchJobDescriptionByJobCode":
      return await listSearchJobDescriptionByJobCode(event);

    case "topUpCredit":
      return await topUpCredit(event);

    case "listTopUpCreditHistory":
      return await listTopUpCreditHistory(event);

    case "checkIfInterviewAlreadyTaken":
      return await checkIfInterviewAlreadyTaken(event);

    case "createInterview":
      return await createInterview(event);

    case "updateInterviewDetails":
      return await updateInterviewDetails(event);

    case "updateInterviewAudioDetails":
      return await updateInterviewAudioDetails(event);

    case "listInterviews":
      return await listInterviews(event);

    case "getTranscriptEvaluation":
      return await getTranscriptEvaluation(event);

    case "updateInterviewDetailsAsInprogress":
      return await updateInterviewDetailsAsInprogress(event);

    default:
      throw new Error("Invalid Command");
  }
};
