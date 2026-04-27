// Mock data for WVNews Platform prototype
// In production, this comes from PostgreSQL via API

// WV News Group publications. Codes match the existing CMS (admin/sites screenshot).
// `slug` is the live wvnews.com URL prefix (used to match RSS items to publications).
// `domain` is the public-facing site. `logoFile` is the masthead asset when we have
// a dedicated one; when null the UI falls back to a color+code badge.
export const sites = [
  { id: 'wvnews', code: 'WV', name: 'WV News', domain: 'wvnews.com', slug: 'wvnews', logoFile: '/publications/wvnews.png', color: '#1a2c5b', primary: true, market: 'North Central WV' },
  { id: 'exponent', code: 'EXP', name: 'Exponent Telegram', domain: 'theet.com', slug: 'theet', logoFile: '/publications/theet.png', color: '#8b2500', market: 'Clarksburg' },
  { id: 'dominion', code: 'MN', name: 'Morgantown News', domain: 'morgantownnews.com', slug: 'morgantownnews', logoFile: '/publications/morgantownnews.png', color: '#c0392b', market: 'Morgantown' },
  { id: 'statejournal', code: 'STJ', name: 'The State Journal', domain: 'statejournal.com', slug: 'statejournal', logoFile: '/publications/statejournal.png', color: '#7b2d8b', market: 'Business / Statewide' },
  // Blue & Gold News logo not yet supplied — falls back to color+code badge.
  { id: 'bluegold', code: 'BGN', name: 'Blue & Gold News', domain: 'bluegoldnews.com', slug: 'bluegoldnews', logoFile: null, color: '#002855', market: 'WVU Athletics' },
  { id: 'bridgeport', code: 'BPN', name: 'Bridgeport News', domain: 'bridgeportnews.com', slug: 'bridgeportnews', logoFile: '/publications/bridgeportnews.png', color: '#0d4a8f', market: 'Bridgeport' },
  { id: 'recorddelta', code: 'RD', name: 'The Record Delta', domain: 'recorddelta.com', slug: 'recorddelta', logoFile: '/publications/recorddelta.png', color: '#3b7d3b', market: 'Buckhannon / Upshur Co.' },
  { id: 'weston', code: 'WES', name: 'Weston Democrat', domain: 'westondemocrat.com', slug: 'westondemocrat', logoFile: '/publications/weston.png', color: '#2d6a4f', market: 'Weston / Lewis Co.' },
  { id: 'jackson', code: 'JAC', name: 'Jackson Star & Herald', domain: 'jacksonstar.com', slug: 'jacksonnews', logoFile: '/publications/jackson.png', color: '#1a4d80', market: 'Jackson Co.' },
  { id: 'preston', code: 'PJN', name: 'Preston News & Journal', domain: 'prestonnj.com', slug: 'prestonnews', logoFile: '/publications/preston.png', color: '#6b4226', market: 'Preston Co.' },
  { id: 'braxtondem', code: 'BD', name: 'Braxton Democrat', domain: 'braxtondemocrat.com', slug: 'braxtonnews', logoFile: '/publications/braxtondem.png', color: '#4a5d23', market: 'Braxton Co.' },
  { id: 'braxtoncit', code: 'BC', name: 'Braxton Citizens\' News', domain: 'braxtoncitizens.com', slug: 'braxtoncit', logoFile: '/publications/braxtoncit.png', color: '#7d5a27', market: 'Braxton Co.' },
  { id: 'mtnstates', code: 'MS', name: 'Mountain Statesman', domain: 'mountainstatesman.com', slug: 'mountainstatesman', logoFile: '/publications/mtnstates.png', color: '#5d4a2a', market: 'Grafton / Taylor Co.' },
  { id: 'mineral', code: 'MNT', name: 'Mineral News & Tribune', domain: 'mineraldaily.com', slug: 'mineralnews', logoFile: '/publications/mineral.png', color: '#2d4a5d', market: 'Keyser / Mineral Co.' },
  { id: 'rivercities', code: 'RTR', name: 'River Cities News', domain: 'rivercitiesnews.com', slug: 'rivercities', logoFile: '/publications/rivercities.png', color: '#2a5d6b', market: 'New/Stonewood' },
  { id: 'roane', code: 'SR', name: 'Roane County Reporter', domain: 'roanereporter.com', slug: 'roanereporter', logoFile: '/publications/roane.png', color: '#6b2a5d', market: 'Roane Co.' },
  { id: 'spencer', code: 'ST', name: 'Spencer Times Record', domain: 'spencertimes.com', slug: 'spencernews', logoFile: '/publications/spencer.png', color: '#8b5a2b', market: 'Spencer / Roane Co.' },
  { id: 'garrett', code: 'RPB', name: 'Garrett County Republican', domain: 'gcnews.com', slug: 'garrettrepublican', logoFile: '/publications/garrett.png', color: '#2d3e7b', market: 'Garrett Co., MD' },
  { id: 'bulletin', code: 'YBB', name: 'Your Bulletin Board', domain: 'yourbulletinboard.com', slug: 'bulletinboard', logoFile: '/publications/bulletin.png', color: '#7b7b2d', market: 'Community Events' },
  { id: 'fmn', code: 'FMN', name: 'Fairmont News', domain: 'fairmontnews.com', slug: 'fairmontnews', logoFile: '/publications/fairmontnews.png', color: '#5d2a4a', market: 'Fairmont / Marion Co.' },
];

