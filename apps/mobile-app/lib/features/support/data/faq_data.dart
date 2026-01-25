import '../models/article_model.dart';

const List<ArticleCategory> kHelpCategories = [
  ArticleCategory(id: 'getting_started', title: 'Getting Started', icon: '🚀'),
  ArticleCategory(id: 'contributions', title: 'Contributions', icon: '💰'),
  ArticleCategory(id: 'wallet', title: 'Wallet & Limits', icon: '🔒'),
  ArticleCategory(id: 'account', title: 'Account', icon: '👤'),
];

const List<Article> kHelpArticles = [
  // Getting Started
  Article(
    id: 'join_group',
    categoryId: 'getting_started',
    title: 'How do I join a group?',
    content:
        'Ask the group leader for an Invite Link or QR Code.\n\nOpen the app and scan the QR code or tap the link to join.',
  ),
  Article(
    id: 'create_group',
    categoryId: 'getting_started',
    title: 'Can I create my own group?',
    content:
        'Yes! Go to the Groups tab and click "Create".\n\nYou can make it Private (friends & family) or Public (community). Public groups require staff approval.',
  ),

  // Contributions
  Article(
    id: 'send_money',
    categoryId: 'contributions',
    title: 'How do I send money?',
    content:
        '1. Use MoMo (*182#) to send money to your Group Treasurer\'s number.\n2. You will receive an SMS from MoMo with a Transaction ID (TxID).\n3. Open the app, go to Contribute, and enter the Amount and TxID as proof.',
  ),
  Article(
    id: 'pending_contribution',
    categoryId: 'contributions',
    title: 'Why is my contribution "Pending"?',
    content:
        'The Group Treasurer needs to check their MoMo account and confirm they received the money.\n\nPlease give them some time. If it takes longer than 24 hours, contact your Treasurer.',
  ),
  Article(
    id: 'rejected_contribution',
    categoryId: 'contributions',
    title: 'My submission was "Rejected". What do I do?',
    content:
        'This usually means the Treasurer couldn\'t find your payment or the TxID was wrong.\n\nGo to your Contribution History, find the rejected item, and tap "Fix" to update the details and try again.',
  ),
  Article(
    id: 'direct_payment',
    categoryId: 'contributions',
    title: 'Can I pay directly in the app?',
    content:
        'No. To keep fees low and simple, we use standard MoMo transfers outside the app.\n\nThe app is strictly for record-keeping and transparency.',
  ),

  // Wallet
  Article(
    id: 'wallet_limit',
    categoryId: 'wallet',
    title: 'What is the maximum I can save?',
    content: 'The current wallet limit is 500,000 RWF per user.',
  ),
  Article(
    id: 'max_contribution',
    categoryId: 'wallet',
    title: 'What is the max contribution?',
    content: 'You can contribute up to 4,000 RWF per transaction.',
  ),

  // Account
  Article(
    id: 'lost_number',
    categoryId: 'account',
    title: 'I lost my phone number. Can I change it?',
    content:
        'Your account is tied to your phone number for security.\n\nPlease contact Support to verify your identity and recover your account.',
  ),
];
