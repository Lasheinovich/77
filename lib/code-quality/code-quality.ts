import { logger } from "@/lib/logger"

interface CodeQualityIssue {
  type: "error" | "warning" | "info"
  message: string
  file?: string
  line?: number
  column?: number
  code?: string
  rule?: string
  severity: number
  fix?: () => void
}

interface CodeQualityReport {
  issues: CodeQualityIssue[]
  summary: {
    errors: number
    warnings: number
    info: number
    fixable: number
  }
  files: {
    name: string
    issues: number
    errors: number
    warnings: number
  }[]
}

class CodeQualityChecker {
  private static instance: CodeQualityChecker
  private issues: CodeQualityIssue[] = []
  private rules: Map<string, (code: string, file: string) => CodeQualityIssue[]> = new Map()

  private constructor() {
    // Register default rules
    this.registerDefaultRules()
  }

  public static getInstance(): CodeQualityChecker {
    if (!CodeQualityChecker.instance) {
      CodeQualityChecker.instance = new CodeQualityChecker()
    }
    return CodeQualityChecker.instance
  }

  /**
   * Register default code quality rules
   */
  private registerDefaultRules(): void {
    // Example rule: Check for console.log statements
    this.registerRule("no-console", (code, file) => {
      const issues: CodeQualityIssue[] = []

      // Simple regex-based check
      const regex = /console\.(log|warn|error|info|debug)\(/g
      let match

      while ((match = regex.exec(code)) !== null) {
        issues.push({
          type: "warning",
          message: `Unexpected console.${match[1]} statement`,
          file,
          code: match[0],
          rule: "no-console",
          severity: 1,
        })
      }

      return issues
    })

    // Example rule: Check for TODO comments
    this.registerRule("no-todo-comments", (code, file) => {
      const issues: CodeQualityIssue[] = []

      // Simple regex-based check
      const regex = /\/\/\s*TODO:?|\/\*\s*TODO:?|<!--\s*TODO:?/g
      let match

      while ((match = regex.exec(code)) !== null) {
        issues.push({
          type: "info",
          message: "TODO comment found",
          file,
          code: match[0],
          rule: "no-todo-comments",
          severity: 0,
        })
      }

      return issues
    })

    // Example rule: Check for long lines
    this.registerRule("max-line-length", (code, file) => {
      const issues: CodeQualityIssue[] = []
      const maxLength = 100

      const lines = code.split("\n")

      lines.forEach((line, index) => {
        if (line.length > maxLength) {
          issues.push({
            type: "warning",
            message: `Line exceeds maximum length of ${maxLength}`,
            file,
            line: index + 1,
            code: line.length > 50 ? line.substring(0, 47) + "..." : line,
            rule: "max-line-length",
            severity: 1,
          })
        }
      })

      return issues
    })
  }

  /**
   * Register a new code quality rule
   */
  registerRule(name: string, rule: (code: string, file: string) => CodeQualityIssue[]): void {
    this.rules.set(name, rule)
  }

  /**
   * Check code quality for a file
   */
  checkFile(file: string, code: string): CodeQualityIssue[] {
    const fileIssues: CodeQualityIssue[] = []

    // Apply each rule
    for (const [name, rule] of this.rules.entries()) {
      try {
        const issues = rule(code, file)
        fileIssues.push(...issues)
      } catch (error) {
        logger.error(`Error applying rule ${name} to file ${file}`, { error })
      }
    }

    // Add to global issues list
    this.issues.push(...fileIssues)

    return fileIssues
  }

  /**
   * Generate a code quality report
   */
  generateReport(): CodeQualityReport {
    const fileMap = new Map<
      string,
      {
        issues: number
        errors: number
        warnings: number
      }
    >()

    // Count issues by file
    for (const issue of this.issues) {
      if (!issue.file) continue

      if (!fileMap.has(issue.file)) {
        fileMap.set(issue.file, {
          issues: 0,
          errors: 0,
          warnings: 0,
        })
      }

      const fileStats = fileMap.get(issue.file)!
      fileStats.issues++

      if (issue.type === "error") {
        fileStats.errors++
      } else if (issue.type === "warning") {
        fileStats.warnings++
      }
    }

    // Generate summary
    const summary = {
      errors: this.issues.filter((issue) => issue.type === "error").length,
      warnings: this.issues.filter((issue) => issue.type === "warning").length,
      info: this.issues.filter((issue) => issue.type === "info").length,
      fixable: this.issues.filter((issue) => !!issue.fix).length,
    }

    // Generate files list
    const files = Array.from(fileMap.entries()).map(([name, stats]) => ({
      name,
      ...stats,
    }))

    return {
      issues: [...this.issues],
      summary,
      files,
    }
  }

  /**
   * Clear all issues
   */
  clearIssues(): void {
    this.issues = []
  }

  /**
   * Get all issues
   */
  getIssues(): CodeQualityIssue[] {
    return [...this.issues]
  }

  /**
   * Apply automatic fixes
   */
  applyFixes(): number {
    let fixCount = 0

    for (const issue of this.issues) {
      if (issue.fix) {
        try {
          issue.fix()
          fixCount++
        } catch (error) {
          logger.error(`Error applying fix for issue: ${issue.message}`, { error, issue })
        }
      }
    }

    return fixCount
  }
}

// Export singleton instance
export const codeQualityChecker = CodeQualityChecker.getInstance()
