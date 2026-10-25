import { useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// GoodCreator – Privacy Policy page
// Edit the values below; the rest of the file is layout.
// ─────────────────────────────────────────────────────────────────────────────
const LAST_UPDATED = 'October 2026';
const CONTACT_EMAIL = 'team@goodcreator.in'; // change to privacy@goodcreator.in once that mailbox exists
const GRIEVANCE_OFFICER = 'Subrat Hati, GoodCreator'; // put your full name here, e.g. 'Your Name (Grievance Officer)'
const BUSINESS_LINE = 'Good Creator (GoodCreator), a sole proprietorship based in Bhubaneswar, Odisha, India';
const DELETION_DAYS = 30; // how long you promise to take to act on a deletion request

const SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction',
    body: [
      { p: `GoodCreator ("GoodCreator", "we", "our" or "us") is a platform that connects Instagram creators with brands for paid collaborations. The platform is operated by ${BUSINESS_LINE}. GoodCreator was earlier known as CollabSpace.` },
      { p: 'This Privacy Policy explains what personal information we collect, why we collect it, who we share it with, how long we keep it, and what choices and rights you have. It applies to our website (goodcreator.in) and everything you do on it, whether you use GoodCreator as a creator or as a brand.' },
      { p: 'By creating an account or using GoodCreator you confirm that you have read this policy. If you do not agree with it, please do not use the platform.' },
    ],
  },
  {
    id: 'collect',
    title: '2. Information we collect',
    body: [
      { h: 'Information you give us' },
      {
        ul: [
          'Account details: your email address, password and role (creator or brand). We verify your email with a one-time password (OTP) that we send to you.',
          'Creator profile: your name, city and state, content categories, gender, bio, profile photo and portfolio images, your Instagram handle, and follower, view or engagement figures if you enter them yourself.',
          'Brand profile: your brand name, city and state, category, logo or images, and a phone number if you choose to add one.',
          'Campaigns and applications: campaign details brands post, and applications and proposals creators send.',
          'Messages: the chat messages, payment requests and deliverables you exchange with other users on the platform.',
          'Reviews: the ratings and written reviews brands leave for creators.',
          'Bank details (creators): account holder name, bank name, account number and IFSC code, so that we can send you your payout.',
          'Support requests: what you write to us through the Contact / Help form, email or WhatsApp.',
          'How you heard about us: your answer to the "how did you hear about us" question.',
        ],
      },
      { h: 'Information from Instagram (creators who connect Instagram)' },
      { p: 'If you choose to connect your Instagram account, we receive information from Instagram through the official Instagram API (provided by Meta) after you approve the permissions on Instagram. This includes your basic profile information (such as username, account type and profile picture), your follower count, and content insights such as reach, views and engagement on your posts. We do not receive your Instagram password, and we do not post, comment or send messages on your behalf.' },
      { h: 'Information collected automatically' },
      {
        ul: [
          'Usage and device data: pages you visit, buttons you click, approximate location derived from your IP address, browser and device type, and the website that referred you (including campaign or UTM tags on links).',
          'Activity data: the time you were last active on GoodCreator, which we use to send timely reminders.',
          'Push notification data: if you allow notifications, your browser gives us a subscription identifier that lets us send notifications to that browser.',
          'Technical logs: server logs that record requests, errors and security events.',
        ],
      },
      { h: 'GoodCreator Assistant (AI chat)' },
      { p: 'If you use GoodCreator Assistant, we collect the messages you send to it and the replies it gives, and we store them in your account so you can continue the conversation later. We also keep basic technical details of each request, such as its time and size, to monitor usage and cost. Please do not share passwords, card or bank details or other sensitive information in the chat.' },
      { h: 'Payment information' },
      { p: 'Brands pay through Razorpay. Your card, UPI or net-banking details are entered on Razorpay\'s checkout and are handled by Razorpay. We do not receive or store them. We keep only the transaction records we need, such as the order and payment reference, the amount, and the payment status.' },
    ],
  },
  {
    id: 'use',
    title: '3. How we use your information',
    body: [
      {
        ul: [
          'To create and secure your account, verify your email and keep you logged in.',
          'To show creator profiles to brands and campaigns to creators, and to rank and recommend creators and campaigns (for example by category, location, profile completeness, ratings and Instagram statistics).',
          'To display Instagram statistics on creator profiles so that brands can see real numbers.',
          'To run collaborations: enabling chat, payment requests, delivery and approval, holding the payment in escrow, calculating our commission and paying out creators.',
          'To send you service messages such as OTPs, payment and delivery updates, application status and new-message alerts, by email, in the app and by push notification.',
          'To send you reminders or occasional updates about GoodCreator, which you can switch off (see section 8).',
          'To provide support, handle complaints and resolve disputes between creators and brands.',
          'To keep the platform safe: preventing fraud, fake or duplicate accounts, abuse and misuse, and enforcing our rules and category policy.',
          'To understand how GoodCreator is used and improve it, for example how many people sign up, complete their profile or finish a collaboration.',
          'To meet legal, tax, accounting and regulatory obligations.',
        ],
      },
      { p: 'We do not sell your personal information. We do not use Instagram data to show you advertising outside GoodCreator.' },
    ],
  },
  {
    id: 'instagram',
    title: '4. Instagram and Meta data',
    body: [
      { p: 'We use Instagram data only to show your statistics and profile details to brands inside GoodCreator and to calculate your quality and ranking on the platform. We do not sell Instagram data, and we do not share it with data brokers or advertisers.' },
      {
        ul: [
          'Access tokens: your Instagram access token is stored in encrypted form. Instagram tokens expire, so we refresh them periodically to keep your connection working.',
          'Automatic sync: once connected, we refresh your Instagram statistics automatically (for example once a day) and when you press "Sync".',
          'Visibility: the statistics from your connected account are visible to brands that use GoodCreator and, on your public profile page, to anyone who opens that page.',
          'Disconnecting: you can disconnect Instagram at any time from your profile settings. You can also remove GoodCreator from your Instagram account\'s "Apps and websites" settings. After you disconnect, we stop syncing and delete your stored access token.',
        ],
      },
      { p: 'Your use of Instagram is governed by Meta\'s own terms and privacy policy. GoodCreator is not endorsed by or affiliated with Meta or Instagram.' },
    ],
  },
  {
    id: 'sharing',
    title: '5. Who can see your information',
    body: [
      { h: 'Other users' },
      {
        ul: [
          'Creators: your profile (name, photo, location, categories, bio, Instagram handle and statistics, ratings and reviews) is visible to brands and appears on your public profile page. Your email address and bank details are not shown to brands.',
          'Brands: your brand profile and campaigns are visible to creators. If you add a phone number, it is not shown publicly.',
          'People you chat with can see the messages, files and payment requests you send them. Reviews you write are shown on the creator\'s profile together with your brand name.',
        ],
      },
      { h: 'Service providers who help us run GoodCreator' },
      { p: 'We use trusted third parties to operate the platform. They may process your information only to provide their service to us:' },
      {
        ul: [
          'Razorpay for payment processing and verification.',
          'Meta / Instagram for the Instagram connection and insights.',
          'Resend for sending OTP and service emails.',
          'Cloudinary for storing and delivering images.',
          'MongoDB Atlas, Render, Vercel and similar providers for databases, servers and hosting.',
          'PostHog for product analytics.',
          'Anthropic, the provider of the Claude AI model that powers GoodCreator Assistant. The messages you send to the assistant, and limited account information needed to answer them, are sent to Anthropic to generate replies.',
          'Your browser vendor\'s push service (for example Google, Apple or Mozilla) for delivering push notifications.',
        ],
      },
      { h: 'GoodCreator team' },
      { p: 'A small number of authorised GoodCreator team members can access account information when needed to run the platform. This includes processing creator payouts (which requires access to bank details), supporting users, resolving disputes, and keeping the platform safe. For these purposes, authorised team members may also review conversations and collaboration records between creators and brands.' },
      { h: 'Legal and business reasons' },
      { p: 'We may disclose information if required by law, court order or a government authority, to protect the rights, safety and property of our users or of GoodCreator, or in connection with a merger, acquisition or sale of the business, in which case we will make sure your information stays protected.' },
    ],
  },
  {
    id: 'storage',
    title: '6. Storage, security and where data is processed',
    body: [
      { p: 'We use reasonable technical and organisational safeguards to protect your information, including encrypted connections (HTTPS), encrypted storage of Instagram access tokens, access controls for our team, and verification of payments with Razorpay. No system is completely secure, so we cannot guarantee absolute security. Please choose a strong password and keep it private.' },
      { p: 'Our providers may store and process information on servers located outside India. Where this happens, we use providers that apply appropriate security measures. If a breach affects your personal information, we will notify you and the relevant authorities as required by law.' },
    ],
  },
  {
    id: 'retention',
    title: '7. How long we keep information',
    body: [
      {
        ul: [
          'Account and profile information: for as long as your account is active.',
          `Deleted accounts: when you ask us to delete your account, we delete or anonymise your personal information within ${DELETION_DAYS} days, except for what we must keep as described below.`,
          'Transaction, payout and invoicing records: kept for the period required by Indian tax, accounting and financial regulations, even after account deletion.',
          'Messages and reviews connected to a payment or a dispute may also be kept for as long as needed to resolve that dispute or meet a legal requirement.',
          'Instagram access tokens: deleted when you disconnect Instagram or delete your account.',
          'Security and server logs: kept for a limited period for fraud prevention and troubleshooting.',
        ],
      },
    ],
  },
  {
    id: 'choices',
    title: '8. Your choices and rights',
    body: [
      { p: 'Under the Digital Personal Data Protection Act, 2023 and other applicable Indian laws, you have rights over your personal information. You can:' },
      {
        ul: [
          'Access the information we hold about you and get a summary of how it is used.',
          'Correct or update your information. Most of it can be edited directly in your profile settings.',
          'Delete your information and close your account by contacting us.',
          'Withdraw your consent at any time, for example by disconnecting Instagram or by switching off notifications. Withdrawing consent does not affect processing that already happened, and some features will stop working without the data they need.',
          'Turn off push notifications in your browser or device settings, and opt out of non-essential updates.',
          'Nominate someone to exercise your rights on your behalf if you are unable to do so.',
          'Raise a complaint with us (see section 12), and if you are not satisfied, with the Data Protection Board of India.',
        ],
      },
      { p: `To use any of these rights, email us at ${CONTACT_EMAIL} from the email address linked to your account. We may ask you to confirm your identity first, and we will respond within a reasonable time.` },
    ],
  },
  {
    id: 'delete-instagram',
    title: '9. Deleting your Instagram data',
    body: [
      { p: 'You can remove your Instagram data from GoodCreator at any time:' },
      {
        ul: [
          'In GoodCreator, open your profile settings and disconnect Instagram. This stops syncing and removes your stored access token.',
          `Or email ${CONTACT_EMAIL} with the subject "Delete my Instagram data" from your registered email. We will delete the Instagram data we store about you within ${DELETION_DAYS} days.`,
          'You can also remove GoodCreator in Instagram under Settings, Apps and websites.',
        ],
      },
    ],
  },
  {
    id: 'cookies',
    title: '10. Cookies and similar technologies',
    body: [
      { p: 'We use cookies and browser storage (such as local storage) to keep you logged in, remember your preferences and understand how the platform is used. Our analytics provider, PostHog, may use similar technologies to recognise a browser across visits. You can block or delete cookies and site data in your browser settings, but parts of GoodCreator may not work properly if you do.' },
    ],
  },
  {
    id: 'children',
    title: '11. Who can use GoodCreator',
    body: [
      { p: 'GoodCreator is meant for people who are 18 years or older. We do not knowingly collect personal information from anyone under 18. If you believe a child has created an account, please contact us and we will delete it.' },
    ],
  },
  {
    id: 'contact',
    title: '12. Contact and grievances',
    body: [
      { p: 'For any privacy question, request or complaint, contact:' },
      {
        ul: [
          GRIEVANCE_OFFICER,
          `Email: ${CONTACT_EMAIL}`,
          'Address: Bhubaneswar, Odisha, India',
        ],
      },
      { p: 'We will acknowledge your complaint and aim to resolve it within 30 days.' },
    ],
  },
  {
    id: 'assistant',
    title: '13. GoodCreator Assistant (AI)',
    body: [
      { p: 'GoodCreator Assistant is an optional AI chat inside GoodCreator for creators and brands. It can answer questions about how the platform works and help you search for creators or campaigns. It is powered by Claude, an AI model provided by Anthropic.' },
      { h: 'What is shared with the AI provider' },
      {
        ul: [
          'The messages you type in the chat, and recent earlier messages of the same conversation, so that it can follow the discussion.',
          'Limited information from your account that is needed to answer, such as the titles of your campaigns or the status of your campaign applications, when you ask about them.',
          'The assistant is not given your password, payment details, bank details or Instagram access token.',
        ],
      },
      { h: 'How the answers are produced' },
      { p: 'Creator and campaign suggestions come from our own search of the information on GoodCreator; the assistant helps you phrase and filter your request. The assistant can make mistakes, so please check campaign and creator details yourself before you decide. It does not apply to campaigns, send messages or make payments on your behalf, and it does not make decisions that have a legal or financial effect on you.' },
      { h: 'Storage and your choices' },
      { p: `Your conversation with the assistant is stored in your account so you can come back to it. Authorised GoodCreator team members may review assistant conversations to investigate problems, abuse or complaints, and to improve the feature. To limit use and cost, we may cap how many assistant messages each account can send per day. You can ask us to delete your assistant conversation by writing to ${CONTACT_EMAIL}.` },
      { p: 'Using the assistant is optional: every feature of GoodCreator can be used without it. Anthropic processes this information as our service provider and may do so on servers outside India (see "Storage, security and where data is processed").' },
    ],
  },
  {
    id: 'changes',
    title: '14. Changes to this policy',
    body: [
      { p: 'We may update this policy from time to time, for example when we add features or when the law changes. We will change the "Last updated" date at the top and, for significant changes, tell you through the platform or by email. Continuing to use GoodCreator after an update means you accept the updated policy.' },
    ],
  },
];

