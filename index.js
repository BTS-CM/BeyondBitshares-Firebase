'use strict'; // Mandatory js style?

process.env.DEBUG = 'actions-on-google:*'; // Creates a lot of log data in firebase, highly recommended when submitting to google (they'll try to trigger errors)
const App = require('actions-on-google').DialogflowApp; // Mandatory
const functions = require('firebase-functions'); // Mandatory when using firebase
const http = require('https'); // Required for request's https use? Or dead code?...
const requestLib = require('request'); // Used for querying the HUG.REST API

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
const BLOCK_ONE_ACTION = 'Block.One';
//const BLOCK_ONE_FALLBACK = 'Block.One.Fallback';
const BLOCKCHAIN_OVERVIEW_ACTION = 'Block.Overview';
//const BLOCKCHAIN_OVERVIEW_FALLBACK = 'Block.Overview.Fallback';
const COMMITTEE_ACTION = 'Committee';
//const COMMITTEE_FALLBACK = 'Committee.Fallback';
const COMMITTEE_ACTIVE_ACTION = 'Committee.Active';
//const COMMITTEE_ACTIVE_FALLBACK = 'Committee.Active.Fallback';
const COMMITTEE_ONE_ACTION = 'Committee.One';
//const COMMITTEE_ONE_FALLBACK = 'Committee.One.Fallback';
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
        `Available Bitshares Account Functionality:` +
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

      const displayText1 = `Available Account Functionality:` +
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
                                    .addButton('Block explorer link', `http://bitshares-explorer.io/#/accounts/${input_account}`)
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
        `Latest block details.` +
        `Specific block details.` +
        `Block overview` +
        `</speak>`;

      const textToSpeech2 = `<speak>` +
        `Placeholder.` +
        `</speak>`;

      const displayText1 = `Placeholder`;

      const displayText2 = `Placeholder`;

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      card.addSimpleResponse({
        speech: textToSpeech2,
        displayText: displayText2
      });

      //if (hasScreen === true) {
      //  rich_response.addSuggestions(['1', '2', '3', 'Quit']);
      //}

      //app.ask(rich_response); // Sending the details to the user, awaiting input!
      app.tell(rich_response); // Sending the details to the user & closing app.
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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

    function block_One(app) {
      /*
        block_One function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('block_One', 1, parameter); // Need to set the data
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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
                                    .addButton('Block explorer link', `http://bitshares-explorer.io/#/committee_members`)
                rich_response.addBasicCard(basic_card)
              }
            }

            //app.ask(rich_response); // Sending the details to the user, awaiting input!
            app.tell(rich_response); // Sending the details to the user & closing app.

          }
        } else {
          catch_error(app); // Something's wrong with the HUG server!
        }
      })
    }

    function committee_One(app) {
      /*
        committee_One function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('committee_One', 1, parameter); // Need to set the data
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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

    function fees(app) {
      /*
        fees function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('fees', 1, parameter); // Need to set the data
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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
        `Placeholder.` +
        `</speak>`;

      const textToSpeech2 = `<speak>` +
        `Placeholder.` +
        `</speak>`;

      const displayText1 = `Placeholder`;

      const displayText2 = `Placeholder`;

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      card.addSimpleResponse({
        speech: textToSpeech2,
        displayText: displayText2
      });

      //if (hasScreen === true) {
      //  rich_response.addSuggestions(['1', '2', '3', 'Quit']);
      //}

      //app.ask(rich_response); // Sending the details to the user, awaiting input!
      app.tell(rich_response); // Sending the details to the user & closing app.
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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

    function market_Overbook(app) {
      /*
        market_Overbook function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('market_Overbook', 1, parameter); // Need to set the data
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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

    function market_Ticker(app) {
      /*
        market_Ticker function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('market_Ticker', 1, parameter); // Need to set the data
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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

    function market_TradeHistory(app) {
      /*
        market_TradeHistory function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('market_TradeHistory', 1, parameter); // Need to set the data
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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

    function network(app) {
      /*
        network function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('network', 1, parameter); // Need to set the data
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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
        `Placeholder.` +
        `</speak>`;

      const textToSpeech2 = `<speak>` +
        `Placeholder.` +
        `</speak>`;

      const displayText1 = `Placeholder`;

      const displayText2 = `Placeholder`;

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      card.addSimpleResponse({
        speech: textToSpeech2,
        displayText: displayText2
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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

    function witness_One(app) {
      /*
        witness_One function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('witness_One', 1, parameter); // Need to set the data
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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
        `Placeholder.` +
        `</speak>`;

      const textToSpeech2 = `<speak>` +
        `Placeholder.` +
        `</speak>`;

      const displayText1 = `Placeholder`;

      const displayText2 = `Placeholder`;

      card.addSimpleResponse({
        speech: textToSpeech1,
        displayText: displayText1
      });

      card.addSimpleResponse({
        speech: textToSpeech2,
        displayText: displayText2
      });

      //if (hasScreen === true) {
      //  rich_response.addSuggestions(['1', '2', '3', 'Quit']);
      //}

      //app.ask(rich_response); // Sending the details to the user, awaiting input!
      app.tell(rich_response); // Sending the details to the user & closing app.
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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

    function worker_One(app) {
      /*
        worker_One function
      */
      app.data.fallbackCount = 0; // Required for tracking fallback attempts!

      const parameter = {}; // The dict which will hold our parameter data
      parameter['placeholder'] = 'placeholder'; // We need this placeholder
      app.setContext('worker_One', 1, parameter); // Need to set the data
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

            // variable = body.assetJSONVariable;

            let rich_response = app.buildRichResponse(); // Rich Response container

            const textToSpeech1 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const textToSpeech2 = `<speak>` +
              `Placeholder.` +
              `</speak>`;

            const displayText1 = `Placeholder`;

            const displayText2 = `Placeholder`;

            rich_response.addSimpleResponse({
              speech: textToSpeech1,
              displayText: displayText1
            });

            rich_response.addSimpleResponse({
              speech: textToSpeech2,
              displayText: displayText2
            });

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

    function handle_no_contexts(app) {
      /*
      Any ghost contexts shall never haunt us again!
      We shall catch cases where the user got to an intent when they shouldn't have.
      Shouldn't be neccessary with correct dialogflow input contexts... :(
      */
      app.setContext('handle_no_contexts', 1, {
        "placeholder": "placeholder"
      });

      let no_context_card = app.buildRichResponse();

      const textToSpeech = `<speak>` +
        `Sorry, you've taken the wrong turn. <break time="0.5s" /> ` +
        `What would you like to do instead? <break time="0.25s" /> ` +
        `</speak>`;

      no_context_card.addSimpleResponse({
        speech: textToSpeech,
        displayText: `Sorry, you've taken the wrong turn.! \n\n ` +
          `What would you like to do instead?`
      });

      if (hasScreen === true) {
        no_context_card.addSuggestions(['A', 'B', 'C', `D`, 'Help', `Quit`]);
      }

      app.ask(no_context_card); // FIRE!
    }

    function handleNoContextsFallback(app) {
      /*
      Fallback function for the GOAT intent!
      */
      console.log("HANDLE NO CONTEXTS FALLBACK TRIGGERED!");

      const NO_CONTEXTS_FALLBACK = [
        "Sorry, what do you want to do next?",
        "I didn't catch that. Do you want to A, B or C?",
        "I'm having difficulties understanding what you want to do with Beyond Bitshares. Do you want to A, B, C or D?"
      ];

      let current_fallback_phrase = NO_CONTEXTS_FALLBACK[app.data.fallbackCount];

      let fallbackCard = app.buildRichResponse();
      fallbackCard.addSimpleResponse(current_fallback_phrase);
      if (hasScreen === true) {
        // The user has a screen, thus let's show them suggestion chips!
        fallbackCard.addSuggestions(['A', 'B', 'C', `D`, 'Help', `Quit`]);
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
    actionMap.set(BLOCK_ONE_ACTION, block_One);
    //actionMap.set(BLOCK_ONE_FALLBACK, block_One_Fallback);
    actionMap.set(BLOCKCHAIN_OVERVIEW_ACTION, blockchain_Overview);
    //actionMap.set(BLOCKCHAIN_OVERVIEW_FALLBACK, blockchain_Overview_Fallback);
    actionMap.set(COMMITTEE_ACTION, committee);
    //actionMap.set(COMMITTEE_FALLBACK, committee_Fallback);
    actionMap.set(COMMITTEE_ACTIVE_ACTION, committee_Active);
    //actionMap.set(COMMITTEE_ACTIVE_FALLBACK, committee_Active_Fallback);
    actionMap.set(COMMITTEE_ONE_ACTION, committee_One);
    //actionMap.set(COMMITTEE_ONE_FALLBACK, committee_One_Fallback);
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
