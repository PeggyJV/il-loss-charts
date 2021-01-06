# il-loss-charts
Ideas for the IL loss charts

### Problem
During our discussions of the Impermanent Loss (IL) usecase it was brought up that we should, as a way of marketing our product, have a way for users to see how much money they are losing as a result of IL. This would be a marketing asset that would live on our home page and be 1. a utility that all uniswap LPs could use to visualize their IL driving 👀 to peggy.cool 2. a way to show users visually with real numbers what peggy can do to help their LP positions. 

### Requirements/Constraints
In discussions with @taariq the following items are pertinent to this design:

- This is not a part of the web app that would facilitate users making peggy transactions 
- If we required an address as input, users who have their LP tokens in farms would not show up properly w/o additional engineering effort
- Users shouldn't have to sign in with metamask to use the tool
- This asset would be displayed on the main page of peggy.cool and supported via Infura queries/a small go backend

### Design
![il-calc](https://user-images.githubusercontent.com/7452680/100788082-70de6c00-33c9-11eb-9613-6ff9ba6079bc.jpg)

### Design Components:
- Pair picker (top left) - This is a dropdown that allows you to pick any pair from uniswap. We would default this to some common pair so that the UI always is the same and doesn't have an empty state. I'm showing an ETH/DAI example here
- Pair stats (top bar) - These are the basic high level stats for a given pair: USD Liquidity, Volume over time, fees over time. Note there is a picker for 24h/7d to display different time periods. this feature is not necessary, but a nice to have
- User inputs (middle right) - These are the user inputs. First item is the date the LP investment was made. This is required to pull the exchange rate for the assets involved. Once that is done, the user will need to input either the total USD amount of the LP investment or the amount of one of the assets from the pair. These are the 2 required user inputs.
- Calculator output (bottom right) - This is the output, the ideal return (fees + uniswap return), the actual return (ideal return - IL) and the amount of IL this investment is suffering from. The value here defaults to the amounts on the current date, but the user can mouse over the graph on the left and look at historical data too. Note: the amounts here are absolute dollar amounts to show the user clearly what their position is
- Graph (bottom left) - the top line represents the ideal case of just fees and uniswap return. The bottom line represents the actual return. The distance between the two on a given day (represented as a red shaded area) is the IL. Note: the amounts on the Y axis are in $, not %

### Source Material
- [Example Uniswap Queries](https://uniswap.org/docs/v2/API/queries/)
- [Graph Query Explorer for Uniswap](https://thegraph.com/explorer/subgraph/uniswap/uniswap-v2)
- [Existing IL Calculator](https://amm.vav.me/) - Note we would use this same data, just better presented
- [UniswapROI](https://www.uniswaproi.com/#) - A community built tool for understanding Uniswap returns. 
- [info.uniswap.org](https://info.uniswap.org/pairs) - Uniswap stats page
- [1inch exchange](https://1inch.exchange/#/) - Nice UI for a uniswap like thing
- [Uniswap Fee Explainer](https://uniswap.org/docs/v2/advanced-topics/fees/) - For understanding how to calculate the returns
- [Using the API from JS](https://uniswap.org/docs/v2/interface-integration/using-the-api/)
