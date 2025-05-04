/**
 * Security Analysis Script for Ark7 Divine Frontend
 *
 * This script parses npm audit JSON output, classifies vulnerabilities by severity,
 * and generates a comprehensive security report with actionable recommendations.
 */

const fs = require("fs");
const path = require("path");

// Configuration
const AUDIT_FILE_PATH = path.resolve(
  __dirname,
  "../.ark7_hyperlogs/npm-audit-report.json"
);
const OUTPUT_DIR = path.resolve(__dirname, "../.ark7_hyperlogs");
const REPORT_FILE_PATH = path.resolve(
  OUTPUT_DIR,
  "frontend-security-report.md"
);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Read and parse the npm audit JSON file
 */
function parseAuditFile() {
  try {
    const auditData = fs.readFileSync(AUDIT_FILE_PATH, "utf8");
    return JSON.parse(auditData);
  } catch (error) {
    console.error(`Error reading or parsing audit file: ${error.message}`);
    return { vulnerabilities: {} };
  }
}

/**
 * Classify vulnerabilities by severity
 */
function classifyVulnerabilities(auditData) {
  const counts = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0,
    total: 0,
  };

  const vulnerabilities = {
    critical: [],
    high: [],
    moderate: [],
    low: [],
    info: [],
  };

  // Process vulnerabilities
  if (auditData.vulnerabilities) {
    Object.entries(auditData.vulnerabilities).forEach(([pkgName, vuln]) => {
      const severity = vuln.severity.toLowerCase();

      if (counts[severity] !== undefined) {
        counts[severity]++;
        counts.total++;

        vulnerabilities[severity].push({
          package: pkgName,
          severity: vuln.severity,
          via: Array.isArray(vuln.via)
            ? vuln.via
                .map((v) => (typeof v === "string" ? v : v.name || "Unknown"))
                .join(", ")
            : vuln.via,
          effects: vuln.effects || [],
          fixAvailable: vuln.fixAvailable || false,
          depth: vuln.depth || "unknown",
        });
      }
    });
  }

  return { counts, vulnerabilities };
}

/**
 * Generate security recommendations based on findings
 */
function generateRecommendations(vulnInfo) {
  const recommendations = [];

  // Critical and high severity recommendations
  if (vulnInfo.counts.critical > 0 || vulnInfo.counts.high > 0) {
    recommendations.push("## 🔴 Critical Security Recommendations");
    recommendations.push("");
    recommendations.push("These issues require immediate attention:");
    recommendations.push("");
    recommendations.push("- Update vulnerable dependencies immediately");
    recommendations.push(
      "- Run `npm run security:fix` to attempt automatic remediation"
    );
    recommendations.push(
      "- Consider replacing severely vulnerable packages with safer alternatives"
    );
    recommendations.push(
      "- Add runtime protection mechanisms for unavoidable vulnerabilities"
    );
    recommendations.push("");
  }

  // General recommendations
  recommendations.push("## 🟠 General Recommendations");
  recommendations.push("");
  recommendations.push("- Keep dependencies updated with regular audits");
  recommendations.push("- Add `npm run security:check` to your CI/CD pipeline");
  recommendations.push(
    "- Consider using `npm-audit-resolver` for vulnerabilities that cannot be fixed immediately"
  );
  recommendations.push(
    "- Implement Content Security Policy (CSP) headers for additional protection"
  );
  recommendations.push(
    "- Use SRI (Subresource Integrity) for third-party scripts"
  );
  recommendations.push("");

  // Best practices
  recommendations.push("## 🟢 Security Best Practices");
  recommendations.push("");
  recommendations.push(
    "- Update to the latest stable versions of React and Next.js"
  );
  recommendations.push("- Use strict CSP policies in production");
  recommendations.push("- Implement proper input validation with zod schemas");
  recommendations.push(
    "- Follow the principle of least privilege for API access"
  );
  recommendations.push("- Enable security headers using the next-safe package");
  recommendations.push("");

  return recommendations.join("\n");
}

/**
 * Generate and save the security report
 */
function generateReport(vulnInfo) {
  const timestamp = new Date().toISOString();

  const reportLines = [
    "# Ark7 Divine Frontend Security Report",
    "",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "## Summary",
    "",
    `Total vulnerabilities: ${vulnInfo.counts.total}`,
    `- Critical: ${vulnInfo.counts.critical}`,
    `- High: ${vulnInfo.counts.high}`,
    `- Moderate: ${vulnInfo.counts.moderate}`,
    `- Low: ${vulnInfo.counts.low}`,
    `- Info: ${vulnInfo.counts.info}`,
    "",
  ];

  // Add detailed vulnerability sections by severity
  ["critical", "high", "moderate", "low"].forEach((severity) => {
    if (vulnInfo.vulnerabilities[severity].length > 0) {
      reportLines.push(
        `## ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity Issues`
      );
      reportLines.push("");

      vulnInfo.vulnerabilities[severity].forEach((vuln) => {
        reportLines.push(`### ${vuln.package}`);
        reportLines.push("");
        reportLines.push(`- **Severity**: ${vuln.severity}`);
        reportLines.push(`- **Vulnerable Dependency**: ${vuln.via}`);
        reportLines.push(
          `- **Fix Available**: ${vuln.fixAvailable ? "Yes" : "No"}`
        );
        reportLines.push(`- **Dependency Depth**: ${vuln.depth}`);

        if (vuln.effects.length > 0) {
          reportLines.push(`- **Affects**: ${vuln.effects.join(", ")}`);
        }

        reportLines.push("");
      });
    }
  });

  // Add recommendations
  reportLines.push(generateRecommendations(vulnInfo));

  // Add footer
  reportLines.push("---");
  reportLines.push("");
  reportLines.push(
    "This report is generated automatically by the Ark7 Divine security analysis script."
  );
  reportLines.push(
    "For more information, consult the npm audit documentation or run `npm audit --json` manually."
  );

  // Write the report to a file
  try {
    fs.writeFileSync(REPORT_FILE_PATH, reportLines.join("\n"));
    console.log(`Security report generated at ${REPORT_FILE_PATH}`);
  } catch (error) {
    console.error(`Error writing security report: ${error.message}`);
  }
}

/**
 * Main function
 */
function main() {
  console.log("Analyzing npm audit results...");

  // Parse audit data
  const auditData = parseAuditFile();

  // Classify vulnerabilities
  const vulnInfo = classifyVulnerabilities(auditData);

  // Generate report
  generateReport(vulnInfo);

  // Output summary to console
  console.log("=== Security Analysis Summary ===");
  console.log(`Total vulnerabilities: ${vulnInfo.counts.total}`);
  console.log(`Critical: ${vulnInfo.counts.critical}`);
  console.log(`High: ${vulnInfo.counts.high}`);
  console.log(`Moderate: ${vulnInfo.counts.moderate}`);
  console.log(`Low: ${vulnInfo.counts.low}`);

  if (vulnInfo.counts.critical > 0 || vulnInfo.counts.high > 0) {
    console.log("\n⚠️ CRITICAL OR HIGH SEVERITY VULNERABILITIES DETECTED!");
    console.log("Run npm run security:fix to attempt automatic remediation");
  }

  console.log(`\nDetailed report available at: ${REPORT_FILE_PATH}`);
}

// Execute the main function
main();
