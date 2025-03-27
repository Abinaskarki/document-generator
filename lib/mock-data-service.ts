// Define types for our mock data
export type MockDataType =
  | "name"
  | "email"
  | "phone"
  | "address"
  | "company"
  | "date"
  | "amount"
  | "id"
  | "description"
  | "product"
  | "quantity"
  | "price"
  | "percentage"
  | "currency"
  | "country"
  | "city"
  | "zipcode"
  | "title"
  | "content"
  | "status"
  | "reference"
  | "custom"

export interface MockDataField {
  name: string
  type: MockDataType
  prefix?: string
  suffix?: string
  format?: string
  options?: string[]
  min?: number
  max?: number
}

export interface MockDataTemplate {
  id: string
  name: string
  description: string
  fields: MockDataField[]
}

// Sample mock data templates for different document types
export const MOCK_DATA_TEMPLATES: MockDataTemplate[] = [
  {
    id: "email",
    name: "Email Template",
    description: "Template for email communications",
    fields: [
      { name: "sender_name", type: "name" },
      { name: "sender_email", type: "email" },
      { name: "receiver_name", type: "name" },
      { name: "receiver_email", type: "email" },
      { name: "subject", type: "title" },
      { name: "message", type: "content" },
      { name: "date", type: "date", format: "YYYY-MM-DD" },
    ],
  },
  {
    id: "invoice",
    name: "Invoice Template",
    description: "Template for invoices and billing",
    fields: [
      { name: "invoice_number", type: "id", prefix: "INV-" },
      { name: "customer_name", type: "name" },
      { name: "customer_email", type: "email" },
      { name: "issue_date", type: "date", format: "YYYY-MM-DD" },
      { name: "due_date", type: "date", format: "YYYY-MM-DD" },
      { name: "item1_description", type: "description" },
      { name: "item1_price", type: "amount", min: 100, max: 1000 },
      { name: "item1_quantity", type: "quantity", min: 1, max: 10 },
      { name: "item1_total", type: "amount", min: 100, max: 10000 },
      { name: "item2_description", type: "description" },
      { name: "item2_price", type: "amount", min: 50, max: 500 },
      { name: "item2_quantity", type: "quantity", min: 1, max: 5 },
      { name: "item2_total", type: "amount", min: 50, max: 2500 },
      { name: "subtotal", type: "amount", min: 150, max: 12500 },
      { name: "tax_rate", type: "percentage", min: 5, max: 25 },
      { name: "tax_amount", type: "amount", min: 10, max: 3000 },
      { name: "total_amount", type: "amount", min: 160, max: 15000 },
      { name: "payment_terms", type: "description" },
      { name: "currency", type: "currency" },
    ],
  },
  {
    id: "contract",
    name: "Contract Template",
    description: "Template for legal contracts and agreements",
    fields: [
      { name: "contract_number", type: "id", prefix: "CTR-" },
      { name: "party1_name", type: "name" },
      { name: "party1_address", type: "address" },
      { name: "party1_representative", type: "name" },
      { name: "party2_name", type: "name" },
      { name: "party2_address", type: "address" },
      { name: "party2_representative", type: "name" },
      { name: "start_date", type: "date", format: "YYYY-MM-DD" },
      { name: "end_date", type: "date", format: "YYYY-MM-DD" },
      { name: "contract_purpose", type: "description" },
      { name: "contract_value", type: "amount", min: 1000, max: 100000 },
      { name: "payment_schedule", type: "description" },
      { name: "termination_clause", type: "description" },
      { name: "governing_law", type: "description" },
    ],
  },
  {
    id: "receipt",
    name: "Receipt Template",
    description: "Template for receipts and payment confirmations",
    fields: [
      { name: "receipt_number", type: "id", prefix: "REC-" },
      { name: "customer_name", type: "name" },
      { name: "transaction_date", type: "date", format: "YYYY-MM-DD" },
      {
        name: "payment_method",
        type: "description",
        options: ["Credit Card", "Cash", "Bank Transfer", "PayPal", "Check"],
      },
      { name: "item_name", type: "product" },
      { name: "amount", type: "amount", min: 10, max: 1000 },
      { name: "tax", type: "amount", min: 1, max: 200 },
      { name: "total", type: "amount", min: 11, max: 1200 },
      { name: "merchant_name", type: "company" },
      { name: "merchant_address", type: "address" },
      { name: "merchant_phone", type: "phone" },
    ],
  },
  {
    id: "letter",
    name: "Letter Template",
    description: "Template for formal letters",
    fields: [
      { name: "sender_name", type: "name" },
      { name: "sender_address", type: "address" },
      { name: "sender_phone", type: "phone" },
      { name: "sender_email", type: "email" },
      { name: "recipient_name", type: "name" },
      { name: "recipient_address", type: "address" },
      { name: "recipient_title", type: "title" },
      { name: "date", type: "date", format: "MMMM D, YYYY" },
      { name: "subject", type: "title" },
      { name: "greeting", type: "description", options: ["Dear", "Hello", "Greetings", "To Whom It May Concern"] },
      { name: "body", type: "content" },
      { name: "closing", type: "description", options: ["Sincerely", "Best Regards", "Yours Truly", "Respectfully"] },
    ],
  },
]