export const sections = [
  { id: 'news', name: 'News', slug: 'news', icon: '📰' },
  { id: 'sports', name: 'Sports', slug: 'sports', icon: '🏈' },
  { id: 'opinion', name: 'Opinion', slug: 'opinion', icon: '💬' },
  { id: 'business', name: 'Business', slug: 'business', icon: '💼' },
  { id: 'crime', name: 'Crime & Courts', slug: 'crime-courts', icon: '⚖️' },
  { id: 'education', name: 'Education', slug: 'education', icon: '🎓' },
  { id: 'lifestyle', name: 'Lifestyle', slug: 'lifestyle', icon: '🌿' },
  { id: 'obituaries', name: 'Obituaries', slug: 'obituaries', icon: '🕊️' },
  { id: 'politics', name: 'Politics', slug: 'politics', icon: '🏛️' },
  { id: 'community', name: 'Community', slug: 'community', icon: '🤝' },
];

export const stories = [
  {
    id: '1',
    headline: 'Governor Signs Historic Infrastructure Bill Allocating $2.3B for West Virginia Roads',
    seoHeadline: 'WV Governor Signs $2.3B Infrastructure Bill for Roads and Bridges',
    slug: 'governor-signs-infrastructure-bill-2024',
    deck: 'The landmark legislation will fund repairs to 1,200 miles of state highways and 340 bridges over the next five years.',
    body: `<p>CHARLESTON — Governor Jim Justice signed into law Thursday what officials are calling the largest single infrastructure investment in West Virginia history, a $2.3 billion package that will fund road repairs, bridge replacements, and broadband expansion across all 55 counties.</p>
<p>The bill, which passed both chambers of the Legislature with bipartisan support, earmarks funding over five years beginning in fiscal year 2025. Transportation Secretary Jimmy Wriston said the plan targets 1,200 miles of state highways rated in "poor" or "failing" condition and 340 structurally deficient bridges.</p>
<p>"This is a generational investment," Justice said at the signing ceremony at the Culture Center. "We're not just fixing roads — we're building the foundation for the next 50 years of economic growth in West Virginia."</p>
<p>The funding breakdown includes $1.4 billion for highway resurfacing and reconstruction, $620 million for bridge replacement and rehabilitation, $180 million for rural broadband infrastructure along highway corridors, and $100 million for county road assistance grants.</p>
<p>Critics have questioned whether the state's Division of Highways has the capacity to manage projects of this scale simultaneously. Senate Minority Leader Mike Woelfel (D-Cabell) voted for the bill but cautioned that "the devil is in the execution."</p>`,
    author: { name: 'Sarah Mitchell', role: 'Capitol Bureau Chief', avatar: 'SM' },
    section: 'news',
    secondarySections: ['politics', 'business'],
    sites: ['wvnews', 'exponent', 'statejournal'],
    status: 'published',
    accessLevel: 'free',
    publishedAt: '2026-03-09T08:00:00Z',
    updatedAt: '2026-03-09T10:30:00Z',
    image: { url: '/placeholder-capitol.jpg', alt: 'West Virginia State Capitol building in Charleston', credit: 'WVNews / James Harper' },
    tags: ['infrastructure', 'governor', 'roads', 'bridges', 'legislation'],
    stats: { views: 14230, uniqueReaders: 8920, avgTimeOnPage: '4:12', socialShares: 342, paywallHits: 0 },
    seo: { score: 92, keyword: 'west virginia infrastructure bill', metaDesc: 'Governor signs $2.3B infrastructure bill funding 1,200 miles of highway repairs and 340 bridge replacements across West Virginia.' },
    featured: true,
    breaking: false,
  },
  {
    id: '2',
    headline: 'Mountaineers Stun No. 8 Kansas in Big 12 Thriller',
    seoHeadline: 'WVU Basketball Upsets No. 8 Kansas 78-74 in Big 12 Conference Game',
    slug: 'mountaineers-stun-kansas-big12',
    deck: 'Tucker DeVries scores 28 points as WVU pulls off the biggest upset of the Big 12 season at the Coliseum.',
    body: `<p>MORGANTOWN — The WVU Coliseum was shaking. Tucker DeVries drained a contested three-pointer with 34 seconds remaining, and the sellout crowd of 14,000 erupted as the Mountaineers completed a stunning 78-74 upset of No. 8 Kansas on Saturday night.</p>
<p>DeVries finished with 28 points, 6 rebounds, and 4 assists in what head coach Darian DeVries called "the most complete game we've played all season." The victory snaps a four-game losing streak against ranked opponents and keeps WVU's NCAA Tournament hopes alive.</p>
<p>"This crowd, this arena — there's nothing like it," DeVries said in the postgame press conference. "Our guys fed off that energy from the opening tip."</p>`,
    author: { name: 'Marcus Cole', role: 'Sports Editor', avatar: 'MC' },
    section: 'sports',
    secondarySections: [],
    sites: ['wvnews', 'dominion', 'exponent'],
    status: 'published',
    accessLevel: 'metered',
    publishedAt: '2026-03-08T23:45:00Z',
    updatedAt: '2026-03-09T01:00:00Z',
    image: { url: '/placeholder-sports.jpg', alt: 'WVU Coliseum basketball game', credit: 'WVNews / Rachel Torres' },
    tags: ['WVU', 'basketball', 'Big 12', 'Kansas', 'sports'],
    stats: { views: 28450, uniqueReaders: 19200, avgTimeOnPage: '3:45', socialShares: 1240, paywallHits: 820 },
    seo: { score: 88, keyword: 'WVU basketball Kansas upset', metaDesc: 'Tucker DeVries scores 28 as WVU upsets No. 8 Kansas 78-74 at the Coliseum in a Big 12 thriller.' },
    featured: true,
    breaking: false,
  },
  {
    id: '3',
    headline: 'Harrison County Commission Approves $4.2M Water System Upgrade',
    slug: 'harrison-county-water-system-upgrade',
    deck: 'The project will replace aging water lines serving 3,400 customers in the Shinnston area.',
    body: '<p>CLARKSBURG — The Harrison County Commission voted unanimously Tuesday to approve a $4.2 million water infrastructure project that will replace deteriorating water lines in the Shinnston service area.</p><p>The project, funded through a combination of state revolving loan funds and ARPA allocations, will replace approximately 12 miles of water main that in some areas dates to the 1950s. County Engineer David Hinkle said the aging pipes have been responsible for an average of three water main breaks per month over the past year.</p>',
    author: { name: 'Jennifer Walsh', role: 'Staff Reporter', avatar: 'JW' },
    section: 'news',
    secondarySections: ['community'],
    sites: ['exponent'],
    status: 'published',
    accessLevel: 'subscriber',
    publishedAt: '2026-03-09T06:30:00Z',
    image: { url: '/placeholder-local.jpg', alt: 'Water main construction project', credit: 'ET / Staff' },
    tags: ['harrison county', 'water', 'infrastructure', 'shinnston'],
    stats: { views: 3420, uniqueReaders: 2100, avgTimeOnPage: '2:55', socialShares: 87, paywallHits: 450 },
    seo: { score: 78, keyword: 'harrison county water upgrade', metaDesc: 'Harrison County approves $4.2M water system upgrade replacing aging pipes in Shinnston area.' },
    featured: false,
    breaking: false,
  },
  {
    id: '4',
    headline: 'Morgantown Chef Opens First Appalachian-Fusion Restaurant Downtown',
    slug: 'appalachian-fusion-restaurant-morgantown',
    deck: 'Root & Ramp combines traditional mountain cooking with global techniques in a 60-seat space on High Street.',
    body: '<p>MORGANTOWN — Chef Elena Sparks has spent the last decade cooking in kitchens from New York to Tokyo, but her new restaurant on High Street draws from a more personal source: her grandmother\'s kitchen in Webster County.</p><p>Root & Ramp, which opened its doors last Friday, pairs Appalachian ingredients — ramps, pawpaws, sorghum, heritage pork — with techniques Sparks picked up abroad.</p>',
    author: { name: 'Amy Chen', role: 'Features Writer', avatar: 'AC' },
    section: 'lifestyle',
    secondarySections: ['business', 'community'],
    sites: ['wvnews', 'dominion'],
    status: 'published',
    accessLevel: 'free',
    publishedAt: '2026-03-08T12:00:00Z',
    image: { url: '/placeholder-food.jpg', alt: 'Root & Ramp restaurant interior', credit: 'WVNews / Amy Chen' },
    tags: ['restaurant', 'morgantown', 'food', 'appalachian'],
    stats: { views: 6780, uniqueReaders: 5100, avgTimeOnPage: '3:20', socialShares: 456, paywallHits: 0 },
    seo: { score: 85, keyword: 'morgantown appalachian restaurant', metaDesc: 'Root & Ramp brings Appalachian-fusion cuisine to downtown Morgantown with a menu rooted in mountain traditions.' },
    featured: false,
    breaking: false,
  },
  {
    id: '5',
    headline: 'Breaking: Chemical Spill Reported on I-79 Near Flatwoods; Northbound Lanes Closed',
    slug: 'chemical-spill-i79-flatwoods',
    deck: 'HAZMAT crews are on scene after a tanker truck overturned near mile marker 67.',
    body: '<p>FLATWOODS — Emergency crews are responding to a chemical spill on Interstate 79 northbound near mile marker 67 in Braxton County after a tanker truck overturned shortly before 6 a.m. Tuesday.</p><p>The West Virginia Division of Highways has closed northbound lanes between the Flatwoods and Burnsville exits. Southbound traffic is unaffected but slowed due to rubbernecking. Drivers are advised to use Route 19 as an alternate.</p>',
    author: { name: 'Tom Bradley', role: 'Breaking News Reporter', avatar: 'TB' },
    section: 'news',
    secondarySections: ['crime'],
    sites: ['wvnews', 'exponent'],
    status: 'published',
    accessLevel: 'free',
    publishedAt: '2026-03-09T06:15:00Z',
    image: { url: '/placeholder-breaking.jpg', alt: 'Emergency vehicles on Interstate 79', credit: 'WVNews / Staff' },
    tags: ['breaking', 'i-79', 'traffic', 'hazmat', 'braxton county'],
    stats: { views: 22100, uniqueReaders: 18400, avgTimeOnPage: '1:45', socialShares: 890, paywallHits: 0 },
    seo: { score: 95, keyword: 'I-79 chemical spill flatwoods', metaDesc: 'Chemical spill closes I-79 northbound near Flatwoods after tanker truck overturns. HAZMAT crews responding.' },
    featured: true,
    breaking: true,
  },
  {
    id: '6',
    headline: 'Editorial: It\'s Time to Invest in West Virginia\'s Teachers Before They Leave',
    slug: 'editorial-invest-wv-teachers',
    deck: 'Teacher vacancies hit a record high this year. Our schools cannot survive without competitive pay.',
    body: '<p>West Virginia lost more than 700 teachers to resignation or retirement last school year alone. The vacancy rate in math and science positions has tripled since 2019. In rural counties like Braxton, Webster, and Pocahontas, a single resignation can leave students without a qualified instructor for months.</p>',
    author: { name: 'Editorial Board', role: 'Opinion', avatar: 'EB' },
    section: 'opinion',
    secondarySections: ['education'],
    sites: ['wvnews'],
    status: 'published',
    accessLevel: 'metered',
    publishedAt: '2026-03-08T05:00:00Z',
    image: { url: '/placeholder-classroom.jpg', alt: 'Empty classroom', credit: 'WVNews / File' },
    tags: ['editorial', 'education', 'teachers', 'pay'],
    stats: { views: 5670, uniqueReaders: 4200, avgTimeOnPage: '5:30', socialShares: 234, paywallHits: 320 },
    seo: { score: 80, keyword: 'west virginia teacher shortage', metaDesc: 'Editorial: Teacher vacancies at record highs demand competitive pay investment in West Virginia schools.' },
    featured: false,
    breaking: false,
  },
];

