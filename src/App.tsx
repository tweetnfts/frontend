import logo from "./logo.svg";
import { oraPromise } from "ora";
import { cryptosquareContract, tweetnftsContract } from "./contract";
import "./App.css";
import { Buffer } from "buffer";
import { create } from "ipfs-http-client";
import { needle } from "needle";
import { privateKeyToAccount } from "viem/accounts";
import React, { useRef, useEffect, useState } from "react";
import { emojisplosion, emojisplosions } from "emojisplosion";
import { ChatGPTAPI } from "chatgpt";
import ReactDOM from "react-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
	sendTransaction,
	prepareSendTransaction,
	waitForTransaction,
} from "@wagmi/core";
import { useAccount } from "wagmi";
import { disconnect } from "@wagmi/core";
import { readContract } from "@wagmi/core";
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
import "viem/window";
import "@rainbow-me/rainbowkit/styles.css";

import {
	getDefaultWallets,
	RainbowKitProvider,
	midnightTheme,
	darkTheme,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, polygon } from "wagmi/chains";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";

const { chains, publicClient } = configureChains(
	[mainnet, polygon],
	[
		infuraProvider({ apiKey: process.env.REACT_APP_INFURA_WEB3_API_KEY }),
		publicProvider(),
	]
);

const { connectors } = getDefaultWallets({
	appName: "TweetNFTs",
	projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
	chains,
});

const wagmiConfig = createConfig({
	autoConnect: true,
	connectors,
	publicClient,
});

function getAbsolutePosition(element) {
	var xPosition = 0;
	var yPosition = 0;

	while (element) {
		xPosition += element.offsetLeft - element.scrollLeft + element.clientLeft;
		yPosition += element.offsetTop - element.scrollTop + element.clientTop;
		element = element.offsetParent;
	}
	return { x: xPosition, y: yPosition };
}

