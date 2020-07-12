# TIN Bank example

Bank example implementation that supporst sync/async flow based on configuration parameters.

> It uses online signing

## Make it run

### Install dependencies

    $ npm install

### Run in dev mode

    $ npm run dev

### Run in debug mode

    $ npm run debug

### Config files

In the next file `config/default.js` is necessary to change for the information in favor of the one is needed for the environment.

Create and fill out `.env` file based on the structure of `env-example`

## Bank configuration

The default bank configuration looks like this:

    DEFAULT_CONFIG = {
      createActionError: false,
      signActionError: false,
      continueCallDelay: 0,
      responseDelay: 0,
      asyncFlow: true,
      error: null,
      regularFlowError: true,
      reverseFlowError: false
    }

### Config erros

If any error is setup it is going to be thrown only on regular flow
to be thrown on reverse flow it must be setup explicitly.

    createActionError: false,
    signActionError: false,
    error: null
    regularFlowError: true,
    reverseFlowError: false


### Config flow

By default the flow the banks managed is async with no delay on the response.

    asyncFlow: true,
    continueCallDelay: 0,
    responseDelay: 0,
