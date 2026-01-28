const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const address = process.argv[2];
    if (!address) throw new Error("Usage: node scripts/find-build-info.js <contractAddress>");

    const onchain = (await ethers.provider.getCode(address)).replace(/^0x/, "").toLowerCase();
    if (!onchain || onchain === "0x" || onchain === "") throw new Error("No code at address (wrong network/address)");

    const dir = path.join(process.cwd(), "artifacts", "build-info");
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));

    const matches = [];

    for (const f of files) {
        const p = path.join(dir, f);
        const j = JSON.parse(fs.readFileSync(p, "utf8"));
        const contracts = j.output?.contracts;
        if (!contracts) continue;

        for (const fileName of Object.keys(contracts)) {
            for (const contractName of Object.keys(contracts[fileName])) {
                const obj = contracts[fileName][contractName]?.evm?.deployedBytecode?.object;
                if (!obj) continue;
                if (obj.toLowerCase() === onchain) {
                    matches.push({ buildInfo: p, fileName, contractName });
                }
            }
        }
    }

    if (!matches.length) {
        console.log("No exact match found in artifacts/build-info. (Maybe proxy? Or different compiler/settings.)");
        process.exit(1);
    }

    console.log("MATCHES:");
    for (const m of matches) {
        console.log(`- ${m.buildInfo}`);
        console.log(`  ${m.fileName}:${m.contractName}`);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
