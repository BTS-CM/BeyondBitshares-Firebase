'use strict'; // Mandatory js style?

const {
  dialogflow,
  Suggestions,
  BasicCard,
  Button,
  SimpleResponse
} = require('actions-on-google')

const util = require('util')
const functions = require('firebase-functions'); // Mandatory when using firebase
const http = require('https'); // Required for request's https use? Or dead code?...
const requestLib = require('request'); // Used for querying the HUG.REST API
const moment = require('moment'); // For handling time.
var chatbase = require('@google/chatbase')
              .setApiKey('API_KEY') // Your Chatbase API Key
              .setPlatform('Google Assistant'); // The type of message you are sending to chatbase: user (user) or agent (bot)

const app = dialogflow({
  debug: true
}) // Creating the primary dialogflow app element

function catch_error(conv, error_message, intent) {
  /*
  Generic function for reporting errors & providing error handling for the user.
  */
  chatbase_analytics(
    conv,
    `Error within intent ${intent}`, // input_message
    intent, // input_intent
    'error' // win_or_fail
  );

  if(error_message instanceof Error) {
      console.error(error_message);
  } else {
      console.error(new Error(error_message));
  }
  return conv.close(
      new SimpleResponse({
      // If we somehow fail, do so gracefully!
      speech: "An unexpected error was encountered! Let's end our Beyond Bitshares session for now.",
      text: "An unexpected error was encountered! Let's end our Beyond Bitshares session for now."
    })
  );
}

function invalid_input(conv, intent_name) {
  /*
  Reducing code duplication.
  Replace conv.close with a direction to a fallback intent in the future!
  */
  chatbase_analytics(
    conv,
    `User input invalid data within intent ${intent_name}`, // input_message
    intent_name, // input_intent
    'fail' // win_or_fail
  );

  return conv.close(
      new SimpleResponse({
      // If we somehow fail, do so gracefully!
      speech: "You provided invalid input data, try again with alternative input!",
      text: "You provided invalid input data, try again with alternative input!"
    })
  );
}

function chatbase_analytics(conv, input_message, input_intent, win_or_fail) {
  /*
  Integrating chatbase chat bot analytics.
  Will help optimize user experience whilst minimizing privacy impact.
  */
  //const userId = conv.user.userID;
  console.log(conv.user.userID);

  const userId = 'TESTER1';

  if (win_or_fail === 'Win') {
    // For reporting successful bot interaction
    chatbase.newMessage('API_KEY')
    .setPlatform('Google Assistant')
  	.setMessage(input_message)
  	.setVersion('1.0')
  	.setUserId(userId.toString())
    .setAsTypeUser() // sets the message as type user
    .setAsHandled() // set the message as handled -- this means the bot understood the message sent by the user
    .setIntent(input_intent) // the intent of the sent message (does not have to be set for agent messages)
    .setTimestamp(Date.now().toString()) // Only unix epochs with Millisecond precision
  	.send()
  	.then(msg => console.log(msg.getCreateResponse()))
  	.catch(err => console.error(err));
  } else {
    // For reporting fallback attempts
    chatbase.newMessage('API_KEY')
    .setPlatform('Google Assistant')
    .setMessage(input_message)
    .setVersion('1.0')
    .setUserId(userId.toString())
    .setAsTypeUser() // sets the message as type agent
    .setAsNotHandled() // set the message as not handled -- this means the opposite of the preceding
    .setIntent(input_intent) // the intent of the sent message (does not have to be set for agent messages)
    .setTimestamp(Date.now().toString()) // Only unix epochs with Millisecond precision
    .send()
    .then(msg => console.log(msg.getCreateResponse()))
    .catch(err => console.error(err));
  }
}

function hug_request(target_url, target_function, method, qs_contents) {
  // Setting URL and headers for request

  var api_host = '';
  if (target_url === 'HUG') {
    api_host = `https://btsapi.grcnode.co.uk`; // Change this to your own HUG REST API server (if you want)
  } else {
    api_host = `https://23.94.69.140:5000`;
  }

  var request_options = {
    url: `${api_host}/${target_function}`,
    method: method, // GET request, not POST.
    json: true,
    headers: {
      'User-Agent': 'Beyond Bitshares Bot',
      'Content-Type': 'application/json'
    },
    qs: qs_contents
  };

  // Return new promise
  return new Promise((resolve, reject) => {
    // Do async job
    requestLib(request_options, (err, resp, body) => {
        if (err) {
          // Returning an indication that the HUG REST query failed
          const error_message = err;
          console.log(`Error - we didn't get a proper response! URL: ${url}`);
          reject(error_message);
        } else {
          if (resp.statusCode === 200) {
            // Returning the body in a promise
            resolve(body);
          } else {
            // Don't want anything other than 200
            const error_message = resp;
            console.log("No error, but response != 200");
            reject(error_message);
          }
        }
    })
  });
}

