export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/watchlist", label: "Watchlist" },
    { href: "/analysis", label: "Analysis" },
  { href: "/screeners", label: "Screeners" }, // Added
];

// Sign-up form select options
export const INVESTMENT_GOALS = [
    { value: 'Growth', label: 'Growth' },
    { value: 'Income', label: 'Income' },
    { value: 'Balanced', label: 'Balanced' },
    { value: 'Conservative', label: 'Conservative' },
];

export const RISK_TOLERANCE_OPTIONS = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
];

export const PREFERRED_INDUSTRIES = [
    { value: 'Technology', label: 'Technology' },
    { value: 'Banking', label: 'Banking' },
    { value: 'Pharmaceuticals', label: 'Pharmaceuticals' },
    { value: 'Automobiles', label: 'Automobiles' },
    { value: 'FMCG', label: 'FMCG' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Metals', label: 'Metals' },
];

export const ALERT_TYPE_OPTIONS = [
    { value: 'price', label: 'Price' },
    { value: 'volume', label: 'Volume' },
];

export const CONDITION_OPTIONS = [
    { value: 'greater', label: 'Greater than (>)' },
    { value: 'less', label: 'Less than (<)' },
];

// TradingView Charts for BSE
export const MARKET_OVERVIEW_WIDGET_CONFIG = {
    colorTheme: 'dark',
    dateRange: '12M',
    locale: 'en',
    largeChartUrl: '',
    isTransparent: true,
    showFloatingTooltip: true,
    plotLineColorGrowing: '#0FEDBE',
    plotLineColorFalling: '#0FEDBE',
    gridLineColor: 'rgba(240, 243, 250, 0)',
    scaleFontColor: '#DBDBDB',
    belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
    belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
    belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
    belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
    symbolActiveColor: 'rgba(15, 237, 190, 0.05)',
    tabs: [
        {
            title: 'Banking',
            symbols: [
                { s: 'BSE:HDFCBANK', d: 'HDFC Bank' },
                { s: 'BSE:ICICIBANK', d: 'ICICI Bank' },
                { s: 'BSE:SBIN', d: 'State Bank of India' },
                { s: 'BSE:AXISBANK', d: 'Axis Bank' },
                { s: 'BSE:KOTAKBANK', d: 'Kotak Mahindra Bank' },
                { s: 'BSE:INDUSINDBK', d: 'IndusInd Bank' },
            ],
        },
        {
            title: 'Technology',
            symbols: [
                { s: 'BSE:TCS', d: 'Tata Consultancy Services' },
                { s: 'BSE:INFY', d: 'Infosys' },
                { s: 'BSE:WIPRO', d: 'Wipro' },
                { s: 'BSE:HCLTECH', d: 'HCL Technologies' },
                { s: 'BSE:TECHM', d: 'Tech Mahindra' },
                { s: 'BSE:LTIM', d: 'LTIMindtree' },
            ],
        },
        {
            title: 'FMCG & Conglomerates',
            symbols: [
                { s: 'BSE:RELIANCE', d: 'Reliance Industries' },
                { s: 'BSE:HINDUNILVR', d: 'Hindustan Unilever' },
                { s: 'BSE:ITC', d: 'ITC Limited' },
                { s: 'BSE:NESTLEIND', d: 'Nestle India' },
                { s: 'BSE:BRITANNIA', d: 'Britannia Industries' },
            ],
        },
    ],
    support_host: 'https://www.tradingview.com',
    backgroundColor: '#141414',
    width: '100%',
    height: 600,
    showSymbolLogo: true,
    showChart: true,
};

// Note: TradingView's heatmap widget has limited support for BSE
// You may need to use NSE (National Stock Exchange) instead for better widget support
export const HEATMAP_WIDGET_CONFIG = {
    dataSource: 'SENSEX', // Use SENSEX for reliable Indian map; NIFTY50 often fails in free widgets
    blockSize: 'market_cap_basic',
    blockColor: 'change',
    grouping: 'sector',
    isTransparent: true,
    locale: 'in',
    symbolUrl: '',
    colorTheme: 'dark',
    exchanges: [],
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    isMonoSize: false,
    width: '100%',
    height: '600',
};

// Note: TradingView's Top Stories widget shows global market news
// It cannot be filtered to show only Indian market news
// You may want to integrate with Indian news APIs like:
// - Economic Times API
// - Moneycontrol API
// - NSE/BSE news feeds


export const MARKET_DATA_WIDGET_CONFIG = {
    title: 'BSE Stocks',
    width: '100%',
    height: 600,
    locale: 'en',
    showSymbolLogo: true,
    colorTheme: 'dark',
    isTransparent: false,
    backgroundColor: '#0F0F0F',
    symbolsGroups: [
        {
            name: 'Banking',
            symbols: [
                { name: 'BSE:HDFCBANK', displayName: 'HDFC Bank' },
                { name: 'BSE:ICICIBANK', displayName: 'ICICI Bank' },
                { name: 'BSE:SBIN', displayName: 'State Bank of India' },
                { name: 'BSE:AXISBANK', displayName: 'Axis Bank' },
                { name: 'BSE:KOTAKBANK', displayName: 'Kotak Mahindra Bank' },
                { name: 'BSE:INDUSINDBK', displayName: 'IndusInd Bank' },
            ],
        },
        {
            name: 'Technology',
            symbols: [
                { name: 'BSE:TCS', displayName: 'Tata Consultancy Services' },
                { name: 'BSE:INFY', displayName: 'Infosys' },
                { name: 'BSE:WIPRO', displayName: 'Wipro' },
                { name: 'BSE:HCLTECH', displayName: 'HCL Technologies' },
                { name: 'BSE:TECHM', displayName: 'Tech Mahindra' },
                { name: 'BSE:LTI', displayName: 'LTIMindtree' },
            ],
        },
        {
            name: 'FMCG & Conglomerates',
            symbols: [
                { name: 'BSE:RELIANCE', displayName: 'Reliance Industries' },
                { name: 'BSE:HINDUNILVR', displayName: 'Hindustan Unilever' },
                { name: 'BSE:ITC', displayName: 'ITC Limited' },
                { name: 'BSE:NESTLEIND', displayName: 'Nestle India' },
                { name: 'BSE:BRITANNIA', displayName: 'Britannia Industries' },
            ],
        },
    ],
};

export const POPULAR_STOCK_SYMBOLS = [
    // Banking & Financial Services
    'HDFCBANK',
    'ICICIBANK',
    'SBIN',
    'AXISBANK',
    'KOTAKBANK',
    'INDUSINDBK',
    'BAJFINANCE',
    'BAJAJFINSV',
    'HDFCLIFE',
    'SBILIFE',

    // IT & Technology
    'TCS',
    'INFY',
    'WIPRO',
    'HCLTECH',
    'TECHM',
    'LTI',
    'MPHASIS',
    'COFORGE',
    'PERSISTENT',
    'LTTS',

    // Energy & Oil
    'RELIANCE',
    'ONGC',
    'BPCL',
    'IOC',
    'COALINDIA',
    'POWERGRID',
    'NTPC',
    'ADANIGREEN',
    'ADANIPORTS',
    'ADANITRANS',

    // FMCG & Consumer
    'HINDUNILVR',
    'ITC',
    'NESTLEIND',
    'BRITANNIA',
    'DABUR',
    'MARICO',
    'GODREJCP',
    'TATACONSUM',
    'COLPAL',
    'PIDILITIND',

    // Automobiles
    'MARUTI',
    'TATAMOTORS',
    'M&M',
    'BAJAJ-AUTO',
    'HEROMOTOCO',
    'EICHERMOT',
    'ASHOKLEY',
    'TVSMOTOR',
    'BOSCHLTD',
    'MOTHERSON',

    // Pharmaceuticals
    'SUNPHARMA',
    'DRREDDY',
    'CIPLA',
    'DIVISLAB',
    'AUROPHARMA',
    'LUPIN',
    'BIOCON',
    'TORNTPHARM',
    'ALKEM',
    'GLENMARK',

    // Metals & Mining
    'TATASTEEL',
    'HINDALCO',
    'JSWSTEEL',
    'VEDL',
    'SAIL',
    'JINDALSTEL',
    'NMDC',
    'HINDZINC',
    'NATIONALUM',
    'MOIL',

    // Infrastructure & Construction
    'LT',
    'ULTRACEMCO',
    'GRASIM',
    'SHREECEM',
    'AMBUJACEM',
    'ACC',
    'ASTRAL',
    'CERA',
    'RAMCOCEM',
    'JKCEMENT',

    // Telecom & Media
    'BHARTIARTL',
    'ZEEL',
    'SUNTV',
    'HATHWAY',
    'DEN',
    'TATACOMM',
];

export const SYMBOL_INFO_WIDGET_CONFIG = (symbol: string) => ({
   symbol: formatTvSymbol(symbol),
    colorTheme: 'dark',
    isTransparent: true,
    locale: 'en',
    width: '100%',
    height: 170,
});
// Helper: Force Indian stocks to open as BSE in TradingView
const formatTvSymbol = (symbol: string) => {
  if (symbol.includes(".NS") || symbol.includes(".BO")) {
    // Remove .NS/.BO and prepend BSE:
    return `BSE:${symbol.replace(".NS", "").replace(".BO", "")}`;
  }
  return symbol; // Return as-is for US stocks
};

export const CANDLE_CHART_WIDGET_CONFIG = (symbol: string) => ({
  symbol: formatTvSymbol(symbol),
    allow_symbol_change: false,
    calendar: false,
    details: true,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_volume: false,
    hotlist: false,
    interval: 'D',
    locale: 'en',
    save_image: false,
    style: 1,
   
    theme: 'dark',
    timezone: "Asia/Kolkata",
    backgroundColor: '#141414',
    gridColor: '#141414',
    watchlist: [],
    withdateranges: false,
    compareSymbols: [],
    studies: [],
    width: '100%',
    height: 600,
});

export const BASELINE_WIDGET_CONFIG = (symbol: string) => ({
    allow_symbol_change: false,
    calendar: false,
    details: false,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_volume: false,
    hotlist: false,
    interval: 'D',
    locale: 'en',
    save_image: false,
    style: 10,
    symbol: formatTvSymbol(symbol),
    theme: 'dark',
    timezone: 'Etc/UTC',
    backgroundColor: '#141414',
    gridColor: '#141414',
    watchlist: [],
    withdateranges: false,
    compareSymbols: [],
    studies: [],
    width: '100%',
    height: 600,
});

export const TECHNICAL_ANALYSIS_WIDGET_CONFIG = (symbol: string) => ({
  symbol: formatTvSymbol(symbol),
  colorTheme: 'dark',
  isTransparent: true,
  locale: 'en',
  width: '100%',
  height: 400,
  interval: '1h',
  largeChartUrl: '',
});

export const COMPANY_PROFILE_WIDGET_CONFIG = (symbol: string) => ({
  symbol: formatTvSymbol(symbol),
  colorTheme: 'dark',
  isTransparent: true,
  locale: 'en',
  width: '100%',
  height: 440,
});

export const COMPANY_FINANCIALS_WIDGET_CONFIG = (symbol: string) => ({
  symbol: formatTvSymbol(symbol),
  colorTheme: 'dark',
  isTransparent: true,
  locale: 'en',
  width: '100%',
  height: 464,
  displayMode: 'regular',
  largeChartUrl: '',
});

export const NO_MARKET_NEWS =
    '<p class="mobile-text" style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#4b5563;">No market news available today. Please check back tomorrow.</p>';



export const WATCHLIST_TABLE_HEADER = [
  "Company",
  "Symbol",
  "Price (₹)",
  "Change",
  "Market Cap",
  "P/E Ratio",
  "Alerts",
  "", // Empty for the trash icon column
];