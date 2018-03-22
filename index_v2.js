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

const app = dialogflow({
  debug: true
}) // Creating the primary dialogflow app element
const hug_host = 'https://btsapi.grcnode.co.uk'; // Change this to your own HUG REST API server (if you want)

function catch_error(conv, error_message) {
  /*
  Generic function for reporting errors & providing error handling for the user.
  */
  if(error_message instanceof Error) {
      console.error(error_message);
  } else {
      console.error(new Error(error_message));
  }
  return conv.close(new SimpleResponse({
    // If we somehow fail, do so gracefully!
    speech: "An unexpected error was encountered! Let's end our Vote Goat session for now.",
    text: "An unexpected error was encountered! Let's end our Vote Goat session for now."
  }));
}

function hug_request(target_function, method, qs_contents) {
  // Setting URL and headers for request
  var request_options = {
    url: `${hug_host}/${target_function}`,
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
          reject(error_message);
        } else {
          if (resp.statusCode === 200) {
            // Returning the body in a promise
            resolve(body);
          } else {
            // Don't want anything other than 200
            const error_message = resp;
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

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new Suggestions('About', 'Accounts', 'Assets', 'Blockchain', 'Committee', 'Markets', 'Network', 'Workers', 'Fees', 'Help', 'Quit'));
  }
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

  const textToSpeech2 = `Referral Rewards Program - Network growth through adoption rewards.` +
    `User-Issued Assets - Regulation-compatible cryptoasset issuance.` +
    `Stakeholder-Approved Project Funding - A self-sustaining funding model.` +
    `Transferable Named Accounts - Easy and secure transactions.` +
    `Delegated Proof-of-Stake Consensus - A robust and flexible consensus protocol.` +
    `Want to know more about any of Bitshares features?`;

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

  conv.ask(
    new SimpleResponse({
      speech: textToSpeech1,
      text: displayText1
    }),
    new SimpleResponse({
      speech: textToSpeech2,
      text: displayText2
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new Suggestions('Delegated Proof-of-Stake Consensus', 'Price-Stable Cryptocurrencies', 'Decentralized Asset Exchange', 'Industrial Performance and Scalability', 'Dynamic Account Permissions', 'Recurring & Scheduled Payments', 'Referral Rewards Program', 'User-Issued Assets', 'Stakeholder-Approved Project Funding', 'Transferable Named Accounts', 'Help', 'Quit'));
  }
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
    `Available Bitshares account information:` +
    `Account's basic overview.` +
    `Account's balances.` +
    `Account's open orders.` +
    `Account's trade history.` +
    `Account's call positions.` +
    `Life Time Membership check.` +
    `</speak>`;

  const textToSpeech2 = `<speak>` +
    `What do you want to find out about an account?` +
    `</speak>`;

  const displayText1 = `Available Bitshares account information:` +
    `Account's basic overview.` +
    `Account's balances.` +
    `Account's open orders.` +
    `Account's trade history.` +
    `Account's call positions.` +
    `Life Time Membership check.`;

  const displayText2 = `What do you want to find out about an account?`;

  conv.ask(
    new SimpleResponse({
      speech: textToSpeech1,
      text: displayText1
    }),
    new SimpleResponse({
      speech: textToSpeech2,
      text: displayText2
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new Suggestions(`Account's Basic Overview`, 'Account Balances', `Account's Open Orders`, `Account's Trade History`, `Account's Call Positions`, 'Help', 'Quit'));
  }
})

app.intent('Account.Balances', conv => {
  const qs_input = {
    //  HUG REST GET request parameters
    account: input_account, // input
    api_key: '123abc'
  };
  return hug_request('account_balances', 'GET', qs_input)
  .then(body => {
    if (body.success === true && body.valid_key === true) {
      var text = ``;
      var voice = ``;
      var many_balances = false;
      const account_balances = body.balances; // This var holds the account's balance array, retrieved from the HUG server.

      if (Array.isArray(genres)) {
        const quantity_balances = account_balances.length;
        if (quantity_balances > 0) { // More than one genre? Engage!
          for (balance in account_balances) {
            if (text.length < 640) {
              asset_name = Object.keys(balance)[0];

              if (index !== (account_balances.length - 1)) {
                text += `${asset_name}: ${balance} \n`;
              } else {
                // Final line
                text += `${asset_name}: ${balance}`;
              }
              voice += `${balance} ${asset_name}'s`;

            } else {
              // Can't go above 640 chars
              // Could extend this to a second text/voice & simple response.
              many_balances = true;
              break;
            }
          }
        } else {
          conv.close(`${input_account} does not have any assets in their account, goodbye.`);
          // TODO: Fallback to repeat account input instead of conv.close()
        }
      }

      const textToSpeech = `<speak>` +
        voice +
        `</speak>`;

      const displayText = text;

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true && many_balances === true) {
        return conv.close(
          new SimpleResponse({
            speech: textToSpeech,
            text: displayText
          }),
          new BasicCard({
            title: `Insufficient space to display ${input_account}'s balances!'`,
            text: 'This account has too many balances to show. Please navigate to the linked block explorer.',
            buttons: new Button({
              title: 'Block explorer link',
              url: `http://open-explorer.io/#/accounts/${input_account}`,
            }),
            display: 'WHITE'
          })
        );
      } else {
        return conv.close(
          new SimpleResponse({
            speech: textToSpeech,
            text: displayText
          })
        );
      }
    } else {
      catch_error(conv, `HUG Function failure!`);
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Account.CallPositions', conv => {
  /*
    account_CallPositions function
  */
  //conv.fallbackCount = 0; // Required for tracking fallback attempts!

  //const parameter = {}; // The dict which will hold our parameter data
  //parameter['placeholder'] = 'placeholder'; // We need this placeholder
  //conv.contexts.set('account_CallPositions', 1, parameter); // Need to set the data

  // input_account = <Retrieve Account from DialogFlow>
  const qs_input = {
    //  HUG REST GET request parameters
    account: input_account, // input
    api_key: '123abc'
  };
  return hug_request('get_callpositions', 'GET', qs_input)
  .then(body => {
    if (body.success === true && body.valid_key === true) {
        var text = ``;
        var voice = ``;

        if (body.account_has_call_positions === true) {

          const call_positions = body.call_positions; // This var holds the account's call positions

          if (Array.isArray(call_positions)) {
            const quantity_call_positions = call_positions.length;
            if (quantity_call_positions > 0) {
              for (call in call_positions) {
                if (text.length < 640) {
                  asset_name = Object.keys(call)[0];
                  collateral = call.collateral; //collateral.<symbol|amount>
                  debt = call.debt; //debt.<symbol|amount>
                  call_price = call.call_price; //call_price.<base|quote>.<symbol|amount>
                  ratio = call.ratio;

                  if (index !== (account_balances.length - 1)) {
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
              return conv.close(`${input_account} does not have any call positions.`);
              // TODO: Fallback to repeat account input instead of conv.close()
            }
          }
        }

        const textToSpeech = `<speak>` +
          `${input_account}'s call positions are:`
        voice +
          `</speak>`;

        const displayText = `${input_account}'s call positions are:` + voice;

        return conv.close(new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: textToSpeech,
          text: displayText
        }));
      } else {
        catch_error(conv, `HUG Function failure!`);
      }
    })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Account.Info', conv => {
  /*
    account_Info function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!

  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('account_Info', 1, parameter); // Need to set the data
  */

  const qs_input = {
    //  HUG REST GET request parameters
    account: input_account, // input
    api_key: '123abc'
  };
  return hug_request('account_info', 'GET', qs_input)
  .then(body => {
    if (body.success === true && body.valid_key === true) {

      const info = body.account_info; // This var holds the account's call positions
      const id = info.id;
      const registrar = info.registrar;
      const name = info.name;
      const witness_votes = info.options.num_witness;
      const committee_votes = info.options.num_committee;

      const textToSpeech = `<speak>` +
        `Found information regarding ${input_account}:` +
        `${name}'s ID is ${id}, they were registered by ${registrar} and have voted for ${witness_votes} witnesses and ${committee_votes} committee members.` +
        `</speak>`;

      const displayText = `Found information regarding ${input_account}:` +
        `${name}'s ID is ${id}, they were registered by ${registrar} and have voted for ${witness_votes} witnesses and ${committee_votes} committee members.`;

      return conv.close(
        new SimpleResponse({
          // Sending the details to the user & closing app.
          speech: textToSpeech,
          text: displayText
        })
      );

    } else {
      catch_error(conv, `HUG Function failure!`);
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
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
    `You can request the following Asset information:` +
    `Information about a single asset.` +
    `Top Smartcoins.` +
    `Top User Issued Assets.` +
    `What do you want to know about Bitshares assets?` +
    `</speak>`;

  const displayText = `You can request the following Asset information:` +
    `Information about a single asset.` +
    `Top Smartcoins.` +
    `Top User Issued Assets.` +
    `What do you want to know about Bitshares assets?`;

  conv.ask(new SimpleResponse({
    // Sending the details to the user
    speech: textToSpeech,
    text: displayText
  }));

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new Suggestions('Top Smartcoins', 'Top UIAs', 'Back', 'Help', 'Quit'));
  }
})

app.intent('Asset.One', conv => {
  /*
    get_Asset function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!

  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('get_Asset', 1, parameter); // Need to set the data
  */
  const qs_input = {
    //  HUG REST GET request parameters
    asset_name: input_asset_name, // input
    api_key: '123abc'
  };
  return hug_request('get_asset', 'GET', qs_input)
  .then(body => {
    if (body.success === true && body.valid_key === true) {

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

      return conv.close(new SimpleResponse({
        // Sending the details to the user & closing app.
        speech: textToSpeech,
        text: displayText
      }))
    } else {
      catch_error(conv, `HUG Function failure!`);
      // TODO: Change to asset name fallback in future
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
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
    `What kind of block information do you seek?` +
    `Latest block details.` +
    `Specific block details.` +
    `An overview of the blockchain.` +
    `</speak>`;

  const displayText = `What kind of block information do you seek?` +
    `The latest block details?` +
    `A specific block's details?` +
    `Perhaps an overview of the blockchain?`;

  conv.ask(new SimpleResponse({
    // Sending the details to the user
    speech: textToSpeech,
    text: displayText
  }));

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new Suggestions('Latest block details', 'Blockchain overview', 'Help', 'Back', 'Quit'));
  }
})

app.intent('Block.Latest', conv => {
  /*
    block_Latest function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('block_Latest', 1, parameter); // Need to set the data
  */
  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('get_latest_block', 'GET', qs_input)
  .then(body => {
    if (body.valid_block_number === true && body.valid_key === true) {

      const previous = body.previous;
      const witness = body.witness;
      const transaction_merkle_root = body.transaction_merkle_root;
      const tx_count = body.transactions.length();
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

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        return conv.close(
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
          })
        );
      } else {
        return conv.close(
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech,
            text: displayText
          })
        );
      }
    } else {
      catch_error(conv, `HUG Function failure!`);
      // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Block.One', conv => {
  /*
    get_block_details function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('get_block_details', 1, parameter); // Need to set the data
  */

  const qs_input = {
    //  HUG REST GET request parameters
    block_number: input_block_number, // input
    api_key: '123abc'
  };
  return hug_request('get_block_details', 'GET', qs_input)
  .then(body => {
      if (body.valid_block_number === true && body.valid_key === true) {

        const previous = body.previous;
        const witness = body.witness;
        const transaction_merkle_root = body.transaction_merkle_root;
        const tx_count = body.transactions.length();
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

        return conv.close(
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
          })
        );
      } else {
        catch_error(conv, `HUG Function failure!`);
        // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
      }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Block.Overview', conv => {
  /*
    blockchain_Overview function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('blockchain_Overview', 1, parameter); // Need to set the data
  */

  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('chain_info', 'GET', qs_input)
  .then(body => {
      if (body.success === true && body.valid_key === true) {

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

        return conv.close(
          new SimpleResponse({
            // Sending the details to the user
            speech: textToSpeech,
            text: displayText
          })
        )

      } else {
        catch_error(conv, `HUG Function failure!`);
        // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
      }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
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
    `Do you want to look up the active committee members, or a single committee member?` +
    `If the later, please accurately specify their account name` +
    `</speak>`;

  const displayText = `Do you want to look up the active committee members, or a single committee member?` +
    `If the later, please accurately specify their account name`;

  conv.ask(
    new SimpleResponse({
      // Sending the details to the user
      speech: textToSpeech,
      text: displayText
    })
  );

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new Suggestions('Active committee members', 'Help', 'Back', 'Quit'));
  }

})

app.intent('Committee.Active', conv => {
  /*
    committee_Active function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('committee_Active', 1, parameter); // Need to set the data
  */

  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('get_committee_members', 'GET', qs_input)
  .then(body => {
      if (body.success === true && body.valid_key === true) {

        var text = ``;
        var voice = ``;
        var more_than_640 = false;
        const committee_members = body.committee_members;

        if (Array.isArray(committee_members)) {

          for (member in committee_members) {
            if (text.length < 640) {
              if (member.status === true) {
                text += `ID: ${member.id}, User ID: ${member.committee_member_account}, Vote ID: ${member.vote_id}, Total votes: ${member.total_votes}.\n`;
                voice += `Committee ID: ${member.id} is active with ${member.total_votes} votes.`;
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

        conv.close(new SimpleResponse({
          // Sending the details to the user
          speech: textToSpeech,
          text: displayText
        }));

        const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
        if (hasScreen === true) {
          if (more_than_640 === true) {
            conv.close(new BasicCard({
              title: `Insufficient space to display committee members!`,
              text: 'There are more Committee member to display! Please navigate to the linked block explorer.',

              buttons: new Button({
                title: 'Committee info',
                url: 'http://open-explorer.io/#/committee_members',
              }),
              display: 'WHITE'
            }));
          }
        }
      } else {
        catch_error(conv, `HUG Function failure!`);
        // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
      }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Committee.One', conv => {
  /*
    get_committee_member function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('get_committee_member', 1, parameter); // Need to set the data
  */

  const request_options = {
    url: `${hug_host}/get_committee_member`,
    method: 'GET', // GET request, not POST.
    json: true,
    headers: {
      'User-Agent': 'Beyond Bitshares Bot',
      'Content-Type': 'application/json'
    },
    qs: { // qs instead of form - because this is a GET request
      committee_id: input_committee_id, // input
      api_key: '123abc'
    }
  };

  const qs_input = {
    //  HUG REST GET request parameters
    committee_id: input_committee_id, // input
    api_key: '123abc'
  };
  return hug_request('get_committee_member', 'GET', qs_input)
  .then(body => {
      if (body.success === true && body.valid_key === true) {

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

        conv.close(new SimpleResponse({
          // Sending the details to the user
          speech: textToSpeech,
          text: displayText
        }));

      } else {
        catch_error(conv, `HUG Function failure!`);
        // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
      }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Fees', conv => {
  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('list_fees', 'GET', qs_input)
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
                          `Asset claim fees: ${body.network_fees.asset_claim_fees.fee}\n`;

    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')

    if (hasScreen === true) {
      try {
        return conv.close(
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
          })
        );
      } catch (err) {
        // Catch unexpected changes to async handling
        catch_error(conv, err);
      }
    } else {
      try {
        return conv.close(
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
      } catch (err) {
        // Catch unexpected changes to async handling
        catch_error(conv, err);
      }
    }
  })
  .catch(error => {
    // Catch unexpected changes to async handling
    catch_error(conv, err);
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
    `You can request an individual trading pair's following market information:` +
    `24 hour trading volume.` +
    `Order orderbook.` +
    `Price ticker.` +
    `Market trade history.` +
    `</speak>`;

  const textToSpeech2 = `<speak>` +
    `What do you want to do? Remember to provide the trading pair in your query!` +
    `</speak>`;

  const displayText1 = `You can request an individual trading pair's following market information:` +
    `24 hour trading volume.` +
    `Order orderbook.` +
    `Price ticker.` +
    `Market trade history.`;

  const displayText2 = `What do you want to do? Remember to provide the trading pair in your query!`;

  conv.ask(new SimpleResponse({
    // Sending the details to the user
    speech: textToSpeech1,
    text: displayText1
  }));

  conv.ask(new SimpleResponse({
    // Sending the details to the user
    speech: textToSpeech2,
    text: displayText2
  }));

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new Suggestions('Back', 'Help', 'Quit'));
  }
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

  const request_options = {
    url: `http://23.94.69.140:5000/top_uias`,
    method: 'GET', // GET request, not POST.
    json: true,
    headers: {
      'User-Agent': 'Beyond Bitshares Bot',
      'Content-Type': 'application/json'
    }
  };

  requestLib(request_options, (err, httpResponse, body) => {
    if (!err && httpResponse.statusCode === 200) { // Check that the GET request didn't encounter any issues!

      const top_uias = body;
      var inner_voice = ``;
      var inner_text = ``;

      var iterator = 1;
      for (uia in top_uias) {
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

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: textToSpeech,
        text: displayText
      }));

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional market information!`,
          text: 'Want more info regarding top traded UIAs? Follow this link for more info!',

          buttons: new Button({
            title: 'Block explorer link',
            url: 'http://open-explorer.io/#/markets',
          }),
          display: 'WHITE'
        }))
      }

    } else {
      conv.close(new SimpleResponse({
        // Sending the details to the user
        speech: "An unexpected error was encountered! Let's end our Vote Goat session for now.",
        text: "An unexpected error was encountered! Let's end our Vote Goat session for now."
      }));
    }
  })
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

  const request_options = {
    url: `http://23.94.69.140:5000/top_smartcoins`,
    method: 'GET', // GET request, not POST.
    json: true,
    headers: {
      'User-Agent': 'Beyond Bitshares Bot',
      'Content-Type': 'application/json'
    }
  };

  requestLib(request_options, (err, httpResponse, body) => {
    if (!err && httpResponse.statusCode === 200) { // Check that the GET request didn't encounter any issues!

      const top_smartcoins = body;
      var inner_voice = ``;
      var inner_text = ``;

      var iterator = 1;
      for (smartcoin in top_smartcoins) {
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

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: textToSpeech,
        text: displayText
      }));

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional market information!`,
          text: 'Want more info regarding top traded UIAs? Follow this link for more info!',

          buttons: new Button({
            title: 'Block explorer link',
            url: 'http://open-explorer.io/#/markets',
          }),
          display: 'WHITE'
        }))
      }

    } else {
      conv.close(new SimpleResponse({
        // Sending the details to the user
        speech: "An unexpected error was encountered! Let's end our Vote Goat session for now.",
        text: "An unexpected error was encountered! Let's end our Vote Goat session for now."
      }));
    }
  })
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

  const request_options = {
    url: `http://23.94.69.140:5000/top_markets`,
    method: 'GET', // GET request, not POST.
    json: true,
    headers: {
      'User-Agent': 'Beyond Bitshares Bot',
      'Content-Type': 'application/json'
    }
  };

  requestLib(request_options, (err, httpResponse, body) => {
    if (!err && httpResponse.statusCode === 200) { // Check that the GET request didn't encounter any issues!

      const top_markets = body;
      var inner_voice = ``;
      var inner_text = ``;

      var iterator = 1;
      for (market in top_markets) {
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

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: textToSpeech,
        text: displayText
      }));

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional market information!`,
          text: 'Want more info regarding top traded UIAs? Follow this link for more info!',

          buttons: new Button({
            title: 'Block explorer link',
            url: 'http://open-explorer.io/#/markets',
          }),
          display: 'WHITE'
        }));
      }

    } else {
      conv.close(new SimpleResponse({
        // Sending the details to the user
        speech: "An unexpected error was encountered! Let's end our Vote Goat session for now.",
        text: "An unexpected error was encountered! Let's end our Vote Goat session for now."
      }));
    }
  })
})

app.intent('Market.24HRVolume', conv => {
  /*
    market_24HRVolume function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('market_24HRVolume', 1, parameter); // Need to set the data
  */

  const qs_input = {
    //  HUG REST GET request parameters
    committee_id: input_committee_id, // input
    api_key: '123abc'
  };
  return hug_request('market_24hr_vol', 'GET', qs_input)
  .then(body => {
    if (body.valid_market === true && body.valid_key === true) {

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

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: textToSpeech,
        text: displayText
      }));

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional market information!`,
          text: 'Want more info regarding top traded UIAs? Follow this link for more info!',

          buttons: new Button({
            title: 'Block explorer link',
            url: 'http://open-explorer.io/#/markets',
          }),
          display: 'WHITE'
        }));
      }

    } else {
      catch_error(conv, `HUG Function failure!`);
      // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Market.Orderbook', conv => {
  /*
    market_Orderbook function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('market_Orderbook', 1, parameter); // Need to set the data
  */
  const input_market_pair = "USD:BTS"

  const qs_input = {
    //  HUG REST GET request parameters
    market_pair: input_market_pair, // input
    api_key: '123abc'
  };
  return hug_request('market_orderbook', 'GET', qs_input)
  .then(body => {
    if (body.valid_market === true && body.valid_key === true) {

      var base_asset = input_market_pair.split(":")[0];
      var quote_asset = input_market_pair.split(":")[1];

      var market_orderbook = body.market_orderbook;
      var market_sell_orders = market_orderbook['asks'];
      var market_buy_orders = market_orderbook['bids'];
      var more_than_640 = false;
      var orderbook_limit = 10;

      var sell_text = `Sell orders: \n`;
      var buy_text = `Buy orders: \n`;

      for (i = 0; i < orderbook_limit; i++) {
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

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: textToSpeech1,
        text: displayText1
      }));

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: textToSpeech2,
        text: displayText2
      }));

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional market open order information available!`,
          text: 'Desire additional open order information? Follow this link for more info!!',
          buttons: new Button({
            title: 'Block explorer link',
            url: `http://open-explorer.io/#/markets/${quote_asset}/${base_asset}`,
          }),
          display: 'WHITE'
        }));
      }

    } else {
      catch_error(conv, `HUG Function failure!`);
      // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Market.Ticker', conv => {
  /*
    market_Ticker function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('market_Ticker', 1, parameter); // Need to set the data
  */
  const input_market_pair = "USD:BTS"

  const qs_input = {
    //  HUG REST GET request parameters
    market_pair: input_market_pair, // input
    api_key: '123abc'
  };
  return hug_request('market_ticker', 'GET', qs_input)
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

      const displayText = `Core exchange rate:\n` +
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

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        var base_asset = input_market_pair.split(":")[0];
        var quote_asset = input_market_pair.split(":")[1];

        conv.close(
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
          })
        );
      } else {
        return conv.close(
          new SimpleResponse({
            // No speech here, because we don't want to read everything out!
            speech: textToSpeech,
            text: displayText
          })
        );
      }

    } else {
      catch_error(conv, `HUG Function failure!`);
      // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Market.TradeHistory', conv => {
  /*
    market_TradeHistory function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('market_TradeHistory', 1, parameter); // Need to set the data
  */

  const input_market_pair = "USD:BTS"
  const qs_input = {
    //  HUG REST GET request parameters
    market_pair: input_market_pair, // input
    api_key: '123abc'
  };
  return hug_request('market_trade_history', 'GET', qs_input)
  .then(body => {
    if (body.valid_market === true && body.valid_key === true) {

      const market_trade_history = body.market_trade_history;
      const mth_limit = 10;
      var trade_text = ``;
      var avg_rate = 0;
      var total_bought = 0;
      var total_sold = 0;

      for (i = 0; i < mth_limit; i++) {
        if (trade_text.length < 640) {
          const current_trade = mth_limit[i.toString()]
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

      const displayText2 = `Last 10 market trades:\n` +
        `${trade_text}`;

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: textToSpeech1,
        text: displayText1
      }));

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: '',
        text: displayText2
      }));

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional market open order information available!`,
          text: 'Desire additional open order information? Follow this link for more info!!',
          buttons: new Button({
            title: 'Block explorer link',
            url: `http://open-explorer.io/#/markets/${quote_asset}/${base_asset}`,
          }),
          display: 'WHITE'
        }));
      }

    } else {
      catch_error(conv, `HUG Function failure!`);
      // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
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
    `Do you want information regarding an individual witness, or a summary of all active witnesses?` +
    `</speak>`;

  const displayText = `Do you want information regarding an individual witness, or a summary of all active witnesses?`;

  conv.ask(new SimpleResponse({
    // Sending the details to the user
    speech: textToSpeech,
    text: displayText
  }));

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new Suggestions('Active witness summary', 'Help', 'Quit'));
  }
})

