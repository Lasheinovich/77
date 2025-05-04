import PDFDocument from "pdfkit"

export async function generateInvoicePdf(invoiceData: {
  invoiceId: string
  customerId: string
  userId: string
  userEmail: string
  amount: number
  date: string
  items: any[]
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const buffers: Buffer[] = []

      doc.on("data", (buffer) => buffers.push(buffer))
      doc.on("end", () => resolve(Buffer.concat(buffers)))

      // Header
      doc
        .fontSize(20)
        .text("The Ark (الفلك)", { align: "center" })
        .fontSize(12)
        .text("Invoice", { align: "center" })
        .moveDown()

      // Invoice details
      doc
        .fontSize(12)
        .text(`Invoice Number: ${invoiceData.invoiceId}`, { align: "left" })
        .text(`Date: ${new Date(invoiceData.date).toLocaleDateString()}`, { align: "left" })
        .text(`Customer ID: ${invoiceData.customerId}`, { align: "left" })
        .text(`Email: ${invoiceData.userEmail}`, { align: "left" })
        .moveDown()

      // Table header
      const tableTop = doc.y + 20
      doc
        .fontSize(10)
        .text("Description", 50, tableTop, { width: 250 })
        .text("Quantity", 300, tableTop, { width: 50 })
        .text("Unit Price", 350, tableTop, { width: 100 })
        .text("Amount", 450, tableTop, { width: 100 })
        .moveDown()

      // Line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown()

      // Table items
      let tableRowY = doc.y
      let totalAmount = 0

      invoiceData.items.forEach((item) => {
        const amount = (item.amount / 100) * item.quantity
        totalAmount += amount

        doc
          .fontSize(10)
          .text(item.description, 50, tableRowY, { width: 250 })
          .text(item.quantity.toString(), 300, tableRowY, { width: 50 })
          .text(`$${(item.amount / 100).toFixed(2)}`, 350, tableRowY, { width: 100 })
          .text(`$${amount.toFixed(2)}`, 450, tableRowY, { width: 100 })

        tableRowY = doc.y + 15
        doc.moveDown()
      })

      // Line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown()

      // Total
      doc
        .fontSize(12)
        .text(`Total Amount: $${totalAmount.toFixed(2)}`, 350, doc.y, { width: 200 })
        .moveDown()

      // Footer
      doc
        .fontSize(10)
        .text("Thank you for your business!", { align: "center" })
        .text("The Ark (الفلك) - Your Eternal AI-Powered World", { align: "center" })
        .text("Where Ideas, Knowledge & Business Unite", { align: "center" })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
