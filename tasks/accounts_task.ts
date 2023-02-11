import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';

task("accounts", "Prints the list of accounts", async () => {
    const accounts = await ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});
