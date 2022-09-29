import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Web3Modal from "web3modal";
import { BigNumber, Contract, utils, providers } from "ethers";
import {
  ICO_CONTRACT_ADDRESS,
  ICO_CONTRACT_ABI,
  WST_NFT_CONTRACT_ADDRESS,
  WST_NFT_CONTRACT_ABI,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();
  const [tokensMinted, setTokensMinted] = useState(zero);
  const [balanceOfWSTTokens, setBalanceOfWSTTokens] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [loading, setLoading] = useState(false);

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getBalanceOfWstTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfWSTTokens(balance);
    } catch (err) {
      console.error(err);
    }
  };

  const getTotalTokenMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        provider
      );

      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  };

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        WST_NFT_CONTRACT_ADDRESS,
        WST_NFT_CONTRACT_ABI,
        provider
      );

      const tokenContract = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);

      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        let amount = 0;
        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(amount);
      }
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  };

  const claimWstTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        signer
      );
      setLoading(true);
      const tx = await tokenContract.claim();
      await tx.wait();
      setLoading(false);
      window.alert("successfully claimed tokens");

      await getTokensToBeClaimed();
      await getTotalTokenMinted();
      await getBalanceOfWstTokens();
    } catch (err) {
      console.error(err);
    }
  };

  const mintWstToken = async (amount) => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        signer
      );

      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      await tx.wait();
      window.alert("successfully minted WST tokens");
      await getBalanceOfWstTokens();
      await getTotalTokenMinted();
      await getTokensToBeClaimed();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  };

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }

    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} WST Tokens can be claimed
          </div>
          <button className={styles.button} onClick={claimWstTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of tokens"
            onChange={(e) =>
              setTokenAmount(BigNumber.from(e.target.value || zero))
            }
          />{" "}
          <button
            onClick={() => mintWstToken(tokenAmount)}
            className={styles.button}
            disabled={!tokenAmount > 0}
          >
            Mint Tokens
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();

      getTokensToBeClaimed();
      getTotalTokenMinted();
      getBalanceOfWstTokens();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to WanShiTong ICO!</h1>
          <div className={styles.description}>
            You can claim or mint WST tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfWSTTokens)} WST Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been
                minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./owl.jpg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