export const budgetItems = [
  { id: 'b1', slug: 'infrastructure-bill', reporter: 'Sarah Mitchell', section: 'News', type: 'News', status: 'Published', printFlag: true, digitalFlag: true, targetLength: 800, site: 'WVNews', date: '2026-03-09' },
  { id: 'b2', slug: 'wvu-kansas-recap', reporter: 'Marcus Cole', section: 'Sports', type: 'Game Recap', status: 'Published', printFlag: true, digitalFlag: true, targetLength: 600, site: 'WVNews', date: '2026-03-09' },
  { id: 'b3', slug: 'city-council-agenda', reporter: 'Jennifer Walsh', section: 'News', type: 'News', status: 'In Progress', printFlag: true, digitalFlag: true, targetLength: 500, site: 'Exponent', date: '2026-03-09' },
  { id: 'b4', slug: 'spring-sports-preview', reporter: 'Marcus Cole', section: 'Sports', type: 'Feature', status: 'Assigned', printFlag: false, digitalFlag: true, targetLength: 1200, site: 'WVNews', date: '2026-03-10' },
  { id: 'b5', slug: 'school-board-vote', reporter: 'Amy Chen', section: 'Education', type: 'News', status: 'Filed', printFlag: true, digitalFlag: true, targetLength: 600, site: 'Exponent', date: '2026-03-09' },
  { id: 'b6', slug: 'restaurant-review', reporter: 'Amy Chen', section: 'Lifestyle', type: 'Feature', status: 'Published', printFlag: false, digitalFlag: true, targetLength: 900, site: 'WVNews', date: '2026-03-08' },
  { id: 'b7', slug: 'drug-bust-upshur', reporter: 'Tom Bradley', section: 'Crime', type: 'Breaking', status: 'In Progress', printFlag: true, digitalFlag: true, targetLength: 400, site: 'WVNews', date: '2026-03-09' },
  { id: 'b8', slug: 'county-commission', reporter: 'Jennifer Walsh', section: 'News', type: 'Government', status: 'Draft', printFlag: true, digitalFlag: true, targetLength: 700, site: 'Exponent', date: '2026-03-10' },
];

