import fs from "fs";
import path from "path";

interface SecretFinding {
  file: string;
  line: number;
  type: string;
  snippet: string;
}

const FORBIDDEN_STRINGS = [
  { pattern: /YlNcGgXrSk5UBCLg/g, name: "Leaked Legacy Database Credential (1)" },
  { pattern: /YTzpwxsaVCPGBUc/g, name: "Leaked Legacy Database Credential (2)" },
  { pattern: /411c3f2a3d4060bc797340f28a3cb72b/g, name: "Leaked Legacy Hash/Key" },
  { pattern: /NEXT_PUBLIC_API_INDONESIA_KEY/g, name: "Dangerous NEXT_PUBLIC Exposing API Key" },
  { pattern: /NEXT_PUBLIC_DATABASE_URL/g, name: "Dangerous NEXT_PUBLIC Exposing Database URL" },
  { pattern: /aip_live_[a-zA-Z0-9]{16,}/g, name: "Hardcoded API Indonesia Production Key" },
];

const SCAN_DIRS = ["src", "scripts", "ml-service"];
const IGNORED_FILES = [".env", ".env.local", ".env.example", "scan-secrets.ts"];

function scanDirectory(dirPath: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  if (!fs.existsSync(dirPath)) return findings;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
        findings.push(...scanDirectory(fullPath));
      }
    } else if (entry.isFile()) {
      const fileName = entry.name;
      if (IGNORED_FILES.some((ignored) => fileName.endsWith(ignored))) {
        continue;
      }

      // Scan text files only
      const ext = path.extname(fileName);
      if (![".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".py", ".md", ".yml", ".yaml"].includes(ext)) {
        continue;
      }

      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i];

          for (const rule of FORBIDDEN_STRINGS) {
            // Reset regex state
            rule.pattern.lastIndex = 0;
            if (rule.pattern.test(lineText)) {
              findings.push({
                file: path.relative(process.cwd(), fullPath),
                line: i + 1,
                type: rule.name,
                snippet: lineText.trim().slice(0, 80),
              });
            }
          }
        }
      } catch (err) {
        console.warn(`[scan-secrets] Gagal membaca berkas: ${fullPath} - ${(err as Error).message}`);
      }
    }
  }

  return findings;
}

function main() {
  console.log("=========================================================");
  console.log(" 🔍 PantauPangan v2.0 - Secret & Credential Leak Scanner ");
  console.log("=========================================================\n");

  const allFindings: SecretFinding[] = [];

  for (const dir of SCAN_DIRS) {
    const fullDir = path.resolve(process.cwd(), dir);
    console.log(`Scanning directory: ./${dir}...`);
    allFindings.push(...scanDirectory(fullDir));
  }

  console.log("\n---------------------------------------------------------");
  if (allFindings.length === 0) {
    console.log("✅ HASIL SCAN: 0 Temuan Kredensial Bocor. Pohon kode aman!");
    console.log("---------------------------------------------------------\n");
    process.exitCode = 0;
  } else {
    console.error(`❌ HASIL SCAN: Ditemukan ${allFindings.length} potensi kebocoran kredensial!\n`);
    console.table(
      allFindings.map((f) => ({
        File: `${f.file}:${f.line}`,
        Jenis: f.type,
        Kutipan: f.snippet,
      }))
    );
    console.log("---------------------------------------------------------\n");
    process.exitCode = 1;
  }
}

main();
