// src/chains/xrplEvmChain.ts
import { defineChain, type Chain } from 'viem';

export const xrplEvmChain = defineChain({
  id: 1440002,
  name: 'XRPL EVM',
  nativeCurrency: {
    name: 'XRP',
    symbol: 'XRP',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [process.env.REACT_APP_RPC_URL || 'http://rpc.xrplevm.org/'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://explorer.xrplevm.org' },
  },
} as const satisfies Chain);