export const subscribers = [
  { id: 's1', name: 'Robert Johnson', email: 'rjohnson@gmail.com', tier: 'Digital All-Access', status: 'Active', since: '2024-01-15', zip: '26301', site: 'wvnews', revenue: '$9.99/mo' },
  { id: 's2', name: 'Patricia Williams', email: 'pwilliams@yahoo.com', tier: 'Print + Digital', status: 'Active', since: '2022-06-01', zip: '26505', site: 'dominion', revenue: '$14.99/mo' },
  { id: 's3', name: 'James Anderson', email: 'janderson@outlook.com', tier: 'E-Edition Only', status: 'Active', since: '2025-03-20', zip: '26452', site: 'exponent', revenue: '$6.99/mo' },
  { id: 's4', name: 'Mary Thompson', email: 'mthompson@aol.com', tier: 'Digital All-Access', status: 'Past Due', since: '2023-09-01', zip: '26554', site: 'wvnews', revenue: '$9.99/mo' },
  { id: 's5', name: 'David Martinez', email: 'dmartinez@gmail.com', tier: 'Registered Free', status: 'Active', since: '2026-01-08', zip: '26301', site: 'exponent', revenue: '$0' },
];

export const analyticsData = {
  overview: {
    totalPageviews: 284500,
    uniqueVisitors: 142300,
    avgSessionDuration: '3:22',
    bounceRate: '42%',
    newSubscribers: 127,
    revenue: '$12,430',
    registrations: 892,
    newsletterSends: 14,
  },
  trafficSources: [
    { name: 'Search', value: 42, color: '#4c6ef5' },
    { name: 'Direct', value: 28, color: '#1e3a5f' },
    { name: 'Social', value: 18, color: '#c0392b' },
    { name: 'Newsletter', value: 8, color: '#d4a843' },
    { name: 'Referral', value: 4, color: '#2d6a4f' },
  ],
  dailyViews: [
    { date: 'Mar 3', views: 38200, subscribers: 15 },
    { date: 'Mar 4', views: 41500, subscribers: 22 },
    { date: 'Mar 5', views: 39800, subscribers: 18 },
    { date: 'Mar 6', views: 44200, subscribers: 31 },
    { date: 'Mar 7', views: 42100, subscribers: 19 },
    { date: 'Mar 8', views: 48700, subscribers: 28 },
    { date: 'Mar 9', views: 30000, subscribers: 14 },
  ],
  paywallFunnel: [
    { stage: 'Total Visitors', count: 142300 },
    { stage: 'Hit Paywall', count: 28460 },
    { stage: 'Registered', count: 8920 },
    { stage: 'Started Checkout', count: 1240 },
    { stage: 'Subscribed', count: 127 },
  ],
};

