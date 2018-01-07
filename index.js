'use strict'; // Mandatory js style?

process.env.DEBUG = 'actions-on-google:*'; // Creates a lot of log data in firebase, highly recommended when submitting to google (they'll try to trigger errors)
const App = require('actions-on-google').DialogflowApp; // Mandatory
const functions = require('firebase-functions'); // Mandatory when using firebase
const http = require('https'); // Required for request's https use? Or dead code?...
const requestLib = require('request'); // Used for querying the HUG.REST API
const moment = require('moment'); // For handling time.

const hug_host = 'https://btsapi.grcnode.co.uk'; // Change this to your own HUG REST API server (if you want)

const WELCOME_ACTION = 'Welcome'; // Welcome intent. (Accessed after the permissions are checked)
//const WELCOME_FALLBACK = 'Welcome.Fallback'; // Welcome intent's fallback (Home)
const GOODBYE = 'goodbye'; // Exit intent
const HELPANYWHERE = 'getHelpAnywhere'; // Help Anywhere intent
//const HELPANYWHERE_FALLBACK = 'getHelpAnywhere.Fallback'; // Help Anywhere Fallback
//const HANDLE_NO_CONTEXTS_FALLBACK = 'handle_no_contexts.Fallback'; // Fallback for the 'handle_no_contexts' function

const ABOUT_ACTION = 'About';
//const ABOUT_FALLBACK = 'About.Fallback';
const ACCOUNT_ACTION = 'Account';
//const ACCOUNT_FALLBACK = 'Account.Fallback';
const ACCOUNT_INFO = 'Account.Info';
//const ACCOUNT_INFO_FALLBACK = 'Account.Info.Fallback';
const ACCOUNT_BALANCES_ACTION = 'Account.Balances';
//const ACCOUNT_BALANCES_FALLBACK = 'Account.Balances.Fallback';
const ACCOUNT_CALLPOSITIONS_ACTION = 'Account.CallPositions';
//const ACCOUNT_CALLPOSITIONS_FALLBACK = 'Account.CallPositions.Fallback';
const ACCOUNT_HISTORY_ACTION = 'Account.History';
//const ACCOUNT_HISTORY_FALLBACK = 'Account.History.Fallback';
const ASSET_ACTION = 'Asset';
//const ASSET_FALLBACK = 'Asset.Fallback';
const ASSET_MANY_ACTION = 'Asset.Many';
//const ASSET_MANY_FALLBACK = 'Asset.Many.Fallback';
const GET_ASSET_ACTION = 'Asset.One';
//const GET_ASSET_FALLBACK = 'Asset.One.Fallback';
const BLOCK_ACTION = 'Block';
//const BLOCK_FALLBACK = 'Block.Fallback';
const BLOCK_LATEST_ACTION = 'Block.Latest';
//const BLOCK_LATEST_FALLBACK = 'Block.Latest.Fallback';
const GET_BLOCK_DETAILS_ACTION = 'Block.One';
//const GET_BLOCK_DETAILS_FALLBACK = 'Block.One.Fallback';
const BLOCKCHAIN_OVERVIEW_ACTION = 'Block.Overview';
//const BLOCKCHAIN_OVERVIEW_FALLBACK = 'Block.Overview.Fallback';
const COMMITTEE_ACTION = 'Committee';
//const COMMITTEE_FALLBACK = 'Committee.Fallback';
const COMMITTEE_ACTIVE_ACTION = 'Committee.Active';
//const COMMITTEE_ACTIVE_FALLBACK = 'Committee.Active.Fallback';
const GET_COMMITTEE_MEMBER_ACTION = 'Committee.One';
//const GET_COMMITTEE_MEMBER_FALLBACK = 'Committee.One.Fallback';
//const DEFAULT_FALLBACK = 'DefaultFallback';
const FEES_ACTION = 'Fees';
//const FEES_FALLBACK = 'Fees.Fallback';
const MARKET_ACTION = 'Market';
//const MARKET_FALLBACK = 'Market.Fallback';
const MARKET_24HRVOLUME_ACTION = 'Market.24HRVolume';
//const MARKET_24HRVOLUME_FALLBACK = 'Market.24HRVolume.Fallback';
const MARKET_ORDERBOOK_ACTION = 'Market.Overbook';
//const MARKET_ORDERBOOK_FALLBACK = 'Market.Overbook.Fallback';
const MARKET_TICKER_ACTION = 'Market.Ticker';
//const MARKET_TICKER_FALLBACK = 'Market.Ticker.Fallback';
const MARKET_TRADEHISTORY_ACTION = 'Market.TradeHistory';
//const MARKET_TRADEHISTORY_FALLBACK = 'Market.TradeHistory.Fallback';
const NETWORK_ACTION = 'Network';
//const NETWORK_FALLBACK = 'Network.Fallback';
const WITNESS_ACTION = 'Witness';
//const WITNESS_FALLBACK = 'Wittness.Fallback';
const WITNESS_ACTIVE_ACTION = 'Witness.Active';
//const WITNESS_ACTIVE_FALLBACK = 'Witness.Active.Fallback';
const WITNESS_ONE_ACTION = 'Witness.One';
//const WITNESS_ONE_FALLBACK = 'Witness.One.Fallback';
const WORKER_ACTION = 'Worker';
//const WORKER_FALLBACK = 'Worker.Fallback';
const WORKER_MANY_ACTION = 'Worker.Many';
//const WORKER_MANY_FALLBACK = 'Worker.Many.Fallback';
const WORKER_ONE_ACTION = 'Worker.One';
//const WORKER_ONE_FALLBACK = 'Worker.One.Fallback';

