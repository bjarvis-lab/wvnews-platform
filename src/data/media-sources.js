// West Virginia media monitoring registry.
//
// This is the master list the Media Desk collector pulls from. Each source
// has an RSS URL (when one exists) and a Facebook page handle (when one
// exists). The collector tries RSS first; FB collection happens when Graph
// API is wired.
//
// Add / disable sources here, commit, and the next cron run picks them up.
// Sources that return no feed show up in the admin UI as "needs attention"
// so someone can fix the URL or disable them.
//
// Coverage goal: every WV TV station, every daily/weekly paper, every state
// agency, every major county + city comms page, every university comms, plus
// wire services and national outlets that regularly cover WV.

// ─── Television ──────────────────────────────────────────────────────────
export const TV_STATIONS = [
  // Charleston / Huntington (largest DMA)
  { id: 'wowktv',  name: 'WOWK-TV 13 News',                affiliate: 'CBS', market: 'Charleston/Huntington', domain: 'wowktv.com',  rss: 'https://www.wowktv.com/feed/', facebook: 'WOWK13News', kind: 'tv' },
  { id: 'wsaz',    name: 'WSAZ News Channel 3',             affiliate: 'NBC', market: 'Charleston/Huntington', domain: 'wsaz.com',    rss: 'https://www.wsaz.com/arcio/rss/',                 facebook: 'WSAZnews3', kind: 'tv' },
  { id: 'wchs',    name: 'WCHS Eyewitness News',            affiliate: 'ABC', market: 'Charleston',            domain: 'wchstv.com',  rss: 'https://wchstv.com/news/local/feed',              facebook: 'wchsnews',  kind: 'tv' },
  { id: 'wvah',    name: 'WVAH Fox 11',                     affiliate: 'FOX', market: 'Charleston',            domain: 'wvah.com',    rss: null,                                              facebook: 'WVAHFox11', kind: 'tv' },
  // Clarksburg / Fairmont / Morgantown
  { id: 'wboy',    name: 'WBOY-TV 12 News',                 affiliate: 'NBC', market: 'Clarksburg',            domain: 'wboy.com',    rss: 'https://www.wboy.com/feed/',                      facebook: 'WBOY12News',facebook2: 'WBOY12', kind: 'tv' },
  { id: 'wdtv',    name: 'WDTV 5 News',                     affiliate: 'CBS', market: 'Clarksburg/Weston',     domain: 'wdtv.com',    rss: 'https://www.wdtv.com/arcio/rss/',                 facebook: 'WDTV5News', kind: 'tv' },
  // Parkersburg
  { id: 'wtap',    name: 'WTAP-TV News Channel 15',         affiliate: 'NBC', market: 'Parkersburg',           domain: 'wtap.com',    rss: 'https://www.wtap.com/arcio/rss/',                 facebook: 'WTAPNews',  kind: 'tv' },
  { id: 'wova',    name: 'WOVA Fox Parkersburg',            affiliate: 'FOX', market: 'Parkersburg',           domain: 'foxparkersburg.com', rss: null,                                      facebook: null,        kind: 'tv' },
  // Wheeling
  { id: 'wtrf',    name: 'WTRF 7 News',                     affiliate: 'CBS/ABC', market: 'Wheeling',          domain: 'wtrf.com',    rss: 'https://www.wtrf.com/feed/',                      facebook: 'WTRF7News', kind: 'tv' },
  // Southern WV
  { id: 'wvva',    name: 'WVVA-TV',                         affiliate: 'NBC/FOX', market: 'Bluefield/Beckley', domain: 'wvva.com',    rss: 'https://www.wvva.com/arcio/rss/',                 facebook: 'wvvatv',    kind: 'tv' },
  { id: 'woay',    name: 'WOAY-TV 4',                       affiliate: 'ABC', market: 'Oak Hill/Beckley',      domain: 'woay.com',    rss: 'https://woay.com/feed/',                          facebook: 'WOAYTV',    kind: 'tv' },
  // Eastern Panhandle (DC/Baltimore DMA, but cover WV)
  { id: 'wdvm',    name: 'DC News Now',                     affiliate: 'NBC/CW',  market: 'Eastern Panhandle', domain: 'dcnewsnow.com', rss: 'https://www.dcnewsnow.com/feed/',              facebook: 'dcnewsnow', kind: 'tv' },
];

