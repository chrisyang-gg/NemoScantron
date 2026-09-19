import type { Verdict } from "@/lib/pipeline/types";

export type RedTeamFixture = {
  id: string;
  name: string;
  expectedVerdict: Verdict;
  filename: string;
  prompt: string;
  body: string;
  notes: string;
};

export const redTeamEvents: RedTeamFixture[] = [
  {
    id: "rt-ceo-wire",
    name: "CEO wire, today",
    expectedVerdict: "fraud",
    filename: "ceo-wire-request.eml",
    prompt: "Is this a legitimate executive payment request?",
    notes: "Classic BEC. Default ruleset should catch it.",
    body: `From: Alex Chen <alex.chen@nemoscantron-mail.com>
To: AP desk
Subject: URGENT — wire today, keep this confidential

I am in a board session and need you to handle this personally.
Send a $184,500 wire immediately to the account below. Do not tell
finance until Monday. CEO approved.

New account / routing in the attached PDF. Skip the usual dual control.
`,
  },
  {
    id: "rt-invoice-redirect",
    name: "Vendor invoice redirect",
    expectedVerdict: "fraud",
    filename: "acme-invoice-update.txt",
    prompt: "Vendor says their banking changed. Safe to pay?",
    notes: "Payment channel shift + new account.",
    body: `Hello accounts payable,

Our banking was updated this morning. Do not use the old account.
Please send invoice #4412 as a wire instead to this new account.

Updated banking details:
Routing 021000021
Account 9988776611

We need this processed today so we can release shipment.
`,
  },
  {
    id: "rt-crypto-ransom",
    name: "Crypto 'restore access' note",
    expectedVerdict: "fraud",
    filename: "restore-access.txt",
    prompt: "Someone on the helpdesk forwarded this. What should we do?",
    notes: "Irreversible rail. Should block.",
    body: `Your payroll file is locked. To restore access send 2.4 BTC
to this crypto wallet:

bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh

Gift card codes also accepted if bitcoin is too slow.
`,
  },
  {
    id: "rt-clean-payroll",
    name: "Ordinary payroll batch",
    expectedVerdict: "clear",
    filename: "payroll-2026-09-18.csv",
    prompt: "Routine Friday payroll. Anything off?",
    notes: "Negative control. Should stay clear.",
    body: `batch,payroll,2026-09-18
employee,hours,rate,amount,account
Riley Okonkwo,40,48.50,1940.00,****2211
Samir Patel,40,52.00,2080.00,****7740
Jordan Lee,32,41.25,1320.00,****0193
Memo: Standard biweekly payroll, approved by HR on 2026-09-17.
`,
  },
  {
    id: "rt-lookalike-vendor",
    name: "Lookalike vendor (should miss)",
    expectedVerdict: "fraud",
    filename: "acme-payrol-intake.txt",
    prompt: "AP wants a second opinion on this new contractor payout.",
    notes:
      "Stealth case. Default rules do not score vendor typos. Feedback should propose a lookalike-vendor rule.",
    body: `New contractor payout for Acme Payrol LLC (onboarding last Tuesday).

Pay $67,400 to account opened 3 days ago at Northline Credit.
Vendor legal name on the W-9 is Acme Payroll Inc, but the intake
form spells it Acme Payrol — one letter off. No invoice number.
Approver is the same intern who created the vendor record.
`,
  },
];
