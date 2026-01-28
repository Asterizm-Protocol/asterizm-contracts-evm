# Asterizm Protocol contracts

Documentation: [DOCS.md](./DOCS.md) and [Asterizm Docs](https://docs.asterizm.io/)

Run tests:
```shell
npm i
cp .env.example .env
npx hardhat node
# Update "..._LOCALHOST" variables in .env file (get data from node command)
npx hardhat test
```
Before the deployment you will also need to update your .env file:

- add scan API keys for networks that are used;
- add owner data;
- add Fireblocks config if it is used.

All private data is stored inside .env file.

### Verify contracts
- See contract input path in artifacts/contracts/.../*.dbg.json
- Verify on scanner form
