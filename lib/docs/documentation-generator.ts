interface DocItem {
  name: string
  description: string
  type: "component" | "hook" | "utility" | "api" | "page"
  usage?: string
  props?: {
    name: string
    type: string
    description: string
    required: boolean
    defaultValue?: string
  }[]
  returns?: {
    type: string
    description: string
  }
  examples?: string[]
  notes?: string[]
  file?: string
}

class DocumentationGenerator {
  private static instance: DocumentationGenerator
  private docs: Map<string, DocItem> = new Map()

  private constructor() {}

  public static getInstance(): DocumentationGenerator {
    if (!DocumentationGenerator.instance) {
      DocumentationGenerator.instance = new DocumentationGenerator()
    }
    return DocumentationGenerator.instance
  }

  /**
   * Add documentation for an item
   */
  addDoc(item: DocItem): void {
    this.docs.set(item.name, item)
  }

  /**
   * Get documentation for an item
   */
  getDoc(name: string): DocItem | undefined {
    return this.docs.get(name)
  }

  /**
   * Get all documentation items
   */
  getAllDocs(): DocItem[] {
    return Array.from(this.docs.values())
  }

  /**
   * Get documentation by type
   */
  getDocsByType
}
