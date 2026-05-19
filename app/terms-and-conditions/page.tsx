import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

const sections = [
  {
    title: "1. Product Details",
    body: "All T-shirts are 100% pure cotton with 240 GSM fabric. Product colors may slightly vary due to lighting, photography, or screen settings.",
  },
  {
    title: "2. Sizing",
    body: "These are oversized fits. Please refer to the size chart before placing your order. We are not responsible for size selection errors.",
  },
  {
    title: "3. Order Processing",
    body: "Orders are processed within 1-2 business days. You will receive order and shipment updates after your order is packed and dispatched.",
  },
  {
    title: "4. Shipping And Delivery",
    body: "Standard delivery time is 5-7 business days, depending on your location. Delays may occur due to external factors such as weather, courier issues, or operational delays.",
  },
  {
    title: "5. Refunds, Returns And Exchanges",
    body: "Returns and replacements are accepted within 7 days of delivery if the product is unused, unwashed, and in original packaging. Replacements are allowed for sizing issues if stock is available and will be delivered within 7 days. Shipping costs for returns or exchanges are borne by the customer unless the product is defective. Refunds will be credited to the original payment method within 7-10 business days.",
  },
  {
    title: "6. Cancellations",
    body: "Orders can be cancelled before shipment. Once shipped, cancellation is not possible and the order will be delivered to the given address.",
  },
  {
    title: "7. Defective Or Damaged Items",
    body: "If you receive a defective or wrong item, contact us within 48 hours with photo evidence. We will arrange a replacement or refund after verification.",
  },
  {
    title: "8. Custom Orders",
    body: "Custom printed or personalized T-shirts are not eligible for return or exchange unless they are defective, damaged, or wrong at delivery.",
  },
  {
    title: "9. Privacy Policy",
    body: "Customer data is kept secure and is used only for order processing, shipping, support, and communication. We may collect name, email address, phone number, address, payment details handled through secure third-party providers, browser type, device information, IP address, pages visited, and time spent on the website. We do not sell or rent personal data. Data may be shared with trusted service providers such as payment gateways, hosting providers, courier partners, or legal authorities if required by law.",
  },
  {
    title: "10. Cookies And Security",
    body: "We may use cookies to understand user behavior, improve user experience, and track website performance. You can disable cookies in your browser settings. We use reasonable security measures to protect customer information from unauthorized access, alteration, disclosure, or destruction.",
  },
  {
    title: "11. Contact Us",
    body: "For any queries, reach out to THE PADDLER customer support at help@thepaddler.in or +91 8103631364. Trade Name: THE PADDLER / VIVEK PATIL.",
  },
]

export default function TermsAndConditionsPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            THE PADDLER POLICY
          </p>

          <h1 className="text-4xl sm:text-5xl font-black mb-6">
            TERMS & CONDITIONS
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-10">
            Please read these terms before placing an order on THE PADDLER website.
          </p>

          <div className="space-y-5">
            {sections.map((section) => (
              <section key={section.title} className="border border-border bg-secondary/20 p-6">
                <h2 className="text-xl font-black mb-3">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