app.intent('Witness.Active', conv => {
  /*
    witness_Active function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('witness_Active', 1, parameter); // Need to set the data
  */
  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('list_of_witnesses', 'GET', qs_input)
  .then(body => {
    if (body.success === true && body.valid_key === true) {

      const witnesses = body.witnesses;
      const num_active_witnesses = body.witness_count;
      var inner_text1 = ``;
      var inner_voice1 = ``;

      for (witness in witnesses) {
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

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: textToSpeech1,
        text: displayText1
      }));

      var textToSpeech2 = ``;
      var displayText2 = ``;

      if (inner_text2.length() > 1) {
        textToSpeech2 = `<speak>` +
          inner_voice2 +
          `</speak>`;

        displayText2 = inner_text2;

        conv.close(new SimpleResponse({
          // No speech here, because we don't want to read everything out!
          speech: textToSpeech2,
          text: displayText2
        }));
      }

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional witness information available!`,
          text: 'Desire additional witness information? Follow this link for more info!',
          buttons: new Button({
            title: 'Block explorer link',
            url: `http://open-explorer.io/#/witness`,
          }),
          display: 'WHITE'
        }));
      }
    } else {
      catch_error(conv, `HUG Function failure!`);
      // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Witness.One', conv => {
  /*
    witness_One function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('witness_One', 1, parameter); // Need to set the data
  */

  const qs_input = {
    //  HUG REST GET request parameters
    witness_name: witness_name, // input
    api_key: '123abc'
  };
  return hug_request('find_witness', 'GET', qs_input)
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

      conv.close(new SimpleResponse({
        // No speech here, because we don't want to read everything out!
        speech: textToSpeech1,
        text: displayText1
      }));

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional account information available!`,
          text: `Desire additional account information about ${witness_name}? Follow this link for more info!`,
          buttons: new Button({
            title: 'Block explorer link',
            url: `http://open-explorer.io/#/accounts/${witness_name}`
          }),
          display: 'WHITE'
        }));
      }
    } else {
      catch_error(conv, `HUG Function failure!`);
      // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
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
    `Do you want information regarding an individual worker proposal, or a summary of all active worker proposals?` +
    `</speak>`;

  const displayText = `Do you want information regarding an individual worker proposal, or a summary of all active worker proposals?`;

  conv.ask(new SimpleResponse({
    // Sending the details to the user
    speech: textToSpeech,
    text: displayText
  }));

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new Suggestions('Active worker proposals', 'Help', 'Quit'));
  }
})

