import logo from "./logo.svg";
import { wagmiContract } from "./contract";
import "./App.css";
import "@rainbow-me/rainbowkit/styles.css";

import { Buffer } from 'buffer';

import { create } from 'ipfs-http-client';

import { needle } from 'needle';

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";
import { privateKeyToAccount } from "viem/accounts";

import { connect } from "@wagmi/core";
import { InjectedConnector } from "@wagmi/core/connectors/injected";


import { createHash } from 'crypto';

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
	Address,
	Hash,
	TransactionReceipt,
	createPublicClient,
	createWalletClient,
	custom,
	http,
	parseEther,
	stringify,
} from "viem";
import { goerli } from "viem/chains";
import "viem/window";


const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: 'Basic ' + Buffer.from('2R0Wd1CUP3U2sONZ9KPtsITQzUL:743776d00d42dff9ccca0b92ae0c77af').toString('base64')
  }
});

const publicClient = createPublicClient({
	chain: goerli,
	transport: http(),
});

const walletClient = createWalletClient({
	chain: goerli,
	transport: custom(window.ethereum!),
});

const token = process.env.REACT_APP_BEARER_TOKEN;

function App() {
	const [account, setAccount] = useState<Address>();
	const [hash, setHash] = useState<Hash>();
	const [receipt, setReceipt] = useState<TransactionReceipt>();

	const idInput = React.createRef<HTMLInputElement>();

	const connect = async () => {
		const [address] = await walletClient.requestAddresses();
		setAccount(address);
	};

	const private_key = process.env.REACT_APP_PRIVATE_KEY;


	const mint = async () => {
		if (!account) return;

		const tweetID = idInput.current!.value as `${number}`;
		const result = await client.add(`{ "description": "Universal Tweet Object", "image": "https://media.tenor.com/jFn8sS1Et-0AAAAM/cat.gif", "name": ${tweetID}}`);
		console.log(result);
		const ipfsHash = result.path;

		const { request } = await publicClient.simulateContract({
			...wagmiContract,
			functionName: "mint",
			args: [
				account,
				tweetID,
				1,
				`https://ipfs.io/ipfs/${ipfsHash}`,
				"0x0",
			],
			account: privateKeyToAccount(private_key),
		});
		const hash = await walletClient.writeContract(request);
		setHash(ipfsHash);
	};

	useEffect(() => {
		(async () => {
			if (hash) {
				const receipt = await publicClient.waitForTransactionReceipt({ hash });
				setReceipt(receipt);
			}
		})();
	}, [hash]);

	if (account)
		return (
			<>
				<div>Connected: {account}</div>
				<input ref={idInput} placeholder="Tweet ID" />
				<button onClick={mint}>Mint</button>
				{receipt && (
					<div>
						Receipt:{" "}
						<pre>
							<code>{stringify(receipt, null, 2)}</code>
						</pre>
					</div>
				)}
			</>
		);
	return <button onClick={connect}>Connect Wallet</button>;

export default App;
