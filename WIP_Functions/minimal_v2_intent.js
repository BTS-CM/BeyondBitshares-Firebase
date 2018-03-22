app.intent('Template', conv => {
  const qs_input = {
    //  HUG REST GET request parameters
    api_key: '123abc'
  };
  return hug_request('external_api_function', 'GET', qs_input)
  .then(body => {



    const hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')

    if (hasScreen === true) {
      try {
        return conv.close(

      } catch (err) {
        // Catch unexpected changes to async handling
        catch_error(conv, err);
      }
    } else {
      try {
        return conv.close(

        );
      } catch (err) {
        // Catch unexpected changes to async handling
        catch_error(conv, err);
      }
    }

  })
  .catch(error_message => {
    catch_error(conv, error_message);
  });
})