// Generate mock data based on field type
export function generateMockValue(field: MockDataField): string {
  switch (field.type) {
    case "name":
      return getRandomName()
    case "email":
      return getRandomEmail()
    case "phone":
      return getRandomPhone()
    case "address":
      return getRandomAddress()
    case "company":
      return getRandomCompany()
    case "date":
      return getRandomDate(field.format)
    case "amount":
      return getRandomAmount(field.min, field.max)
    case "id":
      return getRandomId(field.prefix)
    case "description":
      if (field.options && field.options.length > 0) {
        return field.options[Math.floor(Math.random() * field.options.length)]
      }
      return getRandomDescription()
    case "product":
      return getRandomProduct()
    case "quantity":
      return getRandomQuantity(field.min, field.max).toString()
    case "price":
      return getRandomAmount(field.min, field.max)
    case "percentage":
      return getRandomPercentage(field.min, field.max)
    case "currency":
      return getRandomCurrency()
    case "country":
      return getRandomCountry()
    case "city":
      return getRandomCity()
    case "zipcode":
      return getRandomZipCode()
    case "title":
      return getRandomTitle()
    case "content":
      return getRandomContent()
    case "status":
      return getRandomStatus()
    case "reference":
      return getRandomReference()
    case "custom":
    default:
      return `Custom Value ${Math.floor(Math.random() * 1000)}`
  }
}

// Generate a complete mock data record based on a template
export function generateMockRecord(template: MockDataTemplate): Record<string, string> {
  const record: Record<string, string> = {}

  template.fields.forEach((field) => {
    record[field.name] = generateMockValue(field)
  })

  // For invoice template, ensure calculations are correct
  if (template.id === "invoice") {
    // Calculate item totals
    if (record.item1_price && record.item1_quantity) {
      const price = Number.parseFloat(record.item1_price.replace(/[^0-9.]/g, ""))
      const quantity = Number.parseInt(record.item1_quantity)
      record.item1_total = formatCurrency(price * quantity)
    }

    if (record.item2_price && record.item2_quantity) {
      const price = Number.parseFloat(record.item2_price.replace(/[^0-9.]/g, ""))
      const quantity = Number.parseInt(record.item2_quantity)
      record.item2_total = formatCurrency(price * quantity)
    }

    // Calculate subtotal
    const item1Total = record.item1_total ? Number.parseFloat(record.item1_total.replace(/[^0-9.]/g, "")) : 0
    const item2Total = record.item2_total ? Number.parseFloat(record.item2_total.replace(/[^0-9.]/g, "")) : 0
    const subtotal = item1Total + item2Total
    record.subtotal = formatCurrency(subtotal)

    // Calculate tax
    const taxRate = record.tax_rate ? Number.parseFloat(record.tax_rate.replace(/[^0-9.]/g, "")) / 100 : 0.1
    const taxAmount = subtotal * taxRate
    record.tax_amount = formatCurrency(taxAmount)

    // Calculate total
    record.total_amount = formatCurrency(subtotal + taxAmount)
  }

  return record
}

// Generate multiple mock records
export function generateMockData(template: MockDataTemplate, count: number): Record<string, string>[] {
  const records: Record<string, string>[] = []

  for (let i = 0; i < count; i++) {
    records.push(generateMockRecord(template))
  }

  return records
}

// Find a template by ID
export function findTemplateById(id: string): MockDataTemplate | undefined {
  return MOCK_DATA_TEMPLATES.find((template) => template.id === id)
}

// Generate mock data for a custom template with specified fields
export function generateCustomMockData(fields: string[], count: number): Record<string, string>[] {
  const records: Record<string, string>[] = []

  for (let i = 0; i < count; i++) {
    const record: Record<string, string> = {}

    fields.forEach((field) => {
      // Try to guess the field type based on the field name
      const fieldType = guessFieldType(field)
      record[field] = generateMockValue({ name: field, type: fieldType })
    })

    records.push(record)
  }

  return records
}

