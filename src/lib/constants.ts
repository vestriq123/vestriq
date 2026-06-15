export interface Company {
  name: string;
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
}

export const COMPANIES: Company[] = [
  { name: "Manchester United Plc", symbol: "MANU", price: "$23.21", change: "-0.8%", positive: false },
  { name: "Microsoft Corporation", symbol: "MSFT", price: "$390.74", change: "-1.1%", positive: false },
  { name: "Mastercard Inc", symbol: "MA", price: "$489.98", change: "+0.4%", positive: true },
  { name: "Lowe’s Companies Inc", symbol: "LOW", price: "$221.05", change: "+0.8%", positive: true },
  { name: "American Airlines Group Inc", symbol: "AAL", price: "$14.98", change: "-2.4%", positive: false },
  { name: "Amazon.com Inc", symbol: "AMZN", price: "$238.55", change: "+1.2%", positive: true },
  { name: "Alibaba Group", symbol: "BABA", price: "$112.82", change: "-1.8%", positive: false },
  { name: "Tesla, Inc", symbol: "TSLA", price: "$406.43", change: "+3.1%", positive: true },
  { name: "Nokia Corp", symbol: "NOK", price: "$14.80", change: "+5.5%", positive: true },
  { name: "Bank of America Corp", symbol: "BAC", price: "$56.02", change: "+1.1%", positive: true },
  { name: "United Therapeutics Corporation", symbol: "UTHR", price: "$553.14", change: "-0.5%", positive: false },
  { name: "Citigroup Inc", symbol: "C", price: "$139.83", change: "+5.6%", positive: true },
];
