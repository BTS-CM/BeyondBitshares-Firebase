function asset_Many(app) {
  /*
    asset_Many function
  */
  app.data.fallbackCount = 0; // Required for tracking fallback attempts!

  const parameter = {}; // The dict which will hold our parameter data
  parameter['placeholder'] = 'placeholder'; // We need this placeholder
  app.setContext('asset_Many', 1, parameter); // Need to set the data
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

        //app.ask(card); // Sending the details to the user, awaiting input!
        app.tell(rich_response); // Sending the details to the user & closing app.

      }
    } else {
      catch_error(app); // Something's wrong with the HUG server!
    }
  })
}