// ─── Radio / Public ──────────────────────────────────────────────────────
export const RADIO_PUBLIC = [
  { id: 'wvpb',     name: 'West Virginia Public Broadcasting', domain: 'wvpublic.org',     rss: 'https://www.wvpublic.org/news.rss',                      facebook: 'WVPublicBroadcasting', kind: 'public' },
  { id: 'metronews', name: 'WV MetroNews',                     domain: 'wvmetronews.com',  rss: 'https://wvmetronews.com/feed/',                          facebook: 'WestVirginiaMetroNews', kind: 'radio' },
  { id: 'wvnbroadcasting', name: 'WVNN Talk Radio',            domain: 'wvnn.com',         rss: null,                                                      facebook: null,                   kind: 'radio' },
  { id: '1063',     name: '106.3 The Fan',                     domain: '1063wv.com',       rss: null,                                                      facebook: null,                   kind: 'radio' },
];

// ─── Newspapers — statewide / major dailies ──────────────────────────────
export const NEWSPAPERS_MAJOR = [
  { id: 'gazette',     name: 'Charleston Gazette-Mail',          domain: 'wvgazettemail.com',   rss: 'https://www.wvgazettemail.com/search/?f=rss&t=article&l=25&s=start_time&sd=desc', facebook: 'GazetteMail',      kind: 'paper' },
  { id: 'heralddispatch', name: 'Herald-Dispatch (Huntington)',  domain: 'herald-dispatch.com', rss: 'https://www.herald-dispatch.com/search/?f=rss&t=article&l=25&s=start_time&sd=desc', facebook: 'HeraldDispatch', kind: 'paper' },
  { id: 'newsandsentinel', name: 'Parkersburg News and Sentinel', domain: 'newsandsentinel.com', rss: 'https://www.newsandsentinel.com/news/?type=article&category=6&feed=rss2',       facebook: 'NewsAndSentinel', kind: 'paper' },
  { id: 'intelligencer', name: 'Wheeling Intelligencer',         domain: 'theintelligencer.net', rss: 'https://www.theintelligencer.net/?category=6&feed=rss2',                          facebook: 'TheIntelligencer', kind: 'paper' },
  { id: 'wheelingnr',  name: 'Wheeling News-Register',           domain: 'newsregister.com',    rss: 'https://www.newsregister.com/?category=6&feed=rss2',                               facebook: null,               kind: 'paper' },
  { id: 'registerherald', name: 'Beckley Register-Herald',       domain: 'register-herald.com', rss: 'https://www.register-herald.com/search/?f=rss&t=article&l=25&s=start_time&sd=desc', facebook: 'TheRegisterHerald', kind: 'paper' },
  { id: 'bluefielddaily', name: 'Bluefield Daily Telegraph',     domain: 'bdtonline.com',       rss: 'https://www.bdtonline.com/search/?f=rss&t=article&l=25&s=start_time&sd=desc',     facebook: 'BluefieldDailyTelegraph', kind: 'paper' },
  { id: 'timeswv',     name: 'Times West Virginian (Fairmont)',  domain: 'timeswv.com',         rss: 'https://www.timeswv.com/search/?f=rss&t=article&l=25&s=start_time&sd=desc',       facebook: 'TimesWV',         kind: 'paper' },
  { id: 'martinsburg', name: 'The Journal (Martinsburg)',        domain: 'journal-news.net',    rss: 'https://www.journal-news.net/?category=6&feed=rss2',                               facebook: 'TheJournalNews',  kind: 'paper' },
  { id: 'intermountain', name: 'The Inter-Mountain (Elkins)',    domain: 'theintermountain.com', rss: 'https://www.theintermountain.com/?category=6&feed=rss2',                          facebook: 'InterMountainPaper', kind: 'paper' },
  { id: 'weirtondailytimes', name: 'Weirton Daily Times',        domain: 'weirtondailytimes.com', rss: 'https://www.weirtondailytimes.com/?category=6&feed=rss2',                         facebook: null,              kind: 'paper' },
  { id: 'mountainspotlight', name: 'Mountain State Spotlight',   domain: 'mountainstatespotlight.org', rss: 'https://mountainstatespotlight.org/feed/',                                    facebook: 'mountainstatespotlight', kind: 'paper' },
  { id: '100days',     name: '100 Days in Appalachia',          domain: '100daysinappalachia.com', rss: 'https://www.100daysinappalachia.com/feed/',                                       facebook: '100DaysInAppalachia', kind: 'paper' },
  { id: 'loganbanner', name: 'Logan Banner',                    domain: 'loganbanner.com',      rss: 'https://www.loganbanner.com/search/?f=rss&t=article&l=25',                         facebook: 'LoganBannerOnline', kind: 'paper' },
  { id: 'williamsondaily', name: 'Williamson Daily News',       domain: 'williamsondailynews.com', rss: 'https://www.williamsondailynews.com/search/?f=rss&t=article&l=25',              facebook: null,              kind: 'paper' },
  { id: 'pocahontastimes', name: 'The Pocahontas Times',        domain: 'pocahontastimes.com',  rss: null,                                                                                 facebook: 'PocahontasTimes', kind: 'paper' },
  { id: 'hurherald',   name: 'Hur Herald (Calhoun)',             domain: 'hurherald.com',       rss: null,                                                                                 facebook: null,              kind: 'paper' },
  // Already-owned properties get polled too so we know what we've published vs what else is out there
  { id: 'dominionpost', name: 'The Dominion Post',               domain: 'dominionpost.com',    rss: 'https://www.dominionpost.com/feed/',                                                 facebook: 'dominionpost',    kind: 'paper', owned: true },
];

