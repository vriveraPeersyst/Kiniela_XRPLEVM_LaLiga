"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ethers } from "ethers"; // Ensure proper import
import { useWriteContract } from 'wagmi';

import { xrplEvmChain } from "@/chains/xrplEvmChain";
import { bettingContractAddress, bettingContractABI } from "@/constants/contracts"; // Import your contract's ABI

type SubmitBetsProps = {
  bets: string[];
  matchday: number;
};

const SubmitBets: React.FC<SubmitBetsProps> = ({ bets, matchday }) => {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const ensure0xPrefix = (address: string): `0x${string}` => {
    return address.startsWith("0x") ? address as `0x${string}` : `0x${address}`;
  };

  const formattedBettingContractAddress: `0x${string}` = ensure0xPrefix(bettingContractAddress);

  const { writeContractAsync } = useWriteContract();

  const handleSubmit = async () => {
    try {
      setIsPending(true);

      const encodedBets = bets.map(bet => ethers.encodeBytes32String(bet));
      console.log("Encoded Bets:", encodedBets);

      const config = {
        abi: bettingContractABI,
        address: formattedBettingContractAddress,
        functionName: 'placeBet',  // Replace with your contract's actual function name
        args: [matchday, encodedBets],
        chainId: xrplEvmChain.id,
        value: ethers.parseEther("777.0"),
      };

      const response = await writeContractAsync(config);

      if (!response) {
        throw new Error("No response from contract write");
      }

      const hash = response; // Ensure `response` has property `hash`

      setIsConfirming(true);
      
      await waitForTransaction(hash);

    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error("Transaction Failed: " + (error as Error).message);
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  const waitForTransaction = async (hash: string) => {
    const provider = new ethers.BrowserProvider(window.ethereum);

    toast.loading("Transaction Pending...");

    let receipt = null;
    while (!receipt) {
      receipt = await provider.getTransactionReceipt(hash);
      if (!receipt) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again.
      }
    }

    if (receipt.status === 1) {
      toast.success("Transaction Successful", {
        action: {
          label: "View on Explorer",
          onClick: () => {
            window.open(`https://explorer.xrplevm.org/tx/${hash}`);
          },
        },
      });
    } else {
      toast.error("Transaction Failed");
    }

    setIsPending(false);
    setIsConfirming(false);
  };

  return (
    <div>
      <Button onClick={handleSubmit} disabled={isPending || isConfirming}>
        {isPending ? "Confirming..." : "Submit Bets"}
      </Button>
    </div>
  );
};

export default SubmitBets;
