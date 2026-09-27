import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const root = new URL("../", import.meta.url).pathname;
const readMigration = (name) => readFile(join(root, "migrations", name), "utf8");

test("provider transaction ID migration preserves existing values and is repeatable", async () => {
  const db = new PGlite();
  try {
    await db.exec(await readMigration("0002_flutterwave_payments.sql"));
    await db.exec(await readMigration("0003_flutterwave_v4.sql"));
    await db.query(`
      insert into payment_intents
        (id, tx_ref, amount, currency, customer_email, items_json, flutterwave_transaction_id)
      values ('old-id', 'old-ref', 5.00, 'USD', 'donor@example.test', '[]', 'legacy-charge-123')
    `);

    const migration = await readMigration("0004_provider_transaction_id.sql");
    await db.exec(migration);
    await db.exec(migration);

    const { rows } = await db.query(
      "select provider_transaction_id from payment_intents where tx_ref = 'old-ref'",
    );
    assert.deepEqual(rows, [{ provider_transaction_id: "legacy-charge-123" }]);
    const { rows: legacyColumn } = await db.query(`
      select column_name from information_schema.columns
      where table_schema = current_schema()
        and table_name = 'payment_intents'
        and column_name = 'flutterwave_transaction_id'
    `);
    assert.deepEqual(legacyColumn, []);
  } finally {
    await db.close();
  }
});