// ─── Government / Agencies ──────────────────────────────────────────────
export const GOVERNMENT = [
  // State-level
  { id: 'gov',        name: 'WV Governor\'s Office',              domain: 'governor.wv.gov',        rss: 'https://governor.wv.gov/News/press-releases/Pages/default.aspx?RssFeed=1',     facebook: 'GovernorJimJustice', kind: 'gov' },
  { id: 'legislature', name: 'WV Legislature',                    domain: 'wvlegislature.gov',      rss: 'https://www.wvlegislature.gov/press/rss_press_releases.cfm',                    facebook: 'WVLegislature', kind: 'gov' },
  { id: 'ago',        name: 'WV Attorney General',                domain: 'ago.wv.gov',             rss: null,                                                                            facebook: 'WVAttorneyGeneral', kind: 'gov' },
  { id: 'sos',        name: 'WV Secretary of State',              domain: 'sos.wv.gov',             rss: null,                                                                            facebook: 'WVSecretaryofState', kind: 'gov' },
  { id: 'wvdot',      name: 'WV Dept. of Transportation',         domain: 'transportation.wv.gov', rss: null,                                                                             facebook: 'WVDOTHIGHWAYS', kind: 'gov' },
  { id: 'dhhr',       name: 'WV Dept. of Health & Human Resources', domain: 'dhhr.wv.gov',         rss: null,                                                                             facebook: 'WVDHHR', kind: 'gov' },
  { id: 'wvde',       name: 'WV Dept. of Education',              domain: 'wvde.us',                rss: null,                                                                            facebook: 'WVDeptofEd', kind: 'gov' },
  { id: 'wvdnr',      name: 'WV Division of Natural Resources',   domain: 'wvdnr.gov',              rss: null,                                                                            facebook: 'WVDNR', kind: 'gov' },
  { id: 'wvsp',       name: 'WV State Police',                    domain: 'wvsp.gov',               rss: null,                                                                            facebook: 'WVSP', kind: 'gov' },
  { id: 'wvtourism',  name: 'WV Dept. of Tourism',                domain: 'wvtourism.com',          rss: null,                                                                            facebook: 'WVTourism', kind: 'gov' },
  { id: 'wvdep',      name: 'WV Dept. of Environmental Protection', domain: 'dep.wv.gov',          rss: null,                                                                             facebook: 'WVDEP', kind: 'gov' },
  { id: 'wvema',      name: 'WV Emergency Management',             domain: 'emd.wv.gov',            rss: null,                                                                            facebook: 'WVEmergencyMgt', kind: 'gov' },

  // County governments (top 15 by population)
  { id: 'county-kanawha', name: 'Kanawha County Commission',      domain: 'kanawha.us',             rss: null, facebook: 'KanawhaCountyCommission', kind: 'county' },
  { id: 'county-berkeley', name: 'Berkeley County Council',       domain: 'berkeleywv.org',         rss: null, facebook: 'BerkeleyCountyGov', kind: 'county' },
  { id: 'county-cabell', name: 'Cabell County Commission',        domain: 'cabellcounty.org',       rss: null, facebook: 'CabellCountyGov', kind: 'county' },
  { id: 'county-monongalia', name: 'Monongalia County Commission', domain: 'monongaliacountywv.gov', rss: null, facebook: 'MonongaliaCommission', kind: 'county' },
  { id: 'county-harrison', name: 'Harrison County Commission',     domain: 'harrisoncountywv.com',  rss: null, facebook: 'HarrisonCountyWV', kind: 'county' },
  { id: 'county-wood', name: 'Wood County Commission',             domain: 'woodcountywv.com',      rss: null, facebook: null, kind: 'county' },
  { id: 'county-raleigh', name: 'Raleigh County Commission',       domain: 'raleighcounty.com',     rss: null, facebook: 'RaleighCountyCommission', kind: 'county' },
  { id: 'county-jefferson', name: 'Jefferson County Commission',   domain: 'jeffersoncountywv.org', rss: null, facebook: 'JeffersonCountyWV', kind: 'county' },
  { id: 'county-mercer', name: 'Mercer County Commission',         domain: 'mercercountycommissionwv.com', rss: null, facebook: null, kind: 'county' },
  { id: 'county-wayne', name: 'Wayne County Commission',           domain: 'waynecountywv.org',     rss: null, facebook: null, kind: 'county' },
  { id: 'county-marion', name: 'Marion County Commission',         domain: 'marioncountywv.com',    rss: null, facebook: 'MarionCountyWV', kind: 'county' },
  { id: 'county-marshall', name: 'Marshall County Commission',     domain: 'marshallcountywv.org',  rss: null, facebook: null, kind: 'county' },
  { id: 'county-ohio', name: 'Ohio County Commission',             domain: 'ohiocountywv.org',      rss: null, facebook: 'OhioCountyCommission', kind: 'county' },

  // City governments (major metros)
  { id: 'city-charleston', name: 'City of Charleston',             domain: 'charlestonwv.gov',      rss: null, facebook: 'CityofCharlestonWV', kind: 'city' },
  { id: 'city-huntington', name: 'City of Huntington',             domain: 'cityofhuntington.com',  rss: null, facebook: 'CityOfHuntingtonWV', kind: 'city' },
  { id: 'city-morgantown', name: 'City of Morgantown',             domain: 'morgantownwv.gov',      rss: null, facebook: 'CityofMorgantown', kind: 'city' },
  { id: 'city-parkersburg', name: 'City of Parkersburg',           domain: 'parkersburgwv.gov',     rss: null, facebook: 'cityofparkersburg', kind: 'city' },
  { id: 'city-wheeling', name: 'City of Wheeling',                 domain: 'wheelingwv.gov',        rss: null, facebook: 'CityofWheelingWV', kind: 'city' },
  { id: 'city-fairmont', name: 'City of Fairmont',                 domain: 'fairmontwv.gov',        rss: null, facebook: 'cityoffairmont', kind: 'city' },
  { id: 'city-beckley', name: 'City of Beckley',                   domain: 'beckley.org',           rss: null, facebook: 'CityofBeckleyWV', kind: 'city' },
  { id: 'city-clarksburg', name: 'City of Clarksburg',             domain: 'cityofclarksburgwv.com', rss: null, facebook: 'CityofClarksburgWV', kind: 'city' },
  { id: 'city-martinsburg', name: 'City of Martinsburg',           domain: 'cityofmartinsburg.org', rss: null, facebook: 'cityofmartinsburgwv', kind: 'city' },
  { id: 'city-bridgeport', name: 'City of Bridgeport',             domain: 'bridgeportwv.com',      rss: null, facebook: 'BridgeportCityHall', kind: 'city' },
];