app.intent('Welcome', conv => {
  /*
  The default welcome intent
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!

  const welcome_param = {}; // The dict which will hold our parameter data
  welcome_param['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('home', 1, welcome_param); // We need to insert data into the 'home' context for the home fallback to trigger!

  const textToSpeech = `<speak>` +
    `<emphasis level="moderate">Hey, welcome to Beyond Bitshares!</emphasis> <break time="0.375s" /> ` +
    `Beyond Bitshares provides information regarding Bitshares on demand. <break time="0.35s" /> ` +
    `You can request information about the network, accounts, assets, committee members, witnesses, worker proposals, fees, etc.` +
    `What would you like to do? ` +
    `</speak>`;

  const textToDisplay = `Hey, welcome to Beyond Bitshares!\n\n` +
    `Beyond Bitshares provides information regarding Bitshares on demand.\n\n` +
    `You can request information about the network, accounts, assets, committee members, witnesses, worker proposals, fees, etc.` +
    `What would you like to do?`;

  conv.ask(new SimpleResponse({
    speech: textToSpeech,
    text: textToDisplay
  }));

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(new Suggestions('About', 'Accounts', 'Assets', 'Blockchain', 'Committee', 'Markets', 'Network', 'Workers', 'Fees', 'Help', 'Quit'));
  }
  chatbase_analytics(
    conv,
    'Welcome page', // input_message
    'Welcome', // input_intent
    'Win' // win_or_fail
  );
})

app.intent('About', conv => {
  /*
    About function - providing info about Bitshares.
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!

  const about_param = {}; // The dict which will hold our parameter data
  about_param['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('about', 1, about_param); // Need to set the data

  const textToSpeech1 = `The BitShares platform has numerous innovative features which are not found elsewhere within the smart contract industry such as:` +
    `Price-Stable Cryptocurrencies - SmartCoins provide the freedom of cryptocurrency with the stability of FIAT assets.` +
    `Decentralized Asset Exchange - A fast and fluid trading platform` +
    `Industrial Performance and Scalability - Proven 3k TPS, theoretical 100k limit.` +
    `Dynamic Account Permissions - Management for the corporate environment.` +
    `Recurring & Scheduled Payments - Flexible withdrawal permissions.`;

  const displayText1 = `The BitShares platform has numerous innovative features which are not found elsewhere within the smart contract industry such as: \n\n` +
    `Price-Stable Cryptocurrencies - SmartCoins provide the freedom of cryptocurrency with the stability of FIAT assets.\n\n` +
    `Decentralized Asset Exchange - A fast and fluid trading platform.\n\n` +
    `Industrial Performance and Scalability - Proven 3k TPS, theoretical 100k limit.\n\n` +
    `Dynamic Account Permissions - Management for the corporate environment.\n\n` +
    `Recurring & Scheduled Payments - Flexible withdrawal permissions.`;

  const displayText2 = `Referral Rewards Program - Network growth through adoption rewards.\n\n` +
    `User-Issued Assets - Regulation-compatible cryptoasset issuance.\n\n` +
    `Stakeholder-Approved Project Funding - A self-sustaining funding model.\n\n` +
    `Transferable Named Accounts - Easy and secure transactions.\n\n` +
    `Delegated Proof-of-Stake Consensus - A robust and flexible consensus protocol.\n\n` +
    `Want to know more about any of Bitshares features?`;

  const textToSpeech2 = `Referral Rewards Program - Network growth through adoption rewards.` +
    `User-Issued Assets - Regulation-compatible cryptoasset issuance.` +
    `Stakeholder-Approved Project Funding - A self-sustaining funding model.` +
    `Transferable Named Accounts - Easy and secure transactions.` +
    `Delegated Proof-of-Stake Consensus - A robust and flexible consensus protocol.` +
    `Want to know more about any of Bitshares features?`;

  conv.ask(
    new SimpleResponse({
      speech: textToSpeech1,
      text: displayText1
    }),
    new SimpleResponse({
      speech: textToSpeech2,
      text: displayText2
    }),
    new BasicCard({
      title: `Want to know more?`,
      text: 'The Bitshares documentation wiki has great information!',
      buttons: new Button({
        title: 'Bitshares docs',
        url: `http://docs.bitshares.org/index.html`,
      }),
      display: 'WHITE'
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(new Suggestions('About', 'Accounts', 'Assets', 'Blockchain', 'Committee', 'Markets', 'Network', 'Workers', 'Fees', 'Help', 'Quit'));
  }

  chatbase_analytics(
    conv,
    'About page', // input_message
    'About', // input_intent
    'Win' // win_or_fail
  );
})

app.intent('Account', conv => {
  /*
    account function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!

  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('account', 1, parameter); // Need to set the data

  const textToSpeech1 = `<speak>` +
    `What account information do you want? You can ask for a general account overview or request specific information such as an user's balances, open orders, call positions, their recent trade history and life time membership verification"` +
    `</speak>`;

  const displayText1 = `What account information do you want? You can ask for a general account overview or request specific information such as an user's balances, open orders, call positions, their recent trade history and life time membership verification"`;

  conv.ask(
    new SimpleResponse({
      speech: textToSpeech1,
      text: displayText1
    }),
    new BasicCard({
      title: `Bitshares Account Lookup`,
      text: 'You can search for accounts via open-explorer if Beyond Bitshares is insufficient',
      buttons: new Button({
        title: 'Block explorer link',
        url: `http://open-explorer.io/#/accounts`,
      }),
      display: 'WHITE'
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit'));
  }
  chatbase_analytics(
    conv,
    'Account overview', // input_message
    'Account', // input_intent
    'Win' // win_or_fail
  );
})

app.intent('Account.Balances', conv => {
  const input_account  = 'abit';
  const qs_input = {
    //  HUG REST GET request parameters
    account_name: input_account, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'account_balances', 'GET', qs_input)
  .then(body => {
    if (body.valid_account === true) {
      var text = ``;
      var voice = ``;
      var many_balances = false;

      if (body.account_has_balances === true) {
        const account_balances = body.balances; // This var holds the account's balance array, retrieved from the HUG server.
        const quantity_balances = account_balances.length;
        var balance_iterator = 0;

        for (var balance in account_balances) {
          if (text.length < 640) { // This won't work! It could be 639, then we add more balances causing an invalid output
            if (parseInt(balance) > 1) {
              balance_iterator = balance_iterator + 1; // Iterate
              var asset_name = Object.keys(balance)[0];

              if (balance_iterator !== (quantity_balances - 1)) {
                text += `${asset_name}: ${balance} \n`; // New line
              } else {
                // Final line
                text += `${asset_name}: ${balance}`; // Final line
              }
              voice += `${balance} ${asset_name}'s`;
            }
          } else {
            // Can't go above 640 chars
            // Could extend this to a second text/voice & simple response.
            many_balances = true;
            break;
          }
        }
      } else {
        chatbase_analytics(
          conv,
          'No account balances to display!', // input_message
          'Account.Balances', // input_intent
          'User fail' // win_or_fail
        );
        return conv.close(`${input_account} does not have any assets in their account, goodbye.`);
      }

      const textToSpeech = `<speak>` +
        voice +
        `</speak>`;

      const displayText = text;

      const textToSpeech2 = `<speak>` +
        `Do you require any other Bitshares information?` +
        `</speak>`;

      const displayText2 = `Do you require any other Bitshares information?`;

      chatbase_analytics(
        conv,
        'Successful interaction ', // input_message
        'Account.Balances', // input_intent
        'Win' // win_or_fail
      );

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true && many_balances === true) {
        return conv.ask(
          new SimpleResponse({
            speech: textToSpeech,
            text: displayText
          }),
          new SimpleResponse({
            speech: textToSpeech2,
            text: displayText2
          }),
          new BasicCard({
            title: `Insufficient space to display ${input_account}'s balances!'`,
            text: 'This account has too many balances to show. Please navigate to the linked block explorer.',
            buttons: new Button({
              title: 'Block explorer link',
              url: `http://open-explorer.io/#/accounts/${input_account}`,
            }),
            display: 'WHITE'
          }),
          new Suggestions('About', 'Accounts', 'Assets', 'Blockchain', 'Committee', 'Markets', 'Network', 'Workers', 'Fees', 'Help', 'Quit')
        );
      } else {
        return conv.ask(
          new SimpleResponse({
            speech: textToSpeech,
            text: displayText
          }),
          new SimpleResponse({
            speech: textToSpeech2,
            text: displayText2
          })
        );
      }
    } else {
      return invalid_input(conv, `account_balances`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'account_balances');
  });
})

app.intent('Account.CallPositions', conv => {
  /*
    account_CallPositions function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('account_CallPositions', 1, parameter); // Need to set the data

  // input_account = <Retrieve Account from DialogFlow>
  const input_account  = 'abit';
  const qs_input = {
    //  HUG REST GET request parameters
    account: input_account, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'get_callpositions', 'GET', qs_input)
  .then(body => {
    if (body.valid_account === true) {
        var text = ``;
        var voice = ``;

        if (body.account_has_call_positions === true) {
          const call_positions = body.call_positions; // This var holds the account's call positions
          const quantity_call_positions = call_positions.length;
          var call_position_iterator = 0;

          for (var call in call_positions) {
            if (text.length < 640) { // Insufficient check against going over the max character limit (639 would pass)
              call_position_iterator = call_position_iterator + 1;
              asset_name = Object.keys(call)[0];
              collateral = call.collateral; //collateral.<symbol|amount>
              debt = call.debt; //debt.<symbol|amount>
              call_price = call.call_price; //call_price.<base|quote>.<symbol|amount>
              ratio = call.ratio;

              if (call_position_iterator !== (quantity_call_positions - 1)) {
                text += `${asset_name}: ${debt.amount}, collateral: ${collateral.amount} ${collateral.symbol}, ratio: ${ratio}.\n`;
              } else {
                // Final line
                text += `${asset_name}: ${debt.amount}, collateral: ${collateral.amount} ${collateral.symbol}, ratio: ${ratio}.`;
              }
              voice += `${debt.amount} ${asset_name} with a ratio of ${ratio}.`;

            } else {
              // Can't go above 640 chars
              // Could extend this to a second text/voice & simple response.
              break;
            }
          }
        } else {
          if (hasScreen === true) {
            conv.ask(new Suggestions('About', 'Accounts', 'Assets', 'Blockchain', 'Committee', 'Markets', 'Network', 'Workers', 'Fees', 'Help', 'Quit'));
          }
          return conv.ask(
            new SimpleResponse({
              // Sending the details to the user & closing app.
              speech: `<speak>You asked for ${input_account}'s call positions, however they don't have any call positions.</speak>`,
              text: `You asked for ${input_account}'s call positions, however they don't have any call positions.`
            }),
            new SimpleResponse({
              // Sending the details to the user & closing app.
              speech: `<speak>Do you require any other Bitshares information?</speak>`,
              text: `Do you require any other Bitshares information?`
            })
          );
      }

        const textToSpeech = `<speak>` +
                                `${input_account}'s call positions are:`
                                voice +
                              `</speak>`;

        const displayText = `${input_account}'s call positions are:` + voice;

        chatbase_analytics(
          conv,
          'Successfully displayed account call positions!', // input_message
          'Account.CallPositions', // input_intent
          'Win' // win_or_fail
        );

        return conv.ask(
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: textToSpeech,
            text: displayText
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          })
        );
      } else {
        return invalid_input(conv, `get_callpositions`);
      }
    })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Account.CallPositions');
  });
})

app.intent('Account.Info', conv => {
  /*
    account_Info function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('account_Info', 1, parameter); // Need to set the data

  const input_account  = 'abit';
  const qs_input = {
    //  HUG REST GET request parameters
    account: input_account, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'account_info', 'GET', qs_input)
  .then(body => {
    if (body.valid_account === true) { // NEED TO CHANGE TO CHECKING ACCOUNT VALIDITY, NOT KEY!

      const info = body.account_info; // This var holds the account's call positions
      const id = info.id;
      const registrar = info.registrar;
      const name = info.name;
      const witness_votes = info.options.num_witness;
      const committee_votes = info.options.num_committee;

      const textToSpeech = `<speak>` +
        `You asked for ${input_account}` +
        `Found information regarding ${input_account}:` +
        `${name}'s ID is ${id}, they were registered by ${registrar} and have voted for ${witness_votes} witnesses and ${committee_votes} committee members.` +
        `</speak>`;

      const displayText = `Found information regarding ${input_account}:` +
        `${name}'s ID is ${id}, they were registered by ${registrar} and have voted for ${witness_votes} witnesses and ${committee_votes} committee members.`;

      chatbase_analytics(
        conv,
        'Successfully displayed account information!', // input_message
        'Account.Info', // input_intent
        'Win' // win_or_fail
      );

      return conv.ask(
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: textToSpeech,
          text: displayText
        }),
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: `<speak>Do you require any other Bitshares information?</speak>`,
          text: `Do you require any other Bitshares information?`
        })
      );

    } else {
      return invalid_input(conv, `account_info`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Account.Info');
  });
})

app.intent('Asset', conv => {
  /*
    asset function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('asset', 1, parameter); // Need to set the data

  const textToSpeech = `<speak>` +
                          `What Bitshares asset information do you want?` +
                          `You can ask for:` +
                          `An individual asset's information.` +
                          `The top smartcoins based on volume.` +
                          `The top User Issued Assets based on volume.` +
                          `What do you want to know about Bitshares assets?` +
                        `</speak>`;

  const displayText = `What Bitshares asset information do you want?\n\n` +
                      `You can ask for:` +
                      `An individual asset's information.` +
                      `The top smartcoins based on volume.` +
                      `The top User Issued Assets based on volume.` +
                      `So, what do you want to know?`;

  chatbase_analytics(
    conv,
    'Successfully displayed asset overview!', // input_message
    'Asset', // input_intent
    'Win' // win_or_fail
  );

  conv.ask(
    new SimpleResponse({
      // Sending the details to the user
      speech: textToSpeech,
      text: displayText
    }),
    new BasicCard({
      title: `Bitshares Assets`,
      text: 'Want to know more about assets on the Bitshares network? Check out the linked website!',
      buttons: new Button({
        title: 'Bitshares asset docs',
        url: `http://docs.bitshares.org/bitshares/user/assets.html`,
      }),
      display: 'WHITE'
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(new Suggestions('Top Smartcoins', 'Top UIAs', 'Back', 'Help', 'Quit'));
  }
})

app.intent('Asset.One', conv => {
  /*
    get_Asset function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('get_Asset', 1, parameter); // Need to set the data

  const input_asset_name  = 'USD';
  const qs_input = {
    //  HUG REST GET request parameters
    asset_name: input_asset_name, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'get_asset', 'GET', qs_input)
  .then(body => {
    if (body.valid_key === true) { // Change to checking validity of asset, not key!

      asset_data = body.asset_data;

      const textToSpeech = `<speak>` +
        `${input_asset_name} information:` +
        `ID: ${asset_data['id']}` +
        `Symbol: ${asset_data['symbol']}` +
        `Description: ${asset_data['description']}` +
        `Current supply: ${asset_data['dynamic_asset_data']['current_supply']}` +
        `Confidential supply: ${asset_data['dynamic_asset_data']['confidential_supply']}` +
        `Accumulated Fees: ${asset_data['dynamic_asset_data']['accumulated_fees']}` +
        `Fee pool: ${asset_data['dynamic_asset_data']['fee_pool']}` +
        `</speak>`;

      const displayText = `${input_asset_name} information:` +
        `ID: ${asset_data['id']}` +
        `Symbol: ${asset_data['symbol']}` +
        `Description: ${asset_data['description']}` +
        `Current supply: ${asset_data['dynamic_asset_data']['current_supply']}` +
        `Confidential supply: ${asset_data['dynamic_asset_data']['confidential_supply']}` +
        `Accumulated Fees: ${asset_data['dynamic_asset_data']['accumulated_fees']}` +
        `Fee pool: ${asset_data['dynamic_asset_data']['fee_pool']}`;

      chatbase_analytics(
        conv,
        'Successfully displayed a single assets information!', // input_message
        'Asset.One', // input_intent
        'Win' // win_or_fail
      );

      return conv.ask(
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: textToSpeech,
          text: displayText
        }),
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: `<speak>Do you require any other Bitshares information?</speak>`,
          text: `Do you require any other Bitshares information?`
        })
      );
    } else {
      return invalid_input(conv, `get_asset`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message,'Asset.One');
  });
})

app.intent('Block', conv => {
  /*
    block function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('block', 1, parameter); // Need to set the data

  const textToSpeech = `<speak>` +
                        `What kind of block information do you want?` +
                        `The Latest Bitshares block details?` +
                        `The details of a specific Bitshares block?` +
                        `Perhaps an overview of the Bitshares blockchain?` +
                        `So what will it be?` +
                        `</speak>`;

  const displayText = `What kind of block information do you want?` +
                      `The Latest Bitshares block details?` +
                      `The details of a specific Bitshares block?` +
                      `Perhaps an overview of the Bitshares blockchain?` +
                      `So what will it be?`;

  conv.ask(
    new SimpleResponse({
      speech: textToSpeech,
      text: displayText
    }),
    new BasicCard({
      title: `Bitshares Blocks`,
      text: 'Want to view Bitshares block details in a web browser?',
      buttons: new Button({
        title: 'Block explorer link',
        url: `http://open-explorer.io/#/search`,
      }),
      display: 'WHITE'
    }),
    new SimpleResponse({
      // Sending the details to the user & closing app.
      speech: `<speak>Do you require any other Bitshares information?</speak>`,
      text: `Do you require any other Bitshares information?`
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(new Suggestions('Latest Bitshares block details', 'Bitshares blockchain overview', 'Help', 'Quit'));
  }

  chatbase_analytics(
    conv,
    'Block page', // input_message
    'Block', // input_intent
    'Win' // win_or_fail
  );
})

app.intent('Block.Latest', conv => {
  /*
    block_Latest function
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('block_Latest', 1, parameter); // Need to set the data

  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('HUG', 'get_latest_block', 'GET', qs_input)
  .then(body => {
    const previous = body.previous;
    const witness = body.witness;
    const transaction_merkle_root = body.transaction_merkle_root;
    const tx_count = Object.keys(body.transactions).length;
    const block_id = body.id;
    const block_date = body.block_date;
    const block_number = body.block_number;

    const textToSpeech = `<speak>` +
      `Block ${block_number} is the latest Bitshares block.` +
      `It was produced on ${block_date} by witness with ID ${witness}.` +
      `There were ${tx_count} transactions in the block.` +
      `</speak>`;

    const displayText = `Block ${block_number} (ID: ${block_id}) is the latest Bitshares block.\n\n` +
      `The previous block was ${previous}, with a TX merkle root of ${transaction_merkle_root}.\n\n` +
      `It was produced on ${block_date} by witness with ID ${witness}.\n\n` +
      `There were ${tx_count} transactions in the block.`;

    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    if (hasScreen === true) {
      return conv.ask(
        new SimpleResponse({
          // Sending the details to the user
          speech: textToSpeech,
          text: displayText
        }),
        new BasicCard({
          title: `More block info available!'`,
          text: 'Interested in more block information?',
          buttons: new Button({
            title: 'Block explorer link',
            url: `http://open-explorer.io/#/search`,
          }),
          display: 'WHITE'
        }),
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: `<speak>Do you require any other Bitshares information?</speak>`,
          text: `Do you require any other Bitshares information?`
        }),
        new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
      );
    } else {
      return conv.ask(
        new SimpleResponse({
          // Sending the details to the user
          speech: textToSpeech,
          text: displayText
        }),
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: `<speak>Do you require any other Bitshares information?</speak>`,
          text: `Do you require any other Bitshares information?`
        })
      );
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Block.Latest');
  });
})

app.intent('Block.One', conv => {
  /*
    get_block_details function
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('get_block_details', 1, parameter); // Need to set the data

  var input_block_number = 500000;
  const qs_input = {
    //  HUG REST GET request parameters
    block_number: input_block_number, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'get_block_details', 'GET', qs_input)
  .then(body => {
      if (body.valid_block_number === true && body.valid_key === true) {

        const previous = body.previous;
        const witness = body.witness;
        const transaction_merkle_root = body.transaction_merkle_root;
        const tx_count = Object.keys(body.transactions).length;

        const timestamp = body.timestamp;

        const textToSpeech = `<speak>` +
          `Here's info on block number ${block_number}:` +
          `It was produced on ${block_date} by witness with ID ${witness}.` +
          `There were ${tx_count} transactions in the block.` +
          `</speak>`;

        const displayText = `Info regarding block number ${block_number}:\n\n` +
          `The previous block was ${previous}, with a TX merkle root of ${transaction_merkle_root}.\n\n` +
          `It was produced on ${timestamp} by witness with ID ${witness}.\n\n` +
          `There were ${tx_count} transactions in the block.`;

        return conv.ask(
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech,
            text: displayText
          }),
          new BasicCard({
            title: `More block info available!'`,
            text: 'Interested in more block information?',
            buttons: new Button({
              title: 'Block explorer link',
              url: `http://open-explorer.io/#/blocks/${block_number}`,
            }),
            display: 'WHITE'
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          })
        );
      } else {
        return invalid_input(conv, `get_block_details`);
      }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Block.One');
  });
})

app.intent('Block.Overview', conv => {
  /*
    blockchain_Overview function
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('blockchain_Overview', 1, parameter); // Need to set the data

  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('HUG', 'chain_info', 'GET', qs_input)
  .then(body => {
      if (body.valid_key === true) {

        chain_info = body.chain_info;

        const textToSpeech = `<speak>` +
          `Latest block number: ${chain_info['head_block_number']}.` +
          `time: ${chain_info['time']}.` +
          `current_witness: ${chain_info['current_witness']}.` +
          `next_maintenance_time: ${chain_info['next_maintenance_time']}.` +
          `last_budget_time: ${chain_info['last_budget_time']}.` +
          `witness_budget: ${chain_info['witness_budget']}.` +
          `accounts_registered_this_interval: ${chain_info['accounts_registered_this_interval']}.` +
          `recently_missed_count: ${chain_info['recently_missed_count']}.` +
          `last_irreversible_block_num: ${chain_info['last_irreversible_block_num']}.` +
          `</speak>`;

        const displayText = `Latest block number: ${chain_info['head_block_number']}.` +
          `time: ${chain_info['time']}.` +
          `current_witness: ${chain_info['current_witness']}.` +
          `next_maintenance_time: ${chain_info['next_maintenance_time']}.` +
          `last_budget_time: ${chain_info['last_budget_time']}.` +
          `witness_budget: ${chain_info['witness_budget']}.` +
          `accounts_registered_this_interval: ${chain_info['accounts_registered_this_interval']}.` +
          `recently_missed_count: ${chain_info['recently_missed_count']}.` +
          `last_irreversible_block_num: ${chain_info['last_irreversible_block_num']}.`;

        return conv.ask(
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech,
            text: displayText
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          })
        );

      } else {
        return invalid_input(conv, `chain_info`);
      }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Block.Overview');
  });
})

app.intent('Committee', conv => {
  /*
    committee function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('committee', 1, parameter); // Need to set the data

  const textToSpeech = `<speak>` +
                          `What do you want to know about the active Bitshares committee?` +
                          `Want to find know who the active committee members are?` +
                          `Alternatively, do you want info regarding a specific committee member?` +
                        `</speak>`;

  const displayText = `What do you want to know about the Bitshares committee?` +
                      `Want to find know who the active committee members are?` +
                      `Alternatively, do you want info regarding a specific committee member?`;

  conv.ask(
    new SimpleResponse({
      speech: textToSpeech,
      text: displayText
    }),
    new BasicCard({
      title: `Bitshares Committee reference`,
      text: 'Want to know what the Bitshares committee is?',
      buttons: new Button({
        title: 'Bitshares documentation',
        url: `http://docs.bitshares.org/bitshares/user/committee.html`,
      }),
      display: 'WHITE'
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(new Suggestions('Active committee members', 'Help', 'Quit'));
  }

  chatbase_analytics(
    conv,
    'Committee page', // input_message
    'Committee', // input_intent
    'Win' // win_or_fail
  );
})

app.intent('Committee.Active', conv => {
  /*
    committee_Active function
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('committee_Active', 1, parameter); // Need to set the data

  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('HUG', 'get_committee_members', 'GET', qs_input)
  .then(body => {
      if (body.valid_key === true) {

        var text = ``;
        var voice = ``;
        var more_than_640 = false;
        const committee_members = body.committee_members;

        if (Array.isArray(committee_members)) {
          for (var member in committee_members) {
            //console.log(member);
            var member_data = committee_members[member];
            if (text.length < 640) {
              if (member_data.status === true) {
                //console.log("TEXT WRITTEN");
                var committee_calculated_votes = member_data.total_votes / 10000
                text += `ID: ${member_data.id}, User ID: ${member_data.committee_member_account}, Total votes: ${committee_calculated_votes}.\n`;
                voice += `Committee ID: ${member_data.id} is active with ${committee_calculated_votes} votes.`;
              } else {
                continue;
              }
            } else {
              // Can't go above 640 chars
              more_than_640 = true;
              break;
            }
          }
        }

        const textToSpeech = `<speak>` +
          voice +
          `</speak>`;

        const displayText = text;
        const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');

        if (hasScreen === true && more_than_640 === true) {
          return conv.ask(
            new SimpleResponse({
              // Sending the details to the user
              speech: textToSpeech,
              text: displayText
            }),
            new BasicCard({
              title: `Insufficient space to display committee members!`,
              text: 'There are more Committee member to display! Please navigate to the linked block explorer.',
              buttons: new Button({
                title: 'Committee info',
                url: 'http://open-explorer.io/#/committee_members',
              }),
              display: 'WHITE'
            }),
            new SimpleResponse({
              // Sending the details to the user & closing app.
              speech: `<speak>Do you require any other Bitshares information?</speak>`,
              text: `Do you require any other Bitshares information?`
            }),
            new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
          );
        } else {
          return conv.ask(
            new SimpleResponse({
              // Sending the details to the user
              speech: textToSpeech,
              text: displayText
            }),
            new SimpleResponse({
              // Sending the details to the user & closing app.
              speech: `<speak>Do you require any other Bitshares information?</speak>`,
              text: `Do you require any other Bitshares information?`
            })
          );
        }
      } else {
        return invalid_input(conv, `get_committee_members`);
      }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Committee.Active');
  });
})

app.intent('Committee.One', conv => {
  /*
    get_committee_member function
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('get_committee_member', 1, parameter); // Need to set the data

  const input_committee_id = '1.5.15';
  const qs_input = {
    //  HUG REST GET request parameters
    committee_id: input_committee_id, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'get_committee_member', 'GET', qs_input)
  .then(body => {
      if (body.valid_key === true) {

        const get_committee_member_data = body.get_committee_member;
        const committee_member_account = get_committee_member_data['committee_member_account'];
        const total_votes = get_committee_member_data['total_votes'];
        const vote_id = get_committee_member_data['vote_id'];
        const committee_member_details = get_committee_member_data['committee_member_details'];
        const name = committee_member_details['name'];
        const registrar = committee_member_details['registrar'];
        const committee_status = committee_member_details['status'];

        var committee_status_string = ``;

        if (committee_status === true) {
          committee_status_string = `an`;
        } else {
          committee_status_string = `not an`;
        }

        const textToSpeech = `<speak>` +
          `I found the committee member with ID ${committee_id}, here's some info:` +
          `Their account ID is ${committee_member_account}, and their account name is ${name}.` +
          `They were registered by ${registrar}.` +
          `They currently have ${total_votes} votes, and are ${committee_status_string} active committee member.` +
          `</speak>`;

        const displayText = `I found the committee member with ID ${committee_id}, here's some info:` +
          `Their account ID is ${committee_member_account}, and their account name is ${name}.` +
          `They were registered by ${registrar}.` +
          `They currently have ${total_votes} votes, and are ${committee_status_string} active committee member.`;

        return conv.ask(
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech,
            text: displayText
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          })
        );

      } else {
        return invalid_input(conv, `get_committee_member`);
      }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Committee.One');
  });
})

app.intent('Fees', conv => {
  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('HUG', 'list_fees', 'GET', qs_input)
  .then(body => {
    const textToSpeech1 = `<speak>` +
      `The most important Bitshares network fees are:` +
      `Asset transfer: ${body.network_fees.transfer.fee}` +
      `Limit order create: ${body.network_fees.limit_order_create.fee}` +
      `Account creation: Between ${body.network_fees.account_create.basic_fee} and ${body.network_fees.account_create.premium_fee}` +
      `Lifetime Membership Upgrade: ${body.network_fees.account_upgrade.membership_lifetime_fee}` +
      `Asset creation: ${body.network_fees.asset_create.long_symbol} to ${body.network_fees.asset_create.symbol3}` +
      `Asset issuance: ${body.network_fees.asset_issue.fee}` +
      `Worker proposal creation ${body.network_fees.worker_create.fee}` +
      `</speak>`;

    const displayText1 =  `Market fees:\n` +
                          `Asset transfer: ${body.network_fees.transfer.fee}\n` +
                          `Limit order create: ${body.network_fees.limit_order_create.fee}\n` +
                          `Limit order cancel: ${body.network_fees.limit_order_cancel.fee}\n` +
                          `Call order update: ${body.network_fees.call_order_update.fee}\n\n` +
                          `Account fees:\n` +
                          `Create: ${body.network_fees.account_create.basic_fee} to ${body.network_fees.account_create.premium_fee}\n` +
                          `Update: ${body.network_fees.account_update.fee}\n` +
                          `Whitelist: ${body.network_fees.account_whitelist.fee}\n` +
                          `LTM Upgrade: ${body.network_fees.account_upgrade.membership_lifetime_fee}` +
                          `Transfer: ${body.network_fees.account_transfer.fee}\n\n` +
                          `Asset fees:\n` +
                          `Create: ${body.network_fees.asset_create.long_symbol} to ${body.network_fees.asset_create.symbol3}\n` +
                          `Update: ${body.network_fees.account_update.fee}\n` +
                          `Update bitasset: ${body.network_fees.asset_update_bitasset.fee}\n` +
                          `Update feed producers: ${body.network_fees.asset_update_feed_producers.fee}\n` +
                          `Issue: ${body.network_fees.asset_issue.fee}\n` +
                          `Reserve: ${body.network_fees.asset_reserve.fee}\n` +
                          `Fund fee pool: ${body.network_fees.asset_fund_fee_pool.fee}\n` +
                          `Settle: ${body.network_fees.asset_settle.fee}\n` +
                          `Global settle: ${body.network_fees.asset_global_settle.fee}\n` +
                          `Publish feed: ${body.network_fees.asset_publish_feed.fee}\n\n` +
                          `Witness fees:\n` +
                          `Create: ${body.network_fees.witness_create.fee}\n` +
                          `Update: ${body.network_fees.witness_update.fee}`;

    const textToSpeech2 = `<speak>` +
      `These fees can be changed by the committee upon request by the community.` +
      `Do you require any other Bitshares information?` +
      `</speak>`;

    const displayText2 = `Proposal fees:\n` +
                          `Create: ${body.network_fees.proposal_create.fee}\n` +
                          `Update: ${body.network_fees.proposal_update.fee}\n` +
                          `Delete: ${body.network_fees.proposal_delete.fee}\n\n` +
                          `Withdraw permission fees:\n` +
                          `Create: ${body.network_fees.withdraw_permission_create.fee}\n` +
                          `Update: ${body.network_fees.withdraw_permission_update.fee}\n` +
                          `Claim: ${body.network_fees.withdraw_permission_claim.fee}\n\n` +
                          `Committee member fees:\n` +
                          `Create: ${body.network_fees.committee_member_create.fee}\n` +
                          `Update: ${body.network_fees.committee_member_update.fee}\n` +
                          `Update global parameters: ${body.network_fees.committee_member_update_global_parameters.fee}\n\n` +
                          `Vesting balance fees:\n` +
                          `Create: ${body.network_fees.vesting_balance_create.fee}\n` +
                          `Withdraw: ${body.network_fees.vesting_balance_withdraw.fee}\n\n` +
                          `MISC fees:\n` +
                          `Worker create ${body.network_fees.worker_create.fee}\n` +
                          `Assert: ${body.network_fees.assert.fee}\n` +
                          `Override transfer: ${body.network_fees.override_transfer.fee}\n` +
                          `Transfer to blind: ${body.network_fees.transfer_to_blind.fee}\n` +
                          `Transfer from blind: ${body.network_fees.transfer_from_blind.fee}\n` +
                          `Asset claim fees: ${body.network_fees.asset_claim_fees.fee}\n\n` +
                          `Do you require any other Bitshares information?`;

    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');

    if (hasScreen === true) {
      return conv.ask(
        // 2 simple responses & a card
        new SimpleResponse({
          speech: textToSpeech1,
          text: displayText1
        }),
        new SimpleResponse({
          speech: textToSpeech2,
          text: displayText2
        }),
        new BasicCard({
        title: `Additional info available regarding BTS fees!`,
        text: 'Want more info on Bitshares network fees? Follow this link for more info! Remember that your elected committee members set these fees!',
        buttons: new Button({
          title: 'Block explorer link',
          url: 'http://open-explorer.io/#/fees',
        }),
        display: 'WHITE'
        }),
        new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
      );
    } else {
      return conv.ask(
        // 2 simple responses
        new SimpleResponse({
          speech: textToSpeech1,
          text: displayText1
        }),
        new SimpleResponse({
          speech: textToSpeech2,
          text: displayText2
        })
      );
    }

  })
  .catch(error => {
    // Catch unexpected changes to async handling
    return catch_error(conv, err, 'Fees');
  });
})

app.intent('Market', conv => {
  /*
    market function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('market', 1, parameter); // Need to set the data

  const textToSpeech1 = `<speak>` +
    `What Bitshares market information do you require?` +
    `You can request the following information regarding an individual Bitshares market trading pair:` +
    `24 hour trading volume.` +
    `Current market orderbook.` +
    `Price ticker.` +
    `Recent market trade history.` +
    `</speak>`;

  const textToSpeech2 = `<speak>` +
    `So, what market information do you want? Remember to provide the trading pair in your query!` +
    `</speak>`;

  const displayText1 = `You can request an individual trading pair's following market information:` +
    `24 hour trading volume.` +
    `Order orderbook.` +
    `Price ticker.` +
    `Market trade history.`;

  const displayText2 = `What do you want to do? Remember to provide the trading pair in your query!`;

  conv.ask(
    new SimpleResponse({
      // Sending the details to the user
      speech: textToSpeech1,
      text: displayText1
    }),
    new SimpleResponse({
    // Sending the details to the user
      speech: textToSpeech2,
      text: displayText2
    }),
    new BasicCard({
      title: `Bitshares Market information`,
      text: 'There is plenty of valuable information within the Bitshares docs regarding the Bitshares Decentralized Exchange!',
      buttons: new Button({
        title: 'Bitshares market documentation',
        url: `http://docs.bitshares.org/bitshares/user/dex.html`,
      }),
      display: 'WHITE'
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(new Suggestions('About', 'Accounts', 'Assets', 'Blockchain', 'Committee', 'Markets', 'Network', 'Workers', 'Fees', 'Help', 'Quit'));
  }

  chatbase_analytics(
    conv,
    'Market page', // input_message
    'Market', // input_intent
    'Win' // win_or_fail
  );
})

app.intent('Market.TopUIA', conv => {
  /*
    Most traded UIAs on the BTS DEX (of any type).
    https://github.com/oxarbitrage/bitshares-python-api-backend
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('top_markets', 1, parameter); // Need to set the data

  const qs_input = {
    // None needed
  };

  return hug_request('oxarbitrage', 'top_uias', 'GET', qs_input)
  .then(body => {
      const top_uias = body;
      var inner_voice = ``;
      var inner_text = ``;

      var iterator = 1;
      for (var uia in top_uias) {
        if (inner_text < 640) {
          inner_voice += `<say-as interpret-as="ordinal">${iterator}</say-as>: ${uia[0]} with ${uia[1]} trading volume.`;
          inner_text += `${uia[0]}: ${uia[1]}.\n`;
        } else {
          break;
        }
      }

      const textToSpeech = `<speak>` +
        `The top traded UIAs on Bitshares are as follows:` +
        inner_voice +
        `</speak>`;

      const displayText = `The top traded UIAs on Bitshares are as follows:\n` +
        inner_text;

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true) {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech,
            text: displayText
          }),
          new BasicCard({
            title: `Additional market information!`,
            text: 'Want more info regarding top traded UIAs? Follow this link for more info!',
            buttons: new Button({
              title: 'Block explorer link',
              url: 'http://open-explorer.io/#/markets',
            }),
            display: 'WHITE'
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          }),
          new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
        );
      } else {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech,
            text: displayText
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          })
        );
      }

    })
    .catch(error => {
      // Catch unexpected changes to async handling
      return catch_error(conv, err, 'top_uias');
    });
  })

app.intent('Market.TopMPA', conv => {
  /*
    Most traded smartcoins on the BTS DEX (of any type).
    https://github.com/oxarbitrage/bitshares-python-api-backend
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('top_markets', 1, parameter); // Need to set the data

  const qs_input = {
    // None needed
  };

  return hug_request('oxarbitrage', 'top_smartcoins', 'GET', qs_input)
  .then(body => {
    const top_smartcoins = body;
    var inner_voice = ``;
    var inner_text = ``;

    var iterator = 1;
    for (var smartcoin in top_smartcoins) {
      if (inner_text < 640) {
        inner_voice += `<say-as interpret-as="ordinal">${iterator}</say-as>: ${smartcoin[0]} with ${smartcoin[1]} trading volume.`;
        inner_text += `${smartcoin[0]}: ${smartcoin[1]}.\n`;
      } else {
        break;
      }
    }

    const textToSpeech = `<speak>` +
      `The top traded smartcoins on Bitshares are as follows:` +
      inner_voice +
      `</speak>`;

    const displayText = `The top traded smartcoins on Bitshares are as follows:\n` +
      inner_text;

    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    if (hasScreen === true) {
      return conv.ask(
        new SimpleResponse({
          // No speech here, because we don't want to read everything out!
          speech: textToSpeech,
          text: displayText
        }),
        new BasicCard({
          title: `Additional market information!`,
          text: 'Want more info regarding top traded UIAs? Follow this link for more info!',

          buttons: new Button({
            title: 'Block explorer link',
            url: 'http://open-explorer.io/#/markets',
          }),
          display: 'WHITE'
        }),
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: `<speak>Do you require any other Bitshares information?</speak>`,
          text: `Do you require any other Bitshares information?`
        }),
        new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
      );
    } else {
      return conv.ask(
        new SimpleResponse({
          // No speech here, because we don't want to read everything out!
          speech: textToSpeech,
          text: displayText
        }),
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: `<speak>Do you require any other Bitshares information?</speak>`,
          text: `Do you require any other Bitshares information?`
        })
      );
    }
  })
  .catch(error => {
    // Catch unexpected changes to async handling
    return catch_error(conv, err, 'top_smartcoins');
  });
})

app.intent('Market.TopAll', conv => {
  /*
    Most traded assets on the BTS DEX (of any type).
    https://github.com/oxarbitrage/bitshares-python-api-backend
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('top_markets', 1, parameter); // Need to set the data

  const qs_input = {
    // None needed
  };

  return hug_request('oxarbitrage', 'top_markets', 'GET', qs_input)
  .then(body => {
    const top_markets = body;
    var inner_voice = ``;
    var inner_text = ``;

    var iterator = 1;
    for (var market in top_markets) {
      if (inner_text < 640) {
        inner_voice += `<say-as interpret-as="ordinal">${iterator}</say-as>: The ${market[0]} trading pair with ${market[1]} trading volume.`;
        inner_text += `${market[0]} trading pair with ${market[1]} trading volume.\n`;
      } else {
        break;
      }
    }

    const textToSpeech = `<speak>` +
      `The top markets on Bitshares are as follows:` +
      inner_voice +
      `</speak>`;

    const displayText = `The top markets on Bitshares are as follows:\n` +
      inner_text;

    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    if (hasScreen === true) {
      return conv.ask(
        new SimpleResponse({
          // No speech here, because we don't want to read everything out!
          speech: textToSpeech,
          text: displayText
        }),
        new BasicCard({
          title: `Additional market information!`,
          text: 'Want more info regarding top traded UIAs? Follow this link for more info!',

          buttons: new Button({
            title: 'Block explorer link',
            url: 'http://open-explorer.io/#/markets',
          }),
          display: 'WHITE'
        }),
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: `<speak>Do you require any other Bitshares information?</speak>`,
          text: `Do you require any other Bitshares information?`
        }),
        new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
      );
    } else {
      return conv.ask(
        new SimpleResponse({
          // No speech here, because we don't want to read everything out!
          speech: textToSpeech,
          text: displayText
        }),
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: `<speak>Do you require any other Bitshares information?</speak>`,
          text: `Do you require any other Bitshares information?`
        })
      );
    }
  })
  .catch(error => {
    // Catch unexpected changes to async handling
    return catch_error(conv, err, 'top_markets');
  });
})

app.intent('Market.24HRVolume', conv => {
  /*
    market_24HRVolume function
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('market_24HRVolume', 1, parameter); // Need to set the data

  const input_market_pair = 'USD:BTS';
  const qs_input = {
    //  HUG REST GET request parameters
    market_pair: input_market_pair, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'market_24hr_vol', 'GET', qs_input)
  .then(body => {
    if (body.valid_market === true) {

      const market_volume_24hr = body.market_volume_24hr;
      var base_asset = input_trading_pair.split("")[0];
      var quote_asset = input_trading_pair.split("")[1];
      var base_asset_amount = market_volume_24hr[base_asset]['amount'];
      var quote_asset_amount = market_volume_24hr[quote_asset]['amount'];
      var rate = base_asset_amount / quote_asset_amount;

      const textToSpeech = `<speak>` +
        `${base_asset_amount} ${base_asset} were traded for ${quote_asset_amount} ${quote_asset} at an average rate of ${rate} ${trading_pair} within the last 24 hours.` +
        `</speak>`;

      const displayText = `${base_asset_amount} ${base_asset} were traded for ${quote_asset_amount} ${quote_asset} at an average rate of ${rate} ${trading_pair} within the last 24 hours.`;

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true) {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech,
            text: displayText
          }),
          new BasicCard({
            title: `Additional market information!`,
            text: 'Want more info regarding top traded UIAs? Follow this link for more info!',

            buttons: new Button({
              title: 'Block explorer link',
              url: 'http://open-explorer.io/#/markets',
            }),
            display: 'WHITE'
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          }),
          new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
        );
      } else {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech,
            text: displayText
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          })
        );
      }

    } else {
      return invalid_input(conv, `market_24hr_vol`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Market.24HRVolume');
  });
})

app.intent('Market.Orderbook', conv => {
  /*
    market_Orderbook function
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('market_Orderbook', 1, parameter); // Need to set the data

  const input_market_pair = "USD:BTS"

  const qs_input = {
    //  HUG REST GET request parameters
    market_pair: input_market_pair, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'market_orderbook', 'GET', qs_input)
  .then(body => {
    if (body.valid_market === true) {

      var base_asset = input_market_pair.split(":")[0];
      var quote_asset = input_market_pair.split(":")[1];

      var market_orderbook = body.market_orderbook;
      var market_sell_orders = market_orderbook['asks'];
      var market_buy_orders = market_orderbook['bids'];
      var more_than_640 = false;
      var orderbook_limit = 10;

      var sell_text = `Sell orders: \n`;
      var buy_text = `Buy orders: \n`;

      for (var i = 0; i < orderbook_limit; i++) {
        if (sell_text.length < 640 || buy_text.length < 640) {
          current_sell = market_sell_orders[i.toString()]
          current_sell_quote = current_sell['quote'];
          current_sell_base = current_sell['base'];
          sell_text += `Wants: ${current_sell_quote['amount']} ${current_sell_quote['symbol']} for ${current_base_quote['amount']} ${current_sell_quote['symbol']} (${current_sell['price']} ${current_sell_quote['symbol']}/${current_buy_quote['symbol']})`;
          sell_voice_inner += `${current_sell_quote['amount']} ${current_sell_quote['symbol']} for ${current_base_quote['amount']} ${current_sell_quote['symbol']} (rate of ${current_sell['price']} ${current_sell_quote['symbol']}/${current_buy_quote['symbol']})`;
          /*
            Really aught to squish this down, but that's a future problem.
          */
          current_buy = market_buy_orders[i.toString()]
          current_buy_quote = current_buy['quote'];
          current_buy_base = current_buy['base'];
          buy_text += `Wants: ${current_buy_quote['amount']} ${current_buy_quote['symbol']} for ${current_base_quote['amount']} ${current_buy_quote['symbol']} (${current_buy['price']} ${current_buy_quote['symbol']}/${current_sell_quote['symbol']})`;
          buy_voice_inner += `${current_buy_quote['amount']} ${current_buy_quote['symbol']} for ${current_base_quote['amount']} ${current_buy_quote['symbol']} (a rate of ${current_buy['price']} ${current_buy_quote['symbol']}/${current_sell_quote['symbol']})`;
        } else {
          // Can't go above 640 chars
          more_than_640 = true;
          break;
        }
      }

      const sell_voice = `<speak>` +
        `Sell orders:` +
        `${sell_voice_inner}` +
        `</speak>`;

      const buy_voice = `<speak>` +
        `Sell orders:` +
        `${buy_voice_inner}` +
        `</speak>`;

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true) {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech2,
            text: displayText2
          }),
          new BasicCard({
            title: `Additional market open order information available!`,
            text: 'Desire additional open order information? Follow this link for more info!!',
            buttons: new Button({
              title: 'Block explorer link',
              url: `http://open-explorer.io/#/markets/${quote_asset}/${base_asset}`,
            }),
            display: 'WHITE'
          }),
          new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
        );
      } else {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech2,
            text: displayText2
          })
        );
      }

    } else {
      return invalid_input(conv, `market_orderbook`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Market.Orderbook');
  });
})