const Block = ({ b }) => {
  if (b.h) return <h3 className="mb-2 mt-5 text-[15px] font-bold text-[#101828]">{b.h}</h3>;
  if (b.p) return <p className="mb-3 text-[15px] leading-[1.7] text-[#475467]">{b.p}</p>;
  if (b.ul) {
    return (
      <ul className="mb-3 list-disc space-y-2 pl-5 text-[15px] leading-[1.7] text-[#475467] marker:text-[#155DFC]">
        {b.ul.map((item) => <li key={item}>{item}</li>)}
      </ul>
    );
  }
  return null;
};

const PrivacyPolicy = () => {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Privacy Policy | GoodCreator';
    window.scrollTo(0, 0);
    return () => { document.title = previous; };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#101828]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="border-b border-[#edf0f4]">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="text-[22px] leading-none tracking-[-.4px]" style={{ fontFamily: "'Archivo Black', 'Inter', sans-serif" }}>
            Good<span className="text-[#155DFC]">Creator</span>
          </a>
          <a href="/" className="text-[13px] font-semibold text-[#475467] hover:text-[#101828]">Back to home</a>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 sm:py-12 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        <nav aria-label="Privacy policy sections" className="mb-8 hidden lg:sticky lg:top-6 lg:mb-0 lg:block lg:self-start">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[.8px] text-[#98a2b3]">On this page</p>
          <ul className="space-y-[6px] border-l border-[#edf0f4] text-[13px]">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-[2px] pl-3 text-[#475467] hover:border-[#155DFC] hover:text-[#155DFC]">
                  {s.title.replace(/^\d+\.\s*/, '')}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0">
          <h1 className="text-[30px] font-extrabold tracking-[-1px] sm:text-[38px]">Privacy Policy</h1>
          <p className="mb-8 mt-2 text-[13px] text-[#667085]">Last updated: {LAST_UPDATED}</p>

          <div className="mb-10 rounded-xl border border-[#d1e0ff] bg-[#f5f8ff] p-4 text-[14px] leading-[1.6] text-[#344054]">
            <strong className="text-[#101828]">In short:</strong> we collect only what we need to run GoodCreator. We never sell your personal data. Payments are processed by Razorpay and your card or UPI details never reach us. Instagram statistics are used only to show your profile to brands, and you can disconnect Instagram or delete your account whenever you want. If you use the optional GoodCreator Assistant, your messages to it are processed by our AI provider, Anthropic.
          </div>

          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="mb-9 scroll-mt-6">
              <h2 className="mb-3 text-[20px] font-extrabold tracking-[-.4px]">{s.title}</h2>
              {s.body.map((b, i) => <Block key={i} b={b} />)}
            </section>
          ))}
        </article>
      </main>

      <footer className="border-t border-[#edf0f4]">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-[12px] text-[#667085] sm:px-6">
          <span>© {new Date().getFullYear()} GoodCreator</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[#101828]">{CONTACT_EMAIL}</a>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
