/* The two things to fill in before the site takes payments. See README.md ("Taking payments").
   API_BASE     the address of your licence server (the Cloudflare Worker), for example "https://colection-licences.yourname.workers.dev".
                Leave it "" and the Buy button turns into "Request an invoice", which opens an email to CONTACT_EMAIL instead.
   CONTACT_EMAIL where questions and invoice requests go. */
window.COL_SITE = {
  API_BASE: "",
  CONTACT_EMAIL: "colectionhelp@gmail.com"
};
