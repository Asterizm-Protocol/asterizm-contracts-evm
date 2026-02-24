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
JSON Input logic
- See contract input path in artifacts/contracts/.../*.dbg.json
- Call code (XXXXX.json - filename from )artifacts/contracts/.../*.dbg.json:
    ```shell
    node -e "
    const fs=require('fs');
    const p=process.argv[1];
    const j=JSON.parse(fs.readFileSync(p,'utf8'));
    process.stdout.write(JSON.stringify(j.input));
    " artifacts/build-info/XXXXX.json > standard-input.json
    ```
- Verify on scanner form (Standard JSON Input)

Flatten logic:
- npx hardhat flatten {path-to-main-*.sol} > new-flattened.sol
- Verify on scanner form (Solidity Single file)
