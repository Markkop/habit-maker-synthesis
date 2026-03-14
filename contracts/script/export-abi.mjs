import fs from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url);
const contractJsonPath = path.join(root.pathname, "out", "HabitMakerCommitments.sol", "HabitMakerCommitments.json");
const abiOutputPath = path.join(root.pathname, "abis", "HabitMakerCommitments.json");

if (!fs.existsSync(contractJsonPath)) {
  console.error(`Missing artifact: ${contractJsonPath}`);
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(contractJsonPath, "utf8"));
fs.mkdirSync(path.dirname(abiOutputPath), { recursive: true });
fs.writeFileSync(
  abiOutputPath,
  `${JSON.stringify({ contractName: "HabitMakerCommitments", abi: artifact.abi }, null, 2)}\n`,
);

console.log(`Wrote ABI to ${abiOutputPath}`);

