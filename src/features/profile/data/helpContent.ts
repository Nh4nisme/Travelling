import type { FaqCategory, FaqCategoryId, FaqItem, ReportCategory } from '../types';

/**
 * Thông tin liên hệ hỗ trợ — THAY bằng thông tin thật trước khi phát hành.
 * Số điện thoại dưới đây là số giả (đầu số 555).
 */
export const SUPPORT_CONTACT = {
  email: 'support@travelling.app',
  phoneDisplay: '+1 (800) 555-0123',
  phoneDial: '+18005550123',
  hours: '24/7',
  responseTime: 'within 24 hours',
} as const;

export const FAQ_CATEGORIES: FaqCategory[] = [
  { id: 'booking', title: 'Booking', icon: 'calendar-outline' },
  { id: 'payments', title: 'Payments & fees', icon: 'card-outline' },
  { id: 'cancellations', title: 'Cancellations', icon: 'close-circle-outline' },
  { id: 'account', title: 'Account', icon: 'person-outline' },
  { id: 'stays', title: 'Your stay', icon: 'bed-outline' },
  { id: 'safety', title: 'Safety & trust', icon: 'shield-checkmark-outline' },
];

export const FAQS: FaqItem[] = [
  // ---- Booking ----
  {
    id: 'book-how',
    category: 'booking',
    popular: true,
    question: 'How do I book a place?',
    answer:
      'Use the Search tab to pick a destination, dates and guests, then open a listing you like. Continue to Confirm and pay, choose a payment option and tap Book now. You will get a confirmation screen with your booking reference.',
    keywords: ['reserve', 'reservation', 'book', 'stay', 'how to'],
  },
  {
    id: 'book-find',
    category: 'booking',
    question: 'Where can I find my bookings?',
    answer:
      'Open the Booking tab. Each reservation shows the place, your dates, the booking reference and the amount you paid. Keep the reference handy in case you need to contact support.',
    keywords: ['reservation', 'trips', 'reference', 'history'],
  },
  {
    id: 'book-change',
    category: 'booking',
    question: 'Can I change my dates or number of guests?',
    answer:
      'You can edit dates and guests on the Confirm and pay screen before you book. Once a booking is made, message your host from the Inbox tab or contact support with your booking reference and we will help.',
    keywords: ['modify', 'edit', 'reschedule', 'adults', 'children'],
  },
  {
    id: 'book-host',
    category: 'booking',
    question: 'How do I message my host?',
    answer:
      'Go to the Inbox tab and open your conversation with the host. You can ask about check-in, directions or anything else about your stay. Use the Support filter in the Inbox to reach the Travelling Support team.',
    keywords: ['chat', 'contact host', 'message', 'inbox'],
  },

  // ---- Payments ----
  {
    id: 'pay-options',
    category: 'payments',
    popular: true,
    question: 'What payment options do I have?',
    answer:
      'When you book you can Pay in full to finalise right away, or Pay a part now and settle the remaining amount later. Choose your option on the Confirm and pay screen before tapping Book now.',
    keywords: ['partial', 'installment', 'pay later', 'full payment', 'deposit'],
  },
  {
    id: 'pay-fees',
    category: 'payments',
    question: 'What fees will I be charged?',
    answer:
      'The Price details section on Confirm and pay shows the full breakdown: the nightly rate multiplied by the number of nights, plus service fees such as the Kayak fee and the street parking fee. The total in USD is shown before you book.',
    keywords: ['price', 'cost', 'charges', 'total', 'service fee', 'tax'],
  },
  {
    id: 'pay-methods',
    category: 'payments',
    question: 'How do I manage my payment methods?',
    answer:
      'Go to Profile > Payments to see your payment methods. Adding and removing payment methods directly from the app is coming soon.',
    keywords: ['card', 'credit', 'debit', 'wallet', 'add card'],
  },
  {
    id: 'pay-missing',
    category: 'payments',
    question: 'I was charged but cannot see my booking',
    answer:
      'Check the Booking tab first, as it can take a moment to update. If your booking still does not appear, go to Help Center > Report a Problem, choose Payment or charge, and include the date and amount of the charge so we can look into it.',
    keywords: ['double charge', 'missing', 'billing', 'payment failed', 'money'],
  },

  // ---- Cancellations ----
  {
    id: 'cancel-how',
    category: 'cancellations',
    popular: true,
    question: 'How do I cancel a booking?',
    answer:
      'Cancellation terms depend on the listing and the payment option you chose. Contact support, or your host through the Inbox, with your booking reference and we will walk you through your options.',
    keywords: ['cancel', 'cancellation', 'cancel reservation'],
  },
  {
    id: 'cancel-refund',
    category: 'cancellations',
    question: 'Will I get a refund if I cancel?',
    answer:
      'Refund eligibility depends on the cancellation terms of your listing and how much you have already paid. Contact support with your booking reference and our team will review your case and confirm what applies.',
    keywords: ['refund', 'money back', 'reimbursement'],
  },
  {
    id: 'cancel-host',
    category: 'cancellations',
    question: 'What if my host cancels?',
    answer:
      'If your host cancels, contact support right away with your booking reference. We will help you find another place or review a refund for what you have already paid.',
    keywords: ['host cancelled', 'cancelled by host', 'rebook'],
  },

  // ---- Account ----
  {
    id: 'acct-profile',
    category: 'account',
    popular: true,
    question: 'How do I update my name or phone number?',
    answer: 'Open Profile > Personal info, edit your name or phone number and tap Save Changes.',
    keywords: ['edit profile', 'change name', 'phone', 'personal info'],
  },
  {
    id: 'acct-email',
    category: 'account',
    question: 'How do I change my email address?',
    answer:
      'For security reasons your email cannot be changed in the app. Contact support from Help Center > Contact Support and we will help you update it.',
    keywords: ['email', 'change email', 'update email'],
  },
  {
    id: 'acct-signin',
    category: 'account',
    question: 'I cannot sign in to my account',
    answer:
      'Double-check your email and password (passwords are at least 6 characters). If you still cannot get in, contact support from the Help Center and tell us the email address you registered with.',
    keywords: ['login', 'log in', 'password', 'forgot password', 'locked out'],
  },
  {
    id: 'acct-logout',
    category: 'account',
    question: 'How do I log out?',
    answer: 'Go to the Profile tab and tap Log out at the bottom of the page.',
    keywords: ['sign out', 'logout'],
  },

  // ---- Your stay ----
  {
    id: 'stay-times',
    category: 'stays',
    question: 'What are the check-in and check-out times?',
    answer:
      'Check-in and check-out times are listed on each listing page, together with the host check-in policy. If you need something different, ask your host in the Inbox before you arrive.',
    keywords: ['arrival', 'departure', 'checkin', 'checkout', 'time'],
  },
  {
    id: 'stay-early',
    category: 'stays',
    question: 'Can I arrive early or leave my luggage?',
    answer:
      'Hosts set their own rules, so message your host from the Inbox to ask about early check-in or luggage drop-off. It is best to ask before your trip.',
    keywords: ['early check-in', 'late check-out', 'luggage', 'bags', 'storage'],
  },
  {
    id: 'stay-facilities',
    category: 'stays',
    question: 'How do I know what is included in a listing?',
    answer:
      'Open a listing and tap Facilities to see everything that is provided, from internet access to the kitchen. You can also filter by facilities when you search.',
    keywords: ['amenities', 'wifi', 'kitchen', 'parking', 'included'],
  },

  // ---- Safety ----
  {
    id: 'safe-emergency',
    category: 'safety',
    question: 'What should I do in an emergency?',
    answer:
      'If you or anyone with you is in danger, contact local emergency services first. Once everyone is safe, reach out to us through Contact Support so we can help with next steps.',
    keywords: ['urgent', 'danger', 'police', 'ambulance', 'help now'],
  },
  {
    id: 'safe-report',
    category: 'safety',
    question: 'How do I report a problem with a listing or host?',
    answer:
      'Go to Help Center > Report a Problem and choose Listing or host. Describe what happened and select the related booking if you have one, and our team will follow up by email.',
    keywords: ['complaint', 'report host', 'report listing', 'scam', 'fraud'],
  },
  {
    id: 'safe-account',
    category: 'safety',
    question: 'How can I keep my account secure?',
    answer:
      'Use a unique password, never share it with anyone and log out when you use a shared device. Our team will never ask for your password.',
    keywords: ['security', 'password', 'phishing', 'hack'],
  },
];

export const REPORT_CATEGORIES: ReportCategory[] = [
  { id: 'booking', label: 'Booking issue', icon: 'calendar-outline' },
  { id: 'payment', label: 'Payment or charge', icon: 'card-outline' },
  { id: 'listing', label: 'Listing or host', icon: 'home-outline' },
  { id: 'account', label: 'Account problem', icon: 'person-outline' },
  { id: 'app', label: 'App bug', icon: 'bug-outline' },
  { id: 'other', label: 'Something else', icon: 'ellipsis-horizontal-circle-outline' },
];

export const getFaqCategory = (id: FaqCategoryId) => FAQ_CATEGORIES.find((cat) => cat.id === id);

export const countFaqsByCategory = (id: FaqCategoryId) => FAQS.filter((faq) => faq.category === id).length;