export const newsletters = [
  { id: 'n1', name: 'WVNews Daily Digest', type: 'Daily', subscribers: 24500, lastSent: '2026-03-09 06:00', openRate: '32%', clickRate: '8.4%', status: 'Sent' },
  { id: 'n2', name: 'Breaking News Alerts', type: 'Breaking', subscribers: 18200, lastSent: '2026-03-09 06:20', openRate: '58%', clickRate: '22%', status: 'Sent' },
  { id: 'n3', name: 'Sports Wrap', type: 'Weekly', subscribers: 12800, lastSent: '2026-03-08 18:00', openRate: '28%', clickRate: '12%', status: 'Scheduled' },
  { id: 'n4', name: 'Business Report', type: 'Weekly', subscribers: 6400, lastSent: '2026-03-07 07:00', openRate: '25%', clickRate: '6.8%', status: 'Draft' },
];

export const socialAccounts = [
  { platform: 'Facebook', handle: '@WVNews', followers: '45.2K', site: 'wvnews', lastPost: '2h ago', engagement: '3.2%' },
  { platform: 'X (Twitter)', handle: '@waborsky', followers: '12.8K', site: 'wvnews', lastPost: '45m ago', engagement: '1.8%' },
  { platform: 'Instagram', handle: '@wvnews_official', followers: '8.4K', site: 'wvnews', lastPost: '4h ago', engagement: '4.1%' },
  { platform: 'TikTok', handle: '@wvnews', followers: '3.2K', site: 'wvnews', lastPost: '1d ago', engagement: '6.8%' },
  { platform: 'Facebook', handle: '@ExponentTelegram', followers: '28.1K', site: 'exponent', lastPost: '1h ago', engagement: '2.9%' },
  { platform: 'X (Twitter)', handle: '@TheETonline', followers: '8.9K', site: 'exponent', lastPost: '3h ago', engagement: '1.5%' },
];

export const formTemplates = [
  { id: 'f1', name: 'Submit an Obituary', submissions: 234, status: 'Active', fields: 8, hasPayment: true, price: '$75' },
  { id: 'f2', name: 'Letter to the Editor', submissions: 89, status: 'Active', fields: 5, hasPayment: false },
  { id: 'f3', name: 'Wedding Announcement', submissions: 42, status: 'Active', fields: 12, hasPayment: true, price: '$50' },
  { id: 'f4', name: 'Event Calendar Submission', submissions: 156, status: 'Active', fields: 7, hasPayment: false },
  { id: 'f5', name: 'Story Tip / News Lead', submissions: 312, status: 'Active', fields: 4, hasPayment: false },
  { id: 'f6', name: 'Classified Ad', submissions: 67, status: 'Active', fields: 6, hasPayment: true, price: '$25' },
  { id: 'f7', name: 'Sports Scores', submissions: 98, status: 'Active', fields: 5, hasPayment: false },
  { id: 'f8', name: 'Photo Submission', submissions: 45, status: 'Active', fields: 4, hasPayment: false },
];

export const adCampaigns = [
  { id: 'a1', advertiser: 'Mountain State Auto Group', type: 'Display', zone: 'Leaderboard', impressions: '124.5K', clicks: 892, ctr: '0.72%', status: 'Active', flight: 'Mar 1-31', revenue: '$2,400' },
  { id: 'a2', advertiser: 'WVU Medicine', type: 'Sponsored', zone: 'Native Inline', impressions: '68.2K', clicks: 1240, ctr: '1.82%', status: 'Active', flight: 'Feb 15 - Mar 15', revenue: '$3,500' },
  { id: 'a3', advertiser: 'First Exchange Bank', type: 'Display', zone: 'Sidebar', impressions: '89.1K', clicks: 445, ctr: '0.50%', status: 'Active', flight: 'Mar 1-31', revenue: '$1,200' },
  { id: 'a4', advertiser: 'Clarksburg Furniture Gallery', type: 'Display', zone: 'Mobile Banner', impressions: '34.2K', clicks: 178, ctr: '0.52%', status: 'Ended', flight: 'Feb 1-28', revenue: '$800' },
];

// ============================================================================
// CONTESTS — Best Of ballots, sweepstakes, and photo/story contests
// ============================================================================
//
// Contest lifecycle depends on `type`:
//   - 'bestof':      nomination → voting → winners
//   - 'sweepstakes': entry → drawing → winners
//   - 'photo':       submission → voting (optional) → winners
//
// `phase` auto-advances based on current date vs phase windows, but admins
// can override via `phaseOverride`. See /admin/contests.