app.intent('Market.Ticker', conv => {
  /*
    market_Ticker function
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('market_Ticker', 1, parameter); // Need to set the data

  const input_market_pair = "USD:BTS"

  const qs_input = {
    //  HUG REST GET request parameters
    market_pair: input_market_pair, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'market_ticker', 'GET', qs_input)
  .then(body => {
    if (body.valid_market === true && body.valid_key === true) {

      const market_ticker = body.market_ticker;
      const core_exchange_rate = market_ticker['core_exchange_rate'];
      const cer_base_amount = core_exchange_rate['base']['amount'];
      const cer_quote_amount = core_exchange_rate['quote']['amount'];
      const cer_price = core_exchange_rate['price'];

      const quoteSettlement_price = market_ticker['quoteSettlement_price'];
      const qsp_base_amount = quoteSettlement_price['base']['amount'];
      const qsp_quote_amount = quoteSettlement_price['quote']['amount'];
      const qsp_price = quoteSettlement_price['price'];

      const baseVolume_amount = market_ticker['baseVolume']['amount'];
      const quoteVolume_amount = market_ticker['quoteVolume']['amount'];

      const lowestAsk = market_ticker['lowestAsk'];
      const la_base_amount = lowestAsk['base']['amount'];
      const la_quote_amount = lowestAsk['quote']['amount'];
      const la_price = lowestAsk['price'];

      const highestBid = market_ticker['highestBid'];
      const hb_base_amount = highestBid['base']['amount'];
      const hb_quote_amount = highestBid['quote']['amount'];
      const hb_price = highestBid['price'];

      const percentChange = market_ticker['percentChange'];

      const latest = market_ticker['latest'];
      const l_base_amount = latest['base']['amount'];
      const l_quote_amount = latest['quote']['amount'];
      const l_price = latest['price'];

      const textToSpeech = `<speak>` +
        `Market ticker information for ${input_market_pair}` +
        `Core exchange rate price: ${cer_price}` +
        `Quote settlement price: ${qsp_price}` +
        `Base volume amount: ${baseVolume_amount}` +
        `Quote volume amount: ${quoteVolume_amount}` +
        `Lowest ask price: ${la_price}` +
        `Highest bid price: ${hb_price}` +
        `Recent percent change: ${percentChange}` +
        `Latest base amount: ${l_base_amount}` +
        `Latest quote amount: ${l_quote_amount}` +
        `Latest price: ${l_price}` +
        `</speak>`;

      const displayText = `Market ticker information for ${input_market_pair}` +
        `Core exchange rate:\n` +
        `Base amount: ${cer_base_amount}\n` +
        `Quote amount: ${cer_quote_amount}\n` +
        `Price: ${cer_price}\n\n` +
        `Quote settlement:\n` +
        `Base amount: ${qsp_base_amount}\n` +
        `Quote amount: ${qsp_quote_amount}\n` +
        `Price: ${qsp_price}\n\n` +
        `Volume:\n` +
        `Base amount: ${baseVolume_amount}\n` +
        `Quote amount: ${quoteVolume_amount}\n\n` +
        `Lowest Ask:\n` +
        `Base amount: ${la_base_amount}\n` +
        `Quote amount: ${la_quote_amount}\n` +
        `Lowest price: ${la_price}\n\n` +
        `Highest Bid:\n` +
        `Base amount: ${hb_base_amount}\n` +
        `Quote amount: ${hb_quote_amount}\n\n` +
        `Latest:\n` +
        `Base amount: ${l_base_amount}\n` +
        `Quote amount: ${l_quote_amount}\n` +
        `Price: ${l_price}\n` +
        `Percentage change: ${percentChange}`;

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true) {
        var base_asset = input_market_pair.split(":")[0];
        var quote_asset = input_market_pair.split(":")[1];

        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech,
            text: displayText
          }),
          new BasicCard({
            title: `Additional market open order information available!`,
            text: 'Desire additional open order information? Follow this link for more info!!',
            buttons: new Button({
              title: 'Block explorer link',
              url: `http://open-explorer.io/#/markets/${quote_asset}/${base_asset}`,
            }),
            display: 'WHITE'
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          }),
          new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
        );
      } else {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech,
            text: displayText
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          })
        );
      }

    } else {
      return invalid_input(conv, `market_ticker`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Market.Ticker');
  });
})

app.intent('Market.TradeHistory', conv => {
  /*
    market_TradeHistory function
  */

  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('market_TradeHistory', 1, parameter); // Need to set the data

  const input_market_pair = "USD:BTS"
  const qs_input = {
    //  HUG REST GET request parameters
    market_pair: input_market_pair, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'market_trade_history', 'GET', qs_input)
  .then(body => {
    if (body.valid_market === true && body.valid_key === true) {

      const market_trade_history = body.market_trade_history;
      const mth_limit = 10;
      var trade_text = ``;
      var avg_rate = 0;
      var total_bought = 0;
      var total_sold = 0;

      for (var i = 0; i < mth_limit; i++) {
        if (trade_text.length < 640) {
          const current_trade = market_trade_history[i.toString()]
          const bought = current_trade['bought'];
          const sold = current_trade['sold'];
          const rate = current_trade['rate'];

          total_bought += bought;
          total_sold += sold;
          avg_rate += rate;

          trade_text += `Bought ${bought} by selling ${sold} at a rate of ${rate}.\n`;
        } else {
          // Can't go above 640 chars
          more_than_640 = true;
          break;
        }
      }

      avg_rate = avg_rate / mth_limit;
      var base_asset = input_market_pair.split(":")[0];
      var quote_asset = input_market_pair.split(":")[1];

      const textToSpeech1 = `<speak>` +
        `The last 10 ${input_market_pair} market trades saw ${total_bought} ${base_asset} purchased and ${total_sold} ${quote_asset} sold with an avg rate of ${avg_rate}.` +
        `</speak>`;

      const displayText1 = `The last 10 ${input_market_pair} market trades saw ${total_bought} ${base_asset} purchased and ${total_sold} ${quote_asset} sold with an avg rate of ${avg_rate}.`;
      const textToSpeech2 = `<speak>Do you require any other Bitshares information?</speak>`;
      const displayText2 = `Last 10 market trades:\n` +
        `${trade_text}`;

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true) {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech2,
            text: displayText2
          }),
          new BasicCard({
            title: `Additional market open order information available!`,
            text: 'Desire additional open order information? Follow this link for more info!!',
            buttons: new Button({
              title: 'Block explorer link',
              url: `http://open-explorer.io/#/markets/${quote_asset}/${base_asset}`,
            }),
            display: 'WHITE'
          }),
          new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
        );
      } else {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: '',
            text: displayText2
          })
        );
      }

    } else {
      return invalid_input(conv, `market_trade_history`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Market.TradeHistory');
  });
})

