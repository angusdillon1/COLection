/* The things to fill in before the site takes payments. See README.md ("Taking payments").
   API_BASE      the address of your licence server (the Cloudflare Worker), for example "https://colection-licences.yourname.workers.dev".
                 Leave it "" and the Buy button turns into "Request an invoice", which opens an email to CONTACT_EMAIL instead.
   CONTACT_EMAIL where questions and invoice requests go.
   SELLER        who the licence is sold by, shown on the Terms page. Your full name or business name, with your ABN if you have one,
                 for example "Angus Smith (ABN 12 345 678 901)". Fill this in BEFORE you take payments.
   REFUND_DAYS   how many days a buyer has to ask for a refund (used on the Terms page; the Pricing page FAQ says 14, so change both). */
window.COL_SITE = {
  API_BASE: "",
  CONTACT_EMAIL: "dillonangus5@gmail.com",
  SELLER: "",
  REFUND_DAYS: 14
};