export const contests = [
  {
    id: 'c1',
    type: 'bestof',
    slug: 'best-of-harrison-2026',
    title: 'Best of Harrison 2026',
    subtitle: 'The 28th annual reader-voted awards',
    site: 'exponent',
    coSites: ['wvnews', 'bridgeport'],
    heroImage: '/placeholder-bestof.jpg',
    description: 'Celebrating the best businesses, restaurants, and community favorites in Harrison County — as chosen by you, our readers.',
    year: 2026,
    status: 'active',
    phase: 'voting', // nomination | voting | winners | closed
    phaseOverride: null,
    nominationStart: '2026-03-01',
    nominationEnd: '2026-03-31',
    votingStart: '2026-04-01',
    votingEnd: '2026-04-30',
    winnersPublish: '2026-06-15',
    topN: 5, // top N nominees per category advance to voting ballot
    votingRules: { authRequired: 'email', frequency: 'daily', perCategoryLimit: 1 },
    presentingSponsor: { name: 'Mountain State Auto Group', logo: '/placeholder-sponsor.jpg', url: '#' },
    categorySponsors: true,
    totalNominations: 14230,
    totalVotes: 48120,
    uniqueVoters: 8420,
    rulesUrl: '/contests/best-of-harrison-2026/rules',
  },
  {
    id: 'c2',
    type: 'bestof',
    slug: 'best-of-morgantown-2026',
    title: 'Best of Morgantown 2026',
    subtitle: 'Readers\' Choice Awards',
    site: 'dominion',
    coSites: ['bluegold'],
    heroImage: '/placeholder-bestof-mgt.jpg',
    description: 'The definitive Morgantown awards, decided by the people who live, shop, and eat here.',
    year: 2026,
    status: 'active',
    phase: 'nomination',
    phaseOverride: null,
    nominationStart: '2026-04-15',
    nominationEnd: '2026-05-15',
    votingStart: '2026-06-01',
    votingEnd: '2026-06-30',
    winnersPublish: '2026-08-01',
    topN: 5,
    votingRules: { authRequired: 'email', frequency: 'daily', perCategoryLimit: 1 },
    presentingSponsor: { name: 'WVU Medicine', logo: '/placeholder-sponsor.jpg', url: '#' },
    categorySponsors: true,
    totalNominations: 3240,
    totalVotes: 0,
    uniqueVoters: 0,
  },
  {
    id: 'c3',
    type: 'sweepstakes',
    slug: 'spring-getaway-sweepstakes-2026',
    title: 'Spring Getaway Sweepstakes',
    subtitle: 'Win a weekend for two at Stonewall Resort',
    site: 'wvnews',
    coSites: ['exponent', 'dominion', 'statejournal'],
    heroImage: '/placeholder-sweeps.jpg',
    description: 'Enter for a chance to win a two-night getaway for two at Stonewall Resort, including dinner, spa credits, and a round of golf. Total retail value: $750.',
    prize: 'Stonewall Resort weekend package — $750 value',
    status: 'active',
    phase: 'entry',
    phaseOverride: null,
    entryStart: '2026-04-01',
    entryEnd: '2026-05-31',
    drawingDate: '2026-06-05',
    winnersPublish: '2026-06-06',
    entryLimit: 1, // one entry per email/person
    sponsor: { name: 'Stonewall Resort', logo: '/placeholder-sponsor.jpg', url: '#' },
    totalEntries: 2847,
    rulesUrl: '/contests/spring-getaway-sweepstakes-2026/rules',
  },
  {
    id: 'c4',
    type: 'photo',
    slug: 'wv-landscapes-photo-contest-2026',
    title: 'Wild & Wonderful: WV Landscapes',
    subtitle: 'Reader photo contest',
    site: 'wvnews',
    coSites: ['statejournal'],
    heroImage: '/placeholder-photo.jpg',
    description: 'Submit your best original landscape photo taken in West Virginia. Grand prize: $500 cash plus a feature in our Summer Travel issue.',
    prize: '$500 grand prize, $100 category winners',
    status: 'active',
    phase: 'submission',
    phaseOverride: null,
    submissionStart: '2026-04-01',
    submissionEnd: '2026-05-15',
    votingStart: '2026-05-20',
    votingEnd: '2026-06-10',
    winnersPublish: '2026-06-20',
    votingMode: 'public', // public | judges | hybrid
    maxSubmissionsPerUser: 3,
    photoCategories: ['Mountains', 'Rivers & Waterfalls', 'Wildlife', 'Seasons', 'People & Places'],
    sponsor: { name: 'West Virginia Tourism', logo: '/placeholder-sponsor.jpg', url: '#' },
    totalSubmissions: 412,
  },
  {
    id: 'c5',
    type: 'bestof',
    slug: 'best-of-north-central-wv-2025',
    title: 'Best of North Central WV 2025',
    subtitle: 'Winners announced',
    site: 'wvnews',
    coSites: ['exponent', 'dominion', 'bridgeport', 'recorddelta'],
    heroImage: '/placeholder-bestof-2025.jpg',
    description: '2025 results — thank you to the 12,400 readers who voted.',
    year: 2025,
    status: 'archived',
    phase: 'winners',
    phaseOverride: null,
    winnersPublish: '2025-06-15',
    topN: 5,
    totalVotes: 142800,
    uniqueVoters: 12400,
  },
];

export const contestCategoryGroups = [
  { id: 'food', label: 'Food & Drink', icon: '🍔' },
  { id: 'services', label: 'Services', icon: '🔧' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'health', label: 'Health & Wellness', icon: '💊' },
  { id: 'homepro', label: 'Home & Professional', icon: '🏡' },
  { id: 'community', label: 'Community & People', icon: '🤝' },
  { id: 'nightlife', label: 'Entertainment & Nightlife', icon: '🎭' },
  { id: 'auto', label: 'Auto', icon: '🚗' },
];

