<center>![](https://i.imgur.com/RhXrYPr.png)</center>

# 'Beyond Bitshares' - An open source Google Assistant bot!

In my last couple Steemit posts, I wrote about [developing a HUG REST API](https://steemit.com/bitshares/@cm-steem/several-updates-for-the-bitshares-hug-rest-api) for the read-only [python-bitshares](https://github.com/xeroc/python-bitshares) functions in order to expose said functionality for public Bitshares service utilization.

Given the open source nature of the [HUG REST API](https://github.com/BTS-CM/Bitshares-HUG-REST-API) & the in depth installation documentation, anyone can utilize the tech for whatever Bitshares project they're interested in implementing.

My next Bitshares project is a [Google Assistant](https://assistant.google.com/), this will potentially expose millions of new users to Bitshares through their mobile phones, their watches (in the future) and their dedicated google home devices. It will be first launched in English, and translated into multiple languages once in a production state.

## How?

![](https://steemitimages.com/DQmTMv8qRoiehEt1aKA4hcXQTyCArVP8grwoCdSn8PKTy1Z/image.png)

### Bitshares HUG REST API

The Bitshares HUG REST API repo provides the Bitshares network an open-source high performance interface to the Bitshares network through simple GET requests.

We will be interacting with the HUG REST API server directly using NodeJS hosted on Firebase Cloud Functions (see below).

#### Pricing

For each 1 CPU, we can get between 2-4 workers to interact with NodeJS function calls, so each CPU should serve approx 10-15 Google Assistant users. I currently use Vultr which has reasonable pricing for VPS, I'm currently paying $10/month for a single core VPS to host the HUG server.

---

<center>![](https://avatars3.githubusercontent.com/u/21685097?s=460&v=4)</center>

### Oxarbitrage's "[BPAB - Bitshares Python Api Backend](https://github.com/oxarbitrage/bitshares-python-api-backend)"

My Bitshares HUG REST API does not provide some of the more advanced functionality than that which Oxarbitrage's "BPAB - Bitshares Python Api Backend" provides.

In the future, I'll investigate original (non copy/pasted) HUG implementation, however for the short term I will likely utilize this API for the following functions:

* [Top Proxies](http://23.94.69.140:5000/top_proxies)
* [Top Markets](http://23.94.69.140:5000/top_markets)
* [Top Smartcoins](http://23.94.69.140:5000/top_smartcoins)
* [Top UIAs](http://23.94.69.140:5000/top_uias)
* [Get most active markets](http://23.94.69.140:5000/get_most_active_markets)

---

![](https://steemitimages.com/DQmd8AhU65LuXQTQtYGp4EesbiMU5eRQ7QrkysxGP13QZmn/image.png)

### Dialogflow

I'll be utilizing [Dialogflow](https://dialogflow.com/) (formerly API.AI, bought by Google in 2017) to handle the interpretation of user input, producing rich entities (for the fees & about section for now, perhaps assets later) and to build the intent functionality/logic which is effectively the skeleton of the Google Assistant.

With Dialogflow, you create an intent and provide it 'User says' information such as "Show me the current USD:BTS orderbooks" and Dialogflow will detect which intent to trigger (the orderbook intent), as well as extract the trading pair (USD:BTS in this case) for providing as input to NodeJS (and subsequently the HUG REST API).

What I find most difficult about using DialogFlow currently is that users don't have to follow set out paths through the bot, they can trigger any area of the bot (unless certain steps are mandatory) so you need to account for the user being in one area of the bot's functionality then jumping to another area without bringing along historical data from the previous intent/function which could glitch the operation of the bot unexpectedly. You have to program defensively against this issue whenever expecting input from the user.

For the first version of the bot, once the user is provided information they will be force-quit out of the bot (using app.tell()) rather than asking them what they want to do next. The reason for this is that when you ask (app.ask()) what they want to do next, you need to provide a fallback intent (if they provide invalid user input, re-prompting as error handling) for each intent (at the moment there's approx 28 such intent functions) so their coding right now would be throwing thousands of lines of template code in without real functionality - so it's on the back burner for now!

Pricing: FREE!

Repo link: [BeyondBitshares-Dialogflow](https://github.com/BTS-CM/BeyondBitshares-Dialogflow)

---

![](https://steemitimages.com/DQmSiHrTSvMgfb4ardKsKCJb162tdSAbz3ye8kWhjcFYB79/image.png)

### Firebase

I'll be utilizing [Firebase's cloud function hosting](https://firebase.google.com/products/functions/) to provide Dialogflow the webhook fullfilment required to communicate with once the user has triggered intents through the Google Assistant application/device.

Code hosted on the Firebase cloud function platform is programmed in [NodeJS](https://nodejs.org/en/), it's not too difficult to be honest, difficulties arise in the lack of complete documentation (likely to be fixed by Google & its community) and the fact that we'll we working with a single huge NodeJS script (instead of many files).

With the current template code in place (only about 10% complete the current functionality), the line count is already over 2000 lines so it'll probably end up 4000 lines before we start throwing in additional language support.

#### Pricing

Since we're going to be interacting with the Bitshares HUG REST API (an external networked service), we cannot use Firebase's free tier (only allows external networking to Google services). The cheaper option for now is to pick the 'Blaze Plan'.

![](https://steemitimages.com/DQmX7TTmxFLuGWa344PTQY9bpwmLit1mZ6r4f3YstFkw9Zj/image.png)

Repo link: [BeyondBitshares-Firebase](https://github.com/BTS-CM/BeyondBitshares-Firebase)

## License?

I've open sourced this entire project using the MIT license (both the [Dialogflow](https://github.com/BTS-CM/BeyondBitshares-Dialogflow) and the [NodeJS web fulfillment](https://github.com/BTS-CM/BeyondBitshares-Firebase) code components). The HUG REST API code is already MIT licensed on GitHub.

With this project anyone will be able to fork and run their own clone of the Beyond Bitshares bot. Hopefully rather than immediately forking and competing though we'll work on the one bot together :)

## TODO

* Potentially update HUG REST API to include 'success' fields when everything went well, we're already checking for this in the Firebase code.
* Work on each of the intent's functions, interacting with the data retrieved from HUG. This is probably the largest area of work right now.
* Work on each intent's "User says" sections, including the handling of parameters (Account, Asset, Worker, Committee member, etc..).
* Move from App.Tell() (force quitting after fulfilling user request) to App.Ask() to continue the user's interaction with the bot.
  * This will require providing each intent with a fallback intent, probably a thousand lines of near duplicate code unless I can squish it down somehow..
* Investigate Asset entity generation, so that USD can be called by 'USD, bitUSD, united states dollar market pegged asset, USD smartcoin, etc...).

## Thoughts?

I'd love to hear your thoughts about this project, anyone interested in using or helping develop this bot? Do you think this will be beneficial for the Bitshares network?

What are your initial impressions of the Google Assistant compared to other bots?

Do you have your own ideas for a Google Assistant bot?

---

Best regards,
@cm-steem