app.intent('Witness', conv => {
  /*
    witness function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('witness', 1, parameter); // Need to set the data

  const textToSpeech = `<speak>` +
    `Do you want information regarding an individual Bitshares witness, or a summary of all active Bitshares witnesses?` +
    `</speak>`;

  const displayText = `Do you want information regarding an individual witness, or a summary of all active witnesses?`;

  conv.ask(
    new SimpleResponse({
      // Sending the details to the user
      speech: textToSpeech,
      text: displayText
    }),
    new BasicCard({
      title: `Bitshares Witness documentation`,
      text: 'You can find out more about Bitshares witnesses within the Bitshares documentation!',
      buttons: new Button({
        title: 'Bitshares witness documentation',
        url: `http://docs.bitshares.org/bitshares/user/witness.html`,
      }),
      display: 'WHITE'
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(new Suggestions('Active Bitshares witness summary', 'Help', 'Quit'));
  }

  chatbase_analytics(
    conv,
    'Witness page', // input_message
    'Witness', // input_intent
    'Win' // win_or_fail
  );
})

app.intent('Witness.Active', conv => {
  /*
    witness_Active function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('witness_Active', 1, parameter); // Need to set the data

  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('HUG', 'list_of_witnesses', 'GET', qs_input)
  .then(body => {
    if (body.valid_key === true) {

      const witnesses = body.witnesses;
      const num_active_witnesses = body.witness_count;
      var inner_text1 = ``;
      var inner_voice1 = ``;

      for (var witness in witnesses) {
        if (witness['witness_status'] === true) {
          // Active witness!
          const account_data = witness['witness_account_Data'];
          const role_data = witness['witness_role_data'];

          const witness_name = account_data['name'];
          const witness_id = role_data['id'];
          const witness_account = role_data['witness_account'];
          const vote_id = role_data['vote_id'];
          //const url = role_data['url']; //TMI when viewing many witnesses!
          const total_votes = role_data['total_votes'];
          const total_blocks_missed = role_data['total_missed'];
          const last_confirmed_block_num = role_data['last_confirmed_block_num'];

          if (inner_text1.length() < 640) {
            inner_text1 += `${witness_name} (ID: ${witness_id}): ${total_votes} votes.`;
            inner_voice1 += `${witness_name} with ${total_votes} votes.`;
          } else {

            if (inner_text2.length() < 640) {
              inner_text2 += `${witness_name} (ID: ${witness_id}): ${total_votes} votes.`;
              inner_voice2 += `${witness_name} with ${total_votes} votes.`;
            } else {
              // Don't need it..
              continue;
            }
          }
        } else {
          continue;
        }
      }

      const textToSpeech1 = `<speak>` +
        `The following is a list of the ${num_active_witnesses} active witnesses:` +
        inner_voice1 +
        `</speak>`;

      const displayText1 = `The following is a list of the ${num_active_witnesses} active witnesses:` +
        inner_text1;

      var textToSpeech2 = ``;
      var displayText2 = ``;

      if (inner_text2.length() > 1) {
        textToSpeech2 = `<speak>` +
          inner_voice2 +
          `</speak>`;

        displayText2 = inner_text2;
      }

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true) {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech2,
            text: displayText2
          }),
          new BasicCard({
            title: `Additional witness information available!`,
            text: 'Desire additional witness information? Follow this link for more info!',
            buttons: new Button({
              title: 'Block explorer link',
              url: `http://open-explorer.io/#/witness`,
            }),
            display: 'WHITE'
          }),
          new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
        );
      } else {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech2,
            text: displayText2
          })
        );
      }
    } else {
      return invalid_input(conv, `list_of_witnesses`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Witness.Active');
  });
})

app.intent('Witness.One', conv => {
  /*
    witness_One function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('witness_One', 1, parameter); // Need to set the data

  const input_witness_name = 'delegate-1.lafona';
  const qs_input = {
    //  HUG REST GET request parameters
    witness_name: input_witness_name, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'find_witness', 'GET', qs_input)
  .then(body => {
    if (body.valid_witness === true && body.valid_key === true) {

      const witness_role_data = body.witness_role_data;
      const witness_account_data = body.witness_account_data;

      const witness_name = witness_account_data['name'];
      const witness_id = witness_role_data['id'];
      const witness_account = witness_role_data['witness_account'];
      const vote_id = witness_role_data['vote_id'];
      const url = witness_role_data['url']; //TMI when viewing many witnesses!
      const total_votes = witness_role_data['total_votes'];
      const total_blocks_missed = witness_role_data['total_missed'];
      const last_confirmed_block_num = witness_role_data['last_confirmed_block_num'];
      const witness_status = body.active_witness;
      var witness_status_msg = ``;

      if (witness_status === true) {
        witness_status_msg = `Active`;
      } else {
        witness_status_msg = `Inactive`;
      }

      const textToSpeech1 = `<speak>` +
        `We found the following ${witness_status_msg} witness named ${witness_name}:` +
        `Witness ID: ${witness_id}.` +
        `Vote ID: ${vote_id}.` +
        `Total votes: ${total_votes}.` +
        `Total blocks missed ${total_blocks_missed}.` +
        `Last confirmed block: ${last_confirmed_block_num}.` +
        `</speak>`;

      var displayText1 = `We found the following ${witness_status_msg} witness named ${witness_name}:\n` +
        `Witness ID: ${witness_id}.\n` +
        `Vote ID: ${vote_id}.\n` +
        `Total votes: ${total_votes}.\n` +
        `Total blocks missed ${total_blocks_missed}.\n` +
        `Last confirmed block: ${last_confirmed_block_num}.`;

      if (url.length() > 1) {
        displayText1 += `URL: ${url}`;
      }

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true) {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech1,
            text: displayText1
          }),
          new BasicCard({
            title: `Additional account information available!`,
            text: `Desire additional account information about ${witness_name}? Follow this link for more info!`,
            buttons: new Button({
              title: 'Block explorer link',
              url: `http://open-explorer.io/#/accounts/${witness_name}`
            }),
            display: 'WHITE'
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          }),
          new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
        );
      } else {
        return conv.ask(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          })
        );
      }
    } else {
      return invalid_input(conv, `find_witness`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Witness.One');
  });
})

app.intent('Worker', conv => {
  /*
    worker function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('worker', 1, parameter); // Need to set the data

  const textToSpeech = `<speak>` +
    `Do you want information regarding an individual Bitshares worker proposal, or a summary of all active Bitshares worker proposals?` +
    `</speak>`;

  const displayText = `Do you want information regarding an individual Bitshares worker proposal, or a summary of all active Bitshares worker proposals?`;

  conv.ask(
    new SimpleResponse({
      // Sending the details to the user
      speech: textToSpeech,
      text: displayText
    }),
    new BasicCard({
      title: `Bitshares Worker Proposal documentation`,
      text: 'You can find out more about Bitshares worker proposals within the Bitshares documentation!',
      buttons: new Button({
        title: 'Bitshares worker proposal documentation',
        url: `http://docs.bitshares.org/bitshares/user/worker.html`,
      }),
      display: 'WHITE'
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(new Suggestions('Active worker proposals', 'Help', 'Quit'));
  }

  chatbase_analytics(
    conv,
    'Worker Proposal page', // input_message
    'Worker', // input_intent
    'Win' // win_or_fail
  );
})

app.intent('Worker.Many', conv => {
  /*
    worker_Many function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('worker_Many', 1, parameter); // Need to set the data

  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('HUG', 'get_worker_proposals', 'GET', qs_input)
  .then(body => {
    if (body.valid_key === true) {

      var workers = body.workers;
      const current_time = moment();

      var text1 = ``;
      var voice1 = ``;
      var text2 = ``;
      var voice2 = ``;

      for (var worker in workers) {
        // current_time >= moment(worker['worker_begin_date'])   // Removed this, since a worker proposal could be in the future
        const worker_begin_date = worker['worker_begin_date'];
        const worker_end_date = worker['worker_end_date'];

        if (current_time <= moment(worker_end_date)) {

          const worker_id = worker['id'];
          const total_votes = worker['total_votes_for'];
          const proposal_title = worker['name'];
          const worker_account_details = worker['worker_account_details'];
          const worker_name = worker_account_details['name'];

          if (text1.length <= 640) {
            text1 += `${worker_name}'s '"${proposal_title}" with ${total_votes} votes.'`;
            voice1 += `${worker_name}'s ${proposal_title} has ${total_votes}`;
          } else if (text2.length <= 640) {
            text2 += `${worker_name}'s '"${proposal_title}" with ${total_votes} votes.'`;
            voice2 += `${worker_name}'s ${proposal_title} has ${total_votes}`;
          } else {
            // There's more worker proposal data than there is usable screen space.
            break;
          }
        } else {
          // worker proposal is not active
          continue;
        }
      }

      const textToSpeech1 = `<speak>` +
        voice1 +
        `</speak>`;
      const displayText1 = text1;

      if (text2.length() > 1) {
        const textToSpeech2 = `<speak>` +
          voice2 +
          `</speak>`;
        const displayText2 = text2;
      }

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true) {
        return conv.ask(
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech2,
            text: displayText2
          }),
          new BasicCard({
          title: `Additional worker proposal information is available!`,
          text: 'Desire additional worker proposal information? Follow this link for more info!',
          buttons: new Button({
            title: 'Block explorer link',
            url: `http://open-explorer.io/#/workers`,
          }),
          display: 'WHITE'
        }),
        new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
      );
      } else {
        return conv.ask(
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech2,
            text: displayText2
          })
        );
      }

    } else {
      return invalid_input(conv, `get_worker_proposals`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Worker.Many');
  });
})

app.intent('Worker.One', conv => {
  /*
    worker_One function
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('worker_One', 1, parameter); // Need to set the data

  const input_worker_id = '1.14.50';
  const qs_input = {
    //  HUG REST GET request parameters
    worker_id: input_worker_id, // input
    api_key: '123abc'
  };
  return hug_request('HUG', 'get_worker', 'GET', qs_input)
  .then(body => {
    if (body.valid_worker === true && body.valid_key === true) {

      const worker = body.worker;

      const worker_begin_date = worker['worker_begin_date'].split("T")[0];
      const worker_end_date = worker['worker_end_date'].split("T")[0];
      const worker_id = worker['id'];
      const total_votes = worker['total_votes_for'];
      const proposal_title = worker['name'];
      const worker_account_details = worker['worker_account_details'];
      const worker_name = worker_account_details['name'];
      const url = worker['url'];

      const textToSpeech1 = `<speak>` +
        `Here's information regarding worker proposal ${worker_id}:` +
        `Title: ${proposal_title}.` +
        `Start date: ${worker_begin_date}.` +
        `End date: ${worker_end_date}.` +
        `Worker account name: ${worker_name}.` +
        `Total votes: ${total_votes}.` +
        `</speak>`;

      const displayText1 = `Here's information regarding worker proposal ${worker_id}:` +
        `Title: ${proposal_title}.` +
        `Start date: ${worker_begin_date}.` +
        `End date: ${worker_end_date}.` +
        `Worker account name: ${worker_name}.` +
        `Total votes: ${total_votes}.` +
        `URL: ${url}`;

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
      if (hasScreen === true) {
        return conv.ask(
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech1,
            text: displayText1
          }),
          new BasicCard({
            title: `Additional worker proposal information is available!`,
            text: 'Desire additional worker proposal information? Follow this link for more info!',
            buttons: new Button({
              title: 'Block explorer link',
              url: `http://open-explorer.io/#/objects/${worker_id}`,
            }),
            display: 'WHITE'
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          }),
          new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
        );
      } else {
        return conv.ask(
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech1,
            text: displayText1
          }),
          new SimpleResponse({
            // Sending the details to the user & closing app.
            speech: `<speak>Do you require any other Bitshares information?</speak>`,
            text: `Do you require any other Bitshares information?`
          })
        );
      }

    } else {
      return invalid_input(conv, `get_worker`);
    }
  })
  .catch(error_message => {
    return catch_error(conv, error_message, 'Worker.One');
  });
})

app.intent('menuFallback', conv => {
  /*
  Fallback function for the main menu!
  Change the MENU_FALLBACK contents if you want different responses.
  */
  console.log("HOME SCREEN FALLBACK TRIGGERED!");

  const MENU_FALLBACK = [
    "Sorry, what do you want to do?",
    "I didn't catch that. Do you want to A, B, C or D?",
    "I'm having trouble understanding. Do you want A, B, C or D?"
  ];
  conv.fallbackCount = parseInt(conv.fallbackCount, 10); // Retrieve the value of the intent's fallback counter
  conv.fallbackCount++; // Iterate the fallback counter

  if (conv.fallbackCount > 3) {
    // Google best practice is to quit after 3 attempts
    console.log("User misunderstood 3 times, quitting!");
    conv.close("Unfortunately, Beyond Bitshares was unable to understand user input. Sorry for the inconvenience, let's try again later though? Goodbye.");
  } else {
    // Within fallback attempt limit (<3)
    console.log("HANDLED FALLBACK!");
    let current_fallback_phrase = MENU_FALLBACK[conv.fallbackCount];

    conv.ask(new SimpleResponse({
      // Sending the details to the user
      speech: current_fallback_phrase,
      text: current_fallback_phrase
    }));

    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    if (hasScreen === true) {
      conv.ask(new Suggestions('About', 'Accounts', 'Assets', 'Blockchain', 'Committee', 'Markets', 'Network', 'Workers', 'Fees', 'Help', 'Quit'));
    }
  }
})

