import { ethers } from "ethers";
import { SiweMessage } from "siwe";

// Minimal EIP-1193 provider surface — no standard types package covers this.
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function isWalletAvailable(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

// Reuses ethers@6 (already a dependency for server-side SoDEX signing)
// instead of adding wagmi/viem — this app has exactly one injected wallet
// to support, not a multi-connector abstraction.
function getBrowserProvider(): ethers.BrowserProvider {
  if (!isWalletAvailable()) {
    throw new Error("No wallet extension detected — install MetaMask or another injected wallet.");
  }
  return new ethers.BrowserProvider(window.ethereum!);
}

// Full sign-in flow: connect, fetch a nonce, sign a SIWE message, verify
// server-side. Returns the verified address on success.
export async function signInWithEthereum(): Promise<string> {
  const provider = getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  const nonceRes = await fetch("/api/auth/nonce");
  if (!nonceRes.ok) throw new Error("Failed to get a sign-in nonce");
  const { nonce } = await nonceRes.json();

  const siweMessage = new SiweMessage({
    domain: window.location.host,
    address,
    statement: "Sign in to ATLAS to attribute published theses to your wallet.",
    uri: window.location.origin,
    version: "1",
    chainId,
    nonce,
  });
  const preparedMessage = siweMessage.prepareMessage();

  // Any chain the wallet is currently on is accepted — this is an identity
  // signature, not an on-chain transaction, so there's nothing to gain by
  // forcing a switch to SoDEX's testnet chain.
  const signature = await signer.signMessage(preparedMessage);

  const verifyRes = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: preparedMessage, signature }),
  });
  const data = await verifyRes.json();
  if (!verifyRes.ok) throw new Error(data.error ?? "Sign-in failed");
  return data.address as string;
}

export async function disconnectWallet(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getSession(): Promise<{ address: string } | null> {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return null;
  const data = await res.json();
  return data.address ? { address: data.address } : null;
}

export function onAccountsChanged(handler: (accounts: string[]) => void): () => void {
  if (!isWalletAvailable()) return () => {};
  const listener = (...args: unknown[]) => handler(args[0] as string[]);
  window.ethereum!.on("accountsChanged", listener);
  return () => window.ethereum!.removeListener("accountsChanged", listener);
}

export function onChainChanged(handler: (chainId: string) => void): () => void {
  if (!isWalletAvailable()) return () => {};
  const listener = (...args: unknown[]) => handler(args[0] as string);
  window.ethereum!.on("chainChanged", listener);
  return () => window.ethereum!.removeListener("chainChanged", listener);
}