// ─── Universities & Higher Ed ───────────────────────────────────────────
export const UNIVERSITIES = [
  { id: 'wvu',        name: 'West Virginia University',             domain: 'wvutoday.wvu.edu',      rss: 'https://wvutoday.wvu.edu/rss-feeds',                facebook: 'WestVirginiaU',    kind: 'edu' },
  { id: 'wvusports',  name: 'WVU Sports',                           domain: 'wvusports.com',         rss: 'https://wvusports.com/rss.aspx',                    facebook: 'WVUMountaineers',  kind: 'edu' },
  { id: 'marshall',   name: 'Marshall University',                  domain: 'marshall.edu',          rss: null,                                                 facebook: 'marshallu',        kind: 'edu' },
  { id: 'marshallsports', name: 'Marshall Athletics',                domain: 'herdzone.com',          rss: 'https://herdzone.com/rss.aspx',                     facebook: 'MarshallSports',   kind: 'edu' },
  { id: 'shepherd',   name: 'Shepherd University',                  domain: 'shepherd.edu',          rss: null,                                                 facebook: 'ShepherdU',        kind: 'edu' },
  { id: 'concord',    name: 'Concord University',                   domain: 'concord.edu',           rss: null,                                                 facebook: 'concorduniversity', kind: 'edu' },
  { id: 'fairmontstate', name: 'Fairmont State University',          domain: 'fairmontstate.edu',     rss: null,                                                 facebook: 'FairmontState',    kind: 'edu' },
  { id: 'wvstate',    name: 'WV State University',                  domain: 'wvstateu.edu',          rss: null,                                                 facebook: 'WVStateU',         kind: 'edu' },
  { id: 'wvutech',    name: 'WVU Institute of Technology',          domain: 'wvutech.edu',           rss: null,                                                 facebook: 'wvutech',          kind: 'edu' },
  { id: 'glenville',  name: 'Glenville State University',           domain: 'glenville.edu',         rss: null,                                                 facebook: 'GlenvilleState',   kind: 'edu' },
  { id: 'wvwesleyan', name: 'West Virginia Wesleyan',                domain: 'wvwc.edu',              rss: null,                                                 facebook: 'wvwesleyan',       kind: 'edu' },
  { id: 'alderson',   name: 'Alderson Broaddus',                     domain: 'ab.edu',                rss: null,                                                 facebook: 'aldersonbroaddus', kind: 'edu' },
  { id: 'davis',      name: 'Davis & Elkins College',                domain: 'dewv.edu',              rss: null,                                                 facebook: 'davisandelkinscollege', kind: 'edu' },
];

