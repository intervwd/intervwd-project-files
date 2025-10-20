//********************************* LAYERS *********************************
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

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

const updatePaymentSuccessDetailsInCredits = async (event) => {
  let order_id = event.order_id || event.id;
  let getPaymentOrderDetailsParams = {
    TableName: `Intervwd_Payment_Transactions`,
    IndexName: "order_id-index",
    KeyConditionExpression: "order_id = :order_id",
    ExpressionAttributeValues: {
      ":order_id": order_id
    }
  };
  let orderDetails = await query_dynamo(getPaymentOrderDetailsParams);
  if (orderDetails.Count > 0) {
    if (orderDetails.Count > 0 && orderDetails.Items[0].transaction_status !== "PAID") {
      let orderDetails_item = orderDetails.Items[0];
      let transaction_status = "PAID";

      const date = Date.now();

      let updateOrderStatusInPaymentParams = {
        TableName: `Intervwd_Payment_Transactions`,
        Key: {
          payment_id: orderDetails_item.payment_id
        },
        UpdateExpression: "Set payment_status = :payment_status, razor_pay_response = :razor_pay_response, transaction_modified_on = :transaction_modified_on",
        ExpressionAttributeValues: {
          ":payment_status": transaction_status,
          ":razor_pay_response": event.orderDetails,
          ":transaction_modified_on": date,
        }
      };
      await update_dynamo(updateOrderStatusInPaymentParams);

      let updateBusinessUserInMaster = {
        TableName: "Intervwd_Master",
        Key: {
          master_id: "MASTER_ID"
        },
        UpdateExpression: "ADD total_credites :total_credites, total_credits_balance_added :total_credits_balance_added, total_credits_balance_added_count :total_credits_balance_added_count",
        ExpressionAttributeValues: {
          ":total_credites": orderDetails_item.credits,
          ":total_credits_balance_added": orderDetails_item.amount,
          ":total_credits_balance_added_count": 1,
        }
      };
      await update_dynamo(updateBusinessUserInMaster);

      if (orderDetails_item.payment_source == "BUSINESS") {
        let updateOrganization = {
          TableName: "Intervwd_Organizations",
          Key: {
            organization_id: orderDetails_item.organization_id
          },
          UpdateExpression: "Set organization_credits = :organization_credits, total_credits_balance_added :total_credits_balance_added, paid_source = :paid_source",
          ExpressionAttributeValues: {
            ":organization_credits": event.credits,
            ":total_credits_balance_added": orderDetails_item.credits,
            ":paid_source": "ACTIVE"
          }
        };
        await update_dynamo(updateOrganization);

        let createCreditTransactionsParams = {
          TableName: 'Intervwd_Credit_Transactions',
          Item: {
            credit_transaction_id: uuidv4(),
            transaction_initiator_user_id: orderDetails_item.user_id,
            transaction_initiator_user_name: orderDetails_item.user_name,
            transaction_initiator_user_email_id: orderDetails_item.user_email_id,
            transaction_date: date,
            organization_id: orderDetails_item.organization_id,
            credits: event.credits,
            amount: event.credits,
            credit_source: "TOP_UP",
            reason: "Credits have been successfully topped up",
            transaction_status: "PENDING",
            credit_description: `Credits have been successfully topped up for user ${orderDetails_item.user_name} in Organization ${orderDetails_item.organization_name}. Amount credited: ${event.credits} credits.`
          }
        };
        await insert_dynamo(createCreditTransactionsParams);
      }
      else if (orderDetails_item.payment_source == "JOB_SEEKER") {
        let updateOrganization = {
          TableName: "Intervwd_JobSeeker_Users",
          Key: {
            user_id: orderDetails_item.user_id
          },
          UpdateExpression: "Set credits = :credits, paid_source = :paid_source",
          ExpressionAttributeValues: {
            ":credits": orderDetails_item.credits,
            ":paid_source": "ACTIVE"
          }
        };
        await update_dynamo(updateOrganization);

        let createCreditTransactionsParams = {
          TableName: 'Intervwd_Credit_Transactions',
          Item: {
            credit_transaction_id: uuidv4(),
            transaction_initiator_user_id: orderDetails_item.user_id,
            transaction_initiator_user_name: orderDetails_item.user_name,
            transaction_initiator_user_email_id: orderDetails_item.user_email_id,
            transaction_date: date,
            organization_id: orderDetails_item.organization_id,
            credits: event.credits,
            amount: event.credits,
            credit_source: "TOP_UP",
            reason: "Credits have been successfully topped up",
            transaction_status: "PENDING",
            credit_description: `Credits have been successfully topped up for user ${orderDetails_item.user_name} in Organization ${orderDetails_item.organization_name}. Amount credited: ${event.credits} credits.`
          }
        };
        await insert_dynamo(createCreditTransactionsParams);
      }
    }
  }
};

const updatePaymentFailedDetailsInCredits = async (event) => {
  let order_id = event.order_id || event.id;
  let getPaymentOrderDetailsParams = {
    TableName: `Intervwd_Payment_Transactions`,
    IndexName: "order_id-index",
    KeyConditionExpression: "order_id = :order_id",
    ExpressionAttributeValues: {
      ":order_id": order_id
    }
  };
  let orderDetails = await query_dynamo(getPaymentOrderDetailsParams);
  if (orderDetails.Count > 0) {
    if (orderDetails.Count > 0 && orderDetails.Items[0].transaction_status !== "PAID") {
      let orderDetails_item = orderDetails.Items[0];
      let transaction_status = "FAILED";

      const date = Date.now();

      let updateOrderStatusInPaymentParams = {
        TableName: `Intervwd_Payment_Transactions`,
        Key: {
          payment_id: orderDetails_item.payment_id
        },
        UpdateExpression: "Set payment_status = :payment_status, razor_pay_response = :razor_pay_response, transaction_modified_on = :transaction_modified_on",
        ExpressionAttributeValues: {
          ":payment_status": transaction_status,
          ":razor_pay_response": event.orderDetails,
          ":transaction_modified_on": date,
        }
      };
      await update_dynamo(updateOrderStatusInPaymentParams);
    }
  }
};


export const handler = async (event) => {
  if (event.event === "order.paid" || event.event === "payment.captured") {
    const orderDetails = event.payload.order.entity;
    let eventObj = {
      order_id: event.payload.payment.entity.order_id,
      orderDetails: orderDetails
    };
    await updatePaymentSuccessDetailsInCredits(eventObj);
  }
  else if (event.event === "payment.failed") {
    const orderDetails = event.payload.order.entity;
    let eventObj = {
      order_id: event.payload.payment.entity.order_id,
      orderDetails: orderDetails
    };
    await updatePaymentFailedDetailsInCredits(eventObj);
  }
  return {
    status: "ok",
    statusCode: 200,
  };
};
