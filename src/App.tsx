import logo from "./logo.svg";
import { wagmiContract } from "./contract";
import "./App.css";
import "@rainbow-me/rainbowkit/styles.css";

import { useRef } from "react";

import { toPng } from "html-to-image";

import { Buffer } from "buffer";

import { create } from "ipfs-http-client";

import { needle } from "needle";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";
import { privateKeyToAccount } from "viem/accounts";

import { connect } from "@wagmi/core";
import { InjectedConnector } from "@wagmi/core/connectors/injected";

import { createHash } from "crypto";

import React, { useEffect, useState } from "react";
// import ReactDOM from "react-dom/client";
import ReactDOM from "react-dom";
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
	host: "ipfs.infura.io",
	port: 5001,
	protocol: "https",
	headers: {
		authorization:
			"Basic " +
			Buffer.from(
				"2R0Wd1CUP3U2sONZ9KPtsITQzUL:743776d00d42dff9ccca0b92ae0c77af"
			).toString("base64"),
	},
});

async function downloadImage(url, name) {
	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

const publicClient = createPublicClient({
	chain: goerli,
	transport: http(),
});

const walletClient = createWalletClient({
	chain: goerli,
	transport: custom(window.ethereum!),
});

const token = process.env.REACT_APP_BEARER_TOKEN;

const Tweet = ({ data }) => {
	// Fill out this component using the structure of a tweet
	return (
		<div>
			<h1>{data.text}</h1>
			{/* Fill out the rest of the tweet details */}
		</div>
	);
};

function App() {
	const tweetRef = useRef();

	const [account, setAccount] = useState<Address>();
	const [hash, setHash] = useState<Hash>();
	const [receipt, setReceipt] = useState<TransactionReceipt>();

	const idInput = React.createRef<HTMLInputElement>();

	const connect = async () => {
		const [address] = await walletClient.requestAddresses();
		setAccount(address);
	};
	console.log(token);

	const private_key = process.env.REACT_APP_PRIVATE_KEY;

	const mint = async () => {
		if (!account) return;

		const tweetID = idInput.current!.value as `${number}`;

		const response = await fetch(
			`https://cors-anywhere.herokuapp.com/https://api.twitter.com/2/tweets/${tweetID}?expansions=attachments.media_keys,author_id&tweet.fields=public_metrics,created_at,entities,geo,possibly_sensitive,source,withheld&media.fields=public_metrics,height,width,url&user.fields=created_at,description,public_metrics`,
			{
				method: "GET",
				mode: "cors",
				headers: {
					Authorization: `Bearer ${token}`,
					"Access-Control-Allow-Methods": "GET",
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			}
		)
			.then((response) => response.json())
			.catch((error) => console.error(error));

		console.log(response);
		console.log(
			`https://twitter.com/${response.includes.users[0].username}/status/${tweetID}`
		);

		const twitterImage = await fetch(
			"https://cors-anywhere.herokuapp.com/https://tweetpik.com/api/v2/images",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					authorization: "85105ac2-ceb4-446f-8993-53339a5b55fb",
				},
				body: JSON.stringify({
					url: `https://twitter.com/${response.includes.users[0].username}/status/${tweetID}`,
				}),
			}
		).then((response) => response.json());

		console.log(`{ "description": "Universal Tweet Object", "image": "${twitterImage.url}", "name": ${tweetID}, "attributes": [
    {
      "trait_type": "Likes", 
      "value": ${response.data.public_metrics.like_count}
    },
    {
			"display_type": "number",
      "trait_type": "Bookmarks", 
      "value": ${response.data.public_metrics.bookmark_count}
    },
    {
			"display_type": "number",
      "trait_type": "Impressions", 
      "value": ${response.data.public_metrics.impression_count}
    },
    {
			"display_type": "number",
      "trait_type": "Quote Retweets", 
      "value": ${response.data.public_metrics.quote_count}
    },
    {
			"display_type": "number",
      "trait_type": "Retweets", 
      "value": ${response.data.public_metrics.retweet_count}
    },
    {
			"display_type": "number",
      "trait_type": "Comments", 
      "value": ${response.data.public_metrics.reply_count}
    }
  ]}`);

		const result =
			await client.add(`{ "description": "Universal Tweet Object", "image": "${twitterImage.url}", "name": ${tweetID}, "attributes": [
    {
      "trait_type": "Likes", 
      "value": "${response.data.public_metrics.like_count}"
    },
    {
      "trait_type": "Bookmarks", 
      "value": "${response.data.public_metrics.bookmark_count}"
    },
    {
      "trait_type": "Impressions", 
      "value": "${response.data.public_metrics.impression_count}"
    },
    {
      "trait_type": "Quote Retweets", 
      "value": "${response.data.public_metrics.quote_count}"
    },
    {
      "trait_type": "Retweets", 
      "value": "${response.data.public_metrics.retweet_count}"
    },
    {
      "trait_type": "Comments", 
      "value": "${response.data.public_metrics.reply_count}"
    }
  ]}`);
		console.log(result);
		const ipfsHash = result.path;

		const { request } = await publicClient.simulateContract({
			...wagmiContract,
			functionName: "mint",
			args: [account, tweetID, 1, `https://ipfs.io/ipfs/${ipfsHash}`, "0x0"],
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
}

export default App;
