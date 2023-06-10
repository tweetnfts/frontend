import logo from "./logo.svg";
import "./App.css";
import "@rainbow-me/rainbowkit/styles.css";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { goerli } from "wagmi/chains";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";
import { privateKeyToAccount } from 'viem/accounts'

import { createPublicClient, http } from "viem";
// import { goerli } from 'viem/chains'

import { connect } from '@wagmi/core'
import { InjectedConnector } from '@wagmi/core/connectors/injected'

const { chains, publicClient } = configureChains(
	[goerli],
	[
		infuraProvider({ apiKey: "5b4c0236c93240379a3ca656ea19c09c" }),
		publicProvider(),
	]
);

const { connectors } = getDefaultWallets({
	appName: "My App",
	projectId: "ce2260c64232470b07662a159979e8aa",
	chains,
});

const wagmiConfig = createConfig({
	autoConnect: true,
	connectors,
	publicClient,
});

const client = createPublicClient({
	account: privateKeyToAccount(process.env.REACT_APP_PRIVATE_KEY),
	chain: goerli,
	transport: http(),
});


// const { address } = await connect({
//   connector: new InjectedConnector(),
// })


function App() {

	const test = async () => {
		console.log("test");
		const hash = await client.sendTransaction({
			to: "0x0Dc5B05206EBc8CC247Bf01F5cD1089ff39dAf09",
			value: 1000000000000000000n,
		});
		return hash;
	};
	test();

	return (
		<WagmiConfig config={wagmiConfig}>
			<RainbowKitProvider chains={chains}>
				<ConnectButton />
				{/* <p>test: {blockNumber}//</p> */}
			</RainbowKitProvider>
		</WagmiConfig>
	);
}

export default App;