// Guess the field type based on the field name
function guessFieldType(fieldName: string): MockDataType {
  const name = fieldName.toLowerCase()

  if (name.includes("name")) return "name"
  if (name.includes("email")) return "email"
  if (name.includes("phone")) return "phone"
  if (name.includes("address")) return "address"
  if (name.includes("company")) return "company"
  if (name.includes("date")) return "date"
  if (name.includes("amount") || name.includes("total") || name.includes("price")) return "amount"
  if (name.includes("id") || name.includes("number")) return "id"
  if (name.includes("description")) return "description"
  if (name.includes("product")) return "product"
  if (name.includes("quantity") || name.includes("qty")) return "quantity"
  if (name.includes("percentage") || name.includes("rate")) return "percentage"
  if (name.includes("currency")) return "currency"
  if (name.includes("country")) return "country"
  if (name.includes("city")) return "city"
  if (name.includes("zip")) return "zipcode"
  if (name.includes("title") || name.includes("subject")) return "title"
  if (name.includes("content") || name.includes("body") || name.includes("message")) return "content"
  if (name.includes("status")) return "status"
  if (name.includes("reference")) return "reference"

  return "custom"
}

// Helper functions for generating specific types of mock data
function getRandomName(): string {
  const firstNames = [
    "John",
    "Jane",
    "Michael",
    "Emily",
    "David",
    "Sarah",
    "Robert",
    "Jennifer",
    "William",
    "Elizabeth",
    "James",
    "Linda",
    "Richard",
    "Patricia",
    "Thomas",
    "Barbara",
    "Charles",
    "Susan",
    "Daniel",
    "Jessica",
    "Matthew",
    "Margaret",
    "Anthony",
    "Karen",
    "Mark",
    "Nancy",
    "Donald",
    "Lisa",
    "Steven",
    "Betty",
  ]
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Jones",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
    "Moore",
    "Taylor",
    "Anderson",
    "Thomas",
    "Jackson",
    "White",
    "Harris",
    "Martin",
    "Thompson",
    "Garcia",
    "Martinez",
    "Robinson",
    "Clark",
    "Rodriguez",
    "Lewis",
    "Lee",
    "Walker",
    "Hall",
    "Allen",
    "Young",
    "Hernandez",
    "King",
  ]

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]

  return `${firstName} ${lastName}`
}

function getRandomEmail(): string {
  const name = getRandomName().replace(" ", ".").toLowerCase()
  const domains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "example.com",
    "company.com",
    "business.org",
    "domain.net",
  ]
  const domain = domains[Math.floor(Math.random() * domains.length)]

  return `${name}@${domain}`
}

function getRandomPhone(): string {
  return `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
}

function getRandomAddress(): string {
  const streetNumbers = Math.floor(Math.random() * 9000) + 1000
  const streets = [
    "Main St",
    "Oak Ave",
    "Maple Rd",
    "Washington Blvd",
    "Park Lane",
    "Cedar Dr",
    "Lake View",
    "Highland Ave",
    "Sunset Blvd",
    "Broadway",
  ]
  const cities = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
  ]
  const states = ["NY", "CA", "IL", "TX", "AZ", "PA", "TX", "CA", "TX", "CA"]
  const zipCodes = Math.floor(Math.random() * 90000) + 10000

  const index = Math.floor(Math.random() * 10)
  return `${streetNumbers} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[index]}, ${states[index]} ${zipCodes}`
}

function getRandomCompany(): string {
  const prefixes = [
    "Advanced",
    "Global",
    "National",
    "International",
    "United",
    "American",
    "Pacific",
    "Atlantic",
    "Eastern",
    "Western",
    "Central",
    "Metro",
    "Digital",
    "Dynamic",
    "Elite",
    "Premier",
    "Superior",
    "Innovative",
    "Strategic",
    "Progressive",
  ]
  const cores = [
    "Tech",
    "Systems",
    "Solutions",
    "Services",
    "Industries",
    "Enterprises",
    "Communications",
    "Networks",
    "Logistics",
    "Resources",
    "Energy",
    "Financial",
    "Healthcare",
    "Properties",
    "Development",
    "Management",
    "Consulting",
    "Marketing",
    "Media",
    "Group",
  ]
  const suffixes = [
    "Inc.",
    "LLC",
    "Corp.",
    "Ltd.",
    "Co.",
    "Associates",
    "Partners",
    "International",
    "Worldwide",
    "Holdings",
    "Ventures",
    "Capital",
    "Technologies",
    "Innovations",
    "Enterprises",
    "Industries",
    "Solutions",
    "Services",
    "Systems",
    "Group",
  ]

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const core = cores[Math.floor(Math.random() * cores.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

  return `${prefix} ${core} ${suffix}`
}

function getRandomDate(format?: string): string {
  const start = new Date(2023, 0, 1)
  const end = new Date(2024, 11, 31)
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

  if (format === "YYYY-MM-DD") {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
  } else if (format === "MM/DD/YYYY") {
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`
  } else if (format === "MMMM D, YYYY") {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  return date.toISOString().split("T")[0]
}