// Categories and nominees for Best of Harrison 2026 (contest c1). In production
// every Best Of would have its own category set; keeping one fully-populated
// example here plus a smaller set for c2 to exercise the UI.
export const contestCategories = [
  // ---- Best of Harrison 2026 (voting phase) ----
  { id: 'cat-1', contestId: 'c1', group: 'food', slug: 'best-pizza', name: 'Best Pizza', sponsor: 'Muriale\'s Italian Kitchen', nominees: [
    { id: 'n-1', name: 'Minard\'s Spaghetti Inn', address: 'Clarksburg', votes: 1247 },
    { id: 'n-2', name: 'Oliverio\'s Ristorante', address: 'Clarksburg', votes: 982 },
    { id: 'n-3', name: 'DiBacco\'s Italian Kitchen', address: 'Bridgeport', votes: 847 },
    { id: 'n-4', name: 'Tony\'s Pizza', address: 'Bridgeport', votes: 612 },
    { id: 'n-5', name: 'Pies & Pints', address: 'Bridgeport', votes: 540 },
  ]},
  { id: 'cat-2', contestId: 'c1', group: 'food', slug: 'best-burger', name: 'Best Burger', sponsor: null, nominees: [
    { id: 'n-6', name: 'Twin Oaks Tavern', address: 'Clarksburg', votes: 892 },
    { id: 'n-7', name: 'The Alibi', address: 'Clarksburg', votes: 734 },
    { id: 'n-8', name: 'Bridge Sports Complex Grill', address: 'Bridgeport', votes: 501 },
    { id: 'n-9', name: 'Applebee\'s', address: 'Bridgeport', votes: 312 },
    { id: 'n-10', name: 'Five Guys', address: 'Bridgeport', votes: 298 },
  ]},
  { id: 'cat-3', contestId: 'c1', group: 'food', slug: 'best-steakhouse', name: 'Best Steakhouse', sponsor: null, nominees: [
    { id: 'n-11', name: 'Julio\'s Cafe', address: 'Clarksburg', votes: 1104 },
    { id: 'n-12', name: 'The Vintage Room', address: 'Bridgeport', votes: 918 },
    { id: 'n-13', name: 'Outback Steakhouse', address: 'Bridgeport', votes: 402 },
    { id: 'n-14', name: 'Texas Roadhouse', address: 'Bridgeport', votes: 387 },
    { id: 'n-15', name: 'LongHorn Steakhouse', address: 'Bridgeport', votes: 341 },
  ]},
  { id: 'cat-4', contestId: 'c1', group: 'food', slug: 'best-coffee', name: 'Best Coffee Shop', sponsor: null, nominees: [
    { id: 'n-16', name: 'The Coffee Bean', address: 'Clarksburg', votes: 671 },
    { id: 'n-17', name: 'Almost Heaven Desserts', address: 'Bridgeport', votes: 548 },
    { id: 'n-18', name: 'Starbucks', address: 'Bridgeport', votes: 412 },
    { id: 'n-19', name: 'Dunkin\'', address: 'Clarksburg', votes: 289 },
    { id: 'n-20', name: 'Tim Hortons', address: 'Clarksburg', votes: 201 },
  ]},
  { id: 'cat-5', contestId: 'c1', group: 'services', slug: 'best-mechanic', name: 'Best Auto Repair', sponsor: 'Mountain State Auto', nominees: [
    { id: 'n-21', name: 'Murphy\'s Garage', address: 'Clarksburg', votes: 487 },
    { id: 'n-22', name: 'Bridge Auto Service', address: 'Bridgeport', votes: 412 },
    { id: 'n-23', name: 'Monro Auto Service', address: 'Clarksburg', votes: 298 },
    { id: 'n-24', name: 'Bill\'s Tire & Auto', address: 'Bridgeport', votes: 245 },
    { id: 'n-25', name: 'Midas', address: 'Clarksburg', votes: 198 },
  ]},
  { id: 'cat-6', contestId: 'c1', group: 'services', slug: 'best-plumber', name: 'Best Plumber', sponsor: null, nominees: [
    { id: 'n-26', name: 'Dalton Plumbing', address: 'Clarksburg', votes: 312 },
    { id: 'n-27', name: 'Bridgeport Plumbing & Heating', address: 'Bridgeport', votes: 287 },
    { id: 'n-28', name: 'Mr. Rooter', address: 'Clarksburg', votes: 198 },
    { id: 'n-29', name: 'All Pro Plumbing', address: 'Bridgeport', votes: 145 },
    { id: 'n-30', name: 'Roto-Rooter', address: 'Clarksburg', votes: 112 },
  ]},
  { id: 'cat-7', contestId: 'c1', group: 'health', slug: 'best-dentist', name: 'Best Dentist', sponsor: 'WVU Medicine', nominees: [
    { id: 'n-31', name: 'Dr. Michael Ferrari, DDS', address: 'Clarksburg', votes: 542 },
    { id: 'n-32', name: 'Bridgeport Family Dental', address: 'Bridgeport', votes: 467 },
    { id: 'n-33', name: 'Dr. Sarah Chen, DDS', address: 'Bridgeport', votes: 398 },
    { id: 'n-34', name: 'Harrison County Dental', address: 'Clarksburg', votes: 312 },
    { id: 'n-35', name: 'Smile Design Studio', address: 'Bridgeport', votes: 278 },
  ]},
  { id: 'cat-8', contestId: 'c1', group: 'health', slug: 'best-pharmacy', name: 'Best Pharmacy', sponsor: null, nominees: [
    { id: 'n-36', name: 'Fruth Pharmacy', address: 'Clarksburg', votes: 487 },
    { id: 'n-37', name: 'Rite Aid', address: 'Bridgeport', votes: 234 },
    { id: 'n-38', name: 'Walgreens', address: 'Clarksburg', votes: 201 },
    { id: 'n-39', name: 'CVS', address: 'Bridgeport', votes: 187 },
    { id: 'n-40', name: 'Medicine Shoppe', address: 'Clarksburg', votes: 134 },
  ]},
  { id: 'cat-9', contestId: 'c1', group: 'shopping', slug: 'best-boutique', name: 'Best Boutique', sponsor: null, nominees: [
    { id: 'n-41', name: 'The Pink Pineapple', address: 'Bridgeport', votes: 401 },
    { id: 'n-42', name: 'Almost Heaven Boutique', address: 'Clarksburg', votes: 312 },
    { id: 'n-43', name: 'The Vault', address: 'Bridgeport', votes: 245 },
    { id: 'n-44', name: 'Lily\'s', address: 'Bridgeport', votes: 187 },
    { id: 'n-45', name: 'Grace & Lace', address: 'Clarksburg', votes: 134 },
  ]},
  { id: 'cat-10', contestId: 'c1', group: 'homepro', slug: 'best-realtor', name: 'Best Realtor', sponsor: 'First Exchange Bank', nominees: [
    { id: 'n-46', name: 'Sarah Thompson — Howard Hanna', address: 'Bridgeport', votes: 587 },
    { id: 'n-47', name: 'Mike Davis — RE/MAX', address: 'Clarksburg', votes: 412 },
    { id: 'n-48', name: 'Jennifer Reed — Century 21', address: 'Bridgeport', votes: 378 },
    { id: 'n-49', name: 'Tom Wilson — Coldwell Banker', address: 'Clarksburg', votes: 298 },
    { id: 'n-50', name: 'Lisa Martinez — BHGRE', address: 'Bridgeport', votes: 234 },
  ]},
  { id: 'cat-11', contestId: 'c1', group: 'community', slug: 'best-teacher', name: 'Best Teacher', sponsor: null, nominees: [
    { id: 'n-51', name: 'Mrs. Linda Carter — Bridgeport HS', address: 'Bridgeport', votes: 892 },
    { id: 'n-52', name: 'Mr. David Reed — RCB Middle', address: 'Clarksburg', votes: 671 },
    { id: 'n-53', name: 'Ms. Amy Walker — Liberty HS', address: 'Clarksburg', votes: 534 },
    { id: 'n-54', name: 'Mr. John Smith — Notre Dame HS', address: 'Clarksburg', votes: 412 },
    { id: 'n-55', name: 'Mrs. Karen Jones — Simpson Elem.', address: 'Bridgeport', votes: 345 },
  ]},
  { id: 'cat-12', contestId: 'c1', group: 'nightlife', slug: 'best-bar', name: 'Best Bar', sponsor: null, nominees: [
    { id: 'n-56', name: 'The Alibi', address: 'Clarksburg', votes: 512 },
    { id: 'n-57', name: 'Twin Oaks Tavern', address: 'Clarksburg', votes: 467 },
    { id: 'n-58', name: 'Back Bar', address: 'Bridgeport', votes: 389 },
    { id: 'n-59', name: 'Vintage Room Lounge', address: 'Bridgeport', votes: 312 },
    { id: 'n-60', name: 'Finnerty\'s Irish Pub', address: 'Clarksburg', votes: 234 },
  ]},
  // ---- Best of Morgantown 2026 (nomination phase — lighter sample) ----
  { id: 'cat-m1', contestId: 'c2', group: 'food', slug: 'best-pizza', name: 'Best Pizza', sponsor: null, nominees: [] },
  { id: 'cat-m2', contestId: 'c2', group: 'food', slug: 'best-wings', name: 'Best Wings', sponsor: null, nominees: [] },
  { id: 'cat-m3', contestId: 'c2', group: 'nightlife', slug: 'best-bar', name: 'Best Bar', sponsor: 'Blue & Gold News', nominees: [] },
  { id: 'cat-m4', contestId: 'c2', group: 'health', slug: 'best-dentist', name: 'Best Dentist', sponsor: 'WVU Medicine', nominees: [] },
  { id: 'cat-m5', contestId: 'c2', group: 'services', slug: 'best-hair-salon', name: 'Best Hair Salon', sponsor: null, nominees: [] },
];