app.intent('Worker.Many', conv => {
  /*
    worker_Many function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('worker_Many', 1, parameter); // Need to set the data
  */
  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('get_worker_proposals', 'GET', qs_input)
  .then(body => {
    if (body.success === true && body.valid_key === true) {

      var workers = body.workers;
      const current_time = moment();

      var text1 = ``;
      var voice1 = ``;
      var text2 = ``;
      var voice2 = ``;

      for (worker in workers) {
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

      conv.close(new SimpleResponse({
        // Sending the details to the user
        speech: textToSpeech1,
        text: displayText1
      }));

      if (text2.length() > 1) {
        const textToSpeech2 = `<speak>` +
          voice2 +
          `</speak>`;
        const displayText2 = text2;

        conv.close(new SimpleResponse({
          // Sending the details to the user
          speech: textToSpeech2,
          text: displayText2
        }));
      }

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional worker proposal information is available!`,
          text: 'Desire additional worker proposal information? Follow this link for more info!',
          buttons: new Button({
            title: 'Block explorer link',
            url: `http://open-explorer.io/#/workers`,
          }),
          display: 'WHITE'
        }));
      }

    } else {
      catch_error(conv, `HUG Function failure!`);
      // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})

app.intent('Worker.One', conv => {
  /*
    worker_One function
  */
  /*
  conv.fallbackCount = 0; // Required for tracking fallback attempts!
  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  conv.contexts.set('worker_One', 1, parameter); // Need to set the data
  */
  const qs_input = {
    //  HUG REST GET request parameters
    worker_id: input_worker_id, // input
    api_key: '123abc'
  };
  return hug_request('get_worker', 'GET', qs_input)
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

      conv.close(new SimpleResponse({
        // Sending the details to the user
        speech: textToSpeech1,
        text: displayText1
      }));

      const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
      if (hasScreen === true) {
        conv.close(new BasicCard({
          title: `Additional worker proposal information is available!`,
          text: 'Desire additional worker proposal information? Follow this link for more info!',
          buttons: new Button({
            title: 'Block explorer link',
            url: `http://open-explorer.io/#/objects/${worker_id}`,
          }),
          display: 'WHITE'
        }));
      }

    } else {
      catch_error(conv, `HUG Function failure!`);
      // RELACE WITH FALLBACK ASKING FOR DIFFERENT ASSET NAME!
    }
  })
  .catch(error_message => {
    catch_error(conv, error_message);
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

    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
    if (hasScreen === true) {
      conv.ask(new Suggestions('Help', 'Quit'));
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
    `You can blahblah.` +
    `You can blahblah.` +
    `You can blahblah.` +
    `</speak>`;

  const textToDisplay = `<speak>` +
    `I heard you're having some problems with Beyond Bitshares? ` +
    `You can blahblah.` +
    `You can blahblah.` +
    `You can blahblah.`;

  const textToSpeech2 = `<speak>` +
    `You can blahblah.` +
    `You can blahblah.` +
    `You can blahblah.` +
    `</speak>`;

  const textToDisplay2 = `I heard you're having some problems with Beyond Bitshares? ` +
    `You can blahblah.` +
    `You can blahblah.` +
    `You can blahblah.`;

  conv.ask(new SimpleResponse({
    // Sending the details to the user
    speech: textToSpeech,
    text: textToDisplay
  }));

  conv.ask(new SimpleResponse({
    // Sending the details to the user
    speech: textToSpeech2,
    text: textToDisplay
  }));

  const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
  if (hasScreen === true) {
    conv.ask(new BasicCard({
      title: `Template`,
      text: 'Text to display in basic card.',
      buttons: new Button({
        title: 'Block explorer link',
        url: `http://open-explorer.io`,
      }),
      display: 'WHITE'
    }));
    conv.ask(new Suggestions('Help', 'Quit'));
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

    conv.ask(new SimpleResponse({
      // Sending the details to the user
      speech: current_fallback_phrase,
      text: current_fallback_phrase
    }));

    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')
    if (hasScreen === true) {
      conv.ask(new Suggestions('Help', 'Quit'));
    }
  }
})

app.intent('goodbye', conv => {
  /*
  Elaborate goodbye intent
  */
  textToSpeech = `<speak>` +
    `Sorry to see you go, come back soon? <break time="0.35s" /> ` +
    `Goodbye.` +
    `</speak>`;
  speechToText = `Sorry to see you go, come back soon? \n\n` +
    `Goodbye.`;

  conv.close(new SimpleResponse({
    // Sending the details to the user
    speech: textToSpeech,
    text: displayText
  }));
})

app.catch((conv, e) => {
  /*
    Generic error catch
    https://github.com/actions-on-google/actions-on-google-nodejs/blob/v2.0.0-alpha/samples/js/app/name-psychic/functions/index.js#L212
  */
  console.error(e)
  conv.close(responses.readMindError)
})

exports.BeyondBitshares = functions.https.onRequest(app)