// ─── Wire services / national with WV relevance ────────────────────────
export const WIRE_NATIONAL = [
  { id: 'ap-wv',      name: 'AP — West Virginia',                   domain: 'apnews.com',            rss: 'https://rsshub.app/apnews/topics/west-virginia',     facebook: 'APNews',           kind: 'wire' },
  { id: 'reuters',    name: 'Reuters US News',                      domain: 'reuters.com',           rss: 'https://www.reutersagency.com/feed/?best-sectors=domestic-news',   facebook: 'reuters',   kind: 'wire' },
  // Fox filtered for WV relevance at ingestion time via Claude
  { id: 'foxnews-us', name: 'Fox News — US',                        domain: 'foxnews.com',           rss: 'https://feeds.foxnews.com/foxnews/national',         facebook: 'FoxNews',          kind: 'national', wvFilter: true },
];

// ─── Google News — per-topic queries ────────────────────────────────────
// Each query becomes a separate RSS feed at news.google.com/rss/search?q=...
// Collector hits all of them each cron run, tags the signal with the topic.
// Keep these specific enough to be useful, broad enough to catch tangents.
export const GOOGLE_NEWS_QUERIES = [
  // Geographic — statewide + regions + counties + major cities
  { topic: 'wv-statewide',          query: '"West Virginia" news' },
  { topic: 'wv-southern',           query: '"southern West Virginia" OR "southern WV"' },
  { topic: 'wv-northern',           query: '"northern West Virginia" OR "north central West Virginia"' },
  { topic: 'wv-panhandle-east',     query: '"Eastern Panhandle" West Virginia' },
  { topic: 'wv-panhandle-north',    query: '"Northern Panhandle" West Virginia' },
  { topic: 'wv-coalfields',         query: '"West Virginia" coalfields OR coal miners' },

  { topic: 'kanawha',               query: '"Kanawha County" OR Charleston "West Virginia"' },
  { topic: 'cabell',                query: '"Cabell County" OR "Huntington, West Virginia"' },
  { topic: 'monongalia',            query: '"Monongalia County" OR "Morgantown"' },
  { topic: 'harrison',              query: '"Harrison County" "West Virginia" OR "Clarksburg"' },
  { topic: 'marion',                query: '"Marion County" "West Virginia" OR Fairmont' },
  { topic: 'wood',                  query: '"Wood County" "West Virginia" OR Parkersburg' },
  { topic: 'raleigh',               query: '"Raleigh County" "West Virginia" OR Beckley' },
  { topic: 'berkeley',              query: '"Berkeley County" "West Virginia" OR Martinsburg' },
  { topic: 'ohio',                  query: '"Ohio County" "West Virginia" OR Wheeling' },
  { topic: 'jefferson',             query: '"Jefferson County" "West Virginia"' },
  { topic: 'mercer',                query: '"Mercer County" "West Virginia" OR Bluefield OR Princeton' },
  { topic: 'upshur',                query: '"Upshur County" OR Buckhannon' },
  { topic: 'taylor',                query: '"Taylor County" "West Virginia" OR Grafton' },
  { topic: 'mineral',               query: '"Mineral County" "West Virginia" OR Keyser' },
  { topic: 'preston',               query: '"Preston County" "West Virginia" OR Kingwood' },
  { topic: 'lewis',                 query: '"Lewis County" "West Virginia" OR Weston' },
  { topic: 'braxton',               query: '"Braxton County" "West Virginia" OR Sutton' },
  { topic: 'randolph',              query: '"Randolph County" "West Virginia" OR Elkins' },
  { topic: 'greenbrier',            query: '"Greenbrier County" "West Virginia" OR Lewisburg' },

  // Politics / Government
  { topic: 'wv-governor',           query: 'Morrisey OR "WV Governor"' },
  { topic: 'wv-legislature',        query: '"WV Legislature" OR "West Virginia legislature" OR "House of Delegates" OR "WV Senate"' },
  { topic: 'wv-ag',                 query: '"WV Attorney General" OR "JB McCuskey"' },
  { topic: 'wv-elections',          query: '"West Virginia" election OR primary OR ballot' },
  { topic: 'wv-capito',             query: 'Capito "West Virginia"' },
  { topic: 'wv-justice-senate',     query: '"Jim Justice" senator' },
  { topic: 'wv-mooney-miller',      query: 'Mooney OR Miller "West Virginia" Congress' },

  // Business + Economy
  { topic: 'wv-energy',             query: '"West Virginia" coal OR "natural gas" OR pipeline OR Appalachian' },
  { topic: 'wv-economy',            query: '"West Virginia" economy OR unemployment OR jobs OR business' },
  { topic: 'wv-taxes',              query: '"West Virginia" tax OR tax reform OR "income tax"' },
  { topic: 'wv-tourism',            query: '"West Virginia tourism" OR "WV tourism"' },
  { topic: 'wv-mfg',                query: '"West Virginia" manufacturing OR factory OR plant' },
  { topic: 'wv-hospitals',          query: '"West Virginia" hospital OR "WVU Medicine" OR "Mon Health" OR "Mountain Health"' },

  // Education
  { topic: 'wv-schools',            query: '"West Virginia" "public schools" OR "board of education" OR "school board"' },
  { topic: 'wvu',                   query: 'WVU OR "West Virginia University" Mountaineers' },
  { topic: 'marshall',              query: '"Marshall University" "Thundering Herd"' },
  { topic: 'wv-higher-ed',          query: '"West Virginia" college OR university' },

  // Infrastructure / Transportation
  { topic: 'wv-roads',              query: '"West Virginia" road OR highway OR bridge OR infrastructure OR WVDOT OR pothole' },
  { topic: 'wv-water',              query: '"West Virginia" water OR "water main" OR boil OR flooding OR "water utility"' },
  { topic: 'wv-broadband',          query: '"West Virginia" broadband OR internet OR rural' },

  // Public safety + crime
  { topic: 'wv-state-police',       query: '"WV State Police" OR "West Virginia State Police"' },
  { topic: 'wv-crime',              query: '"West Virginia" arrest OR indicted OR sentenced OR homicide OR "drug bust" OR fentanyl' },
  { topic: 'wv-courts',             query: '"West Virginia" court OR ruling OR "federal court" OR "circuit court"' },
  { topic: 'wv-fire',               query: '"West Virginia" fire OR "house fire" OR firefighter' },

  // Health
  { topic: 'wv-opioids',            query: '"West Virginia" opioid OR overdose OR fentanyl OR addiction' },
  { topic: 'wv-health',             query: '"West Virginia" health OR Medicaid OR "public health" OR DHHR' },

  // Environment + weather
  { topic: 'wv-weather',            query: '"West Virginia" weather OR storm OR snow OR flood OR tornado' },
  { topic: 'wv-environment',        query: '"West Virginia" environment OR DEP OR "water quality" OR spill' },
  { topic: 'wv-outdoors',           query: '"West Virginia" "state park" OR hunting OR fishing OR DNR' },

  // Sports
  { topic: 'wvu-football',          query: 'WVU football Mountaineers' },
  { topic: 'wvu-basketball',        query: 'WVU basketball Mountaineers' },
  { topic: 'marshall-sports',       query: '"Marshall University" football OR basketball' },
  { topic: 'wv-hs-sports',          query: '"West Virginia" "high school" football OR basketball OR baseball OR softball' },

  // Community / Events
  { topic: 'wv-events',             query: '"West Virginia" festival OR fair OR celebration' },
  { topic: 'wv-obits-notable',      query: '"West Virginia" died OR obituary OR "passed away"' },

  // Breaking / emergency keywords
  { topic: 'wv-breaking',           query: '"West Virginia" breaking OR emergency OR alert' },
];

