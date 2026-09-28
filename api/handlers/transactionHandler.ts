import { query } from "../utils/db";
import { getAccount } from "./accountHandler";

export const withdrawal = async (accountID: string, amount: number) => {
    const account = await getAccount(accountID);

    if (amount > 200) { // (Numbers like these would be better as constants or config values, but for this exercise I'm just hardcoding them)
        throw new Error("You can only withdraw up to $200 per transaction.");
    }
    if (amount % 5 !== 0) {
        throw new Error("Withdrawals must be a multiple of $5.");
    }
    

    // Limit to $400 per day
    const q = await query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM withdrawals
        WHERE account_number = $1 AND created_at >= CURRENT_DATE`,
        [accountID]
    );
    if (Number(q.rows[0].total) + amount > 400) {
        throw new Error("You can only withdraw up to $400 per day.");
    }

    if (account.type === "credit") {
        // Note that credit balances are NEGATIVE (so the lowest allowed balance is -credit_limit)
        if (account.amount - amount < -account.credit_limit) {
            throw new Error("This withdrawal exceeds your credit limit.");
        }
    } else if (amount > account.amount) {
        throw new Error("Insufficient funds.");
    }

    account.amount -= amount;
    const res = await query(`
        UPDATE accounts
        SET amount = $1 
        WHERE account_number = $2`,
        [account.amount, accountID]
    );

    if (res.rowCount === 0) {
        throw new Error("Transaction failed");
    }

    return account;
}

export const deposit = async (accountID: string, amount: number) => {
    const account = await getAccount(accountID);

    if (amount > 1000) { // (again, this would be better as a constant or config value but keeping here for simplicity)
        throw new Error("You can only deposit up to $1000 per transaction.");
    }
    // A credit deposit pays down what is owed (can't take it above 0)
    if (account.type === "credit" && account.amount + amount > 0) {
        throw new Error("You cannot deposit more than you owe on a credit account.");
    }

    account.amount += amount;
    const res = await query(`
        UPDATE accounts
        SET amount = $1 
        WHERE account_number = $2`,
        [account.amount, accountID]
    );

    if (res.rowCount === 0) {
        throw new Error("Transaction failed");
    }

    return account;
}