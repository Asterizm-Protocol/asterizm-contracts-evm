const fs = require("fs");
const path = require("path");

function getJsonRpcProvider(ethers, url) {
    // ethers v6 / v5 совместимость
    if (ethers.JsonRpcProvider) return new ethers.JsonRpcProvider(url);
    return new ethers.providers.JsonRpcProvider(url);
}

async function main() {
    const [rpcUrl, address] = process.argv.slice(2);

    if (!rpcUrl || !address) {
        console.error("Usage: node scripts/find-build-info-standalone.js <rpcUrl> <contractAddress>");
        process.exit(1);
    }

    const ethers = require("ethers");
    const provider = getJsonRpcProvider(ethers, rpcUrl);

    const onchain = (await provider.getCode(address)).replace(/^0x/, "").toLowerCase();
    if (!onchain) {
        console.error("No code at address (wrong network/address)");
        process.exit(1);
    }

    const dir = path.join(process.cwd(), "artifacts", "build-info");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

    const matches = [];
    for (const f of files) {
        const p = path.join(dir, f);
        const j = JSON.parse(fs.readFileSync(p, "utf8"));
        const contracts = j.output?.contracts;
        if (!contracts) continue;

        for (const fileName of Object.keys(contracts)) {
            for (const contractName of Object.keys(contracts[fileName])) {
                const obj = contracts[fileName][contractName]?.evm?.deployedBytecode?.object;
                if (obj && obj.toLowerCase() === onchain) {
                    matches.push({ buildInfo: p, fileName, contractName });
                }
            }
        }
    }

    if (!matches.length) {
        console.log("No exact match in artifacts/build-info.");
        console.log("Often errors: (1) using proxy, (2) another project/compiler, (3) different bytecode with linking/metadata.");
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