// ─── Facebook Pages — collected later via Graph API ──────────────────────
// These are listed here so the registry is complete; actual collection
// happens once your Meta app is set up with page_read_engagement + a
// long-lived page access token. For now, these feed a future FB collector.
export const FACEBOOK_PAGES = [
  // TV
  'WOWK13News', 'WSAZnews3', 'wchsnews', 'WVAHFox11',
  'WBOY12News', 'WDTV5News', 'WTAPNews',
  'WTRF7News', 'wvvatv', 'WOAYTV', 'dcnewsnow',
  // Newspapers
  'GazetteMail', 'HeraldDispatch', 'NewsAndSentinel',
  'TheIntelligencer', 'TheRegisterHerald', 'BluefieldDailyTelegraph',
  'TimesWV', 'TheJournalNews', 'InterMountainPaper',
  'LoganBannerOnline', 'PocahontasTimes',
  'mountainstatespotlight', '100DaysInAppalachia',
  // Public / radio
  'WVPublicBroadcasting', 'WestVirginiaMetroNews',
  // Gov
  'GovernorJimJustice', 'WVLegislature', 'WVDHHR', 'WVDeptofEd',
  'WVDNR', 'WVSP', 'WVTourism', 'WVDEP', 'WVEmergencyMgt',
  'WVAttorneyGeneral', 'WVSecretaryofState', 'WVDOTHIGHWAYS',
  // Universities
  'WestVirginiaU', 'WVUMountaineers', 'marshallu', 'MarshallSports',
  'ShepherdU', 'FairmontState', 'WVStateU', 'wvutech',
];

// ─── Combined registry + helpers ────────────────────────────────────────
export const ALL_SOURCES = [
  ...TV_STATIONS,
  ...RADIO_PUBLIC,
  ...NEWSPAPERS_MAJOR,
  ...GOVERNMENT,
  ...UNIVERSITIES,
  ...WIRE_NATIONAL,
];

export const RSS_ENABLED_SOURCES = ALL_SOURCES.filter(s => s.rss);

// Quick-stats helpers the admin Media Desk renders in its header.
export function sourceStats() {
  return {
    total: ALL_SOURCES.length,
    withRss: RSS_ENABLED_SOURCES.length,
    withFacebook: ALL_SOURCES.filter(s => s.facebook).length,
    byKind: ALL_SOURCES.reduce((acc, s) => ({ ...acc, [s.kind]: (acc[s.kind] || 0) + 1 }), {}),
    queries: GOOGLE_NEWS_QUERIES.length,
    fbPages: FACEBOOK_PAGES.length,
  };
}
