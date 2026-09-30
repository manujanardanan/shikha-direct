import LegalShell from "../components/LegalShell";
import { COMPANY_NAME, CONTACT_EMAIL, JURISDICTION_CITY, REPORT_PRICE_TEXT } from "../../lib/legal";

export const metadata = { title: "Terms of Use — Shikha" };

export default function Terms() {
  return (
    <LegalShell title="Terms of Use">
      <div className="legal-summary">
        <p><b>In short:</b></p>
        <p>
          Shikha is a career-exploration tool for families. It gives guidance, not a diagnosis or a
          prediction. It is meant to start a conversation between a child and their parents, not to
          rank a child or decide their future. The journey is free; the full report is a one-time
          paid unlock.
        </p>
      </div>

      <h2>1. Who we are and what these terms cover</h2>
      <p>
        Shikha (“we”, “us”) is operated by {COMPANY_NAME}. These Terms of Use govern your use of the
        Shikha website and service for families (the “Service”). By creating an account you agree to
        these Terms and to our Privacy Policy.
      </p>

      <h2>2. Who can use Shikha</h2>
      <ul>
        <li>Accounts are for adults. You must be 18 or older to create an account.</li>
        <li>
          You may add a child to your account only if you are that child’s parent or legal guardian,
          or you have their parent’s or guardian’s permission to do so.
        </li>
        <li>Children do not have their own accounts. A child uses Shikha through your account, with your involvement.</li>
        <li>Give us accurate information, and keep your password to yourself. You are responsible for activity under your account.</li>
      </ul>

      <h2>3. What Shikha is — and what it is not</h2>
      <ul>
        <li>
          Shikha uses short scenario-based questions and a subject readiness check, and interprets the
          answers using Holland’s RIASEC framework, to suggest directions worth exploring.
        </li>
        <li>
          The results are <b>not</b> a psychological or medical assessment, an aptitude diagnosis, an
          admission or exam prediction, or professional counselling. They reflect one child’s answers on
          one occasion.
        </li>
        <li>
          Interests and readiness change with age and experience. Please do not use a result to rank a
          child, compare children with each other, or make a major decision about education or career
          on its own. Talk it through with your child, and with a qualified counsellor or teacher where useful.
        </li>
        <li>We make no promise that following a result will lead to any particular outcome.</li>
      </ul>

      <h2>4. Free journey and paid report</h2>
      <ul>
        <li>Completing the journey (Levels 1–3) is free.</li>
        <li>
          A one-time payment (currently {REPORT_PRICE_TEXT}, or the price shown at checkout) unlocks
          the full report for that child’s profile. The price shown at checkout is the price you pay.
        </li>
        <li>
          Payments are processed by Razorpay. We never see or store your card, UPI, or bank details.
        </li>
      </ul>

      <h2>5. Refunds and payment problems</h2>
      <p>
        Because the report is a digital product delivered immediately, payments are generally not
        refundable once the report has been unlocked. But if you were charged and the report did not
        unlock, or you were charged more than once for the same child, write to us at {CONTACT_EMAIL}
        with the payment details. We will unlock the report or refund the payment.
      </p>

      <h2>6. Acceptable use</h2>
      <ul>
        <li>Do not try to access another family’s account or data.</li>
        <li>Do not copy, scrape, or reverse-engineer the questions, stories, or report content, or resell them.</li>
        <li>Do not use the Service in a way that could harm it, other users, or a child.</li>
        <li>Do not share your account in a way that lets people who are not your family use it.</li>
      </ul>

      <h2>7. Our content</h2>
      <p>
        The questions, stories, report text, design, and branding are ours or used with permission. You
        may keep and print the report for your own family’s personal, non-commercial use. Anything else
        needs our written permission.
      </p>

      <h2>8. Availability and changes to the Service</h2>
      <p>
        We work to keep Shikha available, but we cannot promise it will always be uninterrupted or
        error-free. We may improve, change, or withdraw features. If a change is significant and affects
        something you have paid for, we will tell you.
      </p>

      <h2>9. Disclaimers and limits on our liability</h2>
      <p>
        The Service is provided “as is”. To the fullest extent the law allows, we are not liable for
        decisions made on the basis of a report, or for indirect or consequential losses. Where we are
        found liable to you, our total liability is limited to the amount you paid us for the affected
        report. Nothing in these Terms limits any right or liability that cannot lawfully be limited.
      </p>

      <h2>10. Closing an account</h2>
      <p>
        You can ask us to delete your account at any time (see the Privacy Policy). We may suspend or
        close an account that breaks these Terms or puts others at risk.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        If we change these Terms in a way that matters, we will update the effective date and ask you to
        accept the new version the next time you sign in. If you do not accept, you can stop using
        Shikha and ask us to delete your data.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Disputes will be subject to the courts at
        {" "}{JURISDICTION_CITY}, India.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions, refund requests, or complaints: {CONTACT_EMAIL}.
      </p>
    </LegalShell>
  );
}
