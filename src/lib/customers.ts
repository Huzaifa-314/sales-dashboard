// Sample data until the customers API exists. Shape mirrors the Core Modules
// doc §4 (customer record) plus the figures the list needs at a glance.
export type Customer = {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  outstanding: number; // RM owed to the business
  overdue: number; // part of outstanding past its due date
  credit: number; // RM the business owes the customer (overpayment/advance)
  openInvoices: number;
  lastActivity: string; // ISO date
  lastPayment?: string; // ISO date of the last payment received
  overdueDays?: number; // age of the oldest overdue invoice, when overdue > 0

  // The rest of the customer record (Core Modules §4). All optional: only the
  // name is needed to start, and the rest is added when it is needed.
  kind?: "company" | "person";
  whatsapp?: string;
  address?: {
    line1?: string;
    line2?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  // Days until an invoice is due (0 = on receipt)
  paymentTermsDays?: number;
  registrationNo?: string; // SSM / company registration number
  tin?: string; // Tax Identification Number (e-Invoice)
  sstNo?: string;
  idNo?: string; // NRIC, for an individual (e-Invoice)
  notes?: string;
  tags?: string[];
};

export type CustomerStatus = "overdue" | "owing" | "credit" | "clear";

export function customerStatus(c: Customer): CustomerStatus {
  if (c.overdue > 0) return "overdue";
  if (c.outstanding > 0) return "owing";
  if (c.credit > 0) return "credit";
  return "clear";
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const email = (name: string, company?: string) => {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z]+/g, ".")
      .replace(/^\.|\.$/g, "");
  return company
    ? `${slug(name.split(" ")[0])}@${slug(company).replace(/\./g, "")}.com.my`
    : `${slug(name)}@gmail.com`;
};

type Seed = [
  name: string,
  company: string | undefined,
  phone: string | undefined,
  outstanding: number,
  overdue: number,
  credit: number,
  open: number,
  days: number,
];

const seeds: Seed[] = [
  ["Ahmad Faizal", "AF Aircond Services", "012-345 6789", 3200, 1700, 0, 2, 2],
  ["Siti Aminah", "Kedai Runcit Aminah", "013-882 1045", 1000, 0, 0, 1, 1],
  ["Tan Wei Ming", "WM Trading Sdn Bhd", "016-221 9087", 3800, 3800, 0, 3, 19],
  ["Lakshmi Devi", undefined, "017-554 3321", 0, 0, 50, 0, 5],
  ["Chong Mei Ling", "Mei Ling Bakery", "011-2468 1357", 0, 0, 0, 0, 8],
  ["Rosli Hamzah", "RH Construction", "019-776 4410", 12500, 0, 0, 2, 3],
  ["Nurul Huda", undefined, "014-330 7782", 0, 0, 20, 0, 6],
  ["Kumar Raj", "Raj Motor Workshop", undefined, 480, 0, 0, 1, 4],
  ["Lim Soo Hock", "SH Furniture", "012-909 1122", 0, 0, 0, 0, 47],
  ["Farah Nadia", "Nadia Beauty Studio", "018-662 3094", 2150, 2150, 0, 2, 33],
  ["Wong Kah Wai", "KW Electrical", "012-771 8830", 6400, 0, 0, 3, 2],
  ["Hafiz Rahman", "Hafiz Catering", "013-440 2917", 0, 0, 0, 0, 12],
  ["Priya Nair", undefined, "016-905 3321", 0, 0, 120, 0, 9],
  ["Ong Boon Teck", "BT Hardware", "011-3392 8841", 890, 0, 0, 1, 7],
  ["Aisyah Zulkifli", "Aisyah Tailoring", "017-228 6405", 0, 0, 0, 0, 21],
  ["Raymond Lee", "RL Print & Pack", "019-338 7710", 4720, 1200, 0, 4, 11],
  ["Zainab Ibrahim", "Kedai Kain Zainab", "014-882 5532", 350, 0, 0, 1, 5],
  ["Gan Hui Min", "HM Dental Clinic", "012-554 0187", 0, 0, 0, 0, 62],
  ["Ismail Yusof", "IY Plumbing Works", "013-707 1193", 1780, 0, 0, 2, 3],
  ["Chan Siew Fong", undefined, "016-448 2276", 0, 0, 35, 0, 14],
  ["Mohd Azri", "Azri Auto Care", "018-991 6350", 2900, 2900, 0, 2, 41],
  ["Devi Krishnan", "DK Florist", "011-2210 4468", 0, 0, 0, 0, 27],
  ["Teo Chee Keong", "CK Solar Solutions", "012-336 9054", 18900, 0, 0, 3, 1],
  ["Salmah Ahmad", "Warung Salmah", "019-120 7783", 220, 220, 0, 1, 24],
  ["Vincent Ho", "VH Interior Design", "017-663 4021", 5600, 0, 0, 2, 6],
  ["Nor Azizah", undefined, "014-557 8812", 0, 0, 0, 0, 38],
  ["Jason Liew", "JL Digital Marketing", "016-772 3340", 3300, 0, 0, 1, 2],
  ["Maznah Abdullah", "Maznah Cakes", "013-228 9906", 0, 0, 15, 0, 10],
  ["Ravi Chandran", "RC Logistics", "012-808 5527", 7450, 7450, 0, 5, 58],
  ["Lau Pei Shan", "PS Learning Centre", "018-336 1204", 960, 0, 0, 1, 4],
  ["Hamdan Ali", "Hamdan Fishery", "011-3345 6671", 0, 0, 0, 0, 90],
  ["Kavitha Rao", undefined, "017-442 8093", 0, 0, 0, 0, 16],
  ["Yap Jia Hao", "JH Roofing", "019-553 2218", 2480, 0, 0, 2, 8],
  ["Rohani Samad", "Rohani Laundry", "014-661 7745", 410, 0, 0, 1, 13],
  ["Steven Goh", "SG Machinery Sdn Bhd", "012-229 6618", 9800, 4100, 0, 4, 29],
  ["Halimah Daud", undefined, "013-779 3302", 0, 0, 80, 0, 18],
  ["Arjun Menon", "AM Cloud Services", "016-110 4496", 1500, 0, 0, 1, 2],
  ["Cheah Yoke Lan", "YL Herbal Shop", "018-445 7739", 0, 0, 0, 0, 52],
  ["Faizul Hakim", "FH Motors", "017-882 1160", 3150, 0, 0, 2, 9],
  ["Esther Pang", "Pang Photography", "011-2609 3358", 0, 0, 0, 0, 31],
  [
    "Khairul Anuar",
    "KA Security Services",
    "019-447 8820",
    1240,
    1240,
    0,
    1,
    36,
  ],
];

export const sampleCustomers: Customer[] = seeds.map(
  (
    [name, company, phone, outstanding, overdue, credit, openInvoices, days],
    i,
  ) => ({
    id: `c${i + 1}`,
    name,
    company,
    phone,
    email: phone ? email(name, company) : undefined,
    outstanding,
    overdue,
    credit,
    openInvoices,
    lastActivity: daysAgo(days),
    // Sample only: every third customer has never paid.
    lastPayment: i % 3 === 0 ? undefined : daysAgo(days + 3 + (i % 17)),
    // Sample only: the API will send the real age of the oldest overdue invoice.
    overdueDays: overdue > 0 ? days + 10 : undefined,
  }),
);