app.intent('getHelpAnywhere', conv => {
  /*
  Provides the user the ability to get help anywhere they are in the bot.
  Pretty much a duplicate of the welcome/home function, minus the greeting!
  */
  conv.fallbackCount = 0; // Required for tracking fallback attempts!

  const help_anywhere_parameter = {}; // The dict which will hold our parameter data
  help_anywhere_parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('help_anywhere', 1, help_anywhere_parameter); // We need to insert data into the 'home' context for the home fallback to trigger!

  const textToSpeech = `<speak>` +
    `I heard you're having some problems with Beyond Bitshares? <break time="0.35s" /> ` +
    `We provide Bitshares block explorer functionality, enabling you to request info regarding Bitshares accounts, assets, committee members, witnesses, worker proposals and market information through the Google Assistant!` +
    `Try to speak naturally when interacting with the bot, and be precise when providing user input (such as asset or account names).` +
    `If you're having difficulties with speech recognition, enable Google personalization permissions or type your requests if possible.` +
    `</speak>`;

  const textToDisplay = `I heard you're having some problems with Beyond Bitshares?` +
      `We provide Bitshares block explorer functionality, enabling you to request info regarding Bitshares accounts, assets, committee members, witnesses, worker proposals and market behaviour through the Google Assistant!` +
      `Try to speak naturally when interacting with the bot, and be precise when providing user input (such as asset or account names).` +
      `If you're having difficulties with speech recognition, enable Google personalization permissions or type your requests if possible.`;

  const textToSpeech2 = `<speak>` +
    `So, what information do you require from the Beyond Bitshares block explorer?` +
    `</speak>`;

  const textToDisplay2 = `So, what information do you require from the Beyond Bitshares block explorer?`;

  conv.ask(
    new SimpleResponse({
      // Sending the details to the user
      speech: textToSpeech,
      text: textToDisplay
    }),
    new SimpleResponse({
      // Sending the details to the user
      speech: textToSpeech2,
      text: textToDisplay2
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
  if (hasScreen === true) {
    conv.ask(
      new BasicCard({
      title: `Need help using Bitshares?`,
      text: `If you've run into issues when using the Bitshares DEX you can reach out to Bitshares community members via Bitsharestalk or Telegram.`,
      buttons: new Button({
        title: 'Bitsharestalk troubleshooting sub-forum',
        url: `https://bitsharestalk.org/index.php?board=45.0`,
      }),
      display: 'WHITE'
    }),
    new Suggestions('About', 'Asset', 'Block', 'Committee', 'Fees', 'Market', 'Workers', 'Help', 'Quit')
  );
  }
})

app.intent('getHelpFallback', conv => {
  /*
  Fallback function for the GOAT intent!
  */
  console.log("HELP FALLBACK TRIGGERED!");

  const HELP_FALLBACK_DATA = [
    "Sorry, what do you want to do next?",
    "I didn't catch that. Do you want A, B or C?",
    "I'm having difficulties understanding what you want to do with Beyond Bitshares. Do you want A, B or C?"
  ];

  conv.fallbackCount = parseInt(conv.fallbackCount, 10); // Retrieve the value of the intent's fallback counter
  conv.fallbackCount++; // Iterate the fallback counter

  if (conv.fallbackCount > 3) {
    // Google best practice is to quit after 3 attempts
    console.log("User misunderstood 3 times, quitting!");
    conv.close("Unfortunately, Beyond Bitshares was unable to understand user input. Sorry for the inconvenience, let's try again later though? Goodbye.");
  } else {
    // Within fallback attempt limit (<3)
    console.log("HANDLED FALLBACK!");
    let current_fallback_phrase = MENU_FALLBACK[conv.fallbackCount];

    conv.ask(
      new SimpleResponse({
        // Sending the details to the user
        speech: current_fallback_phrase,
        text: current_fallback_phrase
      })
    );

    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    if (hasScreen === true) {
      // TODO: Change the buttons to reflect the previous intent
      conv.ask(new Suggestions('About', 'Accounts', 'Assets', 'Blockchain', 'Committee', 'Markets', 'Network', 'Workers', 'Fees', 'Help', 'Quit'));
    }
  }
})

app.intent('goodbye', conv => {
  /*
  Elaborate goodbye intent
  */
  const textToSpeech = `<speak>` +
    `Sorry to see you go, come back soon? <break time="0.35s" /> ` +
    `Goodbye.` +
    `</speak>`;
  const speechToText = `Sorry to see you go, come back soon? \n\n` +
    `Goodbye.`;

  chatbase_analytics(
    conv,
    'Goodbye', // input_message
    'Goodbye', // input_intent
    'Win' // win_or_fail
  );

  conv.close(
    new SimpleResponse({
      // Sending the details to the user
      speech: textToSpeech,
      text: displayText
    })
  );
})

app.catch((conv, error_message) => {
  /*
    Generic error catch
  */
  console.error(error_message);
  return catch_error(conv, error_message, 'Worker.One');
})

exports.BeyondBitshares = functions.https.onRequest(app)
