"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import { useWeb3Modal } from "@web3modal/wagmi/react";

export default function Home() {
  const { isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const { sendTransaction, data: hash } = useSendTransaction();
  const { open } = useWeb3Modal();
  const handleConnect = () => {
    open();
  };
  const {
    isLoading: isConfirming,
    error,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirming) {
      toast.loading("Transaction Pending");
    }
    toast.dismiss();

    if (isConfirmed) {
      toast.success("Transaction Successful", {
        action: {
          label: "View on Etherscan",
          onClick: () => {
            window.open(`https://explorer.xrplevm.org/tx/${hash}`);
          },
        },
      });
    }
    if (error) {
      toast.error("Transaction Failed");
    }
  }, [isConfirming, isConfirmed, error, hash]);

  return (
    <main>
      <section className="py-12 flex flex-col items-center text-center gap-8">
        <h1 className="text-4xl font-bold">Web3 Starter Kit</h1>
        <p className="text-2xl text-muted-foreground">
          La Liga Quiniela loading...
        </p>
      </section>
      <div className="flex gap-6 items-center justify-center">
        {!isConnected ? (
          <Button onClick={handleConnect}>Connect Wallet</Button>
        ) : (
          <>
            <Button onClick={handleConnect}>Info</Button>
            <Button onClick={() => signMessage({ message: "gm" })}>
              {" "}
              Say GM{" "}
            </Button>
            <Button
              onClick={() =>
                sendTransaction({
                  to: "0x1a343eFB966E63bfA25A2b368455448f02466Ffc",
                  value: parseEther("33"),
                })
              }
              disabled={isConfirming}
              //variant={"secondary"}
            >
              Tip 33 XRP
            </Button>
          </>
        )}
      </div>
      <div className="flex mt-10 items-center justify-center">
        <Link href="/quiniela">
          <Button className="w-60">Bet NOW</Button>
        </Link>
      </div>
    </main>
  );
}