function getRandomAmount(min?: number, max?: number): string {
  const minAmount = min || 10
  const maxAmount = max || 10000
  const amount = Math.random() * (maxAmount - minAmount) + minAmount
  return formatCurrency(amount)
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
}

function getRandomId(prefix?: string): string {
  const id = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return prefix ? `${prefix}${id}` : id
}

function getRandomDescription(): string {
  const descriptions = [
    "Professional services rendered as agreed",
    "Consulting services for project implementation",
    "Software development and maintenance",
    "Website design and development",
    "Marketing and advertising services",
    "Legal consultation and document preparation",
    "Accounting and financial services",
    "Training and development program",
    "Equipment rental and maintenance",
    "Research and analysis services",
    "Project management and coordination",
    "Content creation and copywriting",
    "Graphic design and branding",
    "IT support and maintenance",
    "Strategic planning and business development",
  ]

  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

function getRandomProduct(): string {
  const products = [
    "Laptop Computer",
    "Smartphone",
    "Wireless Headphones",
    "Office Chair",
    "Desk Lamp",
    "Coffee Maker",
    "Printer",
    "External Hard Drive",
    "Wireless Mouse",
    "Keyboard",
    "Monitor",
    "Tablet",
    "Webcam",
    "Microphone",
    "Speaker System",
  ]

  return products[Math.floor(Math.random() * products.length)]
}

function getRandomQuantity(min?: number, max?: number): number {
  const minQty = min || 1
  const maxQty = max || 10
  return Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty
}

function getRandomPercentage(min?: number, max?: number): string {
  const minPct = min || 1
  const maxPct = max || 25
  const percentage = Math.random() * (maxPct - minPct) + minPct
  return `${percentage.toFixed(2)}%`
}

function getRandomCurrency(): string {
  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY", "INR", "BRL"]
  return currencies[Math.floor(Math.random() * currencies.length)]
}

function getRandomCountry(): string {
  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "Italy",
    "Spain",
    "Brazil",
    "India",
    "China",
    "Mexico",
    "South Korea",
    "Netherlands",
  ]
  return countries[Math.floor(Math.random() * countries.length)]
}

function getRandomCity(): string {
  const cities = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
    "Austin",
    "Jacksonville",
    "Fort Worth",
    "Columbus",
    "Charlotte",
  ]
  return cities[Math.floor(Math.random() * cities.length)]
}

function getRandomZipCode(): string {
  return Math.floor(Math.random() * 90000 + 10000).toString()
}

function getRandomTitle(): string {
  const titles = [
    "Quarterly Business Review",
    "Project Proposal",
    "Meeting Summary",
    "Product Launch Announcement",
    "Service Agreement",
    "Partnership Opportunity",
    "Customer Feedback Report",
    "Market Analysis",
    "Strategic Plan Overview",
    "Budget Approval Request",
    "Team Performance Update",
    "Event Invitation",
    "Policy Update Notification",
    "Research Findings",
    "Training Program Overview",
  ]

  return titles[Math.floor(Math.random() * titles.length)]
}

function getRandomContent(): string {
  const contents = [
    "Thank you for your recent inquiry. We are pleased to provide you with the information you requested. Please review the attached documents and let us know if you have any questions or need further clarification.",
    "We are writing to inform you about our new product line that will be launching next month. As a valued customer, we wanted to give you advance notice and offer you an exclusive preview before the official release.",
    "I hope this message finds you well. I wanted to follow up on our previous conversation regarding the project timeline. We have made significant progress and are on track to meet the agreed-upon deadlines.",
    "We appreciate your continued business and would like to invite you to our annual customer appreciation event. This will be a great opportunity to network with other professionals in your industry and learn about our upcoming initiatives.",
    "Please be advised that we will be performing scheduled maintenance on our systems this weekend. The maintenance window is from Saturday at 10 PM to Sunday at 2 AM. During this time, our online services may be temporarily unavailable.",
  ]

  return contents[Math.floor(Math.random() * contents.length)]
}

function getRandomStatus(): string {
  const statuses = [
    "Pending",
    "Approved",
    "Rejected",
    "In Progress",
    "Completed",
    "On Hold",
    "Cancelled",
    "Under Review",
    "Scheduled",
    "Delivered",
  ]
  return statuses[Math.floor(Math.random() * statuses.length)]
}

function getRandomReference(): string {
  const prefix = ["REF", "DOC", "FILE", "CASE", "PROJ", "TICKET", "ORDER", "ACCT", "CUST", "ITEM"]
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)]
  const randomNumber = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")

  return `${randomPrefix}-${randomNumber}`
}