// Sample photo submissions for the photo contest (c4)
export const contestPhotoSubmissions = [
  { id: 'p1', contestId: 'c4', category: 'Mountains', title: 'Dolly Sods at Dawn', photographer: 'Jennifer Bailey', location: 'Tucker Co.', image: '/placeholder-photo-1.jpg', votes: 412, submitted: '2026-04-08' },
  { id: 'p2', contestId: 'c4', category: 'Rivers & Waterfalls', title: 'Blackwater Falls Winter', photographer: 'Michael Ross', location: 'Davis', image: '/placeholder-photo-2.jpg', votes: 387, submitted: '2026-04-10' },
  { id: 'p3', contestId: 'c4', category: 'Wildlife', title: 'Elk at Tomblin WMA', photographer: 'Sarah Chen', location: 'Logan Co.', image: '/placeholder-photo-3.jpg', votes: 298, submitted: '2026-04-12' },
  { id: 'p4', contestId: 'c4', category: 'Seasons', title: 'Fall on Spruce Knob', photographer: 'David Miller', location: 'Pendleton Co.', image: '/placeholder-photo-4.jpg', votes: 276, submitted: '2026-04-14' },
  { id: 'p5', contestId: 'c4', category: 'People & Places', title: 'Harvest Festival, Pocahontas Co.', photographer: 'Linda Carter', location: 'Marlinton', image: '/placeholder-photo-5.jpg', votes: 245, submitted: '2026-04-15' },
  { id: 'p6', contestId: 'c4', category: 'Mountains', title: 'Seneca Rocks from Below', photographer: 'Tom Wilson', location: 'Pendleton Co.', image: '/placeholder-photo-6.jpg', votes: 201, submitted: '2026-04-17' },
];

// Sample sweepstakes entry ledger (admin view only — never shown publicly)
export const contestSweepstakesEntries = [
  { id: 'e1', contestId: 'c3', email: 'j***@gmail.com', name: 'Jennifer T.', zip: '26301', entered: '2026-04-02T14:22:00Z', referral: 'homepage' },
  { id: 'e2', contestId: 'c3', email: 'm***@aol.com', name: 'Michael R.', zip: '26330', entered: '2026-04-02T15:41:00Z', referral: 'newsletter' },
  { id: 'e3', contestId: 'c3', email: 's***@yahoo.com', name: 'Sarah C.', zip: '26501', entered: '2026-04-03T09:12:00Z', referral: 'facebook' },
  { id: 'e4', contestId: 'c3', email: 'd***@gmail.com', name: 'David M.', zip: '26101', entered: '2026-04-03T11:34:00Z', referral: 'homepage' },
];
