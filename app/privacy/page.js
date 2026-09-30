import LegalShell from "../components/LegalShell";
import { COMPANY_NAME, CONTACT_EMAIL } from "../../lib/legal";
import { DATABASE_LOCATION, APP_SERVER_LOCATION } from "../../lib/hosting";

export const metadata = { title: "Privacy Policy — Shikha" };

export default function Privacy() {
  const allInIndia = DATABASE_LOCATION === "India" && APP_SERVER_LOCATION === "India";
  return (
    <LegalShell title="Privacy Policy">
      <div className="legal-summary">
        <p><b>In short:</b></p>
        <p>
          We collect only what we need to run the journey and produce a report. A child’s information
          exists only inside their parent’s or guardian’s account. We do not show ads, we do not sell
          data, and we do not share a child’s name or results with schools, colleges, or employers.
          You can ask us to delete everything at any time.
        </p>
      </div>

      <h2>1. Who is responsible for your data</h2>
      <p>
        {COMPANY_NAME} (“we”, “us”) operates Shikha and decides how the information described here is
        used. You can reach us at {CONTACT_EMAIL}.
      </p>

      <h2>2. What we collect</h2>
      <p><b>About you (the parent or guardian):</b></p>
      <ul>
        <li>Your name and email address.</li>
        <li>Your password, stored only as a one-way scrambled value. We cannot read it.</li>
        <li>A record of when you accepted our Terms and Privacy Policy, and which version.</li>
      </ul>
      <p><b>About your child (only what you enter or what they generate through the journey):</b></p>
      <ul>
        <li>The name you give the child’s profile. A first name or nickname is enough.</li>
        <li>Optionally, the name of their school.</li>
        <li>Their answers to the scenario questions and the readiness check.</li>
        <li>The results we work out from those answers: their strongest interest area, career leaning, readiness level, and topics to revisit.</li>
      </ul>
      <p><b>About payments:</b></p>
      <ul>
        <li>
          Payment reference numbers, the amount, the status, and the time. Card, UPI, and bank details
          are handled entirely by Razorpay. We never see or store them.
        </li>
      </ul>
      <p><b>Technical information:</b></p>
      <ul>
        <li>A sign-in cookie that keeps you logged in, and standard server logs kept by our hosting provider (such as IP address, browser type, and pages requested).</li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To run the journey and produce your child’s report.</li>
        <li>To take payment and unlock the report, and to fix or refund a payment that went wrong.</li>
        <li>To keep accounts secure, and to answer your questions and requests.</li>
        <li>To understand overall use of Shikha through totals and other combined figures that do not identify anyone.</li>
      </ul>
      <p>We do not use your child’s information for advertising, and we do not build profiles of children for marketing.</p>

      <h2>4. Children’s information</h2>
      <ul>
        <li>Children cannot create accounts. A child’s profile exists only inside a parent’s or guardian’s account.</li>
        <li>We do not have a way to contact a child directly, and we do not.</li>
        <li>
          When you sign up, and again each time you add a child, you confirm you are the child’s parent or legal guardian (or have
          their parent’s or guardian’s permission) and you consent to us handling your child’s information as
          set out here. You can withdraw that consent at any time by asking us to delete the account.
        </li>
      </ul>

      <h2>5. The school name field</h2>
      <p>
        The school name is optional. If you enter it, we may use it only in combined form. For example, to
        say how many students from a particular school have used Shikha. We will never tell a school which
        individual children used Shikha, and we will never share a child’s name or results with a school.
        If you would rather not say, leave it blank.
      </p>

      <h2>6. Who else handles your information</h2>
      <p>We use a small number of service providers to run Shikha. They handle data only to provide their service to us:</p>
      <ul>
        <li><b>Supabase</b> stores our database.</li>
        <li><b>Vercel</b> hosts the website and application.</li>
        <li><b>Razorpay</b> processes payments.</li>
        <li><b>Google Fonts</b> supplies the typefaces on our pages, so your browser contacts Google’s servers when a page loads.</li>
      </ul>
      <p>
        We do not sell your information. We may disclose information if the law requires it, or to
        protect someone’s safety.
      </p>

      <h2>7. Where your information is kept</h2>
      <p>
        Our database is hosted in {DATABASE_LOCATION} and our application servers run in {APP_SERVER_LOCATION}.
        Payments are processed by Razorpay in India.{" "}
        {allInIndia
          ? "Our providers are international companies and pages are delivered through a global network, so some technical data, such as your IP address, may pass through servers elsewhere."
          : "This means your information is handled outside India."}
      </p>

      <h2>8. How long we keep it</h2>
      <p>
        We keep your account and your child’s results until you ask us to delete them. Deleted information may
        remain in our providers’ backups for a limited period before it is overwritten. Payment records may
        be kept for as long as the law requires for accounting and tax purposes, even after an account is deleted.
      </p>

      <h2>9. Keeping it safe</h2>
      <ul>
        <li>Connections to Shikha are encrypted (HTTPS).</li>
        <li>Passwords are stored as one-way hashes, and the sign-in cookie cannot be read by page scripts.</li>
        <li>Each account can see only its own children’s information. We enforce this on our servers.</li>
        <li>Payments are confirmed with Razorpay’s cryptographic signature before a report unlocks.</li>
      </ul>
      <p>No system is perfectly secure, but we take reasonable care, and we will tell you if something goes wrong that affects you.</p>

      <h2>10. Your choices and rights</h2>
      <p>
        You can ask us to show you the information we hold about you and your child, correct it, delete it,
        or stop handling it. As the parent or guardian, you can make these requests for your child. Write to
        {" "}{CONTACT_EMAIL} from the email address on your account. We will act on a request within 30 days.
        If you are not satisfied with our response, you may have the right to complain to the relevant
        authority under Indian law.
      </p>

      <h2>11. Cookies</h2>
      <p>
        We use one essential cookie to keep you signed in. We do not use advertising or tracking cookies.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        If we change this policy in a way that matters, we will update the effective date and ask you to accept
        the new version the next time you sign in.
      </p>

      <h2>13. Questions and complaints</h2>
      <p>
        {COMPANY_NAME}, {CONTACT_EMAIL}. This is also our contact for any complaint about how your information is handled.
      </p>
    </LegalShell>
  );
}