function App() {
	const [hash, setHash] = useState("");
	const [returnStatement, setReturnStatement] = useState("");
	const [loadingText, setLoadingText] = useState("");
	const initialCryptosquarePromotion =
		localStorage.getItem("cryptosquarePromotion") || false;
	const [cryptosquarePromotion, setCryptosquarePromotion] = useState(
		initialCryptosquarePromotion
	);
	const initialTweetPackage = Number(localStorage.getItem("tweetPackage")) || 0;
	const [tweetPackage, setTweetPackage] = useState(initialTweetPackage);
	const [inputValues, setInputValues] = useState(Array(0).fill(""));

	const loadingRef = useRef(null);

	const checkCrytosquareNFT = async (address) => {
		const balance = await readContract({
			address: cryptosquareContract.address,
			abi: cryptosquareContract.abi,
			functionName: "balanceOf",
			args: [address],
			chainId: 1,
		});
		if (balance > 0) {
			setCryptosquarePromotion(true);
		} else {
			setCryptosquarePromotion(false);
		}
	};

	let discount;
	const { address, isConnected } = useAccount();
	if (isConnected) {
		checkCrytosquareNFT(address);
	}

	const idInput = React.createRef<HTMLInputElement>();

	const mint = async (tweetID) => {
		const response = await fetch(
			`https://api.tweetnfts.xyz/mint?tweetID=${tweetID}&address=${address}`,
			{
				method: "GET",
				headers: {
					"Access-Control-Allow-Methods": "GET",
					"Content-Type": "application/json",
					// "Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type",
					Authorization: `Bearer ${process.env.REACT_APP_BACKEND_API_KEY}`,
				},
			}
		).then((response) => response.json());
		setHash(response.hash);
		console.log(response);
		console.log(response.nftName);

		return response.nftName;
	};

	function shortenString(input) {
		return input.slice(0, 6) + "..." + input.slice(-3);
	}

	useEffect(() => {
		localStorage.setItem("tweetPackage", tweetPackage);
	}, [tweetPackage]);

	useEffect(() => {
		localStorage.setItem("cryptosquarePromotion", cryptosquarePromotion);
	}, [cryptosquarePromotion]);

	useEffect(() => {
		let inputCount = getInputCount();
		setInputValues((prevValues) => {
			let newValues = Array(inputCount).fill("");
			prevValues.forEach((value, index) => {
				if (newValues[index] !== undefined) {
					newValues[index] = value;
				}
			});
			return newValues;
		});
	}, []);

	const handleChange = (index, event) => {
		setInputValues((prevValues) => {
			const newValues = [...prevValues];
			newValues[index] = event.target.value;
			return newValues;
		});
	};

	const handleSubmit = async () => {
		const interval = setInterval(() => {
			const loadingElement = loadingRef.current;

			if (loadingElement.textContent === "") {
				loadingElement.textContent = "loading";
			}

			if (loadingElement.textContent === "loading") {
				loadingElement.textContent = "loading.";
			} else if (loadingElement.textContent === "loading.") {
				loadingElement.textContent = "loading..";
			} else if (loadingElement.textContent === "loading..") {
				loadingElement.textContent = "loading...";
			} else if (loadingElement.textContent === "loading...") {
				loadingElement.textContent = "loading";
			}
		}, 500);

		console.log("test");

		const polygon_price = await fetch(
			`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0&vs_currencies=usd`,
			{
				method: "GET",
				headers: {
					"Access-Control-Allow-Methods": "GET",
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			}
		)
			.then((response) => response.json())
			.then(
				(response) => response["0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"].usd
			);

		console.log(`price data: ${polygon_price}`);

		let mint_price;

		const balance = await readContract({
			address: cryptosquareContract.address,
			abi: cryptosquareContract.abi,
			functionName: "balanceOf",
			args: [address],
			chainId: 1,
		});

		console.log(`address: ${address}, balance: ${balance}`);

		if (balance > 0) {
			if (tweetPackage == 1) {
				mint_price = 3 / polygon_price;
			} else if (tweetPackage == 2) {
				mint_price = 6 / polygon_price;
			} else {
				mint_price = 10 / polygon_price;
			}
		} else {
			if (tweetPackage == 1) {
				mint_price = 10 / polygon_price;
			} else if (tweetPackage == 2) {
				mint_price = 20 / polygon_price;
			} else {
				mint_price = 30 / polygon_price;
			}
		}

		mint_price = parseFloat(mint_price.toFixed(6));

		console.log(mint_price);

		const config = await prepareSendTransaction({
			chainId: 137,
			to: "0xb4bf8a8475D1E8e9A2088F118AD0E2cDc2896183",
			value: parseEther(`${mint_price}`),
		});

		const { hash } = await sendTransaction(config);

		console.log(`Payment hash: ${hash}`);
		const data = await waitForTransaction({
			hash: hash,
		});
		console.log(data);

		setReturnStatement("");
		let draftStatement =
			"<p>Transaction validated! ✅<br/>Head over to OpenSea to check your NFT(s) out: <br/><br/><div style='text-align: left;'>";
		let inputCount = getInputCount();

		for (let i = 1; i < inputCount; i++) {
			if (inputValues[i] == "") {
				continue;
			}
			const nftName = await mint(inputValues[i]);
			draftStatement = draftStatement.concat(
				`${i}. <a href="https://opensea.io/assets/matic/0x4e684e4973Be2D2D25dbF14E87E8041c97E462D0/${inputValues[i]}" target="_blank">${nftName}</a><br/>`
			);
			console.log(draftStatement);
		}
		// setLoadingText("");
		// stopLoading();
		clearInterval(interval);
		const loadingElement = loadingRef.current;
		loadingElement.textContent = '';
		draftStatement = draftStatement.concat("</div></p>");
		setReturnStatement(draftStatement);
	};

	const disconnectWallet = async () => {
		await disconnect();
	};

	const getInputCount = () => {
		if (tweetPackage == 1) {
			return 2;
		} else if (tweetPackage == 2) {
			return 4;
		} else if (tweetPackage == 3) {
			return 11;
		} else {
			return 0;
		}
	};

	const updateNFT = async () => {
		const interval = setInterval(() => {
			const loadingElement = loadingRef.current;

			if (loadingElement.textContent === "") {
				loadingElement.textContent = "loading";
			}

			if (loadingElement.textContent === "loading") {
				loadingElement.textContent = "loading.";
			} else if (loadingElement.textContent === "loading.") {
				loadingElement.textContent = "loading..";
			} else if (loadingElement.textContent === "loading..") {
				loadingElement.textContent = "loading...";
			} else if (loadingElement.textContent === "loading...") {
				loadingElement.textContent = "loading";
			}
		}, 500);
		const tweetID = idInput.current!.value as `${number}`;

		const balance = await readContract({
			address: tweetnftsContract.address,
			abi: tweetnftsContract.abi,
			functionName: "balanceOf",
			args: [address, tweetID],
			chainId: 137,
		});

		if (balance == 0) {
			return;
		}

		const polygon_price = await fetch(
			`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0&vs_currencies=usd`,
			{
				method: "GET",
				headers: {
					"Access-Control-Allow-Methods": "GET",
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			}
		)
			.then((response) => response.json())
			.then(
				(response) => response["0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"].usd
			);

		console.log(`price data: ${polygon_price}`);

		let mint_price = 1 / polygon_price;

		mint_price = parseFloat(mint_price.toFixed(6));

		console.log(mint_price);

		const config = await prepareSendTransaction({
			chainId: 137,
			to: "0xb4bf8a8475D1E8e9A2088F118AD0E2cDc2896183",
			value: parseEther(`${mint_price}`),
		});

		const { hash } = await sendTransaction(config);

		console.log(`Payment hash: ${hash}`);
		const data = await waitForTransaction({
			hash: hash,
		});
		console.log(data);

		setReturnStatement("");
		let draftStatement = `<p>Transaction validated! ✅<br/>Head over to <a href="https://opensea.io/assets/matic/0x4e684e4973Be2D2D25dbF14E87E8041c97E462D0/${tweetID}" target="_blank">OpenSea to check your updated NFT</a> out.</p>`;

		const response = await fetch(
			`https://api.tweetnfts.xyz/update?tweetID=${tweetID}`,
			{
				method: "GET",
				headers: {
					"Access-Control-Allow-Methods": "GET",
					"Content-Type": "application/json",
					"Access-Control-Allow-Headers": "Content-Type",
					Authorization: `Bearer ${process.env.REACT_APP_BACKEND_API_KEY}`,
				},
			}
		).then((response) => response.json());
		setHash(response.hash);
		clearInterval(interval);
		const loadingElement = loadingRef.current;
		loadingElement.textContent = '';
		setReturnStatement(draftStatement);
	};

	const createInputs = () => {
		let inputs = [];
		let inputCount = getInputCount();

		for (let i = 1; i < inputCount; i++) {
			inputs.push(
				<input
					key={i}
					className="inputtext"
					placeholder="Tweet ID"
					onChange={(event) => handleChange(i, event)}
				/>
			);
		}
		return inputs;
	};

	if (isConnected) {
		if (tweetPackage != 0 && tweetPackage != 4) {
			return (
				<>
					<div className="center-screen">
						<div className="connected">
							<strong>Connected:</strong> {shortenString(address)} (
							<a className="disconnect" href="" onClick={disconnectWallet}>
								disconnect
							</a>
							) (
							<a
								className="disconnect"
								href=""
								onClick={() => setTweetPackage(0)}
							>
								change package
							</a>
							)
						</div>

						<div className="submit">
							{createInputs()}
							{/* <input */}
							{/* 	className="inputtext" */}
							{/* 	ref={idInput} */}
							{/* 	placeholder="Tweet ID" */}
							{/* /> */}
							<button
								id="fancy-button"
								className="button-84 button-85 emoji-button"
								onClick={handleSubmit}
							>
								<strong>Mint</strong>
							</button>
							<div ref={loadingRef}></div>
						</div>
						{returnStatement && (
							<div dangerouslySetInnerHTML={{ __html: returnStatement }}></div>
						)}
					</div>
				</>
			);
		} else if (tweetPackage == 4) {
			return (
				<>
					<div className="center-screen">
						<div className="connected">
							<strong>Connected:</strong> {shortenString(address)} (
							<a className="disconnect" href="" onClick={disconnectWallet}>
								disconnect
							</a>
							) (
							<a
								className="disconnect"
								href=""
								onClick={() => setTweetPackage(0)}
							>
								change package
							</a>
							)
						</div>

						<div className="submit">
							<input
								className="inputtext"
								ref={idInput}
								placeholder="Tweet ID"
							/>
							<button
								id="fancy-button"
								className="button-84 button-85 emoji-button"
								onClick={updateNFT}
							>
								<strong>Update</strong>
							</button>
							<div ref={loadingRef}></div>
						</div>
						{returnStatement && (
							<div dangerouslySetInnerHTML={{ __html: returnStatement }}></div>
						)}
					</div>
				</>
			);
		} else {
			if (cryptosquarePromotion == false) {
				return (
					<WagmiConfig config={wagmiConfig}>
						<RainbowKitProvider chains={chains}>
							<div className="center-screen">
								<div className="connected">
									<strong>Connected:</strong> {shortenString(address)} (
									<a className="disconnect" href="" onClick={disconnectWallet}>
										disconnect
									</a>
									)
									<br />
									<br />
									Payments are made in MATIC.
									<hr />
									<br />
									<br />
								</div>
								<div className="tweetPackage">
									<a
										className="tweetPackageElement"
										href=""
										onClick={() => setTweetPackage(1)}
									>
										Mint 1 tweet for 10$
									</a>
									<br />
									<br />
									<a
										className="tweetPackageElement"
										href=""
										onClick={() => setTweetPackage(2)}
									>
										Mint 3 tweets for 20$ (save 34%)
									</a>
									<br />
									<br />
									<a
										className="tweetPackageElement"
										href=""
										onClick={() => setTweetPackage(3)}
									>
										Mint 10 tweets for 30$ (save 70%)
									</a>
									<br />
									<br />
									<a
										className="tweetPackageElement"
										href=""
										onClick={() => setTweetPackage(4)}
									>
										Update 1 NFT for 1$
									</a>
								</div>
							</div>
						</RainbowKitProvider>
					</WagmiConfig>
				);
			} else {
				return (
					<WagmiConfig config={wagmiConfig}>
						<RainbowKitProvider chains={chains}>
							<div className="center-screen">
								<div className="connected">
									<strong>Connected:</strong> {shortenString(address)} (
									<a className="disconnect" href="" onClick={disconnectWallet}>
										disconnect
									</a>
									)
									<hr />
									<br />
									<br />
								</div>
								<div className="tweetPackage">
									<a
										className="tweetPackageElement"
										href=""
										onClick={() => setTweetPackage(1)}
									>
										3$ for 1 tweet (save 70% thanks to Choos3n)
									</a>
									<br />
									<br />
									<a
										className="tweetPackageElement"
										href=""
										onClick={() => setTweetPackage(2)}
									>
										6$ for 3 tweets (save 80% thanks to Choos3n)
									</a>
									<br />
									<br />
									<a
										className="tweetPackageElement"
										href=""
										onClick={() => setTweetPackage(3)}
									>
										10$ for 10 tweets (save 90% thanks to Choos3n)
									</a>
								</div>
							</div>
						</RainbowKitProvider>
					</WagmiConfig>
				);
			}
		}
	} else {
		return (
			<>
				<WagmiConfig config={wagmiConfig}>
					<RainbowKitProvider
						chains={chains}
						theme={darkTheme({
							accentColor: "#4793DA",
							accentColorForeground: "white",
							borderRadius: "medium",
							fontStack: "system",
							overlayBlur: "small",
						})}
					>
						<div className="center-screen-button">
							<ConnectButton />
						</div>
					</RainbowKitProvider>
				</WagmiConfig>
			</>
		);
	}
}

export default App;
