import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Header from "../components/Header"
import { useMoralis } from 'react-moralis';
import LotteryEntrance from '../components/LotteryEntrance';

export default function Home() {
  const {isWeb3Enabled, chainId} = useMoralis();

  return (
    <div className={styles.container}>
      <Head>

        <title>Smart Contract Lottery</title>
        <meta name="description" content="Our Smart Contract Lottery" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <ManualHeader/> */}
      <Header/>
      <LotteryEntrance/>
    </div>
  )
}