exports.BeyondBitshares = functions.https.onRequest((req, res) => {
  /*
  This is the highest level function which is installed & monitored in firebase!
  */
  const app = new App({
    request: req,
    response: res
  });
  //console.log('Request headers: ' + JSON.stringify(req.headers)); // Good for logging
  //console.log('Request body: ' + JSON.stringify(req.body)); // Good for logging

  if (app.isRequestFromDialogflow("key", "value")) {
    /*
      We're checking that the webhook request actually came from dialogflow.
      Why? For security & because it's required before submitting to google for approval.
      https://developers.google.com/actions/reference/nodejs/DialogflowApp#isRequestFromDialogflow
    */

    //console.log("REQUEST IS FROM DIALOGFLOW!");

    // Detecting the capabilities of the user's device!
    const hasScreen = app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);
    const hasAudio = app.hasSurfaceCapability(app.SurfaceCapabilities.AUDIO_OUTPUT);
    //console.log(`Screen: ${hasScreen}, Audio: ${hasAudio}!`);

    // Constants
    const userId = app.getUser() ? app.getUser().userId : ''; // Get the user's userID.

    function welcome(app) {
      /*
      The welcome function is called from the end of the updatePermission (and userData) function.
      This greets the user, and suggests training & recommendation chips.
      If we're quiting the training section, we do not return here, rather the home/welcome intent created in dialogflow.

      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const welcome_param = {}; // The dict which will hold our parameter data
      welcome_param['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('home', 1, welcome_param); // We need to insert data into the 'home' context for the home fallback to trigger!

      let welcomeCard = app.buildRichResponse();

      const textToSpeech = `<speak>` +
        `<emphasis level="moderate">Hey, welcome to Beyond Bitshares!</emphasis> <break time="0.375s" /> ` +
        `Beyond Bitshares provides information regarding Bitshares on demand. <break time="0.35s" /> ` +
        `You can request information about the network, accounts, assets, committee members, witnesses, worker proposals, fees, etc.` +
        `What would you like to do? ` +
        `</speak>`;

      welcomeCard.addSimpleResponse({
        speech: textToSpeech,
        displayText: `Hello, welcome to Beyond Bitshares! ` +
          `Beyond Bitshares provides information regarding Bitshares on demand. \n\n ` +
          `You can request information about the network, accounts, assets, committee members, witnesses, worker proposals, fees, etc.\n\n` +
          `What would you like to do? \n\n` +
      });

      if (hasScreen === true) {
        welcomeCard.addSuggestions(['About', 'Accounts', 'Assets', 'Blockchain', 'Committee', 'Markets', 'Network', 'Workers', 'Fees', 'Help', 'Quit']);
      }

      app.ask(welcomeCard); // Sending the details to the user, awaiting input!
    }

    function about(app) {
      /*
        About function - providing info about Bitshares.
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const about_param = {}; // The dict which will hold our parameter data
      about_param['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('about', 1, about_param); // Need to set the data

      let rich_response = app.buildRichResponse(); // Rich Response container

      const textToSpeech1 = `<speak>` +
        `The BitShares platform has numerous innovative features which are not found elsewhere within the smart contract industry such as:`
      `Price-Stable Cryptocurrencies - SmartCoins provide the freedom of cryptocurrency with the stability of FIAT assets.` +
      `Decentralized Asset Exchange - A fast and fluid trading platform` +
      `Industrial Performance and Scalability - Proven 3k TPS, theoretical 100k limit.` +
      `Dynamic Account Permissions - Management for the corporate environment.` +
      `Recurring & Scheduled Payments - Flexible withdrawal permissions.` +
      `</speak>`;

      const textToSpeech2 = `<speak>` +
        `Referral Rewards Program - Network growth through adoption rewards.` +
        `User-Issued Assets - Regulation-compatible cryptoasset issuance.` +
        `Stakeholder-Approved Project Funding - A self-sustaining funding model.` +
        `Transferable Named Accounts - Easy and secure transactions.` +
        `Delegated Proof-of-Stake Consensus - A robust and flexible consensus protocol.` +
        `Want to know more about any of Bitshares features?`
      `</speak>`;

      const displayText1 = `The BitShares platform has numerous innovative features which are not found elsewhere within the smart contract industry such as: \n\n`
      `Price-Stable Cryptocurrencies - SmartCoins provide the freedom of cryptocurrency with the stability of FIAT assets.\n\n` +
      `Decentralized Asset Exchange - A fast and fluid trading platform.\n\n` +
      `Industrial Performance and Scalability - Proven 3k TPS, theoretical 100k limit.\n\n` +
      `Dynamic Account Permissions - Management for the corporate environment.\n\n` +
      `Recurring & Scheduled Payments - Flexible withdrawal permissions.`;

      const displayText1 = `Referral Rewards Program - Network growth through adoption rewards.\n\n` +
        `User-Issued Assets - Regulation-compatible cryptoasset issuance.\n\n` +
        `Stakeholder-Approved Project Funding - A self-sustaining funding model.\n\n` +
        `Transferable Named Accounts - Easy and secure transactions.\n\n` +
        `Delegated Proof-of-Stake Consensus - A robust and flexible consensus protocol.\n\n` +
        `Want to know more about any of Bitshares features?`;

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      card.addSimpleResponse({
        speech: textToSpeech2,
        displayText: displayText2
      });

      if (hasScreen === true) {
        rich_response.addSuggestions(['Delegated Proof-of-Stake Consensus', 'Price-Stable Cryptocurrencies', 'Decentralized Asset Exchange', 'Industrial Performance and Scalability', 'Dynamic Account Permissions', 'Recurring & Scheduled Payments', 'Referral Rewards Program', 'User-Issued Assets', 'Stakeholder-Approved Project Funding', 'Transferable Named Accounts', 'Help', 'Quit']);
      }

      //app.ask(rich_response); // Sending the details to the user, awaiting input!
      app.tell(rich_response); // Sending the details to the user, awaiting input!
    }

    function account(app) {
      /*
        account function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('account', 1, parameter); // Need to set the data

      let rich_response = app.buildRichResponse(); // Rich Response container

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

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      card.addSimpleResponse({
        speech: textToSpeech2,
        displayText: displayText2
      });

      if (hasScreen === true) {
        card.addSuggestions([`Account's Basic Overview`, 'Account Balances', `Account's Open Orders`, `Account's Trade History`, `Account's Call Positions`, 'Help', 'Quit']);
      }

      app.ask(rich_response); // Sending the details to the user, awaiting input!
    }

    function account_Balances(app) {
      /*
        account_Balances function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('account_Balances', 1, parameter); // Need to set the data

      // input_account = <Retrieve Account from DialogFlow)
      var input_account = 'abit'; // For testing!

      const request_options = {
        url: `${hug_host}/account_balances`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          account: input_account,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
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

                    if (index != (account_balances.length - 1)) {
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
                app.tell(`${input_account} does not have any assets in their account, goodbye.`);
                // TODO: Fallback to repeat account input instead of app.tell()
              }
            }

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech = `<speak>` +
                                     voice +
                                 `</speak>`;

            const displayText = text;

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            if (hasScreen === true) {
              if (many_balances === true) {
                let basic_card = app.buildBasicCard('This account has too many balances to show. Please navigate to the linked block explorer.')
                                    .setTitle(`Insufficient space to display ${input_account}'s balances!'`)
                                    .addButton('Block explorer link', `http://open-explorer.io/#/accounts/${input_account}`)
                rich_response.addBasicCard(basic_card)
              }
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function account_CallPositions(app) {
      /*
        account_CallPositions function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('account_CallPositions', 1, parameter); // Need to set the data

      // input_account = <Retrieve Account from DialogFlow>

      const request_options = {
        url: `${hug_host}/get_callpositions`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          account: input_account,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.success === true && body.valid_key === true) {

            var text = ``;
            var voice = ``;

            if (body.account_has_call_positions === true){

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

                      if (index != (account_balances.length - 1)) {
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
                  app.tell(`${input_account} does not have any call positions.`);
                  // TODO: Fallback to repeat account input instead of app.tell()
                }
              }
            }
            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `${input_account}'s call positions are:`
              voice +
              `</speak>`;

            const displayText1 = `${input_account}'s call positions are:` +
                                 voice;

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            app.tell(rich_response); // Sending the details to the user & closing app.
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function account_Info(app) {
      /*
        account_Info function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('account_Info', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/account_info`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          account: input_account,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.success === true && body.valid_key === true) {

            const info = body.account_info; // This var holds the account's call positions

            const id = info.id;
            const registrar = info.registrar;
            const name = info.name;
            const witness_votes = info.options.num_witness;
            const committee_votes = info.options.num_committee;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech = `<speak>` +
              `Found information regarding ${input_account}:` +
              `${name}'s ID is ${id}, they were registered by ${registrar} and have voted for ${witness_votes} witnesses and ${committee_votes} committee members.` +
              `</speak>`;

            const displayText = `Found information regarding ${input_account}:` +
                                 `${name}'s ID is ${id}, they were registered by ${registrar} and have voted for ${witness_votes} witnesses and ${committee_votes} committee members.`;

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            app.tell(rich_response); // Sending the details to the user & closing app.

          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }


    function asset(app) {
      /*
        asset function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('asset', 1, parameter); // Need to set the data

      let rich_response = app.buildRichResponse(); // Rich Response container

      const textToSpeech = `<speak>` +
        `You can request the following Asset information:` +
        `Information about a single asset.` +
        `Top Smartcoins.` +
        `Top User Issued Assets.` +
        `What do you want to know about Bitshares assets?` +
        `</speak>`;

      const displayText1 = `You can request the following Asset information:` +
              `Information about a single asset.` +
              `Top Smartcoins.` +
              `Top User Issued Assets.` +
              `What do you want to know about Bitshares assets?`;

      card.addSimpleResponse({
        speech: textToSpeech,
        displayText: displayText
      });

      if (hasScreen === true) {
        rich_response.addSuggestions(['Top Smartcoins', 'Top UIAs', 'Back', 'Help', 'Quit']);
      }

      app.ask(rich_response); // Sending the details to the user, awaiting input!
      //app.tell(rich_response); // Sending the details to the user & closing app.
    }

    function get_Asset(app) {
      /*
        get_Asset function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('get_Asset', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/get_asset`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          asset_name: input_asset_name,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.success === true && body.valid_key === true) {

            asset_data = body.asset_data;
            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech = `<speak>` +
              `${input_asset_name} information:` +
              `ID: ${asset_data['id']}` +
              `Symbol: ${asset_data['symbol']}` +
              `Description: ${asset_data['description']}` +
              `Current supply: ${asset_data['dynamic_asset_data']['current_supply']}` +
              `Confidential supply: ${asset_data['dynamic_asset_data']['confidential_supply']}` +
              `Accumulated Fees: ${asset_data['dynamic_asset_data']['accumulated_fees']}` +
              `Fee pool: ${asset_data['dynamic_asset_data']['fee_pool']}`
              `</speak>`;

            const displayText = `${input_asset_name} information:` +
            `ID: ${asset_data['id']}` +
            `Symbol: ${asset_data['symbol']}` +
            `Description: ${asset_data['description']}` +
            `Current supply: ${asset_data['dynamic_asset_data']['current_supply']}` +
            `Confidential supply: ${asset_data['dynamic_asset_data']['confidential_supply']}` +
            `Accumulated Fees: ${asset_data['dynamic_asset_data']['accumulated_fees']}` +
            `Fee pool: ${asset_data['dynamic_asset_data']['fee_pool']}`;

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            app.tell(rich_response); // Sending the details to the user & closing app.
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function block(app) {
      /*
        block function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('block', 1, parameter); // Need to set the data

      let rich_response = app.buildRichResponse(); // Rich Response container

      const textToSpeech1 = `<speak>` +
        `What kind of block information do you seek?`
        `Latest block details.` +
        `Specific block details.` +
        `An overview of the blockchain.` +
        `</speak>`;

      const displayText1 = `Placeholder`;

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      if (hasScreen === true) {
        rich_response.addSuggestions(['Latest block details', 'Blockchain overview', 'Help', 'Back', 'Quit']);
      }

      app.ask(rich_response); // Sending the details to the user, awaiting input!
    }

    function block_Latest(app) {
      /*
        block_Latest function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('block_Latest', 1, parameter); // Need to set the data
      const request_options = {
        url: `${hug_host}/get_latest_block`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.valid_block_number === true && body.valid_key === true) {

            const previous = body.previous;
            const witness  = body.witness;
            const transaction_merkle_root = body.transaction_merkle_root;
            const tx_count = body.transactions.length();
            const block_id = body.id;
            const block_date = body.block_date;
            const block_number = body.block_number;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech = `<speak>` +
              `Block ${block_number} is the latest Bitshares block.` +
              `It was produced on ${block_date} by witness with ID ${witness}.` +
              `There were ${tx_count} transactions in the block.` +
              `</speak>`;

            const displayText = `Block ${block_number} (ID: ${block_id}) is the latest Bitshares block.\n\n` +
                                  `The previous block was ${previous}, with a TX merkle root of ${transaction_merkle_root}.\n\n`
                                  `It was produced on ${block_date} by witness with ID ${witness}.\n\n` +
                                  `There were ${tx_count} transactions in the block.`;

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Interested in more block information?')
                                  .setTitle(`More block info available!`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/blocks/${block_number}`)
              rich_response.addBasicCard(basic_card)
            }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            // WRONG Block number.
            // TODO: SEND TO FALLBACK!
            catch_error(app); // Something's wrong with the HUG server!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function get_block_details(app) {
      /*
        get_block_details function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('get_block_details', 1, parameter); // Need to set the data
      const request_options = {
        url: `${hug_host}/get_block_details`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          block_number: input_block_number,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.valid_block_number === true && body.valid_key === true) {

            const previous = body.previous;
            const witness  = body.witness;
            const transaction_merkle_root = body.transaction_merkle_root;
            const tx_count = body.transactions.length();
            const timestamp = body.timestamp;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech = `<speak>` +
              `Here's info on block number ${block_number}:` +
              `It was produced on ${block_date} by witness with ID ${witness}.` +
              `There were ${tx_count} transactions in the block.` +
              `</speak>`;

            const displayText = `Info regarding block number ${block_number}:\n\n` +
                                  `The previous block was ${previous}, with a TX merkle root of ${transaction_merkle_root}.\n\n`
                                  `It was produced on ${timestamp} by witness with ID ${witness}.\n\n` +
                                  `There were ${tx_count} transactions in the block.`;

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Interested in more block information?')
                                  .setTitle(`More block info available!`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/blocks/${block_number}`)
              rich_response.addBasicCard(basic_card)
            }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function blockchain_Overview(app) {
      /*
        blockchain_Overview function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('blockchain_Overview', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/chain_info`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.success === true && body.valid_key === true) {

            chain_info = body.chain_info;

            let rich_response = app.buildRichResponse(); // Rich Response container

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

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function committee(app) {
      /*
        committee function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('committee', 1, parameter); // Need to set the data

      let rich_response = app.buildRichResponse(); // Rich Response container

      const textToSpeech = `<speak>` +
        `Do you want to look up the active committee members, or a single committee member?` +
        `If the later, please accurately specify their account name` +
        `</speak>`;

      const displayText = `Do you want to look up the active committee members, or a single committee member?` +
      `If the later, please accurately specify their account name`;

      card.addSimpleResponse({
        speech: textToSpeech,
        displayText: displayText
      });

      if (hasScreen === true) {
        rich_response.addSuggestions(['Active committee members', 'Help', 'Back', 'Quit']);
      }

      app.ask(rich_response); // Sending the details to the user, awaiting input!
    }

    function committee_Active(app) {
      /*
        committee_Active function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('committee_Active', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/get_committee_members`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
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

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech = `<speak>` +
              voice +
              `</speak>`;

            const displayText = text;

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            if (hasScreen === true) {
              if (more_than_640 === true) {
                let basic_card = app.buildBasicCard('There are more Committee member to display! Please navigate to the linked block explorer.')
                                    .setTitle(`Insufficient space to display committee members!'`)
                                    .addButton('Block explorer link', `http://open-explorer.io/#/committee_members`)
                rich_response.addBasicCard(basic_card)
              }
            }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function get_committee_member(app) {
      /*
        get_committee_member function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('get_committee_member', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/get_committee_member`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          committee_id: input_committee_id,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.success === true && body.valid_key === true) {

            const get_committee_member_data = body.get_committee_member;
            const committee_member_account = get_committee_member_data['committee_member_account'];
            const total_votes = get_committee_member_data['total_votes'];
            const vote_id = get_committee_member_data['vote_id'];
            const committee_member_details = get_committee_member_data['committee_member_details'];
            const name = committee_member_details['name'];
            const registrar = committee_member_details['registrar'];
            const name = committee_member_details['name'];
            const committee_status = committee_member_details['status'];

            var committee_status_string = ``;

            if (committee_status === true) {
              committee_status_string = `an`;
            } else {
              committee_status_string = `not an`;
            }

            let rich_response = app.buildRichResponse(); // Rich Response container

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

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function fees(app) {
      /*
        fees function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('fees', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/list_fees`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.success === true && body.valid_key === true) {

            fees = body.network_fees;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `The most important Bitshares network fees are:` +
              `Asset transfer: ${fees['transfer']['fee']}` +
              `Limit order create: ${fees['limit_order_create']['fee']}` +
              `Account creation: Between ${fees['account_create']['basic_fee']} and ${fees['account_create']['premium_fee']}` +
              `Lifetime Membership Upgrade: ${fees['account_upgrade']['membership_lifetime_fee']}` +
              `Asset creation: ${fees['asset_create']['long_symbol']} to ${fees['asset_create']['symbol3']}` +
              `Asset issuance: ${fees['asset_issue']['fee']}` +
              `Worker proposal creation ${fees['worker_create']['fee']}` +
              `</speak>`;

            const displayText1 =  `Market fees:\n`
                                  `Asset transfer: ${fees['transfer']['fee']}\n` +
                                  `Limit order create: ${fees['limit_order_create']['fee']}\n` +
                                  `Limit order cancel: ${fees['limit_order_cancel']['fee']}\n` +
                                  `Call order update: ${fees['call_order_update']['fee']}\n\n` +
                                  `Account fees:\n` +
                                  `Create: ${fees['account_create']['basic_fee']} to ${fees['account_create']['premium_fee']}\n` +
                                  `Update: ${fees['account_update']['fee']}\n` +
                                  `Whitelist: ${fees['account_whitelist']['fee']}\n` +
                                  `LTM Upgrade: ${fees['account_upgrade']['membership_lifetime_fee']}` +
                                  `Transfer: ${fees['account_transfer']['fee']}\n\n` +
                                  `Asset fees:\n` +
                                  `Create: ${fees['asset_create']['long_symbol']} to ${fees['asset_create']['symbol3']}\n` +
                                  `Update: ${fees['account_update']['fee']}\n` +
                                  `Update bitasset: ${fees['asset_update_bitasset']['fee']}\n` +
                                  `Update feed producers: ${fees['asset_update_feed_producers']['fee']}\n` +
                                  `Issue: ${fees['asset_issue']['fee']}\n` +
                                  `Reserve: ${fees['asset_reserve']['fee']}\n` +
                                  `Fund fee pool: ${fees['asset_fund_fee_pool']['fee']}\n` +
                                  `Settle: ${fees['asset_settle']['fee']}\n` +
                                  `Global settle: ${fees['asset_global_settle']['fee']}\n` +
                                  `Publish feed: ${fees['asset_publish_feed']['fee']}\n\n` +
                                  `Witness fees:\n` +
                                  `Create: ${fees['witness_create']['fee']}\n` +
                                  `Update: ${fees['witness_update']['fee']}`;

            const displayText2 = `Proposal fees:\n` +
                                  `Create: ${fees['proposal_create']['fee']}\n` +
                                  `Update: ${fees['proposal_update']['fee']}\n` +
                                  `Delete: ${fees['proposal_delete']['fee']}\n\n` +
                                  `Withdraw permission fees:\n` +
                                  `Create: ${fees['withdraw_permission_create']['fee']}\n` +
                                  `Update: ${fees['withdraw_permission_update']['fee']}\n` +
                                  `Claim: ${fees['withdraw_permission_claim']['fee']}\n\n` +
                                  `Committee member fees:\n` +
                                  `Create: ${fees['committee_member_create']['fee']}\n` +
                                  `Update: ${fees['committee_member_update']['fee']}\n` +
                                  `Update global parameters: ${fees['committee_member_update_global_parameters']['fee']}\n\n` +
                                  `Vesting balance fees:\n` +
                                  `Create: ${fees['vesting_balance_create']['fee']}\n` +
                                  `Withdraw: ${fees['vesting_balance_withdraw']['fee']}\n\n` +
                                  `MISC fees:\n` +
                                  `Worker create ${fees['worker_create']['fee']}\n` +
                                  `Assert: ${fees['assert']['fee']}\n` +
                                  `Override transfer: ${fees['override_transfer']['fee']}\n` +
                                  `Transfer to blind: ${fees['transfer_to_blind']['fee']}\n` +
                                  `Transfer from blind: ${fees['transfer_from_blind']['fee']}\n` +
                                  `Asset claim fees: ${fees['asset_claim_fees']['fee']}\n`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              // No speech here, because we don't want to read everything out!
              displayText: displayText2
            });

            if (hasScreen === true) {
              // To be honest, we provide just as much info regarding fees as the open-explorer, but at least it enables them to verify the fees are accurate!
              let basic_card = app.buildBasicCard('Want more info on Bitshares network fees? Follow this link for more info! Remember that your elected committee members set these fees!')
                                  .setTitle(`Additional info available regarding BTS fees!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/fees`)
              rich_response.addBasicCard(basic_card)
            }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function market(app) {
      /*
        market function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('market', 1, parameter); // Need to set the data

      let rich_response = app.buildRichResponse(); // Rich Response container

      const textToSpeech1 = `<speak>` +
        `You can request an individual trading pair's following market information:` +
        `24 hour trading volume.` +
        `Order overbook.` +
        `Price ticker.` +
        `Market trade history.` +
        `</speak>`;

      const textToSpeech2 = `<speak>` +
        `What do you want to do? Remember to provide the trading pair in your query!` +
        `</speak>`;

      const displayText1 = `You can request an individual trading pair's following market information:` +
                            `24 hour trading volume.` +
                            `Order overbook.` +
                            `Price ticker.` +
                            `Market trade history.`;

      const displayText2 =  `What do you want to do? Remember to provide the trading pair in your query!`;

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      card.addSimpleResponse({
        speech: textToSpeech2,
        displayText: displayText2
      });

      if (hasScreen === true) {
        rich_response.addSuggestions(['Back', 'Help', 'Quit']);
      }

      app.ask(rich_response); // Sending the details to the user, awaiting input!
      //app.tell(rich_response); // Sending the details to the user & closing app.
    }

    function market_top_uia(app) {
      /*
        Most traded UIAs on the BTS DEX (of any type).
        https://github.com/oxarbitrage/bitshares-python-api-backend
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('top_markets', 1, parameter); // Need to set the data

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
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!

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

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
                                    `The top traded UIAs on Bitshares are as follows:` +
                                    inner_voice +
                                  `</speak>`;

            const displayText1 = `The top traded UIAs on Bitshares are as follows:\n` +
                                 inner_text;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Want more info regarding top traded UIAs? Follow this link for more info!')
                                  .setTitle(`Additional market information!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/markets`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function market_top_smartcoins(app) {
      /*
        Most traded smartcoins on the BTS DEX (of any type).
        https://github.com/oxarbitrage/bitshares-python-api-backend
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('top_markets', 1, parameter); // Need to set the data

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
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!

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

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
                                    `The top traded smartcoins on Bitshares are as follows:` +
                                    inner_voice +
                                  `</speak>`;

            const displayText1 = `The top traded smartcoins on Bitshares are as follows:\n` +
                                 inner_text;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Want more info regarding top traded smartcoins? Follow this link for more info!')
                                  .setTitle(`Additional market information!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/markets`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function market_top(app) {
      /*
        Most traded assets on the BTS DEX (of any type).
        https://github.com/oxarbitrage/bitshares-python-api-backend
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('top_markets', 1, parameter); // Need to set the data

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
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!

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

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
                                    `The top markets on Bitshares are as follows:` +
                                    inner_voice +
                                  `</speak>`;

            const displayText1 = `The top markets on Bitshares are as follows:\n` +
                                 inner_text;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Want more info regarding top traded markets? Follow this link for more info!')
                                  .setTitle(`Additional market information!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/markets`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function market_24HRVolume(app) {
      /*
        market_24HRVolume function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('market_24HRVolume', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/market_24hr_vol`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          trading_pair: input_trading_pair,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.valid_market === true && body.valid_key === true) {

            const market_volume_24hr = body.market_volume_24hr;
            var base_asset = input_trading_pair.split("")[0];
            var quote_asset = input_trading_pair.split("")[1];
            var base_asset_amount = market_volume_24hr[base_asset]['amount'];
            var quote_asset_amount = market_volume_24hr[quote_asset]['amount'];
            var rate = base_asset_amount/quote_asset_amount;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
                                    `${base_asset_amount} ${base_asset} were traded for ${quote_asset_amount} ${quote_asset} at an average rate of ${rate} ${trading_pair} within the last 24 hours.` +
                                  `</speak>`;

            const displayText1 = `${base_asset_amount} ${base_asset} were traded for ${quote_asset_amount} ${quote_asset} at an average rate of ${rate} ${trading_pair} within the last 24 hours.`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Want more info regarding the above trading pair? Follow this link for more info!')
                                  .setTitle(`Additional trading pair information!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/markets/${quote_asset}/${base_asset}`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function market_Overbook(app) {
      /*
        market_Overbook function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('market_Overbook', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/market_orderbook`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          market_pair: input_market_pair,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.valid_market === true && body.valid_key === true) {

            var base_asset = input_market_pair.split("")[0];
            var quote_asset = input_market_pair.split("")[1];

            var market_orderbook = body.market_orderbook;
            var market_sell_orders = market_orderbook['asks'];
            var market_buy_orders = market_orderbook['bids'];
            var more_than_640 = false;
            var orderbook_limit = 10;

            let rich_response = app.buildRichResponse(); // Rich Response container

            var sell_text = `Sell orders: \n`;
            var buy_text = `Buy orders: \n`;

            for (i = 0; i < orderbook_limit; i++) {
              if (sell_text.length < 640 || buy_text.length < 640 ) {
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
                                `${sell_voice_inner}`+ +
                                `</speak>`;

            const buy_voice = `<speak>` +
                                `Sell orders:` +
                                `${buy_voice_inner}`+
                                `</speak>`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Desire additional open order information? Follow this link for more info!')
                                  .setTitle(`Additional market open order information available!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/markets/${quote_asset}/${base_asset}`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function market_Ticker(app) {
      /*
        market_Ticker function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('market_Ticker', 1, parameter); // Need to set the data
      const request_options = {
        url: `${hug_host}/market_ticker`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          market_pair: input_market_pair,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
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

            let rich_response = app.buildRichResponse(); // Rich Response container

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

            rich_response.addSimpleResponse({
              speech: textToSpeech,
              displayText: displayText
            });

            if (hasScreen === true) {
              var base_asset = input_market_pair.split("")[0];
              var quote_asset = input_market_pair.split("")[1];
              let basic_card = app.buildBasicCard('Desire additional market ticker information? Follow this link for more info!')
                                  .setTitle(`Additional market ticker information available!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/markets/${quote_asset}/${base_asset}`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function market_TradeHistory(app) {
      /*
        market_TradeHistory function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('market_TradeHistory', 1, parameter); // Need to set the data
      const request_options = {
        url: `${hug_host}/market_trade_history`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          market_pair: input_market_pair,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
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

            avg_rate = avg_rate/mth_limit;
            var base_asset = input_market_pair.split("")[0];
            var quote_asset = input_market_pair.split("")[1];

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `The last 10 ${input_market_pair} market trades saw ${total_bought} ${base_asset} purchased and ${total_sold} ${quote_asset} sold with an avg rate of ${avg_rate}.` +
              `</speak>`;

            const displayText1 = `The last 10 ${input_market_pair} market trades saw ${total_bought} ${base_asset} purchased and ${total_sold} ${quote_asset} sold with an avg rate of ${avg_rate}.`;

            const displayText2 = `Last 10 market trades:\n` +
            `${trade_text}`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              displayText: displayText2
            });

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Desire additional market trade history information? Follow this link for more info!')
                                  .setTitle(`Additional market trade info available!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/markets/${quote_asset}/${base_asset}`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function witness(app) {
      /*
        witness function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('witness', 1, parameter); // Need to set the data

      let rich_response = app.buildRichResponse(); // Rich Response container

      const textToSpeech1 = `<speak>` +
        `Do you want information regarding an individual witness, or a summary of all active witnesses?` +
        `</speak>`;

      const displayText1 = `Do you want information regarding an individual witness, or a summary of all active witnesses?`;

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      //if (hasScreen === true) {
      //  rich_response.addSuggestions(['1', '2', '3', 'Quit']);
      //}

      //app.ask(rich_response); // Sending the details to the user, awaiting input!
      app.tell(rich_response); // Sending the details to the user & closing app.
    }

    function witness_Active(app) {
      /*
        witness_Active function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('witness_Active', 1, parameter); // Need to set the data
      const request_options = {
        url: `${hug_host}/list_of_witnesses`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
          if (body.success === true && body.valid_key === true) {

            const witnesses = body.witnesses;
            const num_active_witnesses = body.witness_count;
            var inner_text1 = ``;
            var inner_voice1 = ``;

            for (witness in witnesses) {
              if witness['witness_status'] === true {
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

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `The following is a list of the ${num_active_witnesses} active witnesses:` +
              inner_voice1 +
              `</speak>`;

            const displayText1 = `The following is a list of the ${num_active_witnesses} active witnesses:` +
                                 inner_text1;

             rich_response.addSimpleResponse({
               speech: textToSpeech1,
               displayText: displayText1
             });

            var textToSpeech2 = ``;
            var displayText2 = ``;
            if (inner_text2.length() > 1) {
              textToSpeech2 = `<speak>` +
                inner_voice2 +
                `</speak>`;

              displayText2 = inner_text2;

              rich_response.addSimpleResponse({
                speech: textToSpeech2,
                displayText: displayText2
              });
            }

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Desire additional witness information? Follow this link for more info!')
                                  .setTitle(`Additional witness information available!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/witness`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function witness_One(app) {
      /*
        witness_One function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('witness_One', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/find_witness`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          witness_name: witness_name,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
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

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
                                    `We found the following ${witness_status_msg} witness named ${witness_name}:` +
                                    `Witness ID: ${witness_id}.` +
                                    `Vote ID: ${vote_id}.` +
                                    `Total votes: ${total_votes}.` +
                                    `Total blocks missed ${total_blocks_missed}.` +
                                    `Last confirmed block: ${last_confirmed_block_num}.` +
                                  `</speak>`;

            var displayText1 =  `We found the following ${witness_status_msg} witness named ${witness_name}:\n` +
                                  `Witness ID: ${witness_id}.\n` +
                                  `Vote ID: ${vote_id}.\n` +
                                  `Total votes: ${total_votes}.\n` +
                                  `Total blocks missed ${total_blocks_missed}.\n` +
                                  `Last confirmed block: ${last_confirmed_block_num}.`;

            if (url.length() > 1) {
              displayText1 += `URL: ${url}`;
            }

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard(`Desire additional account information about ${witness_name}? Follow this link for more info!`)
                                  .setTitle(`Additional account information available!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/accounts/${witness_name}`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function worker(app) {
      /*
        worker function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('worker', 1, parameter); // Need to set the data

      let rich_response = app.buildRichResponse(); // Rich Response container

      const textToSpeech1 = `<speak>` +
        `Do you want information regarding an individual worker proposal, or a summary of all active worker proposals?` +
        `</speak>`;

      const displayText1 = `Do you want information regarding an individual worker proposal, or a summary of all active worker proposals?`;

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      if (hasScreen === true) {
        rich_response.addSuggestions(['Active worker proposals', 'Back', 'Help', 'Quit']);
      }

      app.ask(rich_response); // Sending the details to the user, awaiting input!
      //app.tell(rich_response); // Sending the details to the user & closing app.
    }

    function worker_Many(app) {
      /*
        worker_Many function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('worker_Many', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/get_worker_proposals`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
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

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
                                    voice1 +
                                  `</speak>`;
            const displayText1 = text1;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            if (text2.length() > 1) {
              const textToSpeech2 = `<speak>` +
                                      voice2 +
                                    `</speak>`;
              const displayText2 = text2;

              rich_response.addSimpleResponse({
                speech: textToSpeech2,
                displayText: displayText2
              });
            }

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Desire additional worker proposal information? Follow this link for more info!')
                                  .setTitle(`Additional worker proposal information available!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/http://open-explorer.io/#/workers`)
              rich_response.addBasicCard(basic_card)
            }

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function worker_One(app) {
      /*
        worker_One function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('worker_One', 1, parameter); // Need to set the data

      const request_options = {
        url: `${hug_host}/get_worker`,
        method: 'GET', // GET request, not POST.
        json: true,
        headers: {
          'User-Agent': 'Beyond Bitshares Bot',
          'Content-Type': 'application/json'
        },
        qs: { // qs instead of form - because this is a GET request
          worker_id: input_worker_id,// input
          api_key: '123abc'
        }
      };

      requestLib(request_options, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) { // Check that the GET request didn't encounter any issues!
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

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
                                    `Here's information regarding worker proposal ${worker_id}:` +
                                    `Title: ${proposal_title}.` +
                                    `Start date: ${worker_begin_date}.` +
                                    `End date: ${worker_end_date}.` +
                                    `Worker account name: ${worker_name}.` +
                                    `Total votes: ${total_votes}.` +
                                  `</speak>`;

            const displayText1 =  `Here's information regarding worker proposal ${worker_id}:` +
                                  `Title: ${proposal_title}.` +
                                  `Start date: ${worker_begin_date}.` +
                                  `End date: ${worker_end_date}.` +
                                  `Worker account name: ${worker_name}.` +
                                  `Total votes: ${total_votes}.` +
                                  `URL: ${url}`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            // Note: Only for app.asp, not app.tell.
            // if (hasScreen === true) {
            //   rich_response.addSuggestions(['1', '2', '3', 'Quit']);
            // }

            if (hasScreen === true) {
              let basic_card = app.buildBasicCard('Desire additional worker proposal information? Follow this link for more info!')
                                  .setTitle(`Additional worker proposal information available!'`)
                                  .addButton('Block explorer link', `http://open-explorer.io/#/objects/${worker_id}`)
              rich_response.addBasicCard(basic_card)
            }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          } else {
            catch_error(app); // Something's wrong with the HUG server!
            // TODO: REPLACE WITH FALLBACK!!
          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    /////////////////////////////////////////////////////

    function menuFallback(app) {
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

      let current_fallback_phrase = MENU_FALLBACK[app.data.fallbackCount];

      let fallbackCard = app.buildRichResponse();
      fallbackCard.addSimpleResponse(current_fallback_phrase);
      if (hasScreen === true) {
        fallbackCard.addSuggestions(['Help', `Quit`]);
      }
      handleFallback(app, () => {
        app.ask(fallbackCard);
      });
    }

    function handleFallback(app, callback) {
      /*
      https://developers.google.com/actions/assistant/best-practices#provide_helpful_reprompts_and_fail_gracefully
      Function called by each of the main intent's fallback functions.
      Modified to actually work.
      Used to limit the fallback attempts to 3; more than 3 doesn't work (Their documentation says something about a bug).
      */
      console.log("HANDLING FALLBACK!");
      app.data.fallbackCount = parseInt(app.data.fallbackCount, 10); // Retrieve the value of the intent's fallback counter
      app.data.fallbackCount++; // Iterate the fallback counter

      if (app.data.fallbackCount > 3) {
        app.tell("Unfortunately, Beyond Bitshares was unable to understand user input. Sorry for the inconvenience, let's try again later though? Goodbye.");
      } else {
        console.log("HANDLED FALLBACK!");
        callback(); // Run the app.ask
      }
    }

    function catch_error(app) {
      /*
      Generally used when there's a small illogical error.
      */
      app.tell("An unexpected error was encountered! Let's end our Vote Goat session for now.");
    }

    function goodbye(app) {
      /*
      Elaborate goodbye intent
      */
      let GoodbyeRichResponse = app.buildRichResponse();

      // Device is speaker only
      textToSpeech = `<speak>` +
        `Sorry to see you go, come back soon? <break time="0.35s" /> ` +
        `Goodbye.` +
        `</speak>`;
      speechToText = `Sorry to see you go, come back soon? \n\n` +
        `Goodbye.`;

      GoodbyeRichResponse.addSimpleResponse({
        speech: textToSpeech,
        displayText: speechToText
      });

      app.tell(GoodbyeRichResponse); // FIRE!
    }

    function getHelpAnywhere(app) {
      /*
      Provides the user the ability to get help anywhere they are in the bot.
      Pretty much a duplicate of the welcome/home function, minus the greeting!
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const help_anywhere_parameter = {}; // The dict which will hold our parameter data
      help_anywhere_parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('help_anywhere', 1, help_anywhere_parameter); // We need to insert data into the 'home' context for the home fallback to trigger!

      let helpCard = app.buildRichResponse();

      const textToSpeech = `<speak>` +
        `I heard you're having some problems with Beyond Bitshares? <break time="0.35s" /> ` +
        `You can blahblah.` +
        `You can blahblah.` +
        `You can blahblah.` +
        `</speak>`;

      const textToSpeech2 = `<speak>` +
        `You can blahblah.` +
        `You can blahblah.` +
        `You can blahblah.` +
        `</speak>`;

      helpCard.addSimpleResponse({
        speech: textToSpeech,
        displayText: `I heard you're having some problems with Beyond Bitshares? \n\n` +
          `You can blahblah. \n\n` +
          `You can blahblah. \n\n` +
          `You can blahblah.`
      });

      helpCard.addSimpleResponse({
        speech: textToSpeech2,
        displayText: `You can blahblah. \n\n` +
          `You can blahblah. \n\n` +
          `You can blahblah.`
      });

      if (hasScreen === true) {
        helpCard.addBasicCard(app.buildBasicCard(`Card Body`)
          .setTitle(`Card title`)
        );
        helpCard.addSuggestions(['Help', `Quit`]);
      }

      app.ask(helpCard); // Sending the details to the user, awaiting input!
    }

    function getHelpFallback(app) {
      /*
      Fallback function for the GOAT intent!
      */
      console.log("HELP FALLBACK TRIGGERED!");

      const HELP_FALLBACK_DATA = [
        "Sorry, what do you want to do next?",
        "I didn't catch that. Do you want A, B or C?",
        "I'm having difficulties understanding what you want to do with Beyond Bitshares. Do you want A, B or C?"
      ];

      let current_fallback_phrase = HELP_FALLBACK_DATA[app.data.fallbackCount];

      let fallbackCard = app.buildRichResponse();
      fallbackCard.addSimpleResponse(current_fallback_phrase);
      if (hasScreen === true) {
        fallbackCard.addSuggestions([`A`, `B`, `C`, `Quit`]);
      }
      handleFallback(app, () => {
        app.ask(fallbackCard);
      });
    }

    /*
    The following are the required action maps!
      Each intent and fallback require action mapping.
      These match with the constants declared at the top of the script.
    */
    let actionMap = new Map(); // Mandatory
    actionMap.set(WELCOME_ACTION, welcome); // Welcome (Aka home) intent
    actionMap.set(WELCOME_FALLBACK, menuFallback); // Welcome menu fallback

    actionMap.set(HELPANYWHERE, getHelpAnywhere); // Get the user help wherever they are!
    actionMap.set(HELPANYWHERE_FALLBACK, getHelpFallback); // Handle the help fallback appropriately!

    actionMap.set(HANDLE_NO_CONTEXTS_FALLBACK, handleNoContextsFallback); // handling a lack of appropriate contexts

    actionMap.set(GOODBYE, goodbye); // Quit application

    actionMap.set(ABOUT_ACTION, about); // Info about Bitshares
    //actionMap.set(ABOUT_FALLBACK, about_Fallback);
    actionMap.set(ACCOUNT_ACTION, account);
    //actionMap.set(ACCOUNT_FALLBACK, account_Fallback);
    actionMap.set(ACCOUNT_INFO_ACTION, account_Info);
    //actionMap.set(ACCOUNT_INFO_ACTION_FALLBACK, account_Info_Fallback);
    actionMap.set(ACCOUNT_BALANCES_ACTION, account_Balances);
    //actionMap.set(ACCOUNT_BALANCES_FALLBACK, account_Balances_Fallback);
    actionMap.set(ACCOUNT_CALLPOSITIONS_ACTION, account_CallPositions);
    //actionMap.set(ACCOUNT_CALLPOSITIONS_FALLBACK, account_CallPositions_Fallback);
    actionMap.set(ACCOUNT_HISTORY_ACTION, account_History);
    //actionMap.set(ACCOUNT_HISTORY_FALLBACK, account_History_Fallback);
    actionMap.set(ASSET_ACTION, asset);
    //actionMap.set(ASSET_FALLBACK, asset_Fallback);
    actionMap.set(ASSET_MANY_ACTION, asset_Many);
    //actionMap.set(ASSET_MANY_FALLBACK, asset_Many_Fallback);
    actionMap.set(GET_ASSET_ACTION, get_Asset);
    //actionMap.set(GET_ASSET_FALLBACK, get_Asset_Fallback);
    actionMap.set(BLOCK_ACTION, block);
    //actionMap.set(BLOCK_FALLBACK, block_Fallback);
    actionMap.set(BLOCK_LATEST_ACTION, block_Latest);
    //actionMap.set(BLOCK_LATEST_FALLBACK, block_Latest_Fallback);
    actionMap.set(GET_BLOCK_DETAILS_ACTION, get_block_details);
    //actionMap.set(GET_BLOCK_DETAILS_FALLBACK, get_block_details_Fallback);
    actionMap.set(BLOCKCHAIN_OVERVIEW_ACTION, blockchain_Overview);
    //actionMap.set(BLOCKCHAIN_OVERVIEW_FALLBACK, blockchain_Overview_Fallback);
    actionMap.set(COMMITTEE_ACTION, committee);
    //actionMap.set(COMMITTEE_FALLBACK, committee_Fallback);
    actionMap.set(COMMITTEE_ACTIVE_ACTION, committee_Active);
    //actionMap.set(COMMITTEE_ACTIVE_FALLBACK, committee_Active_Fallback);
    actionMap.set(GET_COMMITTEE_MEMBER_ACTION, get_committee_member);
    //actionMap.set(GET_COMMITTEE_MEMBER_FALLBACK, get_committee_member_Fallback);
    actionMap.set(FEES_ACTION, fees);
    //actionMap.set(FEES_FALLBACK, fees_Fallback); // Probably not neccessary
    actionMap.set(MARKET_ACTION, market);
    //actionMap.set(MARKET_FALLBACK, market_Fallback);
    actionMap.set(MARKET_24HRVOLUME_ACTION, market_24HRVolume);
    //actionMap.set(MARKET_24HRVOLUME_FALLBACK, market_24HRVolume_Fallback);
    actionMap.set(MARKET_ORDERBOOK_ACTION, market_Overbook);
    //actionMap.set(MARKET_ORDERBOOK_FALLBACK, market_Overbook_Fallback);
    actionMap.set(MARKET_TICKER_ACTION, market_Ticker);
    //actionMap.set(MARKET_TICKER_FALLBACK, market_Ticker_Fallback);
    actionMap.set(MARKET_TRADEHISTORY_ACTION, market_TradeHistory);
    //actionMap.set(MARKET_TRADEHISTORY_FALLBACK, market_TradeHistory_Fallback);
    actionMap.set(NETWORK_ACTION, network);
    //actionMap.set(NETWORK_FALLBACK, network_Fallback);
    actionMap.set(WITNESS_ACTION, witness);
    //actionMap.set(WITNESS_FALLBACK, wittness_Fallback);
    actionMap.set(WITNESS_ACTIVE_ACTION, witness_Active);
    //actionMap.set(WITNESS_ACTIVE_FALLBACK, witness_Active_Fallback);
    actionMap.set(WITNESS_ONE_ACTION, witness_One);
    //actionMap.set(WITNESS_ONE_FALLBACK, witness_One_Fallback);
    actionMap.set(WORKER_ACTION, worker);
    //actionMap.set(WORKER_FALLBACK, worker_Fallback);
    actionMap.set(WORKER_MANY_ACTION, worker_Many);
    //actionMap.set(WORKER_MANY_FALLBACK, worker_Many_Fallback);
    actionMap.set(WORKER_ONE_ACTION, worker_One);
    //actionMap.set(WORKER_ONE_FALLBACK, worker_One_Fallback);

    app.handleRequest(actionMap); // Mandatory
  } else {
    /*
    The request was not from Dialogflow, this could be an attempted attack!
    */
    console.log("REQUEST NOT FROM DIALOGFLOW ERROR ERROR ERROR!"); // Next level would be to trigger a warning or log the infraction in mongodb.
    response.status(400).send(); // Take this, attacker!
  }


});
