# @sommelier/shared

Shared types and resources between Sommelier Applications

## Coded Errors

We export a number of coded errors in the `errors` module which can be accessed by the error name or code. When creating your own error, the error code should fall into the correct category and the message should be an English sentence.

The details property is meant for additional details to be used by the user that may be specific to a scenario in which the error is being used. In those cases, clone the error via 'error.clone()' and call 'error.setDetails(string)' on the new error object.

For example, the ValidationError can be used for all types of validations but each validator will validate different parameters. The details property should describe which parameters are not passing validations.

### Error Codes

#### 100-x: ??

-   100 : Could not validate parameters.

#### 1000-x: Errors from an upstream service

-   1000 : Encountered error with upstream service. (Generic error so we don't leak upstream service information)
-   1001 : Upstream service missing data for pool.
